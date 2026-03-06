import { NextRequest, NextResponse } from 'next/server';

// Mock product data
const mockProducts = [
  {
    _id: '1',
    name: 'Premium Safety Helmet - HD Vision',
    description: 'Advanced safety helmet with HD vision technology, superior impact protection, and comfortable fit for long rides. Features anti-fog visor, quick-release buckle, and aerodynamic design.',
    price: 299.99,
    category: 'helmets',
    brand: 'SafeRide',
    sku: 'HELM-001',
    stock: 15,
    images: ['/products/helmet-1.png', '/products/helmet-2.png'],
    status: 'active',
    tags: ['safety', 'helmet', 'vision'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Sport Performance Gloves',
    description: 'Professional racing gloves with enhanced grip, knuckle protection, and breathable fabric. Perfect for both street and track riding with touchscreen-compatible fingertips.',
    price: 89.99,
    category: 'gloves',
    brand: 'GripPro',
    sku: 'GLOV-002',
    stock: 8,
    images: ['/products/gloves.jpg', '/products/gloves-2.jpg'],
    status: 'active',
    tags: ['gloves', 'racing', 'protection'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'High-Grip Handlebar Grips Set',
    description: 'Ergonomic handlebar grips with vibration dampening and all-weather grip. Includes throttle assist and easy installation hardware.',
    price: 59.99,
    category: 'handlebars',
    brand: 'ComfortRide',
    sku: 'GRIP-003',
    stock: 25,
    images: ['/products/450handlebar.png', '/products/handlebar-2.png'],
    status: 'active',
    tags: ['handlebars', 'grips', 'comfort'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '4',
    name: 'Premium Racing Tyres (Front)',
    description: 'High-performance racing tires with superior grip and durability. Designed for both wet and dry conditions with advanced compound technology.',
    price: 199.99,
    category: 'tyres',
    brand: 'SpeedGrip',
    sku: 'TYRE-004',
    stock: 12,
    images: ['/products/harleyDavidsontyres.jpg', '/products/tyre-2.jpg'],
    status: 'active',
    tags: ['tyres', 'racing', 'performance'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '5',
    name: 'Carbon Fiber Exhaust System',
    description: 'Lightweight carbon fiber exhaust with enhanced sound and performance. Features removable baffle for street/track tuning.',
    price: 599.99,
    category: 'exhaust',
    brand: 'PowerFlow',
    sku: 'EXH-005',
    stock: 5,
    images: ['/products/exhaust1.png', '/products/exhaust2.png'],
    status: 'active',
    tags: ['exhaust', 'carbon', 'performance'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('Fetching product with ID:', id);
    
    const product = mockProducts.find(p => p._id === id && p.status === 'active');
    
    if (!product) {
      console.log('Product not found for ID:', id);
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    console.log('Product found:', product.name);
    return NextResponse.json({
      message: 'Product retrieved successfully',
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
