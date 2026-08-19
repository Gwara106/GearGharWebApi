'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { Mail, Save, Lock, Edit, Camera } from 'lucide-react';
import { resolveProfileImageUrl } from '@/app/profile/page';

export default function UserProfilePage() {
  const { user, isAuthenticated, isLoading, token, updateUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Shared with app/profile/page.tsx so both pages resolve identically. This
  // page previously preferred `image` over `profilePicture` while the other
  // preferred `profilePicture` over `image`, so the two views of the same user
  // could show different pictures.
  const profileImageUrl = resolveProfileImageUrl(
    user?.profilePicture,
    user?.image,
    user?.updatedAt ? String(user.updatedAt) : undefined
  );

  useEffect(() => {
    if (user) {
      setImagePreview(profileImageUrl);
      // Set form data from auth context user
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  // Keep the preview in step with the user record, unless a local file is
  // staged (in which case the preview is a data: URL we must not overwrite).
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(profileImageUrl);
    }
  }, [profileImageUrl, imageFile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    // Profile fetching disabled to prevent infinite loops
    // We'll rely on auth context data and upload responses
  }, [isAuthenticated, isLoading, router]);

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setImagePreview(profileImageUrl);
      setImageFile(null);
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate passwords if trying to change password
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to change password');
        setSaving(false);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        setSaving(false);
        return;
      }

      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        setSaving(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      
      if (formData.currentPassword && formData.newPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
        formDataToSend.append('newPassword', formData.newPassword);
      }
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(`/api/auth/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setSuccess('Profile updated successfully!');
      
      // The preview effect picks the new picture up from the refreshed user.
      setImageFile(null);
      
      // Update auth context with new user data
      if (updateUser) {
        updateUser(data.user);
      }

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setImageFile(null);
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setImagePreview(profileImageUrl);
      setImageFile(null);
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (isLoading || loading) {
    console.log('Still loading...');
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
              <div className="flex items-center space-x-3">
                <User className="text-primary" size={32} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                  <p className="text-gray-600">Manage your personal information and security</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  <Edit size={20} />
                  <span>Edit Profile</span>
                </button>
              )}
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

          {/* Profile Form */}
          {user && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-8">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div 
                      className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary font-bold text-3xl overflow-hidden cursor-pointer hover:opacity-90 transition"
                      onClick={() => {
                        if (!isEditing) {
                          setIsEditing(true);
                        }
                        setTimeout(() => {
                          document.getElementById('profile-image-input')?.click();
                        }, 100);
                      }}
                    >
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        `${user.firstName[0]}${user.lastName[0]}`
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isEditing) {
                          setIsEditing(true);
                        }
                        setTimeout(() => {
                          document.getElementById('profile-image-input')?.click();
                        }, 100);
                      }}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition shadow-lg"
                      title="Change profile picture"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className="text-white">
                    <h2 className="text-3xl font-bold">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-white/80 flex items-center mt-2">
                      <Mail size={16} className="mr-2" />
                      {user.email}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3">
                      <p className="text-white/70 text-sm">
                        💡 Click on your profile picture or the camera icon to change it
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                      }}
                      className="mt-4 flex items-center space-x-2 px-6 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-semibold"
                    >
                      <Edit size={20} />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Profile Image */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-xl">
                            {formData.firstName[0]}{formData.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="profile-image-input"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        {isEditing && (
                          <>
                            <button
                              type="button"
                              onClick={() => document.getElementById('profile-image-input')?.click()}
                              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition mb-2"
                            >
                              <Camera size={20} />
                              <span>Change Photo</span>
                            </button>
                            <p className="text-sm text-gray-500">
                              JPG, PNG, GIF up to 5MB
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Change */}
                  {isEditing && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Lock size={20} className="mr-2 text-primary" />
                        Change Password
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter new password"
                            minLength={6}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Confirm new password"
                            minLength={6}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Leave password fields empty if you don't want to change your password
                      </p>
                    </div>
                  )}

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Since
                        </label>
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                      >
                        <Save size={20} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
}
