/**
 * Catalogue data-quality pass.
 *
 * Run: node -r dotenv/config scripts/normalize-catalog.js [--apply]
 *
 * Runs in REPORT-ONLY mode by default and prints every change it would make.
 * Pass --apply to actually write. Nothing is deleted without --apply, and
 * duplicate removal always keeps the richest record rather than an arbitrary one.
 *
 * Checks performed:
 *   1. Brand normalisation      — casing, whitespace, known alias spellings
 *   2. Tag normalisation        — lowercase, trimmed, de-duplicated, non-empty
 *   3. Category repair          — partCategory validated against the taxonomy,
 *                                 re-classified from name/tags where invalid;
 *                                 Product.category realigned to the enum
 *   4. Duplicate detection      — identical SKU, or identical brand+name
 *   5. Weak content             — descriptions that are missing, too short, or
 *                                 duplicated verbatim across many products
 *   6. Empty/invalid fields     — missing price, stock, images, features, specs
 *   7. Status consistency       — stock 0 must not be 'active'
 *   8. Orphaned fitment         — compatibility rows pointing at missing docs
 */
const { MongoClient } = require('mongodb');
const { TAXONOMY, classifyProduct } = require('./data/taxonomy');

const VALID_PART_CATEGORIES = new Set(Object.keys(TAXONOMY));
const VALID_ECOMMERCE_CATEGORIES = new Set(['electronics', 'clothing', 'accessories', 'sports', 'home', 'other']);

/** Known brand spelling variants → canonical form. */
const BRAND_ALIASES = {
  'k&n': 'K&N Style',
  kn: 'K&N Style',
  zana: 'ZANA',
  hjg: 'HJG',
  'royal enfield': 'Royal Enfield',
  're: ': 'Royal Enfield',
  motul: 'Motul',
  castrol: 'Castrol',
  'liqui moly': 'Liqui Moly',
  liquimoly: 'Liqui Moly',
  mrf: 'MRF',
  ceat: 'CEAT',
  'tvs eurogrip': 'TVS Eurogrip',
  eurogrip: 'TVS Eurogrip',
  bosch: 'Bosch',
  exide: 'Exide',
  amaron: 'Amaron',
  rynox: 'Rynox',
  viaterra: 'Viaterra',
  studds: 'Studds',
  vega: 'Vega',
  steelbird: 'Steelbird',
  axor: 'Axor',
  ls2: 'LS2',
  smk: 'SMK',
  did: 'DID Style',
  rk: 'RK Style',
  rolon: 'Rolon',
  jt: 'JT Style',
  ebc: 'EBC Style',
  brembo: 'Brembo Style',
};

/** Title-cases a brand while preserving all-caps acronyms. */
function canonicalBrand(raw) {
  const trimmed = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  const alias = BRAND_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  return trimmed
    .split(' ')
    .map((w) => {
      if (w.length <= 3 && w === w.toUpperCase()) return w; // KTM, LS2, MRF
      if (/^[A-Z]{2,}$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function normaliseTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of tags) {
    const t = String(raw || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!t || t.length > 40 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Scores how complete a product record is — used to pick the survivor of a duplicate pair. */
function richness(p) {
  let score = 0;
  if (p.description) score += Math.min(20, Math.floor(p.description.length / 50));
  if (Array.isArray(p.features)) score += p.features.length;
  if (p.specs && Object.keys(p.specs).length) score += Object.keys(p.specs).length;
  if (Array.isArray(p.images)) score += p.images.length * 2;
  if (p.ratingCount) score += 3;
  if (p.partCategory && VALID_PART_CATEGORIES.has(p.partCategory)) score += 5;
  if (p.usageRecommendation) score += 2;
  return score;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: node -r dotenv/config scripts/normalize-catalog.js');
    process.exit(1);
  }

  const apply = process.argv.includes('--apply');
  console.log(apply ? '⚙️  APPLY MODE — changes will be written\n' : '🔍 REPORT MODE — no changes written (pass --apply to write)\n');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const products = db.collection('products');
    const compatibility = db.collection('productcompatibilities');
    const motorcycles = db.collection('motorcycles');

    const all = await products.find({}).toArray();
    console.log(`Loaded ${all.length} product(s)\n`);

    const updates = [];
    const issues = {
      brand: 0,
      tags: 0,
      partCategory: 0,
      category: 0,
      status: 0,
      weakDescription: [],
      missingPrice: [],
      missingImages: [],
      missingFeatures: [],
      missingSpecs: [],
    };

    // Verbatim description reuse across many products is a content smell.
    const descriptionCounts = new Map();
    for (const p of all) {
      const key = (p.description || '').trim().toLowerCase();
      if (key) descriptionCounts.set(key, (descriptionCounts.get(key) || 0) + 1);
    }

    for (const p of all) {
      const set = {};

      // 1. Brand
      const brand = canonicalBrand(p.brand);
      if (brand && brand !== p.brand) {
        set.brand = brand;
        issues.brand++;
      }

      // 2. Tags
      const tags = normaliseTags(p.tags);
      if (JSON.stringify(tags) !== JSON.stringify(p.tags || [])) {
        set.tags = tags;
        issues.tags++;
      }

      // 3. Category mapping
      if (!p.partCategory || !VALID_PART_CATEGORIES.has(p.partCategory)) {
        const inferred = classifyProduct({
          name: p.name || '',
          tags: p.tags || [],
          description: p.description || '',
        });
        if (inferred) {
          set.partCategory = inferred;
          issues.partCategory++;
        }
      }
      if (!p.category || !VALID_ECOMMERCE_CATEGORIES.has(p.category)) {
        set.category = 'accessories';
        issues.category++;
      }

      // 4. Status consistency
      const stock = typeof p.stock === 'number' ? p.stock : 0;
      if (stock === 0 && p.status === 'active') {
        set.status = 'out_of_stock';
        issues.status++;
      } else if (stock > 0 && p.status === 'out_of_stock') {
        set.status = 'active';
        issues.status++;
      }

      // 5/6. Content completeness
      const desc = (p.description || '').trim();
      if (desc.length < 80 || (descriptionCounts.get(desc.toLowerCase()) || 0) > 5) {
        issues.weakDescription.push(p.sku || String(p._id));
      }
      if (typeof p.price !== 'number' || p.price <= 0) issues.missingPrice.push(p.sku || String(p._id));
      if (!Array.isArray(p.images) || p.images.length === 0) issues.missingImages.push(p.sku || String(p._id));
      if (!Array.isArray(p.features) || p.features.length === 0) issues.missingFeatures.push(p.sku || String(p._id));
      if (!p.specs || Object.keys(p.specs).length === 0) issues.missingSpecs.push(p.sku || String(p._id));

      // Backfill defaults for fields the storefront sorts on.
      if (typeof p.ratingAvg !== 'number') set.ratingAvg = 0;
      if (typeof p.ratingCount !== 'number') set.ratingCount = 0;
      if (typeof p.viewCount !== 'number') set.viewCount = 0;
      if (typeof p.salesCount !== 'number') set.salesCount = 0;
      if (typeof p.universalFit !== 'boolean') set.universalFit = false;
      if (!Array.isArray(p.features)) set.features = [];

      if (Object.keys(set).length > 0) {
        updates.push({ updateOne: { filter: { _id: p._id }, update: { $set: set } } });
      }
    }

    // ── Duplicate detection ────────────────────────────────────────────────
    const bySku = new Map();
    const byName = new Map();
    for (const p of all) {
      if (p.sku) {
        const k = String(p.sku).trim().toUpperCase();
        if (!bySku.has(k)) bySku.set(k, []);
        bySku.get(k).push(p);
      }
      const nameKey = `${canonicalBrand(p.brand)}|${String(p.name || '').trim().toLowerCase()}`;
      if (!byName.has(nameKey)) byName.set(nameKey, []);
      byName.get(nameKey).push(p);
    }

    const duplicateIds = [];
    const reportDuplicate = (group, reason) => {
      if (group.length < 2) return;
      const sorted = [...group].sort((a, b) => richness(b) - richness(a));
      const keep = sorted[0];
      for (const drop of sorted.slice(1)) {
        duplicateIds.push({ id: drop._id, sku: drop.sku, name: drop.name, keptSku: keep.sku, reason });
      }
    };

    for (const group of bySku.values()) reportDuplicate(group, 'duplicate SKU');
    for (const group of byName.values()) {
      if (group.length > 1 && new Set(group.map((g) => String(g.sku).toUpperCase())).size === group.length) {
        reportDuplicate(group, 'duplicate brand+name');
      }
    }

    // ── Orphaned fitment ───────────────────────────────────────────────────
    const productIds = new Set(all.map((p) => String(p._id)));
    const bikeIds = new Set((await motorcycles.find({}, { projection: { _id: 1 } }).toArray()).map((b) => String(b._id)));
    const links = await compatibility.find({}).toArray();
    const orphanLinks = links.filter(
      (l) => !productIds.has(String(l.product)) || (!l.universal && l.motorcycle && !bikeIds.has(String(l.motorcycle)))
    );

    // ── Report ─────────────────────────────────────────────────────────────
    console.log('── Normalisation ──');
    console.log(`Brand casing/aliases fixed   : ${issues.brand}`);
    console.log(`Tag lists cleaned            : ${issues.tags}`);
    console.log(`partCategory repaired        : ${issues.partCategory}`);
    console.log(`category realigned to enum   : ${issues.category}`);
    console.log(`status/stock inconsistencies : ${issues.status}`);
    console.log(`Products needing an update   : ${updates.length}`);

    console.log('\n── Content quality ──');
    console.log(`Weak or duplicated descriptions : ${issues.weakDescription.length}`);
    console.log(`Missing or invalid price        : ${issues.missingPrice.length}`);
    console.log(`Missing images                  : ${issues.missingImages.length}`);
    console.log(`Missing features                : ${issues.missingFeatures.length}`);
    console.log(`Missing specs                   : ${issues.missingSpecs.length}`);
    for (const [label, list] of [
      ['weak description', issues.weakDescription],
      ['missing price', issues.missingPrice],
      ['missing images', issues.missingImages],
    ]) {
      if (list.length > 0) console.log(`  ${label}: ${list.slice(0, 10).join(', ')}${list.length > 10 ? ` … +${list.length - 10}` : ''}`);
    }

    console.log('\n── Duplicates ──');
    console.log(`Duplicate products found : ${duplicateIds.length}`);
    for (const d of duplicateIds.slice(0, 15)) {
      console.log(`  ${d.reason}: "${d.name}" (${d.sku}) — keeping ${d.keptSku}`);
    }
    if (duplicateIds.length > 15) console.log(`  … +${duplicateIds.length - 15} more`);

    console.log('\n── Referential integrity ──');
    console.log(`Fitment links total   : ${links.length}`);
    console.log(`Orphaned fitment rows : ${orphanLinks.length}`);

    // ── Apply ──────────────────────────────────────────────────────────────
    if (apply) {
      if (updates.length > 0) {
        for (let i = 0; i < updates.length; i += 400) {
          await products.bulkWrite(updates.slice(i, i + 400), { ordered: false });
        }
        console.log(`\n✅ Applied ${updates.length} product update(s)`);
      }

      if (duplicateIds.length > 0) {
        const ids = duplicateIds.map((d) => d.id);
        await compatibility.deleteMany({ product: { $in: ids } });
        const res = await products.deleteMany({ _id: { $in: ids } });
        console.log(`✅ Removed ${res.deletedCount} duplicate product(s) and their fitment links`);
      }

      if (orphanLinks.length > 0) {
        const res = await compatibility.deleteMany({ _id: { $in: orphanLinks.map((l) => l._id) } });
        console.log(`✅ Removed ${res.deletedCount} orphaned fitment link(s)`);
      }

      console.log('\n✅ Normalisation applied.');
    } else {
      console.log('\nRe-run with --apply to write these changes.');
    }
  } catch (err) {
    console.error('❌ Normalisation failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
