import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/config/database';
import { Order } from '@/src/models/Order';
import { Product } from '@/src/models/Product';
import { User } from '@/src/models/User';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';

// GET /api/admin/orders - Get all orders for admin
export async function GET(request: NextRequest) {
  try {
    // Authenticate and verify admin role
    const authResult = await authenticateToken(request);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.message }, { status: 401 });
    }

    const adminCheck = requireAdmin(authResult.user!);
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: 403 });
    }

    await connectToDatabase();
    console.log('API: Database connected');
    
    // Ensure models are loaded and registered
    console.log('API: Available models:', Object.keys(mongoose.models));
    
    // Force model registration by accessing them
    console.log('API: User model check:', !!User);
    console.log('API: Product model check:', !!Product);
    console.log('API: Order model check:', !!Order);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('API: Fetching orders with query:', { page, limit, status, query });

    const orders = await (Order as any).getAllOrders(page, limit, status);
    const total = await Order.countDocuments(query);

    console.log('API: Found orders count:', orders.length);
    console.log('API: Sample orders:', orders.slice(0, 3).map((o: any) => ({ orderNumber: o.orderNumber, _id: o._id })));

    return NextResponse.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
