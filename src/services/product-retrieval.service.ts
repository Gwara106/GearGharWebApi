import mongoose from 'mongoose';
import { Product } from '@/src/models/Product';
import { ProductCompatibility } from '@/src/models/ProductCompatibility';
import { Review } from '@/src/models/Review';
import { PRODUCT_CATEGORY_KEYWORDS, NluResult } from '@/src/services/motorcycle-nlu.service';
import {
  resolveFitmentBatch,
  FitmentVerdict,
  FitmentResult,
  isRecommendable,
} from '@/src/services/compatibility.service';

/**
 * Retrieval layer: turns NLU entities into a ranked list of real catalogue
 * products.
 *
 * Multi-channel by design, fused with Reciprocal Rank Fusion:
 *   1. RELATIONAL — ProductCompatibility (bike-specific ∪ universal)
 *   2. LEXICAL    — MongoDB $text index (weighted name/tags/description)
 *   3. RULE       — the graded category taxonomy score (anti-leakage gate)
 *
 * Hard filters (never fused away): status='active', category gate, NO_FIT.
 * Ranking additionally consumes review aggregates and stock so that every
 * ordering decision is traceable to a document field.
 */

export interface RetrievedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  brand: string;
  category: string;
  partCategory?: string;
  image: string | null;
  inStock: boolean;
  stock: number;
  tags: string[];
  specs?: Record<string, string>;
  fitmentDifficulty?: string;

  /** Four-valued fitment verdict against the detected motorcycle. */
  fitment: FitmentVerdict;
  fitmentExplanation: string;
  fitmentNotes?: string;
  fitmentEvidenceId?: string;
  /** Retained for backward compatibility with existing callers/UI. */
  compatibleWithBike?: boolean;

  /** Review aggregates used for ranking and explanation. */
  ratingAvg: number;
  ratingCount: number;

  /** Relevance of this product to the requested category (higher = stronger). */
  categoryScore?: number;
  /** Fused retrieval score (RRF across channels + quality signals). */
  retrievalScore?: number;
  /** Which channels surfaced this product — telemetry for the ablation study. */
  channels: string[];
}

export interface RetrievalOptions {
  limit?: number;
  /** Upper price bound from the budget slot. */
  budget?: number;
  /** Product ids the user has already purchased — used to demote repeats. */
  purchasedProductIds?: string[];
  /** Extra categories inferred from knowledge retrieval (e.g. diagnosis → parts). */
  extraCategories?: string[];
}

function toRetrieved(p: any): RetrievedProduct {
  const specs =
    p.specs instanceof Map
      ? Object.fromEntries(p.specs)
      : p.specs && typeof p.specs === 'object'
        ? p.specs
        : undefined;

  return {
    id: String(p._id),
    name: p.name,
    description: p.description,
    price: p.price,
    currency: p.currency || 'INR',
    brand: p.brand || '',
    category: p.category,
    partCategory: p.partCategory,
    image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
    inStock: (p.stock ?? 0) > 0 && p.status === 'active',
    stock: p.stock ?? 0,
    tags: p.tags || [],
    specs,
    fitmentDifficulty: p.fitmentDifficulty,
    fitment: 'UNKNOWN',
    fitmentExplanation: 'Fitment not yet checked.',
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    channels: [],
  };
}

/**
 * Scores how strongly a product matches the requested categories. Prevents
 * leakage by grading the match:
 *   3 = normalised partCategory is exactly one of the requested categories
 *   2 = a requested category keyword appears in the product tags
 *   1 = a requested category keyword appears only in name/description
 *   0 = no match (excluded when a category was requested)
 */
function scoreCategory(p: RetrievedProduct, categories: string[], catRegex: RegExp | null): number {
  if (categories.length === 0) return 0;
  if (p.partCategory && categories.includes(p.partCategory)) return 3;
  if (catRegex) {
    if ((p.tags || []).some((t) => catRegex.test(t))) return 2;
    if (catRegex.test(p.name) || catRegex.test(p.description)) return 1;
  }
  return 0;
}

function categoryRegex(categories: string[]): RegExp | null {
  const terms = categories.flatMap((c) => PRODUCT_CATEGORY_KEYWORDS[c] || [c]);
  if (terms.length === 0) return null;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

/** Reciprocal Rank Fusion. k=60 is the standard damping constant. */
const RRF_K = 60;
function rrf(rank: number): number {
  return 1 / (RRF_K + rank);
}

/**
 * Loads review aggregates for a candidate set. Prefers the denormalised
 * ratingAvg/ratingCount on Product; falls back to aggregating Review so the
 * pipeline still works before the backfill script has been run.
 */
async function attachRatings(products: RetrievedProduct[]): Promise<void> {
  const missing = products.filter((p) => !p.ratingCount);
  if (missing.length === 0) return;

  // aggregate() does not cast strings to ObjectId — do it explicitly.
  const objectIds = missing
    .filter((p) => mongoose.Types.ObjectId.isValid(p.id))
    .map((p) => new mongoose.Types.ObjectId(p.id));
  if (objectIds.length === 0) return;

  const rows = await Review.aggregate([
    { $match: { productId: { $in: objectIds } } },
    { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]).catch(() => [] as any[]);

  const byId = new Map(rows.map((r: any) => [String(r._id), r]));
  for (const p of missing) {
    const row = byId.get(p.id);
    if (row) {
      p.ratingAvg = +Number(row.avg).toFixed(2);
      p.ratingCount = row.count;
    }
  }
}

/**
 * Returns catalogue products relevant to the parsed message, fitment-resolved
 * and ranked. Products with a NO_FIT verdict are removed entirely — the
 * assistant must never recommend a part the data says will not fit.
 */
export async function retrieveProducts(
  nlu: NluResult,
  options: RetrievalOptions = {}
): Promise<RetrievedProduct[]> {
  const limit = options.limit ?? 4;
  const cats = Array.from(new Set([...nlu.categories, ...(options.extraCategories || [])]));
  const catRegex = categoryRegex(cats);
  const budget = options.budget ?? nlu.slots?.budget;

  const candidates = new Map<string, RetrievedProduct>();
  const channelRanks = new Map<string, Map<string, number>>();

  const record = (channel: string, id: string, rank: number) => {
    if (!channelRanks.has(channel)) channelRanks.set(channel, new Map());
    const m = channelRanks.get(channel)!;
    if (!m.has(id)) m.set(id, rank);
  };

  const passesCategory = (p: RetrievedProduct): boolean =>
    cats.length === 0 || scoreCategory(p, cats, catRegex) > 0;

  const passesBudget = (p: RetrievedProduct): boolean => !budget || p.price <= budget;

  // ── Channel 1: RELATIONAL (fitment-driven) ──────────────────────────────
  if (nlu.motorcycle) {
    const links = await ProductCompatibility.find({
      $or: [{ motorcycle: nlu.motorcycle.id }, { universal: true }],
    })
      .populate('product')
      .limit(limit * 25)
      .lean();

    let rank = 0;
    for (const link of links as any[]) {
      const p = link.product;
      if (!p || p.status !== 'active') continue;
      const id = String(p._id);
      if (!candidates.has(id)) {
        const rp = toRetrieved(p);
        if (!passesCategory(rp) || !passesBudget(rp)) continue;
        candidates.set(id, rp);
      }
      // Specific links outrank universal ones within this channel.
      record('relational', id, link.universal ? rank + 100 : rank);
      rank++;
    }
  }

  // ── Channel 2: LEXICAL ($text index) ────────────────────────────────────
  const searchTerms = [
    ...cats.flatMap((c) => (PRODUCT_CATEGORY_KEYWORDS[c] || [c]).slice(0, 3)),
    ...nlu.keywords,
  ]
    .filter(Boolean)
    .slice(0, 12)
    .join(' ');

  if (searchTerms.trim()) {
    const textHits = await Product.find(
      { status: 'active', $text: { $search: searchTerms } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit * 6)
      .lean()
      .catch(() => [] as any[]);

    let rank = 0;
    for (const p of textHits as any[]) {
      const id = String(p._id);
      if (!candidates.has(id)) {
        const rp = toRetrieved(p);
        if (!passesCategory(rp) || !passesBudget(rp)) continue;
        candidates.set(id, rp);
      }
      record('lexical', id, rank++);
    }
  }

  // ── Channel 3: RULE (canonical partCategory lookup) ─────────────────────
  if (cats.length > 0) {
    const query: any = { status: 'active', partCategory: { $in: cats } };
    if (budget) query.price = { $lte: budget };

    const ruleHits = await Product.find(query)
      .sort({ ratingAvg: -1, price: 1 })
      .limit(limit * 6)
      .lean();

    let rank = 0;
    for (const p of ruleHits as any[]) {
      const id = String(p._id);
      if (!candidates.has(id)) {
        const rp = toRetrieved(p);
        if (!passesBudget(rp)) continue;
        candidates.set(id, rp);
      }
      record('rule', id, rank++);
    }
  }

  if (candidates.size === 0) return [];

  const all = Array.from(candidates.values());

  // ── Fitment resolution (hard filter) ────────────────────────────────────
  const fitments: Map<string, FitmentResult> = await resolveFitmentBatch(
    all.map((p) => p.id),
    nlu.motorcycle ? nlu.motorcycle.id : null
  );

  for (const p of all) {
    const f = fitments.get(p.id);
    if (f) {
      p.fitment = f.verdict;
      p.fitmentExplanation = f.explanation;
      p.fitmentNotes = f.fitmentNotes;
      p.fitmentEvidenceId = f.evidenceId;
    }
    p.compatibleWithBike = p.fitment === 'FITS';
  }

  const recommendable = all.filter((p) => isRecommendable(p.fitment));

  await attachRatings(recommendable);

  // ── Fusion + quality ranking ────────────────────────────────────────────
  const purchased = new Set(options.purchasedProductIds || []);

  for (const p of recommendable) {
    p.categoryScore = scoreCategory(p, cats, catRegex);

    let fused = 0;
    channelRanks.forEach((ranks, channel) => {
      const r = ranks.get(p.id);
      if (r !== undefined) {
        fused += rrf(r);
        p.channels.push(channel);
      }
    });

    // Deterministic quality signals, each traceable to a document field.
    const fitmentBoost =
      p.fitment === 'FITS' ? 0.06 : p.fitment === 'FITS_UNIVERSAL' ? 0.02 : 0;
    const categoryBoost = (p.categoryScore ?? 0) * 0.012;
    // Bayesian-damped rating: avoids a single 5★ review outranking a proven part.
    const ratingBoost =
      p.ratingCount > 0 ? (p.ratingAvg / 5) * (p.ratingCount / (p.ratingCount + 5)) * 0.03 : 0;
    const stockBoost = p.inStock ? 0.01 : -0.02;
    const repeatPenalty = purchased.has(p.id) ? -0.03 : 0;

    p.retrievalScore = +(
      fused +
      fitmentBoost +
      categoryBoost +
      ratingBoost +
      stockBoost +
      repeatPenalty
    ).toFixed(6);
  }

  return recommendable
    .sort((a, b) => (b.retrievalScore ?? 0) - (a.retrievalScore ?? 0))
    .slice(0, limit);
}

/**
 * Fetches specific products by id, fitment-resolved. Used by the comparison
 * plan and by "does THIS fit my bike?" follow-ups against the last shown set.
 */
export async function retrieveProductsByIds(
  ids: string[],
  motorcycleId: string | null
): Promise<RetrievedProduct[]> {
  if (ids.length === 0) return [];
  const docs = await Product.find({ _id: { $in: ids }, status: 'active' }).lean();
  const products = (docs as any[]).map(toRetrieved);

  const fitments = await resolveFitmentBatch(products.map((p) => p.id), motorcycleId);
  for (const p of products) {
    const f = fitments.get(p.id);
    if (f) {
      p.fitment = f.verdict;
      p.fitmentExplanation = f.explanation;
      p.fitmentNotes = f.fitmentNotes;
      p.fitmentEvidenceId = f.evidenceId;
    }
    p.compatibleWithBike = p.fitment === 'FITS';
  }

  await attachRatings(products);
  return products;
}
