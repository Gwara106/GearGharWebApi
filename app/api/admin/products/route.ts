import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';

export async function GET(request: NextRequest) {
  try {
    // Connect to database using centralized connection
    await connectToDatabase();
    
    // Get product model
    const { Product } = await import('@/src/models/Product');
    
    const products = await Product.find({}).lean();
    
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
    
    // Connect to database using centralized connection
    await connectToDatabase();
    
    // Get product model
    const { Product } = await import('@/src/models/Product');
    
    // Create new product using mongoose model
    const newProduct = new Product({
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
    });
    
    // Save product to database
    const savedProduct = await newProduct.save();
    
    return NextResponse.json(savedProduct.toJSON(), { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
