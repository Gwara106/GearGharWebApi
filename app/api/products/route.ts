import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';

export async function GET(request: NextRequest) {
  try {
    // Connect to database using centralized connection
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    
    // Get products from database using mongoose model
    const { Product } = await import('@/src/models/Product');
    
    let query: any = { status: 'active' };
    
    if (category && category !== 'All Products') {
      query.category = category;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      query.$or = [
        { name: { $regex: searchLower, $options: 'i' } },
        { description: { $regex: searchLower, $options: 'i' } },
        { brand: { $regex: searchLower, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
