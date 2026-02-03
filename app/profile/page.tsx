'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Mail, Calendar, Shield, LogOut, ShoppingBag, Settings, Camera, Edit } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, isLoading, updateUser } = useAuth();
  const router = useRouter();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Profile fetching disabled to prevent infinite loops
  // We'll rely on auth context data and upload responses
  useEffect(() => {
    // No profile fetching - use auth context data only
  }, []);

  // Set initial image preview when user data loads
  useEffect(() => {
    if (user) {
      const imageUrl = user.image || user.profilePicture;
      if (imageUrl) {
        if (imageUrl.startsWith('http')) {
          setImagePreview(imageUrl);
        } else if (imageUrl.startsWith('/uploads/')) {
          // Add cache busting timestamp to force image refresh
          const timestamp = Date.now();
          setImagePreview(`${imageUrl}?t=${timestamp}`);
        } else if (imageUrl.includes('profiles/')) {
          // Handle old Flutter app paths - convert to users path
          const timestamp = Date.now();
          setImagePreview(`${imageUrl.replace('profiles/', 'users/')}?t=${timestamp}`);
        } else {
          const timestamp = Date.now();
          setImagePreview(`/uploads/users/${imageUrl}?t=${timestamp}`);
        }
      }
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !user) return;

    try {
      setSaving(true);
      setError('');

      const formData = new FormData();
      formData.append('image', imageFile);

      // Get token from cookies instead of localStorage
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const token = getCookie('auth_token');

      const response = await fetch(`/api/auth/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      console.log('New image URL from response:', data.user.image || data.user.profilePicture);
      
      // Update user data
      if (updateUser) {
        updateUser(data.user);
        console.log('Updated user data in auth context');
      }

      // Update image preview with new profile picture
      const newImageUrl = data.user.image || data.user.profilePicture;
      if (newImageUrl) {
        if (newImageUrl.startsWith('http')) {
          setImagePreview(newImageUrl);
          console.log('Set imagePreview to HTTP URL:', newImageUrl);
        } else if (newImageUrl.startsWith('/uploads/')) {
          // Add cache busting timestamp to force image refresh
          const timestamp = Date.now();
          const cacheBustedUrl = `${newImageUrl}?t=${timestamp}`;
          setImagePreview(cacheBustedUrl);
          console.log('Set imagePreview to cache-busted URL:', cacheBustedUrl);
        } else if (newImageUrl.includes('profiles/')) {
          // Handle old Flutter app paths - convert to users path
          const timestamp = Date.now();
          const cacheBustedUrl = `${newImageUrl.replace('profiles/', 'users/')}?t=${timestamp}`;
          setImagePreview(cacheBustedUrl);
          console.log('Set imagePreview to converted URL:', cacheBustedUrl);
        } else {
          const timestamp = Date.now();
          const cacheBustedUrl = `/uploads/users/${newImageUrl}?t=${timestamp}`;
          setImagePreview(cacheBustedUrl);
          console.log('Set imagePreview to constructed URL:', cacheBustedUrl);
        }
      } else {
        console.log('No new image URL found in response');
      }

      setSuccess('Profile picture updated successfully!');
      setImageFile(null);
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  };

  const getProfileImageUrl = () => {
    if (imagePreview) return imagePreview;
    const imageUrl = user?.image || user?.profilePicture;
    if (!imageUrl) return '';
    
    // Handle different path formats
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Full URL
    } else if (imageUrl.startsWith('/uploads/')) {
      // Add cache busting timestamp
      const timestamp = Date.now();
      return `${imageUrl}?t=${timestamp}`;
    } else if (imageUrl.includes('profiles/')) {
      // Handle old Flutter app paths - convert to users path
      const timestamp = Date.now();
      return `${imageUrl.replace('profiles/', 'users/')}?t=${timestamp}`;
    } else {
      // Assume it's a filename
      const timestamp = Date.now();
      return `/uploads/users/${imageUrl}?t=${timestamp}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center">
                  {/* Profile Picture with Camera Icon */}
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={40} className="text-white" />
                      )}
                    </div>
                    {/* Camera Icon */}
                    <button
                      onClick={() => {
                        if (!isEditing) setIsEditing(true);
                        setTimeout(() => {
                          document.getElementById('profile-image-input')?.click();
                        }, 100);
                      }}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition shadow-lg"
                      title="Change profile picture"
                    >
                      <Camera size={12} />
                    </button>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <Shield size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary capitalize">
                      {user.role}
                    </span>
                  </div>
                  
                  {/* Edit Profile Button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                  >
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Details Cards */}
            <div className="md:col-span-2 space-y-6">
              {/* Profile Picture Upload Section */}
              {isEditing && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                  <div className="space-y-4">
                    <input
                      type="file"
                      id="profile-image-input"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={32} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => document.getElementById('profile-image-input')?.click()}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition mb-2"
                        >
                          <Camera size={20} />
                          <span>Choose Photo</span>
                        </button>
                        <p className="text-sm text-gray-500">
                          JPG, PNG, GIF up to 5MB
                        </p>
                      </div>
                    </div>

                    {imageFile && (
                      <div className="flex items-center space-x-4 pt-4 border-t">
                        <button
                          onClick={handleImageUpload}
                          disabled={saving}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                        >
                          {saving ? 'Uploading...' : 'Upload Photo'}
                        </button>
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(getProfileImageUrl());
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <ShoppingBag size={20} className="text-primary" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Settings size={20} className="text-primary" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </div>
              </div>

              {/* Admin Section */}
              {user.role === 'admin' && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Admin Access</h3>
                  <p className="text-gray-700 mb-4">
                    You have administrator privileges. Access the admin dashboard to manage users, products, and system settings.
                  </p>
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                  >
                    <Shield size={20} />
                    <span>Admin Dashboard</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
