import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { catalogFacets, CatalogQuery } from '@/src/services/catalog.service';

/**
 * GET /api/products/facets
 *
 * Filter options with live counts for the shop sidebar. Accepts the same query
 * parameters as GET /api/products, so the counts reflect the filters already
 * applied. Each facet is computed with its own dimension excluded, which keeps
 * brand counts meaningful while a brand filter is active.
 */
function num(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const sp = request.nextUrl.searchParams;

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
    };

    const fits = sp.get('fits');
    if (fits) {
      if (/^[0-9a-fA-F]{24}$/.test(fits)) query.fitsMotorcycleId = fits;
      else query.fitsMotorcycleSlug = fits;
    }

    const facets = await catalogFacets(query);
    return NextResponse.json({ message: 'Facets retrieved successfully', data: facets });
  } catch (error) {
    console.error('Get facets error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
