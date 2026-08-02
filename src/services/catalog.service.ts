import mongoose from 'mongoose';
import { Product } from '@/src/models/Product';
import { ProductCompatibility } from '@/src/models/ProductCompatibility';
import { Motorcycle } from '@/src/models/Motorcycle';
import { User } from '@/src/models/User';
import { Order } from '@/src/models/Order';

/**
 * Storefront catalogue service.
 *
 * Owns search, filtering, sorting, faceting, related products and the
 * personalised re-rank. All of it runs against MongoDB indexes rather than
 * loading the catalogue into memory — the previous shop page fetched every
 * product and filtered client-side, which does not survive a real catalogue.
 *
 * Kept separate from product-retrieval.service.ts on purpose: that one serves
 * the AI assistant and is optimised for fitment-grounded recall, whereas this
 * one serves the storefront and is optimised for browsing and merchandising.
 */

export type SortKey =
  | 'relevance'
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'rating'
  | 'popular'
  | 'name';

export interface CatalogQuery {
  search?: string;
  /** Product.category enum value (electronics, clothing, accessories, …). */
  category?: string;
  /** Taxonomy slug — the precise motorcycle-part category. */
  partCategory?: string | string[];
  brand?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  beginnerFriendly?: boolean;
  universalOnly?: boolean;
  /** Restrict to parts with a fitment record for this motorcycle. */
  fitsMotorcycleId?: string;
  fitsMotorcycleSlug?: string;
  sort?: SortKey;
  page?: number;
  limit?: number;
  /** When set, results are re-ranked for this user's garage and history. */
  personaliseForUserId?: string;
}

export interface CatalogResult {
  products: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appliedFilters: Record<string, unknown>;
  personalised: boolean;
}

const MAX_LIMIT = 60;

function toArray(value?: string | string[]): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : String(value).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Resolves the set of product ids that fit a motorcycle: those with a specific
 * fitment record plus everything flagged universal.
 */
async function fitmentProductIds(motorcycleId: string | null): Promise<mongoose.Types.ObjectId[] | null> {
  if (!motorcycleId || !mongoose.Types.ObjectId.isValid(motorcycleId)) return null;

  const links = await ProductCompatibility.find({
    $or: [{ motorcycle: motorcycleId }, { universal: true }],
  })
    .select('product')
    .lean();

  return links.map((l: any) => l.product);
}

export async function resolveMotorcycleId(query: {
  fitsMotorcycleId?: string;
  fitsMotorcycleSlug?: string;
}): Promise<string | null> {
  if (query.fitsMotorcycleId && mongoose.Types.ObjectId.isValid(query.fitsMotorcycleId)) {
    return query.fitsMotorcycleId;
  }
  if (query.fitsMotorcycleSlug) {
    const bike: any = await Motorcycle.findOne({ slug: query.fitsMotorcycleSlug.toLowerCase() })
      .select('_id')
      .lean();
    return bike ? String(bike._id) : null;
  }
  return null;
}

/** Builds the Mongo filter document from a catalogue query. */
export async function buildFilter(query: CatalogQuery): Promise<{
  filter: Record<string, any>;
  applied: Record<string, unknown>;
  motorcycleId: string | null;
}> {
  const filter: Record<string, any> = {};
  const applied: Record<string, unknown> = {};

  // Out-of-stock products stay browsable unless explicitly excluded, so the
  // catalogue does not appear to shrink when stock runs down.
  if (query.inStockOnly) {
    filter.status = 'active';
    filter.stock = { $gt: 0 };
    applied.inStockOnly = true;
  } else {
    filter.status = { $in: ['active', 'out_of_stock'] };
  }

  if (query.category && query.category !== 'All Products') {
    filter.category = query.category;
    applied.category = query.category;
  }

  const partCategories = toArray(query.partCategory);
  if (partCategories.length > 0) {
    filter.partCategory = { $in: partCategories };
    applied.partCategory = partCategories;
  }

  const brands = toArray(query.brand);
  if (brands.length > 0) {
    filter.brand = { $in: brands };
    applied.brand = brands;
  }

  if (typeof query.minPrice === 'number' || typeof query.maxPrice === 'number') {
    filter.price = {};
    if (typeof query.minPrice === 'number') filter.price.$gte = query.minPrice;
    if (typeof query.maxPrice === 'number') filter.price.$lte = query.maxPrice;
    applied.priceRange = [query.minPrice ?? null, query.maxPrice ?? null];
  }

  if (typeof query.minRating === 'number' && query.minRating > 0) {
    filter.ratingAvg = { $gte: query.minRating };
    applied.minRating = query.minRating;
  }

  if (query.beginnerFriendly) {
    filter.beginnerFriendly = true;
    applied.beginnerFriendly = true;
  }

  if (query.universalOnly) {
    filter.universalFit = true;
    applied.universalOnly = true;
  }

  if (query.search && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
    applied.search = query.search.trim();
  }

  const motorcycleId = await resolveMotorcycleId(query);
  if (motorcycleId) {
    const ids = await fitmentProductIds(motorcycleId);
    if (ids) {
      filter._id = { $in: ids };
      applied.fitsMotorcycle = motorcycleId;
    }
  }

  return { filter, applied, motorcycleId };
}

function sortSpec(sort: SortKey, hasSearch: boolean): Record<string, any> {
  switch (sort) {
    case 'price-low':
      return { price: 1, _id: 1 };
    case 'price-high':
      return { price: -1, _id: 1 };
    case 'rating':
      return { ratingAvg: -1, ratingCount: -1, _id: 1 };
    case 'popular':
      return { salesCount: -1, viewCount: -1, _id: 1 };
    case 'name':
      return { name: 1, _id: 1 };
    case 'newest':
      return { createdAt: -1, _id: 1 };
    case 'relevance':
    default:
      // Without a text query there is no relevance score to sort on, so fall
      // back to a sensible merchandising order.
      return hasSearch
        ? { score: { $meta: 'textScore' }, ratingAvg: -1 }
        : { salesCount: -1, ratingAvg: -1, _id: 1 };
  }
}

/**
 * Personalisation signals for a shopper: their garage bikes, the brands they
 * have bought before, and the part categories they already own.
 */
export interface ShopperProfile {
  motorcycleIds: string[];
  fitProductIds: Set<string>;
  purchasedBrands: Set<string>;
  purchasedProductIds: Set<string>;
  preferredBrands: Set<string>;
  beginnerMode: boolean;
}

export async function loadShopperProfile(userId?: string): Promise<ShopperProfile | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;

  const user: any = await User.findById(userId).select('garage preferences').lean();
  if (!user) return null;

  const motorcycleIds = (user.garage || [])
    .map((g: any) => String(g.motorcycle))
    .filter((id: string) => mongoose.Types.ObjectId.isValid(id));

  const fitProductIds = new Set<string>();
  if (motorcycleIds.length > 0) {
    const links = await ProductCompatibility.find({ motorcycle: { $in: motorcycleIds } })
      .select('product')
      .lean();
    for (const l of links as any[]) fitProductIds.add(String(l.product));
  }

  const purchasedBrands = new Set<string>();
  const purchasedProductIds = new Set<string>();
  try {
    const orders: any[] = await Order.find({ user: userId })
      .select('items')
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();
    const ids = new Set<string>();
    for (const order of orders) {
      // OrderItem stores the product reference as `item` (see src/models/Order.ts).
      for (const line of order.items || []) {
        if (line?.item) ids.add(String(line.item));
      }
    }
    ids.forEach((id) => purchasedProductIds.add(id));

    if (ids.size > 0) {
      const bought = await Product.find({ _id: { $in: Array.from(ids) } })
        .select('brand')
        .lean();
      for (const b of bought as any[]) if (b.brand) purchasedBrands.add(b.brand);
    }
  } catch {
    /* order history is optional for personalisation */
  }

  return {
    motorcycleIds,
    fitProductIds,
    purchasedBrands,
    purchasedProductIds,
    preferredBrands: new Set((user.preferences?.preferredBrands || []) as string[]),
    beginnerMode: !!user.preferences?.beginnerMode,
  };
}

/**
 * Re-orders a page of results for a shopper. Deliberately applied AFTER
 * pagination so the total count and page boundaries stay stable and the ranking
 * remains explainable: it promotes items that fit the rider's own motorcycle,
 * matches brands they already buy, and demotes things they have just bought.
 */
export function personaliseRanking(products: any[], profile: ShopperProfile | null): any[] {
  if (!profile) return products;

  const scored = products.map((p, index) => {
    const id = String(p._id);
    let boost = 0;
    const reasons: string[] = [];

    if (profile.fitProductIds.has(id)) {
      boost += 3;
      reasons.push('Fits a motorcycle in your garage');
    }
    if (p.universalFit) {
      boost += 0.5;
    }
    if (p.brand && profile.preferredBrands.has(p.brand)) {
      boost += 1.5;
      reasons.push('One of your preferred brands');
    }
    if (p.brand && profile.purchasedBrands.has(p.brand)) {
      boost += 1;
      reasons.push('You have bought this brand before');
    }
    if (profile.beginnerMode && p.beginnerFriendly) {
      boost += 1;
      reasons.push('Beginner friendly');
    }
    if (profile.purchasedProductIds.has(id)) {
      boost -= 2.5;
      reasons.push('You already own this');
    }

    return { product: { ...p, personalisation: reasons.length ? reasons : undefined }, boost, index };
  });

  return scored
    .sort((a, b) => (b.boost !== a.boost ? b.boost - a.boost : a.index - b.index))
    .map((s) => s.product);
}

/** Main storefront query. */
export async function searchCatalog(query: CatalogQuery): Promise<CatalogResult> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit || 24));
  const sort = query.sort || 'relevance';

  const { filter, applied } = await buildFilter(query);
  const hasSearch = !!filter.$text;

  const projection: Record<string, any> = hasSearch ? { score: { $meta: 'textScore' } } : {};

  const [rawProducts, total] = await Promise.all([
    Product.find(filter, projection)
      .sort(sortSpec(sort, hasSearch))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const profile = await loadShopperProfile(query.personaliseForUserId);
  const products = personaliseRanking(rawProducts as any[], profile);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    appliedFilters: { ...applied, sort },
    personalised: !!profile,
  };
}

/**
 * Facet counts for the filter sidebar, computed over the current filter set
 * minus the facet's own dimension so counts stay useful while filtering.
 */
export async function catalogFacets(query: CatalogQuery) {
  const { filter } = await buildFilter(query);

  const withoutBrand = { ...filter };
  delete withoutBrand.brand;
  const withoutPartCategory = { ...filter };
  delete withoutPartCategory.partCategory;
  const withoutPrice = { ...filter };
  delete withoutPrice.price;

  const [brands, partCategories, categories, priceStats, ratingBands] = await Promise.all([
    Product.aggregate([
      { $match: withoutBrand },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 60 },
    ]),
    Product.aggregate([
      { $match: withoutPartCategory },
      { $group: { _id: '$partCategory', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Product.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Product.aggregate([
      { $match: withoutPrice },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' }, avg: { $avg: '$price' } } },
    ]),
    Product.aggregate([
      { $match: filter },
      {
        $bucket: {
          groupBy: '$ratingAvg',
          boundaries: [0, 3, 3.5, 4, 4.5, 5.01],
          default: 'unrated',
          output: { count: { $sum: 1 } },
        },
      },
    ]),
  ]);

  const stats = priceStats[0] || { min: 0, max: 0, avg: 0 };

  return {
    brands: brands.filter((b: any) => b._id).map((b: any) => ({ value: b._id, count: b.count })),
    partCategories: partCategories
      .filter((c: any) => c._id)
      .map((c: any) => ({
        value: c._id,
        label: String(c._id).replace(/_/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()),
        count: c.count,
      })),
    categories: categories.filter((c: any) => c._id).map((c: any) => ({ value: c._id, count: c.count })),
    price: {
      min: Math.floor(stats.min || 0),
      max: Math.ceil(stats.max || 0),
      avg: Math.round(stats.avg || 0),
    },
    ratings: ratingBands.map((r: any) => ({ from: r._id, count: r.count })),
  };
}

/**
 * Related products for a product page. Ranked by how much they have in common:
 * same part category first, then shared fitment, then same brand.
 */
export async function relatedProducts(productId: string, limit = 8): Promise<any[]> {
  if (!mongoose.Types.ObjectId.isValid(productId)) return [];

  const product: any = await Product.findById(productId)
    .select('partCategory brand price tags universalFit')
    .lean();
  if (!product) return [];

  // Bikes this product fits — used to prefer parts that suit the same machines.
  const links = await ProductCompatibility.find({ product: productId, universal: false })
    .select('motorcycle')
    .lean();
  const bikeIds = links.map((l: any) => l.motorcycle).filter(Boolean);

  let sameFitIds: string[] = [];
  if (bikeIds.length > 0) {
    const siblings = await ProductCompatibility.find({
      motorcycle: { $in: bikeIds },
      product: { $ne: productId },
    })
      .select('product')
      .limit(600)
      .lean();
    sameFitIds = Array.from(new Set(siblings.map((s: any) => String(s.product))));
  }

  const candidates: any[] = await Product.find({
    _id: { $ne: productId },
    status: { $in: ['active', 'out_of_stock'] },
    $or: [
      { partCategory: product.partCategory },
      { brand: product.brand },
      ...(sameFitIds.length ? [{ _id: { $in: sameFitIds.slice(0, 400) } }] : []),
    ],
  })
    .limit(limit * 8)
    .lean();

  const fitSet = new Set(sameFitIds);
  const tagSet = new Set<string>((product.tags || []) as string[]);

  const scored = candidates.map((c) => {
    let score = 0;
    const reasons: string[] = [];

    if (c.partCategory === product.partCategory) {
      score += 4;
      reasons.push('Same part type');
    }
    if (fitSet.has(String(c._id))) {
      score += 3;
      reasons.push('Fits the same motorcycles');
    }
    if (c.brand === product.brand) {
      score += 2;
      reasons.push('Same brand');
    }
    // Similar price band reads as a genuine alternative rather than an upsell.
    if (product.price > 0) {
      const ratio = c.price / product.price;
      if (ratio >= 0.6 && ratio <= 1.6) score += 1.5;
    }
    const sharedTags = (c.tags || []).filter((t: string) => tagSet.has(t)).length;
    score += Math.min(2, sharedTags * 0.4);
    if (c.ratingCount > 0) score += Math.min(1, (c.ratingAvg / 5) * (c.ratingCount / (c.ratingCount + 5)));
    if ((c.stock ?? 0) > 0) score += 0.5;

    return { ...c, relatedScore: +score.toFixed(2), relatedReasons: reasons };
  });

  return scored.sort((a, b) => b.relatedScore - a.relatedScore).slice(0, limit);
}

export type CollectionKey = 'popular' | 'top-rated' | 'new-arrivals' | 'beginner' | 'deals';

/** Curated homepage collections, all derived from real catalogue fields. */
export async function productCollection(
  key: CollectionKey,
  limit = 12,
  opts: { motorcycleId?: string | null } = {}
): Promise<any[]> {
  const base: Record<string, any> = { status: 'active', stock: { $gt: 0 } };

  if (opts.motorcycleId) {
    const ids = await fitmentProductIds(opts.motorcycleId);
    if (ids) base._id = { $in: ids };
  }

  switch (key) {
    case 'top-rated':
      // A minimum review count stops a single 5-star review topping the list.
      return Product.find({ ...base, ratingCount: { $gte: 5 } })
        .sort({ ratingAvg: -1, ratingCount: -1 })
        .limit(limit)
        .lean();

    case 'new-arrivals':
      return Product.find(base).sort({ createdAt: -1 }).limit(limit).lean();

    case 'beginner':
      return Product.find({ ...base, beginnerFriendly: true })
        .sort({ ratingAvg: -1, salesCount: -1 })
        .limit(limit)
        .lean();

    case 'deals':
      return Product.find({ ...base, originalPriceUSD: { $exists: true, $gt: 0 } })
        .sort({ salesCount: -1 })
        .limit(limit)
        .lean();

    case 'popular':
    default:
      return Product.find(base)
        .sort({ salesCount: -1, viewCount: -1 })
        .limit(limit)
        .lean();
  }
}

/** Hydrates a list of recently viewed ids, preserving the caller's ordering. */
export async function hydrateProductIds(ids: string[], limit = 12): Promise<any[]> {
  const valid = ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).slice(0, limit);
  if (valid.length === 0) return [];

  const docs: any[] = await Product.find({ _id: { $in: valid } }).lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return valid.map((id) => byId.get(id)).filter(Boolean);
}

/** Increments the view counter used by the "popular" collection. */
export async function recordProductView(productId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(productId)) return;
  try {
    await Product.updateOne({ _id: productId }, { $inc: { viewCount: 1 } });
  } catch {
    /* view counting must never break a product page render */
  }
}
