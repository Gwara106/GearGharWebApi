import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken } from '@/app/api/_lib/auth';
import { User } from '@/src/models/User';
import { Motorcycle } from '@/src/models/Motorcycle';

/**
 * Rider Garage — the persistent user profile the assistant reads before every
 * turn. Storing the motorcycle, year and odometer here is what lets the
 * assistant remember the bike across sessions and compute service intervals
 * from MongoDB rather than asking the model to guess.
 */

/** GET /api/user/garage — list the authenticated rider's motorcycles. */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateToken(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ message: auth.message || 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user: any = await User.findById(auth.user.id).select('garage preferences').lean();
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Garage retrieved successfully',
      data: {
        garage: user.garage || [],
        preferences: user.preferences || { beginnerMode: false, preferredBrands: [] },
      },
    });
  } catch (error) {
    console.error('Garage GET error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/garage
 * Body: { motorcycleId | motorcycleSlug, year?, odometerKm?, nickname?,
 *         isPrimary?, lastServiceAt?, lastServiceKm?, preferences? }
 *
 * Upserts by motorcycle so repeated saves update rather than duplicate.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateToken(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ message: auth.message || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const user: any = await User.findById(auth.user.id).select('garage preferences');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Preference-only update.
    if (!body?.motorcycleId && !body?.motorcycleSlug && body?.preferences) {
      user.preferences = { ...(user.preferences || {}), ...body.preferences };
      await user.save();
      return NextResponse.json({
        message: 'Preferences updated',
        data: { garage: user.garage, preferences: user.preferences },
      });
    }

    const query = body?.motorcycleId
      ? { _id: body.motorcycleId }
      : { slug: String(body?.motorcycleSlug || '').toLowerCase() };

    if (body?.motorcycleId && !mongoose.Types.ObjectId.isValid(body.motorcycleId)) {
      return NextResponse.json({ message: 'Invalid motorcycleId' }, { status: 400 });
    }

    const bike: any = await Motorcycle.findOne(query).lean();
    if (!bike) {
      return NextResponse.json({ message: 'Motorcycle not found' }, { status: 404 });
    }

    const year = body?.year ? Number(body.year) : undefined;
    if (year !== undefined && (Number.isNaN(year) || year < 1950 || year > 2100)) {
      return NextResponse.json({ message: 'Invalid year' }, { status: 400 });
    }
    const odometerKm = body?.odometerKm !== undefined ? Number(body.odometerKm) : undefined;
    if (odometerKm !== undefined && (Number.isNaN(odometerKm) || odometerKm < 0)) {
      return NextResponse.json({ message: 'Invalid odometerKm' }, { status: 400 });
    }

    const makePrimary = body?.isPrimary !== false;
    const existing = (user.garage || []).find((g: any) => g.motorcycleSlug === bike.slug);

    if (makePrimary) {
      for (const g of user.garage || []) g.isPrimary = false;
    }

    if (existing) {
      if (year !== undefined) existing.year = year;
      if (odometerKm !== undefined) {
        existing.odometerKm = odometerKm;
        existing.odometerUpdatedAt = new Date();
      }
      if (body?.nickname !== undefined) existing.nickname = String(body.nickname).slice(0, 40);
      if (body?.lastServiceAt) existing.lastServiceAt = new Date(body.lastServiceAt);
      if (body?.lastServiceKm !== undefined) existing.lastServiceKm = Number(body.lastServiceKm);
      existing.isPrimary = makePrimary;
    } else {
      user.garage = [
        ...(user.garage || []),
        {
          motorcycle: bike._id,
          motorcycleSlug: bike.slug,
          motorcycleLabel: `${bike.brand} ${bike.model}`,
          nickname: body?.nickname ? String(body.nickname).slice(0, 40) : undefined,
          year,
          odometerKm,
          odometerUpdatedAt: odometerKm !== undefined ? new Date() : undefined,
          lastServiceAt: body?.lastServiceAt ? new Date(body.lastServiceAt) : undefined,
          lastServiceKm:
            body?.lastServiceKm !== undefined ? Number(body.lastServiceKm) : undefined,
          isPrimary: makePrimary,
          addedAt: new Date(),
        },
      ];
    }

    if (body?.preferences) {
      user.preferences = { ...(user.preferences || {}), ...body.preferences };
    }

    await user.save();

    return NextResponse.json({
      message: 'Garage updated successfully',
      data: { garage: user.garage, preferences: user.preferences },
    });
  } catch (error) {
    console.error('Garage POST error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/user/garage?slug=<motorcycleSlug> */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateToken(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ message: auth.message || 'Unauthorized' }, { status: 401 });
    }

    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ message: 'slug is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user: any = await User.findById(auth.user.id).select('garage');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const before = (user.garage || []).length;
    user.garage = (user.garage || []).filter((g: any) => g.motorcycleSlug !== slug);

    // Keep exactly one primary entry.
    if (user.garage.length > 0 && !user.garage.some((g: any) => g.isPrimary)) {
      user.garage[0].isPrimary = true;
    }

    await user.save();

    return NextResponse.json({
      message: before === user.garage.length ? 'No matching motorcycle' : 'Motorcycle removed',
      data: { garage: user.garage },
    });
  } catch (error) {
    console.error('Garage DELETE error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
