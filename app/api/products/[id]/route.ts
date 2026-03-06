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
    console.log('Fetching product with ID:', id);
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const productsCollection = db.collection('products');
    
    // Try to find product by ObjectId
    let product;
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      product = await productsCollection.findOne({ _id: objectId, status: 'active' });
      console.log('Trying ObjectId query...');
    } catch (error) {
      console.log('Invalid ObjectId, trying string ID...');
      product = await productsCollection.findOne({ _id: id, status: 'active' });
    }
    
    // Don't disconnect - let mongoose manage connection pool
    
    if (!product) {
      console.log('Product not found for ID:', id);
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    console.log('Product found:', product.name);
    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
