import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/config/database';
import { Order } from '@/src/models/Order';
import { Product } from '@/src/models/Product';
import { User } from '@/src/models/User';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';

// GET /api/admin/orders/[id] - Get single order for admin
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('API: Get order request received for ID:', id);
    
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

    // Try to find order by ID or orderNumber
    let order = await Order.findById(id)
      .populate('items.item', 'name images description price')
      .populate('user', 'firstName lastName email phoneNumber');
    
    console.log('API: Order found by ID:', !!order);
    
    if (!order) {
      // If not found by ID, try by orderNumber
      console.log('API: Trying to find by orderNumber:', id);
      order = await Order.findOne({ orderNumber: id })
        .populate('items.item', 'name images description price')
        .populate('user', 'firstName lastName email phoneNumber');
      console.log('API: Order found by orderNumber:', !!order);
    }

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching admin order:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
