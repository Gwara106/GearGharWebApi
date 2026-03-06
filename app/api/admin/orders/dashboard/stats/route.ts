import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/config/database';
import { Order } from '@/src/models/Order';
import { User } from '@/src/models/User';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';

// GET /api/admin/orders/dashboard/stats - Get dashboard statistics
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
    console.log('API: Order model check:', !!Order);

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'received'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber user total status createdAt');

    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.orderNumber,
      customer: `${order.user.firstName} ${order.user.lastName}`,
      amount: `Rs. ${order.total.toFixed(2)}`,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: order.createdAt.toLocaleDateString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        recentOrders: formattedRecentOrders
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
