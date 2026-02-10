import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for orders (in a real app, this would be a database)
let orders: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      subtotal, 
      tax, 
      shipping,
      total,
      grandTotal 
    } = body;

    // Validate required fields
    if (!items || !shippingAddress || !paymentMethod || !subtotal || !tax || !total && !grandTotal) {
      return NextResponse.json({ 
        message: 'Missing required order information' 
      }, { status: 400 });
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    
    // Create new order
    const newOrder = {
      _id: Date.now().toString(),
      userId: '1', // In a real app, extract from JWT token
      orderNumber,
      status: paymentMethod === 'cash-on-delivery' ? 'pending' : 'processing',
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address,
        phone: shippingAddress.phone
      },
      paymentMethod,
      subtotal,
      tax,
      shipping,
      total: total || grandTotal,
      createdAt: new Date().toISOString(),
      // Add estimated delivery date (3-5 business days from now)
      estimatedDelivery: new Date(Date.now() + (4 * 24 * 60 * 60 * 1000)).toISOString()
    };

    // Save order to in-memory storage
    orders.push(newOrder);

    console.log('New order placed:', newOrder);

    return NextResponse.json({
      message: 'Order placed successfully',
      order: newOrder
    }, { status: 201 });

  } catch (error) {
    console.error('Place order error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // For demo purposes, return orders for user ID '1'
    // In a real app, you'd extract user ID from JWT
    const userOrders = orders.filter(order => order.userId === '1');

    // Sort orders by date (newest first)
    userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      message: 'Orders retrieved successfully',
      orders: userOrders,
      total: userOrders.length
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
