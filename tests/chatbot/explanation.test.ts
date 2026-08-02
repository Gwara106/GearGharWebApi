import { describe, it, expect } from 'vitest';
import { buildReasons, summariseReasons, compareProducts } from '@/src/services/explanation.service';
import { isRecommendable, FITMENT_LABEL } from '@/src/services/compatibility.service';
import type { RetrievedProduct } from '@/src/services/product-retrieval.service';

/**
 * Explainability tests.
 *
 * Every reason the assistant shows must be traceable to a MongoDB field. These
 * tests assert both the content of the explanations and — importantly — that
 * each carries an `evidence` pointer, which is what makes the recommendations
 * auditable rather than merely plausible.
 */

function product(overrides: Partial<RetrievedProduct> = {}): RetrievedProduct {
  return {
    id: '650f1a2b3c4d5e6f70819200',
    name: 'RaceTech Slip-On Exhaust',
    description: 'Stainless slip-on exhaust',
    price: 8499,
    currency: 'INR',
    brand: 'RaceTech',
    category: 'accessories',
    partCategory: 'exhaust',
    image: null,
    inStock: true,
    stock: 4,
    tags: ['exhaust', 'slip-on'],
    fitment: 'FITS',
    fitmentExplanation: 'A confirmed fitment record links this part to your motorcycle.',
    fitmentEvidenceId: 'abc123',
    ratingAvg: 4.6,
    ratingCount: 12,
    categoryScore: 3,
    channels: ['relational', 'rule'],
    ...overrides,
  };
}

const bike = {
  id: 'bike1',
  slug: 'yamaha-r15-v4',
  brand: 'Yamaha',
  model: 'R15 V4',
  label: 'Yamaha R15 V4',
  type: 'sport',
  engineCc: 155,
};

describe('buildReasons', () => {
  it('leads with the fitment verdict', () => {
    const reasons = buildReasons(product(), { motorcycle: bike });
    expect(reasons[0].code).toBe('CONFIRMED_FITMENT');
    expect(reasons[0].text).toContain('Yamaha R15 V4');
  });

  it('attaches document-level evidence to every reason', () => {
    const reasons = buildReasons(product(), { motorcycle: bike });
    expect(reasons.length).toBeGreaterThan(0);
    for (const r of reasons) {
      expect(r.evidence).toBeTruthy();
      expect(r.evidence.length).toBeGreaterThan(3);
    }
  });

  it('cites the ProductCompatibility document id for a confirmed fit', () => {
    const reasons = buildReasons(product(), { motorcycle: bike });
    expect(reasons[0].evidence).toBe('ProductCompatibility:abc123');
  });

  it('flags unverified fitment as a caution rather than a positive', () => {
    const reasons = buildReasons(
      product({ fitment: 'UNKNOWN', fitmentEvidenceId: undefined }),
      { motorcycle: bike }
    );
    expect(reasons[0].code).toBe('FITMENT_UNVERIFIED');
    expect(reasons[0].tone).toBe('caution');
  });

  it('includes the fitment note when the catalogue supplies one', () => {
    const reasons = buildReasons(
      product({ fitmentNotes: 'Requires OEM clamp adapter' }),
      { motorcycle: bike }
    );
    expect(reasons[0].text).toContain('Requires OEM clamp adapter');
  });

  it('reports review aggregates with the real numbers', () => {
    const reasons = buildReasons(product(), { motorcycle: bike });
    const rating = reasons.find((r) => r.code === 'HIGHLY_RATED');
    expect(rating).toBeDefined();
    expect(rating!.label).toBe('4.6★ (12)');
    expect(rating!.evidence).toContain('Review.aggregate');
  });

  it('omits a rating reason when there are no reviews', () => {
    const reasons = buildReasons(product({ ratingAvg: 0, ratingCount: 0 }), { motorcycle: bike });
    expect(reasons.some((r) => r.code === 'HIGHLY_RATED' || r.code === 'WELL_REVIEWED')).toBe(false);
  });

  it('marks out-of-stock products as a caution', () => {
    const reasons = buildReasons(product({ inStock: false, stock: 0 }), { motorcycle: bike });
    const stock = reasons.find((r) => r.code === 'OUT_OF_STOCK');
    expect(stock).toBeDefined();
    expect(stock!.tone).toBe('caution');
  });

  it('reports a budget match against the stated budget', () => {
    const reasons = buildReasons(product(), { motorcycle: bike, budget: 10000 });
    const budget = reasons.find((r) => r.code === 'WITHIN_BUDGET');
    expect(budget).toBeDefined();
    expect(budget!.text).toContain('10000');
  });

  it('labels a diagnosis-driven match differently from a user-requested one', () => {
    const reasons = buildReasons(product({ partCategory: 'brakes' }), {
      motorcycle: bike,
      knowledgeCategories: ['brakes'],
      intent: 'repair',
    });
    expect(reasons.some((r) => r.code === 'DIAGNOSIS_MATCH')).toBe(true);
  });

  it('surfaces fitting difficulty for beginners', () => {
    const reasons = buildReasons(product({ fitmentDifficulty: 'workshop' }), { motorcycle: bike });
    const fit = reasons.find((r) => r.code === 'WORKSHOP_FITTING');
    expect(fit).toBeDefined();
    expect(fit!.tone).toBe('caution');
  });
});

describe('summariseReasons', () => {
  it('produces a compact rationale for the deterministic reply', () => {
    const summary = summariseReasons(buildReasons(product(), { motorcycle: bike }));
    expect(summary).toContain('Confirmed fit');
    expect(summary.split('·').length).toBeLessThanOrEqual(2);
  });
});

describe('compatibility verdicts', () => {
  it('permits recommending everything except a known mismatch', () => {
    expect(isRecommendable('FITS')).toBe(true);
    expect(isRecommendable('FITS_UNIVERSAL')).toBe(true);
    expect(isRecommendable('UNKNOWN')).toBe(true);
    expect(isRecommendable('NO_FIT')).toBe(false);
  });

  it('has a distinct user-facing label for every verdict', () => {
    const labels = Object.values(FITMENT_LABEL);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('compareProducts', () => {
  it('returns null when there is nothing to compare', () => {
    expect(compareProducts([product()])).toBeNull();
  });

  it('identifies which attributes actually differ', () => {
    const a = product({ id: 'a', specs: { material: 'Stainless', weight: '2.1kg' } });
    const b = product({ id: 'b', name: 'Other Exhaust', price: 6999, specs: { material: 'Titanium', weight: '2.1kg' } });

    const cmp = compareProducts([a, b])!;
    expect(cmp.attributes).toEqual(['material', 'weight']);
    expect(cmp.rows.find((r) => r.attribute === 'material')!.differs).toBe(true);
    expect(cmp.rows.find((r) => r.attribute === 'weight')!.differs).toBe(false);
  });

  it('computes the price range and the cheapest option deterministically', () => {
    const a = product({ id: 'a', price: 8499 });
    const b = product({ id: 'b', name: 'Budget Exhaust', price: 4999 });

    const cmp = compareProducts([a, b])!;
    expect(cmp.priceRange).toEqual({ min: 4999, max: 8499 });
    expect(cmp.cheapest!.id).toBe('b');
  });

  it('identifies the best-rated product from review data', () => {
    const a = product({ id: 'a', ratingAvg: 4.6, ratingCount: 12 });
    const b = product({ id: 'b', name: 'Other', ratingAvg: 4.9, ratingCount: 5 });

    const cmp = compareProducts([a, b])!;
    expect(cmp.bestRated!.id).toBe('b');
  });
});
