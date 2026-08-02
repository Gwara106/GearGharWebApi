import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';
import { ProductCompatibility } from '@/src/models/ProductCompatibility';

async function guard(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (!auth.success) return { ok: false as const, res: NextResponse.json({ message: auth.message }, { status: 401 }) };
  const adminCheck = requireAdmin(auth.user!);
  if (!adminCheck.success) return { ok: false as const, res: NextResponse.json({ message: adminCheck.message }, { status: 403 }) };
  return { ok: true as const };
}

// PUT /api/admin/compatibility/:id — edit a mapping (Admin)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const update: any = {};
    if (body.fitmentNotes !== undefined) update.fitmentNotes = String(body.fitmentNotes).trim();
    if (body.product !== undefined) update.product = String(body.product).trim();
    if (body.motorcycle !== undefined) update.motorcycle = body.motorcycle ? String(body.motorcycle).trim() : undefined;
    if (body.universal !== undefined) {
      update.universal = !!body.universal;
      if (update.universal) update.motorcycle = undefined;
    }

    const updated = await ProductCompatibility.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate('product', 'name brand price images')
      .populate('motorcycle', 'brand model slug');
    if (!updated) {
      return NextResponse.json({ message: 'Compatibility mapping not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update compatibility error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/compatibility/:id — remove a mapping (Admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const { id } = await params;
    await connectToDatabase();

    const deleted = await ProductCompatibility.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Compatibility mapping not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Compatibility mapping removed' });
  } catch (error) {
    console.error('Delete compatibility error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
