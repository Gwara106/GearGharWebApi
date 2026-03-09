'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Minus, Plus, Truck, Shield, RefreshCw, Heart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  originalPriceUSD?: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  images: string[];
  status: string;
  tags: string[];
  reviews?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProductPage() {
  const params = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  useEffect(() => {
    if (product && (!product.images || product.images.length === 0)) {
      setSelectedImage(0);
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }
      
      const data = await response.json();
      console.log('Product data from API:', data);
      console.log('Product images:', data.images);
      console.log('Selected image index:', selectedImage);
      console.log('Image path for selected image:', data.images?.[selectedImage]);
      console.log('Processed image src:', getImageSrc(data.images?.[selectedImage] || ''));
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
    
    // Use cart context to add item
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '/placeholder.svg',
      quantity: quantity
    });
    
    console.log('Added to cart:', product.name, 'Quantity:', quantity);
  };

  const getImageSrc = (imagePath: string) => {
    if (!imagePath) return '/placeholder.svg';
    // If path already starts with /, return as is
    if (imagePath.startsWith('/')) return imagePath;
    // Otherwise, prefix with /products/
    return `/products/${imagePath}`;
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement actual wishlist functionality
    console.log('Toggled favorite for:', product?.name);
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <Link href="/shop" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <Link href="/shop" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href="/shop" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          ← Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
              <Image
                src={getImageSrc(product.images?.[selectedImage] || '')}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
            </div>
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-w-1 aspect-h-1 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={getImageSrc(image)}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-lg text-gray-600 mt-2">{product.brand}</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-gray-300" />
                <span className="ml-2 text-sm text-gray-600">(4.0)</span>
              </div>
              <span className="text-gray-500">|</span>
              <span className="text-sm text-gray-600">{product.reviews || 0} Reviews</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">Rs. {product.price}</span>
                {product.originalPriceUSD && (
                  <span className="text-lg text-gray-500 line-through">
                    Rs. {Math.round(product.originalPriceUSD * 83)}
                  </span>
                )}
              </div>
              <p className="text-sm text-green-600 font-medium">
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="text-gray-900 font-medium">{product.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">SKU</span>
                  <p className="text-gray-900 font-medium">{product.sku}</p>
                </div>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decrementQuantity}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-center font-medium">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                    disabled={!product || quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {product.stock} items available
                </span>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product || product.stock === 0}
                  className={`flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-md font-medium text-white ${
                    addedToCart
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                </button>
                <button
                  onClick={toggleFavorite}
                  className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavorite ? 'text-red-600 fill-current' : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Free Shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">2 Year Warranty</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">30 Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
