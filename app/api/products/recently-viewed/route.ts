import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken } from '@/app/api/_lib/auth';
import { User } from '@/src/models/User';
import { hydrateProductIds, recordProductView } from '@/src/services/catalog.service';

/**
 * Recently viewed products.
 *
 * Works for both guests and signed-in shoppers:
 *   - Guests keep the id list in localStorage and pass it as `?ids=a,b,c`.
 *   - Signed-in shoppers have the list persisted on User.recentlyViewed, so it
 *     follows them across devices. Any ids sent by the client are merged in,
 *     which preserves browsing history through a login.
 *
 * POST also increments Product.viewCount, which feeds the "popular" collection.
 */

const MAX_TRACKED = 20;

/** GET /api/products/recently-viewed?ids=<comma-separated>&limit=12 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(24, Number(sp.get('limit')) || 12);

    const clientIds = (sp.get('ids') || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => mongoose.Types.ObjectId.isValid(s));

    let ids = clientIds;

    const auth = await authenticateToken(request);
    if (auth.success && auth.user) {
      const user: any = await User.findById(auth.user.id).select('recentlyViewed').lean();
      const stored = (user?.recentlyViewed || []).map((id: any) => String(id));
      // Client ids first (this device is more current), then the stored history.
      ids = Array.from(new Set([...clientIds, ...stored]));
    }

    const products = await hydrateProductIds(ids, limit);

    return NextResponse.json({
      message: 'Recently viewed retrieved successfully',
      data: { products, count: products.length },
    });
  } catch (error) {
    console.error('Recently viewed GET error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/products/recently-viewed
 * Body: { productId: string }
 *
 * Records a product view. Auth optional — guests still increment the counter.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ message: 'A valid productId is required' }, { status: 400 });
    }

    await connectToDatabase();
    await recordProductView(productId);

    const auth = await authenticateToken(request);
    if (auth.success && auth.user) {
      // Pull first so a re-view moves the product to the front rather than
      // creating a duplicate entry, then cap the list length.
      await User.updateOne({ _id: auth.user.id }, { $pull: { recentlyViewed: productId } });
      await User.updateOne(
        { _id: auth.user.id },
        { $push: { recentlyViewed: { $each: [productId], $position: 0, $slice: MAX_TRACKED } } }
      );
    }

    return NextResponse.json({ message: 'View recorded', productId });
  } catch (error) {
    console.error('Recently viewed POST error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
