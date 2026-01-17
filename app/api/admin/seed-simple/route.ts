import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { Product } from '@/src/models/Product';

const seedProducts = [
  {
    name: 'Premium Safety Helmet - HD Vision',
    description: 'High-definition vision premium safety helmet with advanced impact protection and anti-scratch visor.',
    price: 299.99,
    category: 'electronics',
    brand: 'GearGhar Premium',
    sku: 'HELM-001',
    stock: 15,
    images: ['https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['helmet', 'safety', 'premium', 'hd-vision']
  },
  {
    name: 'Sport Performance Gloves',
    description: 'Professional sport performance gloves with enhanced grip and breathable material.',
    price: 89.99,
    category: 'accessories',
    brand: 'GearGhar Sport',
    sku: 'GLOV-001',
    stock: 25,
    images: ['https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['gloves', 'sport', 'performance', 'grip']
  },
  {
    name: 'High-Grip Handlebar Grips Set',
    description: 'High-grip handlebar grips set for superior control and comfort during long rides.',
    price: 59.99,
    category: 'accessories',
    brand: 'GearGhar Pro',
    sku: 'GRIP-001',
    stock: 30,
    images: ['https://images.unsplash.com/photo-1606405162335-5e8e9d8f8f3d?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['handlebar', 'grips', 'control', 'comfort']
  },
  {
    name: 'Premium Racing Tyres (Front)',
    description: 'High-performance racing tyres designed for maximum grip and durability on track.',
    price: 199.99,
    category: 'electronics',
    brand: 'GearGhar Racing',
    sku: 'TYRE-F001',
    stock: 12,
    images: ['https://images.unsplash.com/photo-1559056169-641ef2a8ec3f?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['tyres', 'racing', 'performance', 'front']
  },
  {
    name: 'Carbon Fiber Exhaust System',
    description: 'Lightweight carbon fiber exhaust system for enhanced performance and aggressive sound.',
    price: 599.99,
    category: 'electronics',
    brand: 'GearGhar Performance',
    sku: 'EXH-001',
    stock: 8,
    images: ['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['exhaust', 'carbon-fiber', 'performance', 'lightweight']
  },
  {
    name: 'Professional Riding Suit',
    description: 'Professional riding suit with advanced protection materials and ergonomic design.',
    price: 349.99,
    category: 'clothing',
    brand: 'GearGhar Pro',
    sku: 'SUIT-001',
    stock: 10,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['suit', 'riding', 'professional', 'protection']
  },
  {
    name: 'Full-Face Safety Helmet Pro',
    description: 'Professional full-face safety helmet with advanced ventilation and communication system.',
    price: 399.99,
    category: 'electronics',
    brand: 'GearGhar Pro',
    sku: 'HELM-002',
    stock: 6,
    images: ['https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['helmet', 'full-face', 'professional', 'safety']
  },
  {
    name: 'Leather Riding Gloves Premium',
    description: 'Premium leather riding gloves with reinforced padding and weather protection.',
    price: 129.99,
    category: 'accessories',
    brand: 'GearGhar Premium',
    sku: 'GLOV-002',
    stock: 0,
    images: ['https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop'],
    status: 'out_of_stock',
    tags: ['gloves', 'leather', 'premium', 'riding']
  }
];

// GET to check current products
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const currentCount = await Product.countDocuments();
    const currentProducts = await Product.find().select('name status stock price').limit(5);
    
    return NextResponse.json({
      success: true,
      currentCount,
      currentProducts,
      message: `Current database has ${currentCount} products`
    });

  } catch (error) {
    console.error('Error checking products:', error);
    return NextResponse.json(
      { message: 'Failed to check products', error: error.message },
      { status: 500 }
    );
  }
}

// POST to seed products (no auth required for testing)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing products`);
    
    // Insert seed products
    const insertedProducts = await Product.insertMany(seedProducts);
    console.log(`Successfully inserted ${insertedProducts.length} products`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedProducts.length} products`,
      deletedCount: deleteResult.deletedCount,
      insertedCount: insertedProducts.length,
      products: insertedProducts.map(p => ({
        name: p.name,
        status: p.status,
        stock: p.stock,
        price: p.price
      }))
    });

  } catch (error) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { message: 'Failed to seed products', error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
