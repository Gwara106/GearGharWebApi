import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken } from '@/app/api/_lib/auth';
import {
  productCollection,
  CollectionKey,
  loadShopperProfile,
  personaliseRanking,
} from '@/src/services/catalog.service';

/**
 * GET /api/products/collections?key=popular&limit=12[&fits=<slug|id>]
 * GET /api/products/collections?keys=popular,top-rated,new-arrivals
 *
 * Merchandising collections for the homepage and category landing pages. Every
 * collection is derived from real catalogue fields — sales and view counts,
 * review aggregates, creation date, beginner flag — rather than a hand-picked
 * list, so it stays current as the catalogue changes.
 *
 * When the shopper is signed in and has a motorcycle in their garage, the
 * results are additionally filtered/ranked for that machine.
 */

const VALID: CollectionKey[] = ['popular', 'top-rated', 'new-arrivals', 'beginner', 'deals'];

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(24, Number(sp.get('limit')) || 12);

    const requested = (sp.get('keys') || sp.get('key') || 'popular')
      .split(',')
      .map((k) => k.trim())
      .filter((k): k is CollectionKey => VALID.includes(k as CollectionKey));

    if (requested.length === 0) {
      return NextResponse.json(
        { message: `key must be one of: ${VALID.join(', ')}` },
        { status: 400 }
      );
    }

    let profile = null;
    const auth = await authenticateToken(request);
    if (auth.success && auth.user) {
      profile = await loadShopperProfile(auth.user.id);
    }

    // Explicit `fits` wins; otherwise fall back to the shopper's primary bike.
    let motorcycleId: string | null = sp.get('fits');
    if (motorcycleId && !/^[0-9a-fA-F]{24}$/.test(motorcycleId)) motorcycleId = null;
    if (!motorcycleId && profile && profile.motorcycleIds.length > 0) {
      motorcycleId = profile.motorcycleIds[0];
    }

    const collections: Record<string, any[]> = {};
    for (const key of requested) {
      const products = await productCollection(key, limit, { motorcycleId });
      collections[key] = personaliseRanking(products, profile);
    }

    return NextResponse.json({
      message: 'Collections retrieved successfully',
      data: { collections, personalised: !!profile, motorcycleId },
    });
  } catch (error) {
    console.error('Collections error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
