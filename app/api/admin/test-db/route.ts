import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { Product } from '@/src/models/Product';

// GET test products count
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Test basic connection
    const totalProducts = await Product.countDocuments();
    const allProducts = await Product.find().limit(5);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test',
      totalProducts,
      products: allProducts.map(p => ({
        name: p.name,
        status: p.status,
        stock: p.stock,
        price: p.price
      }))
    });

  } catch (error) {
    console.error('Error testing database:', error);
    return NextResponse.json(
      { 
        message: 'Database test failed', 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
