import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';
import { Motorcycle } from '@/src/models/Motorcycle';
import { Product } from '@/src/models/Product';
import { ProductCompatibility } from '@/src/models/ProductCompatibility';

/**
 * POST /api/admin/seed-motorcycles  (Admin only)
 *
 * Seeds a starter motorcycle catalogue and bootstraps ProductCompatibility.
 * Idempotent: motorcycles are upserted by slug and existing products are marked
 * `universal` so the assistant can recommend real items immediately. Curators can
 * later replace universal links with specific fitments — no schema change needed.
 */
const SEED_MOTORCYCLES = [
  { brand: 'Yamaha', model: 'R15 V4', slug: 'yamaha-r15-v4', type: 'sport', engineCc: 155, aliases: ['r15v4', 'r15 v4', 'yzf r15 v4', 'r15'] },
  { brand: 'Yamaha', model: 'MT-15', slug: 'yamaha-mt-15', type: 'naked', engineCc: 155, aliases: ['mt15', 'mt 15', 'mt-15'] },
  { brand: 'Yamaha', model: 'FZ', slug: 'yamaha-fz', type: 'naked', engineCc: 149, aliases: ['fz', 'fz-s', 'fz s'] },
  { brand: 'KTM', model: 'Duke 390', slug: 'ktm-duke-390', type: 'naked', engineCc: 373, aliases: ['duke 390', 'duke390', '390 duke'] },
  { brand: 'KTM', model: 'Duke 200', slug: 'ktm-duke-200', type: 'naked', engineCc: 199, aliases: ['duke 200', 'duke200', '200 duke'] },
  { brand: 'Royal Enfield', model: 'Classic 350', slug: 'royal-enfield-classic-350', type: 'cruiser', engineCc: 349, aliases: ['classic 350', 're classic 350', 'classic350'] },
  { brand: 'Royal Enfield', model: 'Hunter 350', slug: 'royal-enfield-hunter-350', type: 'cruiser', engineCc: 349, aliases: ['hunter 350', 'hunter350'] },
  { brand: 'Honda', model: 'CB Hornet 2.0', slug: 'honda-cb-hornet-2-0', type: 'naked', engineCc: 184, aliases: ['hornet', 'cb hornet', 'hornet 2.0'] },
  { brand: 'Bajaj', model: 'Pulsar NS200', slug: 'bajaj-pulsar-ns200', type: 'naked', engineCc: 199, aliases: ['ns200', 'ns 200', 'pulsar ns200'] },
  { brand: 'Bajaj', model: 'Pulsar 150', slug: 'bajaj-pulsar-150', type: 'commuter', engineCc: 149, aliases: ['pulsar 150', 'pulsar150'] },
];

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateToken(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: 401 });
    }
    const adminCheck = requireAdmin(auth.user!);
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: 403 });
    }

    await connectToDatabase();

    // 1. Upsert motorcycles by slug (idempotent).
    let motorcyclesUpserted = 0;
    for (const bike of SEED_MOTORCYCLES) {
      await Motorcycle.updateOne({ slug: bike.slug }, { $set: bike }, { upsert: true });
      motorcyclesUpserted++;
    }

    // 2. Bootstrap compatibility: mark every active product as universal so the
    //    assistant returns real catalogue items out of the box.
    const products = await Product.find({ status: 'active' }).select('_id').lean();
    let compatibilityCreated = 0;
    for (const p of products as any[]) {
      const res = await ProductCompatibility.updateOne(
        { product: p._id, universal: true },
        { $setOnInsert: { product: p._id, universal: true } },
        { upsert: true }
      );
      if (res.upsertedCount) compatibilityCreated++;
    }

    return NextResponse.json({
      message: 'Motorcycle catalogue and compatibility seeded successfully',
      data: {
        motorcyclesUpserted,
        activeProducts: products.length,
        universalCompatibilityCreated: compatibilityCreated,
      },
    });
  } catch (error) {
    console.error('Seed motorcycles error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
