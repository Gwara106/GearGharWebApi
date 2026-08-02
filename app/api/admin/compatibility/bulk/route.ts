import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';
import { ProductCompatibility } from '@/src/models/ProductCompatibility';
import { Motorcycle } from '@/src/models/Motorcycle';

async function guard(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (!auth.success) return { ok: false as const, res: NextResponse.json({ message: auth.message }, { status: 401 }) };
  const adminCheck = requireAdmin(auth.user!);
  if (!adminCheck.success) return { ok: false as const, res: NextResponse.json({ message: adminCheck.message }, { status: 403 }) };
  return { ok: true as const };
}

/**
 * POST /api/admin/compatibility/bulk  (Admin)
 * Body: { mappings: [{ product, motorcycle? | motorcycleSlug?, universal?, fitmentNotes? }] }
 * A motorcycle may be referenced by ObjectId (`motorcycle`) or by `motorcycleSlug`.
 * Upserts (idempotent); returns per-row results.
 */
export async function POST(request: NextRequest) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const body = await request.json().catch(() => ({}));
    const rows = Array.isArray(body?.mappings) ? body.mappings : Array.isArray(body) ? body : null;
    if (!rows) {
      return NextResponse.json({ message: 'Expected a "mappings" array' }, { status: 400 });
    }
    if (rows.length > 5000) {
      return NextResponse.json({ message: 'Too many rows (max 5000 per request)' }, { status: 400 });
    }

    await connectToDatabase();

    // Resolve motorcycle slugs → ids once.
    const slugs = Array.from(new Set(rows.map((r: any) => r?.motorcycleSlug).filter(Boolean)));
    const slugMap = new Map<string, string>();
    if (slugs.length) {
      const bikes = await Motorcycle.find({ slug: { $in: slugs } }).select('slug').lean();
      for (const b of bikes as any[]) slugMap.set(b.slug, String(b._id));
    }

    let inserted = 0;
    let skipped = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const product = String(r.product || '').trim();
      const universal = !!r.universal;
      let motorcycle: string | undefined;
      if (!universal) {
        motorcycle = r.motorcycle ? String(r.motorcycle).trim() : r.motorcycleSlug ? slugMap.get(r.motorcycleSlug) : undefined;
      }

      if (!product) {
        errors.push({ row: i, message: 'product is required' });
        continue;
      }
      if (!universal && !motorcycle) {
        errors.push({ row: i, message: 'motorcycle or motorcycleSlug is required (or set universal:true)' });
        continue;
      }

      try {
        const filter = universal ? { product, universal: true } : { product, motorcycle };
        const res = await ProductCompatibility.updateOne(
          filter,
          {
            $setOnInsert: {
              product,
              motorcycle: universal ? undefined : motorcycle,
              universal,
              fitmentNotes: r.fitmentNotes ? String(r.fitmentNotes).trim() : undefined,
            },
          },
          { upsert: true }
        );
        if (res.upsertedCount) inserted++;
        else skipped++;
      } catch (e: any) {
        errors.push({ row: i, message: e?.message || 'upsert failed' });
      }
    }

    return NextResponse.json({
      message: 'Bulk compatibility import complete',
      data: { received: rows.length, inserted, skippedExisting: skipped, errors },
    });
  } catch (error) {
    console.error('Bulk compatibility import error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
