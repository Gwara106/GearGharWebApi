'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    itemName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'received' | 'cancelled' | 'refunded';
  paymentStatus: string;
  createdAt: string;
  shippingAddress: any;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export default function AdminOrdersPage() {
  const { user, isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && token) {
      fetchOrders();
      fetchStats();
    }
  }, [isAuthenticated, token, selectedStatus, currentPage, searchTerm]);

  const fetchOrders = async () => {
    try {
      if (!token) {
        console.error('No token available for fetchOrders');
        return;
      }

      console.log('Fetching orders with token:', token.substring(0, 20) + '...');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Orders response status:', response.status);
      console.log('Orders response ok:', response.ok);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      setOrders(result.data);
      setTotalPages(result.pages);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!token) {
        console.error('No token available for fetchStats');
        return;
      }

      console.log('Fetching stats with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/admin/orders/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Stats response status:', response.status);
      console.log('Stats response ok:', response.ok);

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, note?: string) => {
    try {
      setUpdatingStatus(true);
      
      console.log('Updating order status:', { orderId, newStatus, note });
      console.log('Token being used:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus, 
          note: note || `Status updated to ${newStatus}` 
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Failed to update order status: ${response.status} - ${errorText}`);
      }

      await fetchOrders();
      await fetchStats();
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'packed': return 'bg-indigo-100 text-indigo-700';
      case 'shipped': return 'bg-orange-100 text-orange-700';
      case 'delivered': case 'received': return 'bg-green-100 text-green-700';
      case 'cancelled': case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'delivered': case 'received': return <CheckCircle size={16} />;
      case 'cancelled': case 'refunded': return <XCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  if (!isAuthenticated() || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be an admin to access this page.</p>
          <Link href="/admin/login" className="text-primary hover:underline">
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <ArrowLeft size={20} />
            <span className="text-lg font-bold text-gray-900">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
            <button
              onClick={() => {
                fetchOrders();
                fetchStats();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                </div>
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.processingOrders}</p>
                </div>
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Items</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6 font-semibold text-primary">{order.orderNumber}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.user.firstName} {order.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{order.user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1 hover:bg-gray-100 rounded transition"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowStatusModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition"
                            title="Update Status"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && !showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                  <p className="text-sm text-gray-600">Order ID: {selectedOrder.orderNumber}</p>
                  <p className="text-sm text-gray-600">Status: 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Total: ${selectedOrder.total.toFixed(2)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Item</th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Price</th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-2 px-4 text-sm">{item.itemName}</td>
                          <td className="py-2 px-4 text-sm">{item.quantity}</td>
                          <td className="py-2 px-4 text-sm">Rs. {item.price.toFixed(2)}</td>
                          <td className="py-2 px-4 text-sm font-semibold">Rs. {item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Update Order Status</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a note about this status change..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const note = (document.querySelector('textarea') as HTMLTextAreaElement)?.value;
                    console.log('Selected order object:', selectedOrder);
                    console.log('Order ID being updated:', selectedOrder._id);
                    console.log('Order Number being updated:', selectedOrder.orderNumber);
                    updateOrderStatus(selectedOrder._id, selectedOrder.status, note);
                  }}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
