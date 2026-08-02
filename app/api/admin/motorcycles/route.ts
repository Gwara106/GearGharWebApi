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
  return `${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/admin/motorcycles — list all motorcycles (Admin)
export async function GET(request: NextRequest) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    await connectToDatabase();
    const motorcycles = await Motorcycle.find({}).sort({ brand: 1, model: 1 }).lean();
    return NextResponse.json(motorcycles);
  } catch (error) {
    console.error('List motorcycles error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/motorcycles — create a motorcycle (Admin)
export async function POST(request: NextRequest) {
  const g = await guard(request);
  if (!g.ok) return g.res;
  try {
    const body = await request.json().catch(() => ({}));
    const brand = (body.brand || '').trim();
    const model = (body.model || '').trim();
    if (!brand || !model) {
      return NextResponse.json({ message: 'Brand and model are required' }, { status: 400 });
    }

    await connectToDatabase();
    const slug = (body.slug || '').trim() || slugify(brand, model);

    const existing = await Motorcycle.findOne({ slug });
    if (existing) {
      return NextResponse.json({ message: `A motorcycle with slug "${slug}" already exists` }, { status: 409 });
    }

    const aliases = Array.isArray(body.aliases)
      ? body.aliases.map((a: string) => String(a).trim()).filter(Boolean)
      : typeof body.aliases === 'string'
        ? body.aliases.split(',').map((a: string) => a.trim()).filter(Boolean)
        : [];

    const created = await Motorcycle.create({
      brand,
      model,
      slug,
      type: body.type || 'other',
      engineCc: body.engineCc ? Number(body.engineCc) : undefined,
      yearFrom: body.yearFrom ? Number(body.yearFrom) : undefined,
      yearTo: body.yearTo ? Number(body.yearTo) : undefined,
      aliases,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create motorcycle error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
