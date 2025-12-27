'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Users, Package, ShoppingCart, LogOut, Settings, Plus } from 'lucide-react';

interface AdminData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}
// for the example using static data
const dashboardStats = [
  { label: 'Total Orders', value: '1,234', change: '+12%', icon: ShoppingCart },
  { label: 'Total Users', value: '8,567', change: '+8%', icon: Users },
  { label: 'Total Products', value: '456', change: '+23%', icon: Package },
  { label: 'Revenue', value: '$45,234', change: '+18%', icon: BarChart3 },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: '$299.99', status: 'Completed', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: '$149.99', status: 'Pending', date: '2024-01-14' },
  { id: 'ORD-003', customer: 'Bob Johnson', amount: '$599.99', status: 'Processing', date: '2024-01-14' },
  { id: 'ORD-004', customer: 'Alice Brown', amount: '$89.99', status: 'Completed', date: '2024-01-13' },
];

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is authenticated
    const token = localStorage.getItem('admin-token');
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      window.location.href = '/admin/login';
      return;
    }
    
    try {
      setAdmin(JSON.parse(adminData));
    } catch {
      localStorage.removeItem('admin-token');
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
    }

    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin');
    window.location.href = '/admin/login';
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!admin) {
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
              Welcome, {admin.firstName} {admin.lastName}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {dashboardStats.map(({ label, value, change, icon: Icon }) => (
            <div
              key={label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon size={24} className="text-primary" />
                </div>
                <span className="text-sm font-semibold text-green-600">{change}</span>
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
                    {recentOrders.map((order) => (
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
                    ))}
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
