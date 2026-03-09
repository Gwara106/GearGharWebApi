import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching product with ID:', id);
    
    // Connect to database using centralized connection
    await connectToDatabase();
    
    // Get product from database using mongoose model
    const { Product } = await import('@/src/models/Product');
    
    // Try to find product by ObjectId or string ID
    let product;
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      product = await Product.findOne({ _id: objectId, status: 'active' }).lean();
      console.log('Trying ObjectId query...');
    } catch (error) {
      console.log('Invalid ObjectId, trying string ID...');
      product = await Product.findOne({ _id: id, status: 'active' }).lean();
    }
    
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
