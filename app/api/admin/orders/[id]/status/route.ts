import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/config/database';
import { Order } from '@/src/models/Order';
import { Product } from '@/src/models/Product';
import { User } from '@/src/models/User';
import { authenticateToken, requireAdmin } from '@/app/api/_lib/auth';

// PUT /api/admin/orders/[id]/status - Update order status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('API: Update order status request received for ID:', id);
    
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

    // Direct database test for debugging
    const directTest = await Order.findById(id);
    console.log('API: Direct database test result:', !!directTest);
    
    if (!directTest) {
      const directTestByNumber = await Order.findOne({ orderNumber: id });
      console.log('API: Direct database test by orderNumber result:', !!directTestByNumber);
    }

    const body = await request.json();
    const { status, note, trackingNumber, carrier, estimatedDelivery } = body;

    if (!['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'received', 'cancelled', 'refunded'].includes(status)) {
      return NextResponse.json({ message: "Invalid order status" }, { status: 400 });
    }

    // Try to find order by ID or orderNumber
    let order = await Order.findById(id);
    console.log('API: Order found by ID:', !!order);
    
    if (!order) {
      // If not found by ID, try by orderNumber
      console.log('API: Trying to find by orderNumber:', id);
      order = await Order.findOne({ orderNumber: id });
      console.log('API: Order found by orderNumber:', !!order);
    }

    if (!order) {
      // Log all orders for debugging
      console.log('API: Order not found, listing all orders for debugging...');
      const allOrders = await Order.find({}).select('orderNumber _id').limit(5);
      console.log('API: Available orders:', allOrders.map((o: any) => ({ orderNumber: o.orderNumber, _id: o._id })));
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
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

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating admin order status:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
