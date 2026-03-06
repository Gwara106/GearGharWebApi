import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyprajapati715_db_user:Gwara9841@ronakdemo.0yfckss.mongodb.net/gearghar';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const reviewsCollection = db.collection('reviews');
    
    // Get reviews for this product
    const reviews = await reviewsCollection
      .find({ productId: id })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get user information for each review
    const usersCollection = db.collection('users');
    for (let review of reviews) {
      if (review.userId) {
        // Try both ObjectId and string lookup
        let user = null;
        try {
          // Try ObjectId lookup first
          user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(review.userId) });
        } catch (e) {
          // If ObjectId fails, try string lookup
          user = await usersCollection.findOne({ _id: review.userId });
        }
        
        if (user) {
          review.userName = `${user.firstName} ${user.lastName}`;
          review.userEmail = user.email;
          review.userAvatar = user.profilePicture || user.image || null;
        }
      }
    }
    
    const skip = (page - 1) * limit;
    const paginatedReviews = reviews.slice(skip, skip + limit);

    return NextResponse.json({
      reviews: paginatedReviews,
      pagination: {
        page,
        limit,
        total: reviews.length,
        pages: Math.ceil(reviews.length / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, title, content, userId } = body;
    
    // Validate input
    if (!rating || !title || !content) {
      return NextResponse.json({ message: 'Rating, title, and content are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const reviewsCollection = db.collection('reviews');
    const usersCollection = db.collection('users');
    
    // Get user information
    let userName = 'Anonymous User';
    let verified = false;
    let userAvatar = null;
    
    if (userId) {
      // Try both ObjectId and string lookup
      let user = null;
      try {
        // Try ObjectId lookup first
        user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
      } catch (e) {
        // If ObjectId fails, try string lookup
        user = await usersCollection.findOne({ _id: userId });
      }
      
      if (user) {
        userName = `${user.firstName} ${user.lastName}`;
        verified = true;
        userAvatar = user.profilePicture || user.image || null;
      }
    }
    
    // Create new review
    const newReview = {
      productId: id,
      userId: userId || null,
      userName,
      userAvatar: userAvatar || null,
      rating,
      title,
      content,
      helpful: 0,
      verified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await reviewsCollection.insertOne(newReview);
    
    return NextResponse.json({
      message: 'Review added successfully',
      review: {
        ...newReview,
        _id: result.insertedId.toString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Add review error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
