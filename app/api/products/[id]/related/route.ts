import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { relatedProducts } from '@/src/services/catalog.service';

/**
 * GET /api/products/:id/related?limit=8
 *
 * Related products for the product page. Ranked on shared part category, shared
 * motorcycle fitment, brand, price band, tag overlap and review quality — each
 * result carries `relatedReasons` so the UI can explain the connection instead
 * of presenting an unexplained carousel.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const limit = Math.min(24, Number(request.nextUrl.searchParams.get('limit')) || 8);

    await connectToDatabase();
    const products = await relatedProducts(id, limit);

    return NextResponse.json({
      message: 'Related products retrieved successfully',
      data: { products, count: products.length },
    });
  } catch (error) {
    console.error('Related products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
