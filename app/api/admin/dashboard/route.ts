import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';

// GET dashboard statistics (Admin only)
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

    // Use direct MongoDB connection (same as products API)
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://luckyprajapati715_db_user:Gwara9841@ronakdemo.0yfckss.mongodb.net/gearghar';
    
    await mongoose.connect(MONGODB_URI);
    console.log('API: Database connected');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Available collections:', await db.listCollections().toArray());

    // Get user statistics
    const usersCollection = db.collection('users');
    const totalUsers = await usersCollection.countDocuments();
    const activeUsers = await usersCollection.countDocuments({ status: 'active' });
    const adminUsers = await usersCollection.countDocuments({ role: 'admin' });
    const regularUsers = await usersCollection.countDocuments({ role: 'user' });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await usersCollection.find({ createdAt: { $gte: sevenDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get product statistics
    const productsCollection = db.collection('products');
    const totalProducts = await productsCollection.countDocuments();
    const activeProducts = await productsCollection.countDocuments({ status: 'active' });
    const outOfStockProducts = await productsCollection.countDocuments({ stock: 0 });

    // Get order statistics
    const ordersCollection = db.collection('orders');
    const totalOrders = await ordersCollection.countDocuments();
    const paidOrders = await ordersCollection.countDocuments({ status: 'paid' });
    const pendingOrders = await ordersCollection.countDocuments({ status: 'pending' });
    const completedOrders = await ordersCollection.countDocuments({ status: 'completed' });

    // Get recent orders
    const recentOrders = await ordersCollection.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Populate user data for recent orders and calculate totals
    for (let order of recentOrders) {
      // Use the 'total' field which includes subtotal + tax + shipping
      if (!order.totalAmount && order.total) {
        order.totalAmount = order.total;
      }
      
      // Try to find user if user field exists
      if (order.user) {
        const user = await usersCollection.findOne({ _id: order.user });
        order.user = user;
      }
      
      // If no user found, use shipping address name as customer
      if (!order.user && order.shippingAddress && order.shippingAddress.name) {
        order.user = {
          name: order.shippingAddress.name,
          email: order.shippingAddress.email || 'No email'
        };
      }
    }

    // Calculate revenue (using the 'total' field which includes VAT and shipping)
    let totalRevenue = 0;
    const allOrders = await ordersCollection.find({ status: 'paid' }).toArray();
    
    for (let order of allOrders) {
      // Use the 'total' field which includes subtotal + tax + shipping
      if (order.total) {
        totalRevenue += order.total;
      }
    }

    // Don't disconnect - let mongoose manage connection pool

    return NextResponse.json({
      message: 'Dashboard statistics retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        adminUsers,
        regularUsers,
        recentUsers: recentUsers.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        })),
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalOrders,
        paidOrders,
        pendingOrders,
        completedOrders,
        recentOrders: recentOrders.map(order => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          user: order.user ? {
            name: order.user.name,
            email: order.user.email
          } : null,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt
        })),
        totalRevenue,
        userGrowthPercentage: recentUsers.length > 0 ? Math.round((recentUsers.length / totalUsers) * 100) : 0,
        productGrowthPercentage: totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0,
        orderGrowthPercentage: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        revenueGrowthPercentage: totalRevenue > 0 ? 10 : 0 // Placeholder for revenue growth
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    // Don't disconnect - let mongoose manage connection pool
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
