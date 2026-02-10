import { NextRequest, NextResponse } from 'next/server';
import { mockReviews } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const productReviews = mockReviews.filter(r => r.productId === id);
    
    const skip = (page - 1) * limit;
    const paginatedReviews = productReviews.slice(skip, skip + limit);

    return NextResponse.json({
      message: 'Reviews retrieved successfully',
      reviews: paginatedReviews,
      pagination: {
        page,
        limit,
        total: productReviews.length,
        pages: Math.ceil(productReviews.length / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { rating, title, content } = body;
    
    // Mock user validation
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Validate input
    if (!rating || !title || !content) {
      return NextResponse.json({ message: 'Rating, title, and content are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Create new review (in real app, save to database)
    const newReview = {
      _id: Date.now().toString(),
      productId: id,
      userId: 'current-user',
      userName: 'Current User',
      rating,
      title,
      content,
      helpful: 0,
      verified: true,
      createdAt: new Date().toISOString()
    };

    mockReviews.unshift(newReview);

    return NextResponse.json({
      message: 'Review added successfully',
      review: newReview
    }, { status: 201 });
  } catch (error) {
    console.error('Add review error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
