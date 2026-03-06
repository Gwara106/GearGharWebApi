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
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const productsCollection = db.collection('products');
    
    // Find product by ID
    let product;
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      product = await productsCollection.findOne({ _id: objectId });
    } catch (error) {
      product = await productsCollection.findOne({ _id: id });
    }
    
    await mongoose.disconnect();
    
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, price, description, images, stock, status } = body;
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const productsCollection = db.collection('products');
    
    // Update product
    const updateData = {
      ...(name && { name }),
      ...(category && { category }),
      ...(price && { price: parseFloat(price) }),
      ...(description && { description }),
      ...(images && { images }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };
    
    let result;
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      result = await productsCollection.updateOne(
        { _id: objectId },
        { $set: updateData }
      );
    } catch (error) {
      result = await productsCollection.updateOne(
        { _id: id },
        { $set: updateData }
      );
    }
    
    await mongoose.disconnect();
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const productsCollection = db.collection('products');
    
    // Delete product
    let result;
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      result = await productsCollection.deleteOne({ _id: objectId });
    } catch (error) {
      result = await productsCollection.deleteOne({ _id: id });
    }
    
    await mongoose.disconnect();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
