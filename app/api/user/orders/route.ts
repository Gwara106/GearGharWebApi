import { NextRequest, NextResponse } from 'next/server';

// Mock order data - in a real app, this would come from a database
const mockOrders = [
  {
    _id: '1',
    userId: '1',
    orderNumber: 'ORD-123456',
    status: 'delivered',
    items: [
      {
        id: '1',
        name: 'Premium Safety Helmet - HD Vision',
        price: 299.99,
        quantity: 1,
        image: '/products/helmet-1.png'
      },
      {
        id: '2',
        name: 'Sport Performance Gloves',
        price: 89.99,
        quantity: 2,
        image: '/products/gloves.jpg'
      }
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St, City, State 12345',
      phone: '+1234567890'
    },
    paymentMethod: 'credit-card',
    subtotal: 479.97,
    tax: 47.99,
    shipping: 0,
    total: 527.96,
    createdAt: '2024-01-15T10:30:00.000Z',
    deliveredAt: '2024-01-18T14:20:00.000Z'
  },
  {
    _id: '2',
    userId: '1',
    orderNumber: 'ORD-123457',
    status: 'processing',
    items: [
      {
        id: '3',
        name: 'High-Grip Handlebar Grips Set',
        price: 59.99,
        quantity: 1,
        image: '/products/450handlebar.png'
      }
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St, City, State 12345',
      phone: '+1234567890'
    },
    paymentMethod: 'cash-on-delivery',
    subtotal: 59.99,
    tax: 6.00,
    shipping: 9.99,
    total: 75.98,
    createdAt: '2024-01-20T09:15:00.000Z',
    estimatedDelivery: '2024-01-25T00:00:00.000Z'
  },
  {
    _id: '3',
    userId: '1',
    orderNumber: 'ORD-123458',
    status: 'shipped',
    items: [
      {
        id: '4',
        name: 'Premium Racing Tyres (Front)',
        price: 199.99,
        quantity: 2,
        image: '/products/harleyDavidsontyres.jpg'
      },
      {
        id: '5',
        name: 'Carbon Fiber Exhaust System',
        price: 599.99,
        quantity: 1,
        image: '/products/exhaust1.png'
      }
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St, City, State 12345',
      phone: '+1234567890'
    },
    paymentMethod: 'credit-card',
    subtotal: 999.97,
    tax: 100.00,
    shipping: 0,
    total: 1099.97,
    createdAt: '2024-01-22T16:45:00.000Z',
    shippedAt: '2024-01-23T11:30:00.000Z',
    trackingNumber: 'TRK123456789',
    estimatedDelivery: '2024-01-26T00:00:00.000Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // For demo purposes, we'll return orders for user ID '1'
    // In a real app, you'd extract user ID from JWT and fetch their orders
    const userOrders = mockOrders.filter(order => order.userId === '1');

    // Sort orders by date (newest first)
    userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      message: 'Orders retrieved successfully',
      orders: userOrders,
      total: userOrders.length
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
