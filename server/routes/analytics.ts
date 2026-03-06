import express from 'express';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/adminAuth';
import { connectToDatabase } from '../../lib/db';
import { ObjectId } from 'mongodb';

const router = express.Router();

// GET /api/admin/analytics/users - Get user analytics
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { range = '30d' } = req.query;
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Calculate date range
    const now = new Date();
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Get total users
    const totalUsers = await usersCollection.countDocuments();
    
    // Get active users (users who logged in within the last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const activeUsers = await usersCollection.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Get inactive users
    const inactiveUsers = totalUsers - activeUsers;

    // Get admin users
    const adminUsers = await usersCollection.countDocuments({ role: 'admin' });
    const regularUsers = totalUsers - adminUsers;

    // Get new users this month
    const newUsersThisMonth = await usersCollection.countDocuments({
      createdAt: { $gte: monthStart }
    });

    // Get new users this week
    const newUsersThisWeek = await usersCollection.countDocuments({
      createdAt: { $gte: weekStart }
    });

    // Calculate user growth rate
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const usersPreviousMonth = await usersCollection.countDocuments({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });
    
    const userGrowthRate = usersPreviousMonth > 0 
      ? ((newUsersThisMonth - usersPreviousMonth) / usersPreviousMonth) * 100 
      : 0;

    // Calculate retention rate (simplified - users who were active last month and are still active)
    const retentionRate = activeUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Average session duration (mock data - in real app, track actual sessions)
    const averageSessionDuration = 1800; // 30 minutes in seconds

    // Get user registration trend for the selected period
    const registrationTrend = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const count = await usersCollection.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      registrationTrend.push({
        date: dayStart.toISOString().split('T')[0],
        count
      });
    }

    // Get user activity by day (mock data - in real app, track actual sessions)
    const userActivityByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const activeUsersCount = await usersCollection.countDocuments({
        lastLogin: { $gte: dayStart, $lt: dayEnd }
      });
      
      userActivityByDay.push({
        day: dayStart.toLocaleDateString('en', { weekday: 'short' }),
        activeUsers: activeUsersCount,
        totalSessions: Math.floor(activeUsersCount * 1.5) // Mock session data
      });
    }

    // Get top active users
    const topActiveUsers = await usersCollection
      .find({})
      .sort({ lastLogin: -1 })
      .limit(10)
      .project({ 
        password: 0,
        firstName: 1,
        lastName: 1,
        email: 1,
        lastLogin: 1,
        loginCount: { $ifNull: ['$loginCount', Math.floor(Math.random() * 50) + 1] } // Mock login count
      })
      .toArray();

    const analytics = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      userGrowthRate,
      userRetentionRate: retentionRate,
      averageSessionDuration,
      usersByRole: {
        admin: adminUsers,
        user: regularUsers
      },
      usersByStatus: {
        active: activeUsers,
        inactive: inactiveUsers
      },
      userRegistrationTrend: registrationTrend,
      userActivityByDay,
      topActiveUsers
    };

    res.json({
      message: 'User analytics retrieved successfully',
      analytics
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// GET /api/admin/analytics/users/export - Export user analytics
router.get('/users/export', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { range = '30d' } = req.query;
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Get all users with their details
    const users = await usersCollection
      .find({})
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    // Create CSV content
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user._id.toString(),
        user.firstName,
        user.lastName,
        user.email,
        user.role,
        user.status,
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="user-analytics-${range}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export user analytics error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

export { router as analyticsRouter };
