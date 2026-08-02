import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';
import { Motorcycle } from '@/src/models/Motorcycle';

async function guard(request: NextRequest) {
  const auth = await authenticateToken(request);
  if (!auth.success) return { ok: false as const, res: NextResponse.json({ message: auth.message }, { status: 401 }) };
  const adminCheck = requireAdmin(auth.user!);
  if (!adminCheck.success) return { ok: false as const, res: NextResponse.json({ message: adminCheck.message }, { status: 403 }) };
  return { ok: true as const };
}

function slugify(brand: string, model: string): string {
  return `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * POST /api/admin/motorcycles/bulk  (Admin)
 * Body: { motorcycles: [{ brand, model, type?, engineCc?, yearFrom?, yearTo?, aliases? }] }
 * Upserts by slug — safe to re-run. Returns per-row results.
 */
export async function POST(request: NextRequest) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const body = await request.json().catch(() => ({}));
    const rows = Array.isArray(body?.motorcycles) ? body.motorcycles : Array.isArray(body) ? body : null;
    if (!rows) {
      return NextResponse.json({ message: 'Expected a "motorcycles" array' }, { status: 400 });
    }
    if (rows.length > 2000) {
      return NextResponse.json({ message: 'Too many rows (max 2000 per request)' }, { status: 400 });
    }

    await connectToDatabase();

    let inserted = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const brand = String(r.brand || '').trim();
      const model = String(r.model || '').trim();
      if (!brand || !model) {
        errors.push({ row: i, message: 'brand and model are required' });
        continue;
      }
      const slug = String(r.slug || '').trim() || slugify(brand, model);
      const aliases = Array.isArray(r.aliases)
        ? r.aliases.map((a: string) => String(a).trim()).filter(Boolean)
        : typeof r.aliases === 'string'
          ? r.aliases.split(',').map((a: string) => a.trim()).filter(Boolean)
          : [];

      const doc: any = { brand, model, slug, type: r.type || 'other', aliases };
      if (r.engineCc) doc.engineCc = Number(r.engineCc);
      if (r.yearFrom) doc.yearFrom = Number(r.yearFrom);
      if (r.yearTo) doc.yearTo = Number(r.yearTo);

      try {
        const res = await Motorcycle.updateOne({ slug }, { $set: doc }, { upsert: true });
        if (res.upsertedCount) inserted++;
        else updated++;
      } catch (e: any) {
        errors.push({ row: i, message: e?.message || 'upsert failed' });
      }
    }

    return NextResponse.json({
      message: 'Bulk motorcycle import complete',
      data: { received: rows.length, inserted, updated, errors },
    });
  } catch (error) {
    console.error('Bulk motorcycle import error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
