import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';
import { ProductCompatibility } from '@/src/models/ProductCompatibility';
// Ensure referenced models are registered for populate().
import '@/src/models/Product';
import '@/src/models/Motorcycle';

async function guard(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (!auth.success) return { ok: false as const, res: NextResponse.json({ message: auth.message }, { status: 401 }) };
  const adminCheck = requireAdmin(auth.user!);
  if (!adminCheck.success) return { ok: false as const, res: NextResponse.json({ message: adminCheck.message }, { status: 403 }) };
  return { ok: true as const };
}

// GET /api/admin/compatibility?motorcycle=<id> — list mappings (Admin)
export async function GET(request: NextRequest) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const motorcycle = searchParams.get('motorcycle');

    const query: any = {};
    if (motorcycle) query.motorcycle = motorcycle;

    const mappings = await ProductCompatibility.find(query)
      .populate('product', 'name brand price images')
      .populate('motorcycle', 'brand model slug')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('List compatibility error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/compatibility — assign a product to a motorcycle (Admin)
// Body: { product, motorcycle?, universal?, fitmentNotes? }
export async function POST(request: NextRequest) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const body = await request.json().catch(() => ({}));
    const product = (body.product || '').trim();
    const universal = !!body.universal;
    const motorcycle = universal ? undefined : (body.motorcycle || '').trim();

    if (!product) {
      return NextResponse.json({ message: 'Product is required' }, { status: 400 });
    }
    if (!universal && !motorcycle) {
      return NextResponse.json({ message: 'A motorcycle is required unless the mapping is universal' }, { status: 400 });
    }

    await connectToDatabase();

    // Prevent duplicates.
    const existing = await ProductCompatibility.findOne(
      universal ? { product, universal: true } : { product, motorcycle }
    );
    if (existing) {
      return NextResponse.json({ message: 'This compatibility mapping already exists' }, { status: 409 });
    }

    const created = await ProductCompatibility.create({
      product,
      motorcycle: universal ? undefined : motorcycle,
      universal,
      fitmentNotes: body.fitmentNotes ? String(body.fitmentNotes).trim() : undefined,
    });

    const populated = await ProductCompatibility.findById(created._id)
      .populate('product', 'name brand price images')
      .populate('motorcycle', 'brand model slug')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error('Create compatibility error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
