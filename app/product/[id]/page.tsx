'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Minus, 
  Plus, 
  Truck, 
  Shield, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  ThumbsUp,
  User
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/lib/cart-context';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  images: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}`);
      
      if (!response.ok) {
        // If API fails, use mock data
        const mockProduct = getMockProduct(id as string);
        if (mockProduct) {
          setProduct(mockProduct);
          fetchRelatedProducts(mockProduct.category, mockProduct._id);
          setError('');
          setLoading(false);
          return;
        }
        throw new Error('Product not found');
      }
      
      const data = await response.json();
      setProduct(data.product);
      fetchRelatedProducts(data.product.category, data.product._id);
    } catch (err) {
      // Try mock data as fallback
      const mockProduct = getMockProduct(id as string);
      if (mockProduct) {
        setProduct(mockProduct);
        fetchRelatedProducts(mockProduct.category, mockProduct._id);
        setError('');
      } else {
        setError('Product not found');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data function
  const getMockProduct = (productId: string) => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Premium Safety Helmet - HD Vision',
        description: 'Advanced safety helmet with HD vision technology, superior impact protection, and comfortable fit for long rides. Features anti-fog visor, quick-release buckle, and aerodynamic design.',
        price: 299.99,
        category: 'helmets',
        brand: 'SafeRide',
        sku: 'HELM-001',
        stock: 15,
        images: ['/products/helmet-1.png', '/products/helmet-2.png'],
        status: 'active' as const,
        tags: ['safety', 'helmet', 'vision'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'Sport Performance Gloves',
        description: 'Professional racing gloves with enhanced grip, knuckle protection, and breathable fabric. Perfect for both street and track riding with touchscreen-compatible fingertips.',
        price: 89.99,
        category: 'gloves',
        brand: 'GripPro',
        sku: 'GLOV-002',
        stock: 8,
        images: ['/products/gloves.jpg', '/products/gloves-2.jpg'],
        status: 'active' as const,
        tags: ['gloves', 'racing', 'protection'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        name: 'High-Grip Handlebar Grips Set',
        description: 'Ergonomic handlebar grips with vibration dampening and all-weather grip. Includes throttle assist and easy installation hardware.',
        price: 59.99,
        category: 'handlebars',
        brand: 'ComfortRide',
        sku: 'GRIP-003',
        stock: 25,
        images: ['/products/450handlebar.png', '/products/handlebar-2.png'],
        status: 'active' as const,
        tags: ['handlebars', 'grips', 'comfort'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '4',
        name: 'Premium Racing Tyres (Front)',
        description: 'High-performance racing tires with superior grip and durability. Designed for both wet and dry conditions with advanced compound technology.',
        price: 199.99,
        category: 'tyres',
        brand: 'SpeedGrip',
        sku: 'TYRE-004',
        stock: 12,
        images: ['/products/harleyDavidsontyres.jpg', '/products/tyre-2.jpg'],
        status: 'active' as const,
        tags: ['tyres', 'racing', 'performance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '5',
        name: 'Carbon Fiber Exhaust System',
        description: 'Lightweight carbon fiber exhaust with enhanced sound and performance. Features removable baffle for street/track tuning.',
        price: 599.99,
        category: 'exhaust',
        brand: 'PowerFlow',
        sku: 'EXH-005',
        stock: 5,
        images: ['/products/exhaust1.png', '/products/exhaust2.png'],
        status: 'active' as const,
        tags: ['exhaust', 'carbon', 'performance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    return mockProducts.find(p => p._id === productId);
  };

  const fetchRelatedProducts = async (category: string, currentProductId: string) => {
    try {
      const response = await fetch(`/api/products?category=${category}&limit=4`);
      if (response.ok) {
        const data = await response.json();
        setRelatedProducts(data.products.filter((p: Product) => p._id !== currentProductId));
      }
    } catch (err) {
      // Use mock related products as fallback
      const mockRelatedProducts = getMockRelatedProducts(category, currentProductId);
      setRelatedProducts(mockRelatedProducts);
      console.error('Failed to fetch related products, using mock data:', err);
    }
  };

  const getMockRelatedProducts = (category: string, currentProductId: string) => {
    const allMockProducts = [
      {
        _id: '1',
        name: 'Premium Safety Helmet - HD Vision',
        description: 'Advanced safety helmet with HD vision technology.',
        price: 299.99,
        category: 'helmets',
        brand: 'SafeRide',
        sku: 'HELM-001',
        stock: 15,
        images: ['/products/helmet-1.png', '/products/helmet-2.png'],
        status: 'active' as const,
        tags: ['safety', 'helmet', 'vision'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'Sport Performance Gloves',
        description: 'Professional racing gloves with enhanced grip.',
        price: 89.99,
        category: 'gloves',
        brand: 'GripPro',
        sku: 'GLOV-002',
        stock: 8,
        images: ['/products/gloves.jpg', '/products/gloves-2.jpg'],
        status: 'active' as const,
        tags: ['gloves', 'racing', 'protection'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        name: 'High-Grip Handlebar Grips Set',
        description: 'Ergonomic handlebar grips with vibration dampening.',
        price: 59.99,
        category: 'handlebars',
        brand: 'ComfortRide',
        sku: 'GRIP-003',
        stock: 25,
        images: ['/products/450handlebar.png', '/products/handlebar-2.png'],
        status: 'active' as const,
        tags: ['handlebars', 'grips', 'comfort'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '4',
        name: 'Premium Racing Tyres (Front)',
        description: 'High-performance racing tires with superior grip.',
        price: 199.99,
        category: 'tyres',
        brand: 'SpeedGrip',
        sku: 'TYRE-004',
        stock: 12,
        images: ['/products/harleyDavidsontyres.jpg', '/products/tyre-2.jpg'],
        status: 'active' as const,
        tags: ['tyres', 'racing', 'performance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '5',
        name: 'Carbon Fiber Exhaust System',
        description: 'Lightweight carbon fiber exhaust with enhanced sound.',
        price: 599.99,
        category: 'exhaust',
        brand: 'PowerFlow',
        sku: 'EXH-005',
        stock: 5,
        images: ['/products/exhaust1.png', '/products/exhaust2.png'],
        status: 'active' as const,
        tags: ['exhaust', 'carbon', 'performance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    return allMockProducts
      .filter(p => p.category === category && p._id !== currentProductId)
      .slice(0, 4);
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (err) {
      // Use mock reviews as fallback
      const mockReviewsData = getMockReviews(id as string);
      setReviews(mockReviewsData);
      console.error('Failed to fetch reviews, using mock data:', err);
    }
  };

  const getMockReviews = (productId: string) => {
    const mockReviewsData = [
      {
        _id: '1',
        productId: '1',
        userId: 'user1',
        userName: 'John Doe',
        rating: 5,
        title: 'Best helmet I\'ve ever owned!',
        content: 'The HD vision is incredible and the fit is perfect. Worth every penny.',
        helpful: 12,
        verified: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '2',
        productId: '1',
        userId: 'user2',
        userName: 'Sarah Smith',
        rating: 4,
        title: 'Great helmet, minor issues',
        content: 'Very comfortable and safe, but the visor fogs up a bit in rain. Overall excellent.',
        helpful: 8,
        verified: true,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        _id: '3',
        productId: '2',
        userId: 'user3',
        userName: 'Mike Johnson',
        rating: 5,
        title: 'Perfect for racing',
        content: 'These gloves saved my hands in a fall. Excellent protection and great feel.',
        helpful: 15,
        verified: true,
        createdAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        _id: '4',
        productId: '3',
        userId: 'user4',
        userName: 'Emily Davis',
        rating: 4,
        title: 'Good grips, great price',
        content: 'Installation was easy and they feel much better than stock grips. Would recommend.',
        helpful: 6,
        verified: true,
        createdAt: new Date(Date.now() - 345600000).toISOString()
      }
    ];
    
    return mockReviewsData.filter(r => r.productId === productId);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0] || '/placeholder.svg',
        quantity
      });
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 3000);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewForm)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setReviewForm({ rating: 5, title: '', content: '' });
      setShowReviewForm(false);
      fetchReviews();
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHelpfulReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed to mark review as helpful:', err);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href={`/?category=${product.category}`} className="hover:text-primary capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-4xl">📦</span>
                </div>
              )}
              {product.status === 'out_of_stock' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">Out of Stock</span>
                </div>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-600 capitalize">{product.category}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.stock <= 5 && product.stock > 0 && (
                <span className="text-sm text-orange-600 font-medium">
                  Only {product.stock} left in stock!
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
              <div>
                <span className="text-sm text-gray-600">Brand</span>
                <p className="font-medium">{product.brand}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">SKU</span>
                <p className="font-medium">{product.sku}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Availability</span>
                <p className="font-medium">
                  {product.status === 'active' && product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Category</span>
                <p className="font-medium capitalize">{product.category}</p>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-0 focus:ring-0"
                    min="1"
                    max={product.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-gray-100 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.status !== 'active' || product.stock === 0}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold transition ${
                    isAddedToCart
                      ? 'bg-green-500 text-white'
                      : product.status === 'active' && product.stock > 0
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={20} />
                  <span>{isAddedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
                </button>
                
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Heart 
                    size={20} 
                    className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                </button>
                
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Share2 size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Truck size={20} className="text-primary" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield size={20} className="text-primary" />
                <span>1-year warranty included</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <RotateCcw size={20} className="text-primary" />
                <span>30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Please log in to write a review</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                  >
                    Log In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating })}
                          className="p-1"
                        >
                          <Star
                            size={24}
                            className={rating <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                    <textarea
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.userName}</span>
                          {review.verified && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              <Check size={12} className="mr-1" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                  <p className="text-gray-600 mb-4">{review.content}</p>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleHelpfulReview(review._id)}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary transition"
                    >
                      <ThumbsUp size={16} />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  href={`/product/${relatedProduct._id}`}
                  className="group block bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {relatedProduct.images[0] ? (
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-110 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-primary">
                      ${relatedProduct.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
