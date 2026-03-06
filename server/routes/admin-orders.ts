import express from 'express';
import { Response } from 'express';
import { connectToDatabase } from '../../src/config/database';
import { Order } from '../../src/models/Order';
import { Product } from '../../src/models/Product';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/adminAuth';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// @desc    Get all orders for admin
// @route   GET /api/admin/orders
// @access  Admin
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectToDatabase();
    
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as string;
    const startIndex = (page - 1) * limit;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const orders = await (Order as any).getAllOrders(page, limit, status);
    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get order counts by status
// @route   GET /api/admin/orders/counts
// @access  Admin
router.get('/counts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectToDatabase();
    
    const counts = await (Order as any).getOrderCounts();

    res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error('Error fetching order counts:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get single order for admin
// @route   GET /api/admin/orders/:id
// @access  Admin
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectToDatabase();
    
    const order = await Order.findById(req.params.id)
      .populate('items.item', 'name images description price')
      .populate('user', 'firstName lastName email phoneNumber');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching admin order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Update order status (admin only)
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectToDatabase();
    
    const { status, note, trackingNumber, carrier, estimatedDelivery } = req.body;

    if (!['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'received', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status and add to history
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
    });

    // Update tracking information if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (carrier) {
      order.carrier = carrier;
    }
    if (estimatedDelivery) {
      order.estimatedDelivery = new Date(estimatedDelivery);
    }

    // Update actual delivery date if status is delivered
    if (status === 'delivered') {
      order.actualDelivery = new Date();
      order.paymentStatus = 'completed';
    }

    // Update payment status based on order status
    if (status === 'cancelled') {
      order.paymentStatus = 'refunded';
      // Restore item stock
      for (const orderItem of order.items) {
        await Product.findByIdAndUpdate(
          orderItem.item,
          { $inc: { stock: orderItem.quantity } }
        );
      }
    }

    await order.save();

    // Populate user and item data before returning
    await order.populate('user', 'firstName lastName email');
    await order.populate('items.item', 'name images');

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating admin order status:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/orders/dashboard
// @access  Admin
router.get('/dashboard/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectToDatabase();
    
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

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        recentOrders: recentOrders.map(order => ({
          id: order.orderNumber,
          customer: `${order.user.firstName} ${order.user.lastName}`,
          amount: `$${order.total.toFixed(2)}`,
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          date: order.createdAt.toLocaleDateString()
        }))
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as adminOrdersRouter };
