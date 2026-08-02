import { RetrievedProduct } from '@/src/services/product-retrieval.service';
import { FITMENT_LABEL } from '@/src/services/compatibility.service';
import { DetectedMotorcycle } from '@/src/services/motorcycle-nlu.service';

/**
 * Explanation layer.
 *
 * Turns the retrieval signals into user-facing reasons. Every reason is derived
 * from a MongoDB field and carries the evidence that produced it, so the UI can
 * show *why* a product was recommended and a reviewer can audit the claim.
 *
 * No LLM is involved here — this is what makes the recommendations explainable
 * rather than plausible-sounding.
 */

export type ReasonCode =
  | 'CONFIRMED_FITMENT'
  | 'UNIVERSAL_FITMENT'
  | 'FITMENT_UNVERIFIED'
  | 'CATEGORY_EXACT'
  | 'CATEGORY_KEYWORD'
  | 'HIGHLY_RATED'
  | 'WELL_REVIEWED'
  | 'IN_STOCK'
  | 'OUT_OF_STOCK'
  | 'WITHIN_BUDGET'
  | 'BEGINNER_FRIENDLY'
  | 'WORKSHOP_FITTING'
  | 'DIAGNOSIS_MATCH'
  | 'MAINTENANCE_MATCH';

export interface Reason {
  code: ReasonCode;
  /** Short chip label for the UI. */
  label: string;
  /** Full sentence for the grounding pack / tooltip. */
  text: string;
  /** Document field or id this claim came from. */
  evidence: string;
  tone: 'positive' | 'neutral' | 'caution';
}

export interface ExplainOptions {
  motorcycle?: DetectedMotorcycle | null;
  budget?: number;
  /** Categories that came from a diagnosis or maintenance task, not the user. */
  knowledgeCategories?: string[];
  intent?: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  diy_easy: 'Easy DIY fit',
  diy_moderate: 'Moderate DIY fit',
  workshop: 'Workshop fitting',
};

/**
 * Builds the ordered reason list for one product. Order matters: the first two
 * reasons are what the widget renders as chips.
 */
export function buildReasons(p: RetrievedProduct, opts: ExplainOptions = {}): Reason[] {
  const reasons: Reason[] = [];
  const bikeLabel = opts.motorcycle?.label || 'your motorcycle';

  // 1. Fitment — always first, it is the strongest claim we make.
  switch (p.fitment) {
    case 'FITS':
      reasons.push({
        code: 'CONFIRMED_FITMENT',
        label: FITMENT_LABEL.FITS,
        text: `Confirmed to fit the ${bikeLabel} by a fitment record in our catalogue.${
          p.fitmentNotes ? ` Note: ${p.fitmentNotes}` : ''
        }`,
        evidence: p.fitmentEvidenceId
          ? `ProductCompatibility:${p.fitmentEvidenceId}`
          : 'ProductCompatibility',
        tone: 'positive',
      });
      break;
    case 'FITS_UNIVERSAL':
      reasons.push({
        code: 'UNIVERSAL_FITMENT',
        label: FITMENT_LABEL.FITS_UNIVERSAL,
        text: `Listed as universal fitment, so it is expected to fit the ${bikeLabel}.${
          p.fitmentNotes ? ` Note: ${p.fitmentNotes}` : ''
        }`,
        evidence: p.fitmentEvidenceId
          ? `ProductCompatibility:${p.fitmentEvidenceId}`
          : 'ProductCompatibility.universal',
        tone: 'positive',
      });
      break;
    default:
      reasons.push({
        code: 'FITMENT_UNVERIFIED',
        label: FITMENT_LABEL.UNKNOWN,
        text: `We hold no fitment record for this part on the ${bikeLabel} — check the listing or ask us before buying.`,
        evidence: 'ProductCompatibility:none',
        tone: 'caution',
      });
  }

  // 2. Why this product matched the request.
  if ((p.categoryScore ?? 0) >= 3 && p.partCategory) {
    const fromKnowledge = (opts.knowledgeCategories || []).includes(p.partCategory);
    reasons.push({
      code: fromKnowledge
        ? opts.intent === 'repair'
          ? 'DIAGNOSIS_MATCH'
          : 'MAINTENANCE_MATCH'
        : 'CATEGORY_EXACT',
      label: fromKnowledge ? 'Matches the diagnosis' : 'Exact part type',
      text: fromKnowledge
        ? `This is a ${p.partCategory.replace(/_/g, ' ')}, the part category identified by the diagnosis.`
        : `Categorised as ${p.partCategory.replace(/_/g, ' ')}, exactly the part type you asked about.`,
      evidence: `Product.partCategory=${p.partCategory}`,
      tone: 'positive',
    });
  } else if ((p.categoryScore ?? 0) > 0) {
    reasons.push({
      code: 'CATEGORY_KEYWORD',
      label: 'Related part',
      text: 'Matched your request on the product name, tags or description.',
      evidence: 'Product.name|tags|description',
      tone: 'neutral',
    });
  }

  // 3. Social proof from real Review documents.
  if (p.ratingCount > 0) {
    const strong = p.ratingAvg >= 4.2 && p.ratingCount >= 3;
    reasons.push({
      code: strong ? 'HIGHLY_RATED' : 'WELL_REVIEWED',
      label: `${p.ratingAvg.toFixed(1)}★ (${p.ratingCount})`,
      text: `Rated ${p.ratingAvg.toFixed(1)} out of 5 across ${p.ratingCount} customer review${
        p.ratingCount === 1 ? '' : 's'
      }.`,
      evidence: `Review.aggregate(productId=${p.id})`,
      tone: strong ? 'positive' : 'neutral',
    });
  }

  // 4. Availability.
  reasons.push(
    p.inStock
      ? {
          code: 'IN_STOCK',
          label: 'In stock',
          text: `In stock (${p.stock} available) and ready to ship.`,
          evidence: `Product.stock=${p.stock}`,
          tone: 'positive',
        }
      : {
          code: 'OUT_OF_STOCK',
          label: 'Out of stock',
          text: 'Currently out of stock.',
          evidence: `Product.stock=${p.stock}`,
          tone: 'caution',
        }
  );

  // 5. Budget.
  if (opts.budget && p.price <= opts.budget) {
    reasons.push({
      code: 'WITHIN_BUDGET',
      label: 'Within budget',
      text: `Priced at ${p.price}, within your stated budget of ${opts.budget}.`,
      evidence: `Product.price=${p.price}`,
      tone: 'positive',
    });
  }

  // 6. Fitting difficulty — matters most to the beginner audience.
  if (p.fitmentDifficulty) {
    reasons.push({
      code: p.fitmentDifficulty === 'workshop' ? 'WORKSHOP_FITTING' : 'BEGINNER_FRIENDLY',
      label: DIFFICULTY_LABEL[p.fitmentDifficulty] || p.fitmentDifficulty,
      text:
        p.fitmentDifficulty === 'workshop'
          ? 'Fitting this part normally needs workshop tools or a mechanic.'
          : 'This part can normally be fitted at home with basic tools.',
      evidence: `Product.fitmentDifficulty=${p.fitmentDifficulty}`,
      tone: p.fitmentDifficulty === 'workshop' ? 'caution' : 'positive',
    });
  }

  return reasons;
}

/** Compact one-line rationale used inside the deterministic fallback reply. */
export function summariseReasons(reasons: Reason[], max = 2): string {
  return reasons
    .filter((r) => r.tone !== 'neutral')
    .slice(0, max)
    .map((r) => r.label)
    .join(' · ');
}

/**
 * Deterministic spec comparison. Produces the shared/differing attribute table
 * for the `comparison` intent so the LLM only has to phrase a verdict it cannot
 * compute wrongly.
 */
export interface SpecComparison {
  attributes: string[];
  rows: Array<{ attribute: string; values: Array<string | null>; differs: boolean }>;
  priceRange: { min: number; max: number };
  bestRated?: { id: string; name: string; ratingAvg: number };
  cheapest?: { id: string; name: string; price: number };
}

export function compareProducts(products: RetrievedProduct[]): SpecComparison | null {
  if (products.length < 2) return null;

  const attributes = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specs || {})))
  ).sort();

  const rows = attributes.map((attribute) => {
    const values = products.map((p) => (p.specs ? (p.specs[attribute] ?? null) : null));
    const present = values.filter((v) => v !== null);
    return {
      attribute,
      values,
      differs: new Set(present).size > 1,
    };
  });

  const prices = products.map((p) => p.price);
  const rated = products.filter((p) => p.ratingCount > 0);
  const bestRated = rated.length
    ? rated.reduce((a, b) => (b.ratingAvg > a.ratingAvg ? b : a))
    : undefined;
  const cheapest = products.reduce((a, b) => (b.price < a.price ? b : a));

  return {
    attributes,
    rows,
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    bestRated: bestRated
      ? { id: bestRated.id, name: bestRated.name, ratingAvg: bestRated.ratingAvg }
      : undefined,
    cheapest: { id: cheapest.id, name: cheapest.name, price: cheapest.price },
  };
}
