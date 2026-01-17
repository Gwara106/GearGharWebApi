import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { User } from '@/src/models/User';
import { Product } from '@/src/models/Product';
import { Order } from '@/src/models/Order';
import { verifyToken } from '@/lib/auth';

const seedProducts = [
  {
    name: 'Premium Safety Helmet - HD Vision',
    description: 'High-definition vision premium safety helmet with advanced impact protection and anti-scratch visor.',
    price: 299.99,
    category: 'electronics',
    brand: 'GearGhar Premium',
    sku: 'HELM-001',
    stock: 15,
    images: ['https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['helmet', 'safety', 'premium', 'hd-vision']
  },
  {
    name: 'Sport Performance Gloves',
    description: 'Professional sport performance gloves with enhanced grip and breathable material.',
    price: 89.99,
    category: 'accessories',
    brand: 'GearGhar Sport',
    sku: 'GLOV-001',
    stock: 25,
    images: ['https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['gloves', 'sport', 'performance', 'grip']
  },
  {
    name: 'High-Grip Handlebar Grips Set',
    description: 'High-grip handlebar grips set for superior control and comfort during long rides.',
    price: 59.99,
    category: 'accessories',
    brand: 'GearGhar Pro',
    sku: 'GRIP-001',
    stock: 30,
    images: ['https://images.unsplash.com/photo-1606405162335-5e8e9d8f8f3d?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['handlebar', 'grips', 'control', 'comfort']
  },
  {
    name: 'Premium Racing Tyres (Front)',
    description: 'High-performance racing tyres designed for maximum grip and durability on track.',
    price: 199.99,
    category: 'electronics',
    brand: 'GearGhar Racing',
    sku: 'TYRE-F001',
    stock: 12,
    images: ['https://images.unsplash.com/photo-1559056169-641ef2a8ec3f?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['tyres', 'racing', 'performance', 'front']
  },
  {
    name: 'Carbon Fiber Exhaust System',
    description: 'Lightweight carbon fiber exhaust system for enhanced performance and aggressive sound.',
    price: 599.99,
    category: 'electronics',
    brand: 'GearGhar Performance',
    sku: 'EXH-001',
    stock: 8,
    images: ['https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['exhaust', 'carbon-fiber', 'performance', 'lightweight']
  },
  {
    name: 'Professional Riding Suit',
    description: 'Professional riding suit with advanced protection materials and ergonomic design.',
    price: 349.99,
    category: 'clothing',
    brand: 'GearGhar Pro',
    sku: 'SUIT-001',
    stock: 10,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['suit', 'riding', 'professional', 'protection']
  },
  {
    name: 'Full-Face Safety Helmet Pro',
    description: 'Professional full-face safety helmet with advanced ventilation and communication system.',
    price: 399.99,
    category: 'electronics',
    brand: 'GearGhar Pro',
    sku: 'HELM-002',
    stock: 6,
    images: ['https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop'],
    status: 'active',
    tags: ['helmet', 'full-face', 'professional', 'safety']
  },
  {
    name: 'Leather Riding Gloves Premium',
    description: 'Premium leather riding gloves with reinforced padding and weather protection.',
    price: 129.99,
    category: 'accessories',
    brand: 'GearGhar Premium',
    sku: 'GLOV-002',
    stock: 0,
    images: ['https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop'],
    status: 'out_of_stock',
    tags: ['gloves', 'leather', 'premium', 'riding']
  }
];

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

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Auto-seed products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('No products found, seeding database...');
      await Product.deleteMany({});
      await Product.insertMany(seedProducts);
      console.log(`Seeded ${seedProducts.length} products to database`);
    }

    // Get real user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate user growth percentage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersThirtyDaysAgo = await User.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    const usersLastThirtyDays = totalUsers - usersThirtyDaysAgo;
    const userGrowthPercentage = usersThirtyDaysAgo > 0 
      ? Math.round((usersLastThirtyDays / usersThirtyDaysAgo) * 100) 
      : 0;

    // Get real product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const outOfStockProducts = await Product.countDocuments({ 
      status: 'out_of_stock' 
    });

    // Calculate product growth percentage (last 30 days)
    const productsThirtyDaysAgo = await Product.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    const productsLastThirtyDays = totalProducts - productsThirtyDaysAgo;
    const productGrowthPercentage = productsThirtyDaysAgo > 0 
      ? Math.round((productsLastThirtyDays / productsThirtyDaysAgo) * 100) 
      : 0;

    // Get real order statistics
    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });

    // Calculate order growth percentage (last 30 days)
    const ordersThirtyDaysAgo = await Order.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    const ordersLastThirtyDays = totalOrders - ordersThirtyDaysAgo;
    const orderGrowthPercentage = ordersThirtyDaysAgo > 0 
      ? Math.round((ordersLastThirtyDays / ordersThirtyDaysAgo) * 100) 
      : 0;

    // Calculate total revenue from paid orders
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Calculate revenue growth percentage (last 30 days vs previous 30 days)
    const revenueLast30Days = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenueLast30DaysAmount = revenueLast30Days.length > 0 ? revenueLast30Days[0].total : 0;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const revenuePrevious30Days = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        } 
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const revenuePrevious30DaysAmount = revenuePrevious30Days.length > 0 ? revenuePrevious30Days[0].total : 0;

    const revenueGrowthPercentage = revenuePrevious30DaysAmount > 0 
      ? Math.round(((revenueLast30DaysAmount - revenuePrevious30DaysAmount) / revenuePrevious30DaysAmount) * 100) 
      : 0;

    // Get recent orders with customer details
    const recentOrdersData = await Order.find()
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentOrders = recentOrdersData.map(order => ({
      id: order.orderNumber,
      customer: `${order.customer.firstName} ${order.customer.lastName}`,
      amount: `$${order.total.toFixed(2)}`,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: new Date(order.createdAt).toLocaleDateString()
    }));

    const dashboardStats = {
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers,
      recentUsers,
      userGrowthPercentage,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      productGrowthPercentage,
      totalOrders,
      paidOrders,
      pendingOrders,
      completedOrders,
      orderGrowthPercentage,
      totalRevenue,
      revenueGrowthPercentage,
      recentOrders
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
