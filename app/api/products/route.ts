import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyprajapati715_db_user:Gwara9841@ronakdemo.0yfckss.mongodb.net/gearghar';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    
    // Get products from database
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    const productsCollection = db.collection('products');
    let filteredProducts = await productsCollection.find({ status: 'active' }).toArray();
    
    if (category && category !== 'All Products') {
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

    await mongoose.disconnect();

    return NextResponse.json(paginatedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
