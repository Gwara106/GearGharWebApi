import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET dashboard statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Get user statistics
    const totalUsers = await usersCollection.countDocuments();
    const activeUsers = await usersCollection.countDocuments({ status: 'active' });
    const adminUsers = await usersCollection.countDocuments({ role: 'admin' });
    const regularUsers = await usersCollection.countDocuments({ role: 'user' });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await usersCollection.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate user growth percentage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersThirtyDaysAgo = await usersCollection.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    const usersLastThirtyDays = totalUsers - usersThirtyDaysAgo;
    const userGrowthPercentage = usersThirtyDaysAgo > 0 
      ? Math.round((usersLastThirtyDays / usersThirtyDaysAgo) * 100) 
      : 0;

    // For now, return mock data for products and orders since those collections might not exist
    const dashboardStats = {
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers,
      recentUsers,
      userGrowthPercentage,
      totalProducts: 8, // Mock data
      activeProducts: 7, // Mock data
      outOfStockProducts: 1, // Mock data
      productGrowthPercentage: 12, // Mock data
      totalOrders: 24, // Mock data
      paidOrders: 18, // Mock data
      pendingOrders: 4, // Mock data
      completedOrders: 16, // Mock data
      orderGrowthPercentage: 8, // Mock data
      totalRevenue: 4850.50, // Mock data
      revenueGrowthPercentage: 15, // Mock data
      recentOrders: [ // Mock data
        {
          id: 'ORD-001',
          customer: 'John Doe',
          amount: '$299.99',
          status: 'Completed',
          date: '2024-01-15'
        },
        {
          id: 'ORD-002',
          customer: 'Jane Smith',
          amount: '$89.99',
          status: 'Pending',
          date: '2024-01-14'
        },
        {
          id: 'ORD-003',
          customer: 'Mike Johnson',
          amount: '$599.99',
          status: 'Completed',
          date: '2024-01-13'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
