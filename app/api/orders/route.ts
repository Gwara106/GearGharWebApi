import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyprajapati715_db_user:Gwara9841@ronakdemo.0yfckss.mongodb.net/gearghar';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      user,
      items, 
      shippingAddress, 
      billingAddress,
      paymentMethodId,
      subtotal, 
      tax, 
      shipping,
      discount,
      total,
      customerNotes,
      isGift,
      paymentStatus
    } = body;

    // Validate required fields
    if (!items || !shippingAddress || !subtotal || !tax || !total) {
      return NextResponse.json({ 
        message: 'Missing required order information' 
      }, { status: 400 });
    }

    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('Orders API: Connected to database');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }

    const ordersCollection = db.collection('orders');

    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Create new order matching Flutter app structure
    const newOrder = {
      orderNumber,
      user: user, // User ID from Flutter app
      items: items.map((item: any) => ({
        item: item.itemId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        itemName: item.name || 'Product',
        itemImages: item.images || []
      })),
      subtotal,
      tax,
      shipping,
      discount: discount || 0,
      total, // This is the complete total (subtotal + tax + shipping)
      currency: 'USD',
      status: 'pending',
      shippingAddress: {
        _id: shippingAddress._id || '1',
        name: shippingAddress.name,
        streetAddress: shippingAddress.streetAddress,
        city: shippingAddress.city,
        phone: shippingAddress.phone,
        isDefault: shippingAddress.isDefault || true
      },
      billingAddress: billingAddress ? {
        _id: billingAddress._id || '1',
        name: billingAddress.name,
        streetAddress: billingAddress.streetAddress,
        city: billingAddress.city,
        phone: billingAddress.phone,
        isDefault: billingAddress.isDefault || true
      } : shippingAddress,
      paymentMethod: paymentMethodId || 'default',
      paymentStatus: paymentStatus || 'pending',
      customerNotes: customerNotes || 'Order placed from web app',
      isGift: isGift || false,
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Order placed via web app'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert order into database
    const result = await ordersCollection.insertOne(newOrder);
    
    // Don't disconnect - let mongoose manage connection pool

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        ...newOrder,
        _id: result.insertedId.toString()
      }
    });

  } catch (error: any) {
    console.error('Orders API error:', error);
    // Don't disconnect - let mongoose manage connection pool
    return NextResponse.json({ 
      message: 'Failed to create order',
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('Orders API: Connected to database');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }

    const ordersCollection = db.collection('orders');
    
    // Get all orders, sorted by creation date (newest first)
    const orders = await ordersCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Don't disconnect - let mongoose manage connection pool

    return NextResponse.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders
    });

  } catch (error: any) {
    console.error('Orders API error:', error);
    // Don't disconnect - let mongoose manage connection pool
    return NextResponse.json({ 
      message: 'Failed to retrieve orders',
      error: error.message 
    }, { status: 500 });
  }
}
