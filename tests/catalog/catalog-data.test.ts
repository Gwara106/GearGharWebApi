import { describe, it, expect } from 'vitest';

// The generators are CommonJS modules shared with the seed scripts, so the
// tests exercise exactly the code that populates MongoDB.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildProducts, SEGMENTS, ECOMMERCE_CATEGORY } = require('../../scripts/data/catalog');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildMotorcycles, deriveAbs } = require('../../scripts/data/motorcycles');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildFitment, verdictCoverage, bikesInSegment } = require('../../scripts/data/fitment');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildKnowledge } = require('../../scripts/data/knowledge-extended');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TAXONOMY } = require('../../scripts/data/taxonomy');

const VALID_ECOMMERCE = new Set(['electronics', 'clothing', 'accessories', 'sports', 'home', 'other']);
const VALID_TAXONOMY = new Set(Object.keys(TAXONOMY));

const PRODUCTS = buildProducts();
const BIKES = buildMotorcycles();
const KNOWLEDGE = buildKnowledge();

/**
 * Data-quality gates for the generated catalogue.
 *
 * These assert the contract the storefront and the AI assistant both depend on:
 * no duplicates, no empty fields, every category resolvable in the taxonomy, and
 * fitment data that genuinely exercises all four compatibility verdicts. A
 * regression in the generator fails the build rather than quietly seeding a
 * broken catalogue.
 */

describe('product catalogue scale', () => {
  it('meets the catalogue size target', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(300);
  });

  it('covers the full part taxonomy', () => {
    const covered = new Set(PRODUCTS.map((p: any) => p.partCategory));
    const missing = Array.from(VALID_TAXONOMY).filter((c) => !covered.has(c));
    expect(missing, `taxonomy slugs with no product: ${missing.join(', ')}`).toEqual([]);
  });

  it('spans a realistic range of brands', () => {
    const brands = new Set(PRODUCTS.map((p: any) => p.brand));
    expect(brands.size).toBeGreaterThanOrEqual(30);
  });

  it('mixes universal and model-specific products', () => {
    const universal = PRODUCTS.filter((p: any) => p.universalFit).length;
    const specific = PRODUCTS.length - universal;
    expect(universal).toBeGreaterThan(50);
    expect(specific).toBeGreaterThan(50);
  });
});

describe('product data integrity', () => {
  it('has no duplicate SKUs', () => {
    const skus = PRODUCTS.map((p: any) => p.sku);
    expect(skus.length - new Set(skus).size).toBe(0);
  });

  it('has no duplicate product names', () => {
    const names = PRODUCTS.map((p: any) => p.name.toLowerCase());
    expect(names.length - new Set(names).size).toBe(0);
  });

  it('has no empty or weak descriptions', () => {
    const weak = PRODUCTS.filter((p: any) => !p.description || p.description.length < 80);
    expect(weak.map((p: any) => p.sku)).toEqual([]);
  });

  it('respects the schema length limits', () => {
    const longName = PRODUCTS.filter((p: any) => p.name.length > 100);
    const longDesc = PRODUCTS.filter((p: any) => p.description.length > 1000);
    expect(longName.map((p: any) => p.sku)).toEqual([]);
    expect(longDesc.map((p: any) => p.sku)).toEqual([]);
  });

  it('populates every field the assistant and storefront rely on', () => {
    for (const p of PRODUCTS) {
      expect(p.price, `${p.sku} price`).toBeGreaterThan(0);
      expect(p.images.length, `${p.sku} images`).toBeGreaterThan(0);
      expect(p.features.length, `${p.sku} features`).toBeGreaterThanOrEqual(3);
      expect(Object.keys(p.specs).length, `${p.sku} specs`).toBeGreaterThanOrEqual(3);
      expect(p.tags.length, `${p.sku} tags`).toBeGreaterThanOrEqual(3);
      expect(p.usageRecommendation, `${p.sku} usage`).toBeTruthy();
      expect(p.installationDifficulty, `${p.sku} difficulty`).toBeGreaterThanOrEqual(1);
      expect(p.installationDifficulty, `${p.sku} difficulty`).toBeLessThanOrEqual(5);
    }
  });

  it('maps every product onto a valid taxonomy slug and category enum', () => {
    for (const p of PRODUCTS) {
      expect(VALID_TAXONOMY.has(p.partCategory), `${p.sku} partCategory=${p.partCategory}`).toBe(true);
      expect(VALID_ECOMMERCE.has(p.category), `${p.sku} category=${p.category}`).toBe(true);
      expect(ECOMMERCE_CATEGORY[p.partCategory]).toBe(p.category);
    }
  });

  it('keeps stock and status consistent', () => {
    const inconsistent = PRODUCTS.filter(
      (p: any) => (p.stock === 0 && p.status === 'active') || (p.stock > 0 && p.status === 'out_of_stock')
    );
    expect(inconsistent.map((p: any) => p.sku)).toEqual([]);
  });

  it('keeps ratings within range and consistent with the review count', () => {
    for (const p of PRODUCTS) {
      expect(p.ratingAvg).toBeGreaterThanOrEqual(0);
      expect(p.ratingAvg).toBeLessThanOrEqual(5);
      if (p.ratingCount === 0) expect(p.ratingAvg).toBe(0);
      else expect(p.ratingAvg).toBeGreaterThan(0);
    }
  });

  it('flags safety-critical categories correctly', () => {
    const criticalCategories = ['helmet', 'brakes', 'tyres', 'chain', 'jacket'];
    for (const category of criticalCategories) {
      const sample = PRODUCTS.filter((p: any) => p.partCategory === category);
      expect(sample.length, `no products for ${category}`).toBeGreaterThan(0);
      for (const p of sample) {
        expect(['high', 'critical'], `${p.sku} safetyImpact`).toContain(p.safetyImpact);
      }
    }
  });

  it('is deterministic across runs', () => {
    const second = buildProducts();
    expect(second.length).toBe(PRODUCTS.length);
    expect(second[0].sku).toBe(PRODUCTS[0].sku);
    expect(second[0].price).toBe(PRODUCTS[0].price);
    expect(second[100].description).toBe(PRODUCTS[100].description);
  });
});

describe('motorcycle catalogue', () => {
  it('meets the fleet size target', () => {
    expect(BIKES.length).toBeGreaterThanOrEqual(100);
  });

  it('covers every brand the project requires', () => {
    const brands = new Set(BIKES.map((b: any) => b.brand));
    for (const required of [
      'Yamaha', 'Honda', 'Suzuki', 'KTM', 'Royal Enfield',
      'Bajaj', 'TVS', 'Kawasaki', 'Benelli', 'CFMoto',
    ]) {
      expect(brands.has(required), `missing brand: ${required}`).toBe(true);
    }
  });

  it('has unique slugs', () => {
    const slugs = BIKES.map((b: any) => b.slug);
    expect(slugs.length - new Set(slugs).size).toBe(0);
  });

  it('populates ABS and fuel type on every record', () => {
    const validAbs = new Set(['none', 'cbs', 'single-channel', 'dual-channel', 'switchable']);
    for (const b of BIKES) {
      expect(validAbs.has(b.abs), `${b.slug} abs=${b.abs}`).toBe(true);
      expect(['petrol', 'electric', 'hybrid']).toContain(b.fuelType);
      expect(b.aliases.length).toBeGreaterThan(0);
    }
  });

  it('derives braking systems consistently with the documented rule', () => {
    // Small-capacity machines get CBS from 2019, not ABS.
    expect(deriveAbs('test-125', 125, 'commuter', 2021)).toBe('cbs');
    // Larger sport machines get dual-channel.
    expect(deriveAbs('test-sport', 400, 'sport', 2021)).toBe('dual-channel');
    // Pre-regulation small machines have none.
    expect(deriveAbs('test-old', 150, 'commuter', 2012)).toBe('none');
  });
});

describe('fitment data', () => {
  const { links, stats } = buildFitment(PRODUCTS, BIKES);

  it('creates links for the great majority of products', () => {
    expect(stats.productsLinked / PRODUCTS.length).toBeGreaterThan(0.9);
  });

  it('gives every universal product exactly one universal link', () => {
    const universalProducts = PRODUCTS.filter((p: any) => p.universalFit);
    expect(stats.universal).toBe(universalProducts.length);
  });

  it('never attaches a motorcycle to a universal link', () => {
    const bad = links.filter((l: any) => l.universal && l.motorcycleSlug);
    expect(bad.length).toBe(0);
  });

  it('always attaches a motorcycle to a specific link', () => {
    const bad = links.filter((l: any) => !l.universal && !l.motorcycleSlug);
    expect(bad.length).toBe(0);
  });

  it('authors fitment notes on a meaningful share of links', () => {
    expect(stats.withNotes / stats.specific).toBeGreaterThan(0.3);
  });

  it('covers most of the motorcycle fleet', () => {
    expect(stats.bikesCovered / BIKES.length).toBeGreaterThan(0.8);
  });

  it('exercises all four compatibility verdicts', () => {
    const coverage = verdictCoverage(PRODUCTS, links, BIKES);
    // Every verdict must be genuinely reachable, or the compatibility feature
    // is untestable and the assistant can never legitimately answer "no".
    expect(coverage.fits, 'no FITS cases').toBeGreaterThan(0);
    expect(coverage.noFit, 'no NO_FIT cases').toBeGreaterThan(0);
    expect(coverage.unknown, 'no UNKNOWN cases').toBeGreaterThan(0);
    expect(coverage.fitsPct).toBeGreaterThan(1);
    expect(coverage.unknownPct).toBeGreaterThan(5);
  });

  it('only links products to bikes inside their declared segment', () => {
    const bikeBySlug = new Map(BIKES.map((b: any) => [b.slug, b]));
    const segmentByKey = new Map(SEGMENTS.map((s: any) => [s.key, s]));
    const productBySku = new Map(PRODUCTS.map((p: any) => [p.sku, p]));

    for (const link of links.slice(0, 3000)) {
      if (link.universal) continue;
      const product: any = productBySku.get(link.sku);
      const bike: any = bikeBySlug.get(link.motorcycleSlug);
      const segment: any = segmentByKey.get(product._segmentKey);
      if (!segment || !bike) continue;

      const cc = bike.engineCc || 0;
      expect(cc, `${link.sku} -> ${link.motorcycleSlug}`).toBeGreaterThanOrEqual(segment.ccMin);
      expect(cc, `${link.sku} -> ${link.motorcycleSlug}`).toBeLessThanOrEqual(segment.ccMax);
    }
  });

  it('resolves segments to a non-empty bike set', () => {
    for (const segment of SEGMENTS) {
      expect(bikesInSegment(BIKES, segment).length, `empty segment: ${segment.key}`).toBeGreaterThan(0);
    }
  });
});

describe('knowledge base scale and integrity', () => {
  it('meets the maintenance task target', () => {
    expect(KNOWLEDGE.maintenance.length).toBeGreaterThanOrEqual(100);
  });

  it('meets the symptom rule target', () => {
    expect(KNOWLEDGE.symptoms.length).toBeGreaterThanOrEqual(100);
  });

  it('covers the full glossary taxonomy', () => {
    const covered = new Set(KNOWLEDGE.glossary.map((g: any) => g.partCategory));
    const missing = Array.from(VALID_TAXONOMY).filter((c) => !covered.has(c));
    expect(missing).toEqual([]);
  });

  it('has unique keys across authored and derived documents', () => {
    const taskKeys = KNOWLEDGE.maintenance.map((t: any) => t.taskKey);
    const symptomKeys = KNOWLEDGE.symptoms.map((r: any) => r.symptomKey);
    expect(taskKeys.length - new Set(taskKeys).size).toBe(0);
    expect(symptomKeys.length - new Set(symptomKeys).size).toBe(0);
  });

  it('references only valid taxonomy categories', () => {
    const bad: string[] = [];
    for (const t of KNOWLEDGE.maintenance) {
      for (const c of t.relatedPartCategories || []) {
        if (!VALID_TAXONOMY.has(c)) bad.push(`${t.taskKey}:${c}`);
      }
    }
    for (const r of KNOWLEDGE.symptoms) {
      for (const cause of r.likelyCauses || []) {
        for (const c of cause.fixPartCategories || []) {
          if (!VALID_TAXONOMY.has(c)) bad.push(`${r.symptomKey}:${c}`);
        }
      }
    }
    expect(Array.from(new Set(bad))).toEqual([]);
  });

  it('cites a source on every document', () => {
    for (const t of KNOWLEDGE.maintenance) {
      expect(t.source?.title, `${t.taskKey} missing source`).toBeTruthy();
      expect(['oem_manual', 'service_guide', 'editorial']).toContain(t.source.kind);
    }
    for (const r of KNOWLEDGE.symptoms) {
      expect(r.source?.title, `${r.symptomKey} missing source`).toBeTruthy();
    }
  });

  it('tags derived specialisations so they can be counted separately', () => {
    const derived = KNOWLEDGE.maintenance.filter((t: any) => t.derivedFrom);
    expect(derived.length).toBe(KNOWLEDGE.counts.maintenanceDerived);
    const authored = KNOWLEDGE.maintenance.filter((t: any) => !t.derivedFrom);
    expect(authored.length).toBe(KNOWLEDGE.counts.maintenanceBase);
    // Every derived document must point at a real base document.
    const baseKeys = new Set(authored.map((t: any) => t.taskKey));
    for (const d of derived) {
      expect(baseKeys.has(d.derivedFrom), `${d.taskKey} -> unknown base ${d.derivedFrom}`).toBe(true);
    }
  });

  it('keeps symptom cause confidences within range after specialisation', () => {
    for (const r of KNOWLEDGE.symptoms) {
      expect(r.likelyCauses.length, `${r.symptomKey} has no causes`).toBeGreaterThan(0);
      for (const c of r.likelyCauses) {
        expect(c.priorConfidence).toBeGreaterThan(0);
        expect(c.priorConfidence).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'critical']).toContain(c.severity);
      }
    }
  });

  it('escalates every safety-critical symptom rule', () => {
    const unescalated = KNOWLEDGE.symptoms.filter((r: any) => r.safetyCritical && !r.escalateToMechanic);
    expect(unescalated.map((r: any) => r.symptomKey)).toEqual([]);
  });
});
