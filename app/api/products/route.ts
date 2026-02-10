import { NextRequest, NextResponse } from 'next/server';
import { mockProducts } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    
    let filteredProducts = mockProducts.filter(p => p.status === 'active');
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower)
      );
    }

    const skip = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(skip, skip + limit);

    return NextResponse.json({
      message: 'Products retrieved successfully',
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        pages: Math.ceil(filteredProducts.length / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
