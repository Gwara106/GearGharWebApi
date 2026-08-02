'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import { Filter, X, Search, SlidersHorizontal, Loader2 } from 'lucide-react';

/**
 * Shop page.
 *
 * Search, filtering, sorting and pagination all run server-side against
 * MongoDB indexes. The previous implementation downloaded the entire catalogue
 * and filtered it in the browser with randomly generated ratings; with a real
 * catalogue that is both slow and misleading, so ratings now come from the
 * actual review aggregates.
 */

interface ApiProduct {
  _id: string;
  name: string;
  brand: string;
  category: string;
  partCategory?: string;
  price: number;
  originalPriceUSD?: number;
  images?: string[];
  status: string;
  stock: number;
  ratingAvg?: number;
  ratingCount?: number;
  beginnerFriendly?: boolean;
  universalFit?: boolean;
  personalisation?: string[];
}

interface Facets {
  brands: Array<{ value: string; count: number }>;
  partCategories: Array<{ value: string; label: string; count: number }>;
  price: { min: number; max: number; avg: number };
}

const PRICE_RANGES = [
  { label: 'Under Rs. 1,000', min: 0, max: 1000 },
  { label: 'Rs. 1,000 - 5,000', min: 1000, max: 5000 },
  { label: 'Rs. 5,000 - 10,000', min: 5000, max: 10000 },
  { label: 'Rs. 10,000 - 20,000', min: 10000, max: 20000 },
  { label: 'Over Rs. 20,000', min: 20000, max: undefined },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

const PAGE_SIZE = 24;

function toCardProduct(p: ApiProduct) {
  return {
    id: p._id,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPriceUSD ? Math.round(p.originalPriceUSD * 83) : null,
    image: p.images?.[0] || '/products/placeholder.png',
    // Real aggregates from the Review collection — no longer randomised.
    rating: p.ratingAvg ?? 0,
    reviews: p.ratingCount ?? 0,
    inStock: Boolean(p.status === 'active' && p.stock > 0),
  };
}

export default function ShopPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [personalised, setPersonalised] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPartCategories, setSelectedPartCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number } | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce the search box so typing does not fire a request per keystroke.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedPartCategories.length) params.set('partCategory', selectedPartCategories.join(','));
    if (selectedBrands.length) params.set('brand', selectedBrands.join(','));
    if (priceRange?.min !== undefined) params.set('minPrice', String(priceRange.min));
    if (priceRange?.max !== undefined) params.set('maxPrice', String(priceRange.max));
    if (minRating > 0) params.set('minRating', String(minRating));
    if (inStockOnly) params.set('inStock', 'true');
    if (beginnerOnly) params.set('beginner', 'true');
    params.set('sort', sortBy);
    params.set('limit', String(PAGE_SIZE));
    return params;
  }, [search, selectedPartCategories, selectedBrands, priceRange, minRating, inStockOnly, beginnerOnly, sortBy]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = buildParams();
        params.set('page', String(page));

        const [listRes, facetRes] = await Promise.all([
          fetch(`/api/products?${params.toString()}`, { credentials: 'include' }),
          fetch(`/api/products/facets?${buildParams().toString()}`, { credentials: 'include' }),
        ]);

        if (cancelled) return;

        if (listRes.ok) {
          const data = await listRes.json();
          setProducts(data.products || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setPersonalised(!!data.personalised);
        }
        if (facetRes.ok) {
          const data = await facetRes.json();
          setFacets(data.data);
        }
      } catch (error) {
        if (!cancelled) console.error('Error fetching products:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [buildParams, page]);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setPage(1);
  };

  const clearAll = () => {
    setSearchInput('');
    setSearch('');
    setSelectedPartCategories([]);
    setSelectedBrands([]);
    setPriceRange(null);
    setMinRating(0);
    setInStockOnly(false);
    setBeginnerOnly(false);
    setPage(1);
  };

  const activeFilterCount =
    selectedPartCategories.length +
    selectedBrands.length +
    (priceRange ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (beginnerOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shop</h1>
          <p className="text-gray-600">
            Browse our complete collection of motorcycle parts, gear and accessories
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search parts, brands or categories — e.g. &quot;sintered brake pads&quot;"
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <div
            className={`fixed inset-0 z-40 bg-black/50 lg:static lg:bg-transparent lg:z-0 ${
              showFilters ? 'block' : 'hidden lg:block'
            }`}
            onClick={() => setShowFilters(false)}
          >
            <div
              className="fixed left-0 top-0 h-full w-80 overflow-y-auto bg-white lg:relative lg:h-auto lg:w-64 lg:bg-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowFilters(false)}
                className="absolute right-4 top-4 lg:hidden"
                aria-label="Close filters"
              >
                <X size={24} />
              </button>

              <div className="p-6 pt-12 lg:p-0 lg:pt-0">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="mb-6 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:border-primary hover:text-primary"
                  >
                    Clear all filters ({activeFilterCount})
                  </button>
                )}

                {/* Part category */}
                {facets && facets.partCategories.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Part Type</h3>
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {facets.partCategories.map((c) => (
                        <label key={c.value} className="flex cursor-pointer items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedPartCategories.includes(c.value)}
                            onChange={() => toggle(selectedPartCategories, c.value, setSelectedPartCategories)}
                            className="h-4 w-4 rounded text-primary"
                          />
                          <span className="ml-3 flex-1 text-gray-700">{c.label}</span>
                          <span className="text-xs text-gray-400">{c.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brand */}
                {facets && facets.brands.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Brand</h3>
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {facets.brands.map((b) => (
                        <label key={b.value} className="flex cursor-pointer items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(b.value)}
                            onChange={() => toggle(selectedBrands, b.value, setSelectedBrands)}
                            className="h-4 w-4 rounded text-primary"
                          />
                          <span className="ml-3 flex-1 text-gray-700">{b.value}</span>
                          <span className="text-xs text-gray-400">{b.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Price Range</h3>
                  <div className="space-y-2">
                    {PRICE_RANGES.map((r) => (
                      <label key={r.label} className="flex cursor-pointer items-center text-sm">
                        <input
                          type="radio"
                          name="price"
                          checked={priceRange?.min === r.min && priceRange?.max === r.max}
                          onChange={() => {
                            setPriceRange({ min: r.min, max: r.max });
                            setPage(1);
                          }}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="ml-3 text-gray-700">{r.label}</span>
                      </label>
                    ))}
                    <label className="flex cursor-pointer items-center text-sm">
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange === null}
                        onChange={() => {
                          setPriceRange(null);
                          setPage(1);
                        }}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="ml-3 text-gray-700">All Prices</span>
                    </label>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Rating</h3>
                  <div className="space-y-2">
                    {[4.5, 4, 3.5, 0].map((r) => (
                      <label key={r} className="flex cursor-pointer items-center text-sm">
                        <input
                          type="radio"
                          name="rating"
                          checked={minRating === r}
                          onChange={() => {
                            setMinRating(r);
                            setPage(1);
                          }}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="ml-3 text-gray-700">{r === 0 ? 'Any rating' : `${r}★ and above`}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Options</h3>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center text-sm">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={() => {
                          setInStockOnly(!inStockOnly);
                          setPage(1);
                        }}
                        className="h-4 w-4 rounded text-primary"
                      />
                      <span className="ml-3 text-gray-700">In stock only</span>
                    </label>
                    <label className="flex cursor-pointer items-center text-sm">
                      <input
                        type="checkbox"
                        checked={beginnerOnly}
                        onChange={() => {
                          setBeginnerOnly(!beginnerOnly);
                          setPage(1);
                        }}
                        className="h-4 w-4 rounded text-primary"
                      />
                      <span className="ml-3 text-gray-700">Beginner friendly</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="mb-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 font-semibold text-gray-700 transition hover:text-primary lg:hidden"
              >
                <Filter size={20} />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>

              <div className="ml-4 flex-1 lg:ml-0">
                <p className="text-sm text-gray-600">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Searching…
                    </span>
                  ) : (
                    <>
                      {total.toLocaleString()} product{total === 1 ? '' : 's'}
                      {search ? ` for "${search}"` : ''}
                      {personalised && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          Personalised for you
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="hidden text-gray-400 sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-4 h-48 w-full rounded-lg bg-gray-200" />
                    <div className="mb-2 h-4 rounded bg-gray-200" />
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <div key={p._id}>
                      <ProductCard product={toCardProduct(p)} />
                      {p.personalisation && p.personalisation.length > 0 && (
                        <p className="mt-1 px-1 text-[11px] font-medium text-primary">
                          {p.personalisation[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:border-primary disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="px-4 text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:border-primary disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
                <p className="text-lg text-gray-600">No products match those filters</p>
                <button
                  onClick={clearAll}
                  className="mt-4 rounded-lg bg-primary px-6 py-2 text-white transition hover:bg-primary/90"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
