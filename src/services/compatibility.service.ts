import { ProductCompatibility } from '@/src/models/ProductCompatibility';
import { Product } from '@/src/models/Product';

/**
 * Fitment reasoning layer.
 *
 * The previous implementation could only express "boosted because compatible"
 * — the absence of a fitment link was silently indistinguishable from a real
 * mismatch. That makes a confident-sounding wrong answer the default.
 *
 * This service returns an explicit four-valued verdict so the assistant can say
 * "no" and "I don't know" as first-class answers:
 *
 *   FITS            — a specific product↔motorcycle link exists
 *   FITS_UNIVERSAL  — the product is marked universal
 *   NO_FIT          — the bike HAS fitment data for this part category, but not
 *                     for this product (closed-world inference within a category)
 *   UNKNOWN         — no data either way; never guess
 */
export type FitmentVerdict = 'FITS' | 'FITS_UNIVERSAL' | 'NO_FIT' | 'UNKNOWN';

export interface FitmentResult {
  verdict: FitmentVerdict;
  /** Human-readable justification, always derived from a document. */
  explanation: string;
  /** Free-form note authored on the ProductCompatibility document. */
  fitmentNotes?: string;
  /** The compatibility document that justified a positive verdict. */
  evidenceId?: string;
}

export const FITMENT_LABEL: Record<FitmentVerdict, string> = {
  FITS: 'Confirmed fit',
  FITS_UNIVERSAL: 'Universal fit',
  NO_FIT: 'Does not fit',
  UNKNOWN: 'Fitment unverified',
};

/** True when the verdict permits recommending the product for that bike. */
export function isRecommendable(verdict: FitmentVerdict): boolean {
  return verdict !== 'NO_FIT';
}

/**
 * Resolves the verdict for a single product against a single motorcycle.
 *
 * The NO_FIT inference is deliberately conservative: we only claim a mismatch
 * when the catalogue demonstrably knows about fitment for that part category on
 * that bike (i.e. at least one sibling product in the same category IS linked).
 * Otherwise we return UNKNOWN rather than implying knowledge we do not have.
 */
export async function resolveFitment(
  productId: string,
  motorcycleId: string | null,
  partCategory?: string
): Promise<FitmentResult> {
  if (!motorcycleId) {
    return {
      verdict: 'UNKNOWN',
      explanation: 'No motorcycle specified, so fitment cannot be checked.',
    };
  }

  const links = await ProductCompatibility.find({
    product: productId,
    $or: [{ motorcycle: motorcycleId }, { universal: true }],
  }).lean();

  const specific = links.find((l: any) => !l.universal);
  if (specific) {
    return {
      verdict: 'FITS',
      explanation: 'A confirmed fitment record links this part to your motorcycle.',
      fitmentNotes: (specific as any).fitmentNotes,
      evidenceId: String((specific as any)._id),
    };
  }

  const universal = links.find((l: any) => l.universal);
  if (universal) {
    return {
      verdict: 'FITS_UNIVERSAL',
      explanation: 'This part is listed as universal fitment across motorcycles.',
      fitmentNotes: (universal as any).fitmentNotes,
      evidenceId: String((universal as any)._id),
    };
  }

  // Closed-world check, scoped to the part category.
  if (partCategory) {
    const siblingIds = await Product.find({ partCategory, status: 'active' })
      .select('_id')
      .lean();
    if (siblingIds.length > 0) {
      const categoryCoverage = await ProductCompatibility.countDocuments({
        motorcycle: motorcycleId,
        product: { $in: siblingIds.map((p: any) => p._id) },
      });
      if (categoryCoverage > 0) {
        return {
          verdict: 'NO_FIT',
          explanation:
            'We hold fitment data for this part category on your motorcycle, and this product is not listed as compatible.',
        };
      }
    }
  }

  return {
    verdict: 'UNKNOWN',
    explanation: 'We have no fitment record for this product on your motorcycle yet.',
  };
}

/**
 * Batch variant used by the retrieval pipeline — one round-trip for the whole
 * candidate set instead of N queries.
 */
export async function resolveFitmentBatch(
  productIds: string[],
  motorcycleId: string | null
): Promise<Map<string, FitmentResult>> {
  const out = new Map<string, FitmentResult>();
  if (productIds.length === 0) return out;

  if (!motorcycleId) {
    for (const id of productIds) {
      out.set(id, {
        verdict: 'UNKNOWN',
        explanation: 'No motorcycle specified, so fitment cannot be checked.',
      });
    }
    return out;
  }

  const links = await ProductCompatibility.find({
    product: { $in: productIds },
    $or: [{ motorcycle: motorcycleId }, { universal: true }],
  }).lean();

  for (const link of links as any[]) {
    const key = String(link.product);
    const existing = out.get(key);
    // A specific link always beats a universal one.
    if (!link.universal) {
      out.set(key, {
        verdict: 'FITS',
        explanation: 'A confirmed fitment record links this part to your motorcycle.',
        fitmentNotes: link.fitmentNotes,
        evidenceId: String(link._id),
      });
    } else if (!existing || existing.verdict !== 'FITS') {
      out.set(key, {
        verdict: 'FITS_UNIVERSAL',
        explanation: 'This part is listed as universal fitment across motorcycles.',
        fitmentNotes: link.fitmentNotes,
        evidenceId: String(link._id),
      });
    }
  }

  for (const id of productIds) {
    if (!out.has(id)) {
      out.set(id, {
        verdict: 'UNKNOWN',
        explanation: 'We have no fitment record for this product on your motorcycle yet.',
      });
    }
  }

  return out;
}
