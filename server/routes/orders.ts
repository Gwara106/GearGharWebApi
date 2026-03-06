import express from 'express';
import { Request, Response } from 'express';
import { connectToDatabase } from '../../src/config/database';
import { Order } from '../../src/models/Order';
import { Product } from '../../src/models/Product';
import { User } from '../../src/models/User';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// @desc    Get all orders for a user
// @route   GET /api/orders
// @access  Private
router.get('/', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;

    const orders = await Order.find({ user: (req as any).user.id })
      .populate('items.item', 'name images')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Order.countDocuments({ user: (req as any).user.id });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const order = await Order.findOne({
      _id: req.params.id,
      user: (req as any).user.id,
    })
      .populate('items.item', 'name images description price')
      .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      customerNotes,
      promoCode,
      isGift,
      giftMessage,
      giftWrap,
      subtotal,
      tax,
      shipping,
      discount,
      total,
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (!billingAddress) {
      return res.status(400).json({ message: "Billing address is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    // Validate items and calculate totals
    let calculatedSubtotal = 0;
    const orderItems = [];

    for (const itemData of items) {
      const product = await Product.findById(itemData.item);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${itemData.item}` });
      }

      if (!product.isActive) {
        return res.status(400).json({ message: `Product is not available: ${product.name}` });
      }

      if (product.stock < itemData.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${itemData.quantity}` 
        });
      }

      const itemPrice = itemData.price;
      const itemTotal = itemData.totalPrice;
      
      orderItems.push({
        item: product._id,
        quantity: itemData.quantity,
        price: itemPrice,
        totalPrice: itemTotal,
        itemName: product.name,
        itemImages: product.images || [],
      });

      calculatedSubtotal += itemTotal;
    }

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: (req as any).user.id,
      items: orderItems,
      subtotal: subtotal || calculatedSubtotal,
      tax: tax || 0,
      shipping: shipping || 0,
      discount: discount || 0,
      total: total,
      shippingAddress,
      billingAddress,
      paymentMethod,
      customerNotes,
      promoCode,
      isGift,
      giftMessage,
      giftWrap,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order created'
      }]
    });

    // Populate the order before returning
    await order.populate('items.item', 'name images');
    await order.populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only in real implementation)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const { status, note } = req.body;

    if (!['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'received', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: (req as any).user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    if (note) {
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note,
      });
    }

    if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: (req as any).user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: "Order cannot be cancelled at this stage" 
      });
    }

    // Restore item stock
    for (const orderItem of order.items) {
      await Product.findByIdAndUpdate(
        orderItem.item,
        { $inc: { stock: orderItem.quantity } }
      );
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Order cancelled by customer',
    });

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Get order statistics for user
// @route   GET /api/orders/stats
// @access  Private
router.get('/stats', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const stats = await (Order as any).getStats((req as any).user.id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Private
router.get('/:id/track', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const order = await Order.findOne({
      _id: req.params.id,
      user: (req as any).user.id,
    })
      .select('orderNumber status trackingNumber carrier estimatedDelivery statusHistory createdAt');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @desc    Delete a cancelled order (permanent)
// @route   DELETE /api/orders/:id
// @access  Private
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    
    const order = await Order.findOne({
      _id: req.params.id,
      user: (req as any).user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow deleting orders that were already cancelled
    if (order.status !== 'cancelled') {
      return res.status(400).json({
        message: "Only cancelled orders can be deleted",
      });
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      data: { id: req.params.id },
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as ordersRouter };
