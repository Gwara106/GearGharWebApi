import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken } from '@/app/api/_lib/auth';
import { searchCatalog, CatalogQuery, SortKey } from '@/src/services/catalog.service';

/**
 * GET /api/products
 *
 * Server-side search, filtering, sorting and pagination over the catalogue.
 * Replaces the previous handler, which returned a whole page of the collection
 * and left the browser to filter it — untenable once the catalogue grew past a
 * few dozen products.
 *
 * Query parameters:
 *   search / q        full-text query (weighted name > tags > description)
 *   category          Product.category enum value
 *   partCategory      taxonomy slug(s), comma-separated
 *   brand             brand name(s), comma-separated
 *   minPrice/maxPrice price band
 *   minRating         minimum average rating
 *   inStock=true      exclude out-of-stock items
 *   beginner=true     beginner-friendly items only
 *   universal=true    universal-fit items only
 *   fits              motorcycle id or slug — only parts with fitment coverage
 *   sort              relevance | newest | price-low | price-high | rating | popular | name
 *   page, limit       pagination (limit capped at 60)
 *   format=legacy     return a bare array, as the original endpoint did
 *
 * Auth is optional. When a valid token is present the result page is re-ranked
 * for that shopper's garage, preferred brands and purchase history.
 */

const VALID_SORTS: SortKey[] = ['relevance', 'newest', 'price-low', 'price-high', 'rating', 'popular', 'name'];

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const sp = request.nextUrl.searchParams;
    const sortParam = sp.get('sort') as SortKey | null;

    const query: CatalogQuery = {
      search: sp.get('search') || sp.get('q') || undefined,
      category: sp.get('category') || undefined,
      partCategory: sp.get('partCategory') || undefined,
      brand: sp.get('brand') || undefined,
      minPrice: num(sp.get('minPrice')),
      maxPrice: num(sp.get('maxPrice')),
      minRating: num(sp.get('minRating')),
      inStockOnly: sp.get('inStock') === 'true',
      beginnerFriendly: sp.get('beginner') === 'true',
      universalOnly: sp.get('universal') === 'true',
      sort: sortParam && VALID_SORTS.includes(sortParam) ? sortParam : 'relevance',
      page: num(sp.get('page')) || 1,
      limit: num(sp.get('limit')) || 24,
    };

    // `fits` accepts either an ObjectId or a motorcycle slug.
    const fits = sp.get('fits');
    if (fits) {
      if (/^[0-9a-fA-F]{24}$/.test(fits)) query.fitsMotorcycleId = fits;
      else query.fitsMotorcycleSlug = fits;
    }

    // Optional auth — guests get the unpersonalised ordering.
    const auth = await authenticateToken(request);
    if (auth.success && auth.user) {
      query.personaliseForUserId = auth.user.id;
    }

    const result = await searchCatalog(query);

    // The original endpoint returned a bare array; keep that shape available
    // for any caller that has not been updated.
    if (sp.get('format') === 'legacy') {
      return NextResponse.json(result.products);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
