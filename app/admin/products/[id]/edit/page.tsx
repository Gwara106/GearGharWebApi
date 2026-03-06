'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  images?: string[];
  imageUrl?: string;
  stock: number;
  status: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [product, setProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    stock: '',
    status: 'active'
  });

  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  const categories = [
    'Accessories',
    'Electronics', 
    'Clothing',
    'Exhaust System',
    'Helmets',
    'Handlebars',
    'Gloves',
    'Tyres'
  ];

  useEffect(() => {
    if (!isLoading && (!isAuthenticated() || !user || user.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }

    if (isAuthenticated() && token) {
      fetchProduct();
    }
  }, [isLoading, isAuthenticated, user, router, token]);

  const fetchProduct = async () => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/admin/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
        setFormData({
          name: productData.name,
          category: productData.category,
          price: productData.price.toString(),
          description: productData.description,
          stock: productData.stock.toString(),
          status: productData.status
        });
        setImages(productData.images || (productData.imageUrl ? [productData.imageUrl.replace('assets/Product_Image/', '/products/')] : []));
      } else {
        setError('Product not found');
      }
    } catch (error) {
      setError('Failed to fetch product');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddImage = () => {
    if (imageInput.trim() && !images.includes(imageInput.trim())) {
      setImages([...images, imageInput.trim()]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { id } = await params;
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images
        })
      });

      if (response.ok) {
        setSuccess('Product updated successfully!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update product');
      }
    } catch (error) {
      setError('An error occurred while updating the product');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || fetchLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated() || !user || user.role !== 'admin') {
    return null;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/admin/products" className="text-primary hover:underline">
            Back to Products
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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">⚙️</span>
            </div>
            <span className="text-lg font-bold text-gray-900">GearGhar Admin</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/shop" className="text-gray-600 hover:text-gray-900">
              View Store
            </Link>
            <button
              onClick={() => router.push('/admin/login')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link
            href="/admin/products"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Product</h1>
            <p className="text-gray-600">Update product information</p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter product description"
              />
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Images</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="Enter image URL (e.g., /products/product-image.jpg)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/products/placeholder.png';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/products"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
