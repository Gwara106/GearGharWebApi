import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';
import { Motorcycle } from '@/src/models/Motorcycle';
import { ProductCompatibility } from '@/src/models/ProductCompatibility';

async function guard(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (!auth.success) return { ok: false as const, res: NextResponse.json({ message: auth.message }, { status: 401 }) };
  const adminCheck = requireAdmin(auth.user!);
  if (!adminCheck.success) return { ok: false as const, res: NextResponse.json({ message: adminCheck.message }, { status: 403 }) };
  return { ok: true as const };
}

// PUT /api/admin/motorcycles/:id — update a motorcycle (Admin)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const update: any = {};
    if (body.brand !== undefined) update.brand = String(body.brand).trim();
    if (body.model !== undefined) update.model = String(body.model).trim();
    if (body.slug !== undefined) update.slug = String(body.slug).trim();
    if (body.type !== undefined) update.type = body.type;
    if (body.engineCc !== undefined) update.engineCc = body.engineCc ? Number(body.engineCc) : undefined;
    if (body.yearFrom !== undefined) update.yearFrom = body.yearFrom ? Number(body.yearFrom) : undefined;
    if (body.yearTo !== undefined) update.yearTo = body.yearTo ? Number(body.yearTo) : undefined;
    if (body.aliases !== undefined) {
      update.aliases = Array.isArray(body.aliases)
        ? body.aliases.map((a: string) => String(a).trim()).filter(Boolean)
        : String(body.aliases).split(',').map((a) => a.trim()).filter(Boolean);
    }

    const updated = await Motorcycle.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!updated) {
      return NextResponse.json({ message: 'Motorcycle not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update motorcycle error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/motorcycles/:id — delete a motorcycle + its fitments (Admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const { id } = await params;
    await connectToDatabase();

    const deleted = await Motorcycle.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Motorcycle not found' }, { status: 404 });
    }
    // Cascade: remove all compatibility mappings for this motorcycle.
    const { deletedCount } = await ProductCompatibility.deleteMany({ motorcycle: id });

    return NextResponse.json({ message: 'Motorcycle deleted', removedFitments: deletedCount });
  } catch (error) {
    console.error('Delete motorcycle error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
