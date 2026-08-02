/**
 * Seeds the full GearGhar product catalogue, its motorcycle fitment data and a
 * body of customer reviews.
 *
 * Run: node -r dotenv/config scripts/seed-catalog.js
 * Flags:
 *   --fresh          delete generated products/fitment/reviews first (keeps
 *                    hand-created products that lack the GG- SKU prefix)
 *   --skip-reviews   products only, no review generation
 *   --skip-fitment   products only, no compatibility links
 *
 * Idempotent: products upsert by SKU, fitment upserts by (product, motorcycle),
 * reviews upsert by (productId, userName). Re-running updates rather than
 * duplicating, and the deterministic generator means values do not drift.
 *
 * ALL DATA IS SYNTHETIC. See the header of scripts/data/catalog.js.
 */
const { MongoClient } = require('mongodb');
const { buildProducts } = require('./data/catalog');
const { buildMotorcycles } = require('./data/motorcycles');
const { buildFitment, verdictCoverage } = require('./data/fitment');
const { makeRng } = require('./data/catalog');
const { createUniqueSkuIndex } = require('./data/sku');
const { ensureIndexes } = require('./data/indexes');

const GENERATED_SKU_PREFIX = /^GG-/;

const REVIEWER_FIRST = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anjali', 'Karan', 'Meera', 'Rohan', 'Divya', 'Sameer', 'Nisha', 'Aditya', 'Pooja', 'Nikhil', 'Kavya', 'Suresh', 'Ritu', 'Manish', 'Tara', 'Bikash', 'Sunita', 'Prakash', 'Anita'];
const REVIEWER_LAST = ['Sharma', 'Patel', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Iyer', 'Joshi', 'Thapa', 'Shrestha', 'Rana', 'Desai', 'Kulkarni', 'Bose', 'Menon', 'Gurung'];

const REVIEW_TEMPLATES = {
  high: [
    { title: 'Exactly as described', body: 'Fitted this last weekend and it went on without any drama. Build quality is genuinely good for the money and it looks like it belongs on the bike. No complaints so far.' },
    { title: 'Great value for money', body: 'Was sceptical at this price but it has held up well through a full monsoon season. No rust, no rattles. Would buy again.' },
    { title: 'Solid quality, quick delivery', body: 'Packaging was proper and everything listed in the box was actually in the box. Took about an hour to fit with basic tools. Very happy.' },
    { title: 'Does the job well', body: 'Noticeable improvement over the stock part. Instructions were clear enough and all the hardware was included. Recommended.' },
    { title: 'Bought a second one', body: 'Liked the first one enough that I bought another for my other bike. Consistent quality across both.' },
  ],
  mid: [
    { title: 'Good but fitting took a while', body: 'Product itself is fine and does what it says. Fitting took longer than expected and I needed an extra spacer that was not in the box. Worth it once sorted.' },
    { title: 'Decent for the price', body: 'Not premium quality but perfectly acceptable for what I paid. Finish is a little rough in places but nothing you notice once fitted.' },
    { title: 'Works, minor niggles', body: 'Functionally good. The supplied fasteners felt a bit soft so I swapped them for stainless ones. Everything else is fine.' },
    { title: 'Slightly different from photos', body: 'Colour is a shade darker than the listing images suggested. Quality is fine and it fits properly, so I kept it.' },
  ],
  low: [
    { title: 'Fitment was a struggle', body: 'Ended up needing to modify a bracket to get this to line up on my bike. It works now but it was not the bolt-on job I expected.' },
    { title: 'Average quality', body: 'Does the basic job but the finish started marking within a couple of months. Might be fine if you are on a tight budget.' },
    { title: 'Expected better at this price', body: 'Not bad exactly, but I have seen better for similar money. Delivery was quick at least.' },
  ],
};

function pickTemplate(rng, rating) {
  const band = rating >= 4 ? 'high' : rating >= 3 ? 'mid' : 'low';
  return rng.pick(REVIEW_TEMPLATES[band]);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: node -r dotenv/config scripts/seed-catalog.js');
    process.exit(1);
  }

  const fresh = process.argv.includes('--fresh');
  const skipReviews = process.argv.includes('--skip-reviews');
  const skipFitment = process.argv.includes('--skip-fitment');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const products = db.collection('products');
    const motorcycles = db.collection('motorcycles');
    const compatibility = db.collection('productcompatibilities');
    const reviews = db.collection('reviews');

    const now = new Date();

    // ── 1. Motorcycles ────────────────────────────────────────────────────
    const bikeDocs = buildMotorcycles();
    let bikeCount = 0;
    for (const batch of chunk(bikeDocs, 200)) {
      const ops = batch.map((bike) => ({
        updateOne: {
          filter: { slug: bike.slug },
          update: { $set: { ...bike, updatedAt: now }, $setOnInsert: { createdAt: now } },
          upsert: true,
        },
      }));
      const res = await motorcycles.bulkWrite(ops, { ordered: false });
      bikeCount += res.upsertedCount + res.modifiedCount + res.matchedCount;
    }
    console.log(`✅ Motorcycles       — ${bikeDocs.length} upserted`);

    const brands = new Set(bikeDocs.map((b) => b.brand));
    console.log(`   ${brands.size} brands, ABS/fuel type populated on every record`);

    // ── 2. Products ───────────────────────────────────────────────────────
    const generated = buildProducts();

    if (fresh) {
      const del = await products.deleteMany({ sku: { $regex: GENERATED_SKU_PREFIX } });
      console.log(`🧹 Removed ${del.deletedCount} previously generated product(s)`);
    }

    let inserted = 0;
    let updated = 0;
    for (const batch of chunk(generated, 250)) {
      const ops = batch.map((p) => {
        // `_segmentKey` drives fitment generation only; it is not a Product field.
        const { _segmentKey, ...doc } = p;
        return {
          updateOne: {
            filter: { sku: doc.sku },
            update: { $set: { ...doc, updatedAt: now }, $setOnInsert: { createdAt: now } },
            upsert: true,
          },
        };
      });
      const res = await products.bulkWrite(ops, { ordered: false });
      inserted += res.upsertedCount;
      updated += res.modifiedCount;
    }
    console.log(`✅ Products          — ${inserted} inserted, ${updated} updated (${generated.length} total)`);

    // ── 3. Fitment ────────────────────────────────────────────────────────
    if (!skipFitment) {
      const { links, stats } = buildFitment(generated, bikeDocs);

      // Resolve SKUs and slugs to the _id values the schema references.
      const productIdBySku = new Map(
        (await products.find({ sku: { $regex: GENERATED_SKU_PREFIX } }, { projection: { sku: 1 } }).toArray()).map(
          (p) => [p.sku, p._id]
        )
      );
      const bikeIdBySlug = new Map(
        (await motorcycles.find({}, { projection: { slug: 1 } }).toArray()).map((b) => [b.slug, b._id])
      );

      if (fresh) {
        const generatedIds = Array.from(productIdBySku.values());
        const del = await compatibility.deleteMany({ product: { $in: generatedIds } });
        console.log(`🧹 Removed ${del.deletedCount} previously generated fitment link(s)`);
      }

      let linkOps = [];
      let linkCount = 0;
      let skipped = 0;

      for (const link of links) {
        const productId = productIdBySku.get(link.sku);
        if (!productId) {
          skipped++;
          continue;
        }

        if (link.universal) {
          linkOps.push({
            updateOne: {
              filter: { product: productId, universal: true },
              update: {
                $set: { product: productId, universal: true, fitmentNotes: link.fitmentNotes, updatedAt: now },
                $setOnInsert: { createdAt: now },
              },
              upsert: true,
            },
          });
        } else {
          const motorcycleId = bikeIdBySlug.get(link.motorcycleSlug);
          if (!motorcycleId) {
            skipped++;
            continue;
          }
          linkOps.push({
            updateOne: {
              filter: { product: productId, motorcycle: motorcycleId },
              update: {
                $set: {
                  product: productId,
                  motorcycle: motorcycleId,
                  universal: false,
                  fitmentNotes: link.fitmentNotes,
                  updatedAt: now,
                },
                $setOnInsert: { createdAt: now },
              },
              upsert: true,
            },
          });
        }

        if (linkOps.length >= 500) {
          await compatibility.bulkWrite(linkOps, { ordered: false });
          linkCount += linkOps.length;
          linkOps = [];
        }
      }
      if (linkOps.length > 0) {
        await compatibility.bulkWrite(linkOps, { ordered: false });
        linkCount += linkOps.length;
      }

      console.log(`✅ Fitment links     — ${linkCount} upserted${skipped ? `, ${skipped} skipped` : ''}`);
      console.log(
        `   ${stats.universal} universal, ${stats.specific} model-specific, ` +
          `${stats.withNotes} with fitment notes, ${stats.bikesCovered} bikes covered`
      );

      const coverage = verdictCoverage(generated, links, bikeDocs);
      console.log(
        `   Verdict spread — FITS ${coverage.fitsPct}% · NO_FIT ${coverage.noFitPct}% · UNKNOWN ${coverage.unknownPct}%`
      );
    }

    // ── 4. Reviews ────────────────────────────────────────────────────────
    if (!skipReviews) {
      const stored = await products
        .find({ sku: { $regex: GENERATED_SKU_PREFIX } }, { projection: { sku: 1, ratingAvg: 1, ratingCount: 1 } })
        .toArray();

      if (fresh) {
        const del = await reviews.deleteMany({ generated: true });
        console.log(`🧹 Removed ${del.deletedCount} previously generated review(s)`);
      }

      let reviewOps = [];
      let reviewCount = 0;

      for (const product of stored) {
        const target = product.ratingCount || 0;
        if (target === 0) continue;

        // Write a bounded sample of real Review documents. ratingAvg/ratingCount
        // on the Product remain the authoritative aggregate; these give the
        // product page and the assistant genuine review text to work with.
        const toWrite = Math.min(target, 8);
        const rng = makeRng(`reviews|${product.sku}`);

        for (let i = 0; i < toWrite; i++) {
          // Sample ratings around the product's stored average.
          const jitter = rng.int(-1, 1);
          const rating = Math.max(1, Math.min(5, Math.round(product.ratingAvg) + jitter));
          const template = pickTemplate(rng, rating);
          const userName = `${rng.pick(REVIEWER_FIRST)} ${rng.pick(REVIEWER_LAST)}`;
          const daysAgo = rng.int(3, 540);

          reviewOps.push({
            updateOne: {
              filter: { productSku: product.sku, userName },
              update: {
                $set: {
                  productSku: product.sku,
                  userName,
                  rating,
                  title: template.title,
                  content: template.body,
                  helpful: rng.int(0, 42),
                  verified: rng.chance(0.68),
                  generated: true,
                  updatedAt: now,
                },
                $setOnInsert: {
                  createdAt: new Date(now.getTime() - daysAgo * 86400000),
                },
              },
              upsert: true,
            },
          });
        }

        if (reviewOps.length >= 500) {
          await reviews.bulkWrite(reviewOps, { ordered: false });
          reviewCount += reviewOps.length;
          reviewOps = [];
        }
      }
      if (reviewOps.length > 0) {
        await reviews.bulkWrite(reviewOps, { ordered: false });
        reviewCount += reviewOps.length;
      }

      // Attach the real productId now that the review rows exist.
      const skuToId = new Map(stored.map((p) => [p.sku, p._id]));
      let linked = 0;
      let linkOps = [];
      for (const [sku, id] of skuToId) {
        linkOps.push({ updateMany: { filter: { productSku: sku }, update: { $set: { productId: id } } } });
        if (linkOps.length >= 400) {
          const res = await reviews.bulkWrite(linkOps, { ordered: false });
          linked += res.modifiedCount;
          linkOps = [];
        }
      }
      if (linkOps.length > 0) {
        const res = await reviews.bulkWrite(linkOps, { ordered: false });
        linked += res.modifiedCount;
      }

      console.log(`✅ Reviews           — ${reviewCount} upserted, ${linked} linked to products`);
    }

    // ── 5. Indexes ────────────────────────────────────────────────────────
    console.log('\nCreating catalogue indexes...');

    // The unique SKU index is built through a helper that first fills any
    // product missing a SKU. Documents predating the `sku` field all read as
    // `sku: null` to a unique index, so without this step the index build fails
    // with `E11000 ... dup key: { sku: null }` and takes the whole seed with it.
    const skuIndex = await createUniqueSkuIndex(products);
    if (!skuIndex.created) {
      console.warn('⚠️  Continuing without the unique SKU index — resolve the issue above and re-run.');
    }

    // Everything else goes through ensureIndex so an option mismatch with an
    // index created by an earlier schema reports rather than aborting the seed.
    await ensureIndexes(
      [
        { collection: products, keys: { status: 1, brand: 1, partCategory: 1 } },
        { collection: products, keys: { status: 1, ratingAvg: -1, ratingCount: -1 } },
        { collection: products, keys: { status: 1, salesCount: -1 } },
        { collection: products, keys: { status: 1, createdAt: -1 } },
        { collection: products, keys: { status: 1, partCategory: 1, price: 1 } },
        { collection: products, keys: { universalFit: 1 } },
        { collection: products, keys: { beginnerFriendly: 1 } },
        {
          collection: products,
          keys: { name: 'text', tags: 'text', description: 'text' },
          options: { weights: { name: 10, tags: 5, description: 1 }, name: 'product_text' },
        },
        { collection: motorcycles, keys: { slug: 1 }, options: { unique: true } },
        { collection: motorcycles, keys: { type: 1, engineCc: 1 } },
        { collection: motorcycles, keys: { abs: 1 } },
        { collection: compatibility, keys: { motorcycle: 1 } },
        { collection: compatibility, keys: { product: 1 } },
        { collection: compatibility, keys: { universal: 1 } },
        { collection: reviews, keys: { productId: 1, createdAt: -1 } },
        { collection: reviews, keys: { productSku: 1, userName: 1 } },
      ],
      { log: console.log }
    );

    // ── 6. Summary ────────────────────────────────────────────────────────
    console.log('\n── Catalogue summary ──');
    console.log(`Products       : ${await products.countDocuments()}`);
    console.log(`Active         : ${await products.countDocuments({ status: 'active' })}`);
    console.log(`Motorcycles    : ${await motorcycles.countDocuments()}`);
    console.log(`Fitment links  : ${await compatibility.countDocuments()}`);
    console.log(`Reviews        : ${await reviews.countDocuments()}`);

    const byCategory = await products
      .aggregate([{ $group: { _id: '$partCategory', n: { $sum: 1 } } }, { $sort: { n: -1 } }])
      .toArray();
    console.log(`Part categories: ${byCategory.length}`);
    console.log('  ' + byCategory.map((c) => `${c._id}:${c.n}`).join('  '));

    console.log('\n✅ Catalogue seeded. Next: npm run normalize:catalog && npm run backfill:ratings');
  } catch (err) {
    console.error('❌ Catalogue seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
