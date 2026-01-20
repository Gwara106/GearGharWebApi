'use client';

import Link from 'next/link';
import { BarChart3, Users, Package, ShoppingCart, LogOut, Settings, Plus } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
  userGrowthPercentage: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  productGrowthPercentage: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  completedOrders: number;
  orderGrowthPercentage: number;
  totalRevenue: number;
  revenueGrowthPercentage: number;
  recentOrders: any[];
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  if (isLoading || dataLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated() || !user || user.role !== 'admin') {
    window.location.href = '/admin/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">⚙️</span>
            </div>
            <span className="text-lg font-bold text-gray-900">GearGhar Admin</span>
          </Link>


          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {user.firstName} {user.lastName}
            </span>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Manage your store, products, orders, and customers
          </p>
        </div>

        {/* Stats Grid */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {dashboardData && [
            { label: 'Total Orders', value: dashboardData.totalOrders.toLocaleString(), change: `+${dashboardData.orderGrowthPercentage}%`, icon: ShoppingCart },
            { label: 'Total Users', value: dashboardData.totalUsers.toLocaleString(), change: `+${dashboardData.userGrowthPercentage}%`, icon: Users },
            { label: 'Total Products', value: dashboardData.totalProducts.toLocaleString(), change: `+${dashboardData.productGrowthPercentage}%`, icon: Package },
            { label: 'Revenue', value: `$${dashboardData.totalRevenue.toLocaleString()}`, change: `+${dashboardData.revenueGrowthPercentage}%`, icon: BarChart3 },
          ].map(({ label, value, change, icon: Icon }) => (
            <div
              key={label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon size={24} className="text-primary" />
                </div>
                <span className={`text-sm font-semibold ${
                  parseInt(change) > 0 ? 'text-green-600' : 
                  parseInt(change) < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>{change}</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">{label}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/products/new"
                  className="flex items-center space-x-3 px-4 py-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-semibold"
                >
                  <Plus size={20} />
                  <span>Add New Product</span>
                </Link>
                <Link
                  href="/admin/orders"
                  className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  <ShoppingCart size={20} />
                  <span>View Orders</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  <Users size={20} />
                  <span>Manage Users</span>
                </Link>
                <Link
                  href="/admin/products"
                  className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  <Package size={20} />
                  <span>Manage Products</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <Link href="/admin/orders" className="text-primary hover:underline text-sm font-semibold">
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 ? (
                      dashboardData.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-4 px-4 font-semibold text-primary">{order.id}</td>
                          <td className="py-4 px-4 text-gray-700">{order.customer}</td>
                          <td className="py-4 px-4 font-semibold text-gray-900">{order.amount}</td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'Completed'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">{order.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No orders found. Orders will appear here once they are created.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">Admin Features Available</h3>
          <p className="text-blue-800 text-sm">
            This admin dashboard provides access to manage products, orders, users, and view sales analytics.
            Additional admin routes can be added in the /admin folder.
          </p>
        </div>
      </div>
    </div>
  );
}
