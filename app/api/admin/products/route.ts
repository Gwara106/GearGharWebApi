import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyprajapati715_db_user:Gwara9841@ronakdemo.0yfckss.mongodb.net/gearghar';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({}).toArray();
    
    await mongoose.disconnect();
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price, description, images, stock, status } = body;
    
    // Validate required fields
    if (!name || !category || !price || !description) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const productsCollection = db.collection('products');
    
    // Create new product
    const newProduct = {
      name,
      category,
      price: parseFloat(price),
      description,
      images: images || [],
      stock: parseInt(stock) || 0,
      status: status || 'active',
      rating: 4.5,
      isFavorite: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await productsCollection.insertOne(newProduct);
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      ...newProduct,
      _id: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
