'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Download,
  Filter
} from 'lucide-react';

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  userGrowthRate: number;
  userRetentionRate: number;
  averageSessionDuration: number;
  usersByRole: {
    admin: number;
    user: number;
  };
  usersByStatus: {
    active: number;
    inactive: number;
  };
  userRegistrationTrend: {
    date: string;
    count: number;
  }[];
  userActivityByDay: {
    day: string;
    activeUsers: number;
    totalSessions: number;
  }[];
  topActiveUsers: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    lastLogin: string;
    loginCount: number;
  }[];
}

export default function UserAnalyticsPage() {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated() || user?.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }

    if (isAuthenticated() && user?.role === 'admin' && token) {
      fetchAnalytics();
    }
  }, [isAuthenticated, isLoading, user, token, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/analytics/users?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setError('');
    } catch (err) {
      setError('Failed to fetch user analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/users/export?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export analytics');
      console.error(err);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights into user behavior and engagement</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                <button
                  onClick={exportAnalytics}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  <Download size={20} />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users size={24} className="text-blue-600" />
                    </div>
                    <span className={`text-sm font-semibold ${
                      analytics.userGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.userGrowthRate > 0 ? '+' : ''}{analytics.userGrowthRate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{(analytics.totalUsers || 0).toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserCheck size={24} className="text-green-600" />
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{(analytics.activeUsers || 0).toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserPlus size={24} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-semibold text-purple-600">
                      +{analytics.newUsersThisMonth}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">New This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{(analytics.newUsersThisMonth || 0).toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Activity size={24} className="text-orange-600" />
                    </div>
                    <span className="text-sm font-semibold text-orange-600">
                      {Math.floor(analytics.averageSessionDuration / 60)}m
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Avg Session</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.averageSessionDuration}s</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* User Registration Trend */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp size={20} className="mr-2 text-primary" />
                    User Registration Trend
                  </h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 size={48} className="mx-auto mb-2" />
                      <p>Chart visualization would go here</p>
                      <p className="text-sm">Showing {analytics.userRegistrationTrend.length} data points</p>
                    </div>
                  </div>
                </div>

                {/* Users by Role */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart size={20} className="mr-2 text-primary" />
                    Users by Role
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Admin Users</span>
                        <span className="text-sm text-gray-600">{analytics.adminUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.adminUsers / analytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Regular Users</span>
                        <span className="text-sm text-gray-600">{analytics.regularUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.regularUsers / analytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Active Users */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users size={20} className="mr-2 text-primary" />
                  Most Active Users
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Login Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.topActiveUsers.map((activeUser) => (
                        <tr key={activeUser._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {activeUser.firstName[0]}{activeUser.lastName[0]}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {activeUser.firstName} {activeUser.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {activeUser.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(activeUser.lastLogin).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {activeUser.loginCount} logins
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
