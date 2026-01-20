import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { Product } from '@/src/models/Product';
import { verifyToken } from '@/lib/auth';

const seedProducts = [
  {
    name: 'Premium Safety Helmet - HD Vision',
    description: 'High-definition vision premium safety helmet with advanced impact protection and anti-scratch visor.',
    price: 299.99,
    category: 'accessories',
    brand: 'GearGhar Premium',
    sku: 'HELM-001',
    stock: 15,
    images: ['/products/helmet-1.png'],
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
    images: ['/products/gloves.jpg'],
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
    images: ['/products/450handlebar.png'],
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
    images: ['/products/harleyDavidsontyres.jpg'],
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
    images: ['/products/exhaust1.png'],
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
    images: ['/products/jacket.jpg'],
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
    images: ['/products/helmet-1.png'],
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
    images: ['/products/gloves.jpg'],
    status: 'out_of_stock',
    tags: ['gloves', 'leather', 'premium', 'riding']
  }
];

// POST seed products (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert seed products
    const insertedProducts = await Product.insertMany(seedProducts);
    console.log(`Successfully inserted ${insertedProducts.length} products`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedProducts.length} products`,
      count: insertedProducts.length,
      products: insertedProducts.map(p => ({
        name: p.name,
        status: p.status,
        stock: p.stock
      }))
    });

  } catch (error) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { message: 'Failed to seed products', error: error.message },
      { status: 500 }
    );
  }
}
