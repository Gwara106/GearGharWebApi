'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { User, ArrowLeft, Edit, Mail, Calendar, Shield, Activity } from 'lucide-react';

interface UserDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  image?: string;
  profilePicture?: string;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated() || user?.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }

    if (isAuthenticated() && user?.role === 'admin' && token) {
      fetchUser();
    }
  }, [isAuthenticated, isLoading, user, token, router, params.id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUserData(data.user);
      setError('');
    } catch (err) {
      setError('Failed to fetch user details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Users</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              </div>
              {userData && (
                <button
                  onClick={() => router.push(`/admin/users/${userData._id}/edit`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  <Edit size={20} />
                  <span>Edit User</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* User Details */}
          {userData && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* User Profile Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-8">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary font-bold text-3xl">
                    {userData.image || userData.profilePicture ? (
                      <img 
                        src={userData.image || userData.profilePicture} 
                        alt={`${userData.firstName} ${userData.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      `${userData.firstName[0]}${userData.lastName[0]}`
                    )}
                  </div>
                  <div className="text-white">
                    <h2 className="text-3xl font-bold">
                      {userData.firstName} {userData.lastName}
                    </h2>
                    <p className="text-white/80 flex items-center mt-2">
                      <Mail size={16} className="mr-2" />
                      {userData.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User size={20} className="mr-2 text-primary" />
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span className="font-mono text-sm text-gray-900">{userData._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-medium text-gray-900">
                          {userData.firstName} {userData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{userData.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield size={20} className="mr-2 text-primary" />
                      Account Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userData.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {userData.role === 'admin' && <Shield size={12} className="mr-1" />}
                          {userData.role}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          userData.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userData.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity size={20} className="mr-2 text-primary" />
                      Activity Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                        <span className="font-medium text-gray-900">
                          {userData.lastLogin 
                            ? new Date(userData.lastLogin).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/admin/users/${userData._id}/edit`)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                      >
                        <Edit size={20} />
                        <span>Edit User</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
