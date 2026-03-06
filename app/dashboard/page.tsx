'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, User, ShoppingBag, Heart, Settings, MapPin, Phone, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

interface Order {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    item: string;
    quantity: number;
    price: number;
    totalPrice: number;
    itemName: string;
    itemImages: string[];
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
  };
  paymentMethod: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: string;
  deliveredAt?: string;
  shippedAt?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout, isLoading, updateUser, isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!token) return;
    
    try {
      setOrdersLoading(true);
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data); // Fixed: access data.data instead of data.orders
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch orders:', errorData.message);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' && token) {
      fetchOrders();
    }
  }, [activeTab, token]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setProfileLoading(true);
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data.user);
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'shipped': return 'text-blue-600 bg-blue-50';
      case 'processing': return 'text-yellow-600 bg-yellow-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'processing': return <Package size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return <Package size={16} />;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }
  //making the front end
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-20">
              <div className="p-6 border-b border-gray-200">
                {user?.profilePicture || user?.image ? (
                  <img
                    src={user.profilePicture || user.image}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mx-auto mb-4"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 text-center">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-600 text-center mt-1">{user.email}</p>
              </div>

              <nav className="p-4 space-y-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'orders', label: 'Orders', icon: ShoppingBag },
                  { id: 'wishlist', label: 'Wishlist', icon: Heart },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </div>
          </div>
                
          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="Add phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-2" />
                      Address
                    </label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      placeholder="Add your address"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="submit" 
                      disabled={profileLoading}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:bg-gray-400 transition"
                    >
                      {profileLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        phone: user.phone || '',
                        address: user.address || ''
                      })}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
                
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-gray-600 mt-4">Loading orders...</p>
                  </div>
                ) : !orders || !Array.isArray(orders) || orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <Link href="/shop" className="btn-primary inline-block">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Array.isArray(orders) && orders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">
                              Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                          <div className="space-y-2">
                            {order.items && Array.isArray(order.items) && order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-4">
                                <img
                                  src={item.itemImages?.[0] || '/products/placeholder.png'}
                                  alt={item.itemName || 'Product'}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.itemName || 'Product'}</p>
                                  <p className="text-sm text-gray-600">Qty: {item.quantity} × Rs. {item.price.toFixed(2)}</p>
                                </div>
                                <p className="font-semibold text-gray-900">Rs. {item.totalPrice.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                              {order.shippingAddress.address}<br />
                              {order.shippingAddress.phone}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                            <p className="text-sm text-gray-600 capitalize">
                              {order.paymentMethod === 'credit-card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              <div>Subtotal: ${order.subtotal.toFixed(2)}</div>
                              <div>Tax: ${order.tax.toFixed(2)}</div>
                              <div>Shipping: ${order.shipping.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                Total: ${order.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {order.trackingNumber && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Tracking Number:</strong> {order.trackingNumber}
                            </p>
                          </div>
                        )}

                        {order.estimatedDelivery && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Estimated Delivery:</strong> {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Wishlist</h2>
                <div className="text-center py-12">
                  <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Your wishlist is empty</p>
                  <Link href="/shop" className="btn-primary inline-block">
                    Browse Products
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Email notifications for orders', id: 'order-email' },
                        { label: 'Email notifications for promotions', id: 'promo-email' },
                        { label: 'SMS notifications for delivery', id: 'sms-delivery' },
                      ].map(({ label, id }) => (
                        <label key={id} className="flex items-center">
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                          <span className="ml-3 text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                    <button className="px-6 py-2 border-2 border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
