'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';
import { useState, useEffect } from 'react';

const categories = [
  {
    id: 1,
    name: 'Helmets',
    icon: '🪖',
    description: 'Protective helmets for safety',
    count: 45,
  },
  {
    id: 2,
    name: 'Handlebars',
    icon: '🏍️',
    description: 'Quality handlebars & controls',
    count: 32,
  },
  {
    id: 3,
    name: 'Gloves',
    icon: '🧤',
    description: 'Protective riding gloves',
    count: 28,
  },
  {
    id: 4,
    name: 'Tyres',
    icon: '🛞',
    description: 'Premium motorcycle tyres',
    count: 56,
  },
  {
    id: 5,
    name: 'Exhaust Systems',
    icon: '💨',
    description: 'Performance exhausts',
    count: 24,
  },
  {
    id: 6,
    name: 'Accessories',
    icon: '🔧',
    description: 'Various bike accessories',
    count: 78,
  },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=4');
      if (response.ok) {
        const products = await response.json();
        // Transform database products to match frontend format
        const transformedProducts = products.map((product: any) => ({
          id: product._id,
          name: product.name,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPriceUSD ? product.originalPriceUSD * 83 : null,
          image: product.images?.[0] || product.imageUrl?.replace('assets/Product_Image/', '/products/') || '/products/placeholder.png',
          rating: 4.5 + Math.random() * 0.5, // Random rating for demo
          reviews: Math.floor(Math.random() * 200) + 50, // Random reviews for demo
          inStock: Boolean(product.status === 'active' && product.stock > 0),
        }));
        setFeaturedProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 md:py-32">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Premium Motorcycle <span className="text-primary">Parts & Gear</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg">
              Discover the finest motorcycle accessories and parts. From helmets to exhausts, we have everything riders need for safety and performance.
            </p>
            <div className="flex gap-4">
              <Link
                href="/shop"
                className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition inline-flex items-center gap-2"
              >
                Shop Now <ChevronRight size={20} />
              </Link>
              <Link
                href="/about"
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-9xl animate-bounce">🏍️</div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Shop by Category
              </h2>
              <p className="text-gray-600">
                Find exactly what you need for your motorcycle
              </p>
            </div>
            <Link href="/categories" className="hidden md:inline-flex text-primary hover:text-primary/80 font-semibold items-center gap-2">
              View All <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Products
              </h2>
              <p className="text-gray-600">
                Top-rated items our customers love
              </p>
            </div>
            <Link href="/shop" className="hidden md:inline-flex text-primary hover:text-primary/80 font-semibold items-center gap-2">
              View All <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              ))
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold mb-2">Fast Shipping</h3>
              <p className="text-gray-400">
                Free shipping on orders over $100. Express shipping available.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">Authentic Products</h3>
              <p className="text-gray-400">
                100% authentic motorcycle parts from trusted manufacturers.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-2">Secure Shopping</h3>
              <p className="text-gray-400">
                Safe checkout with SSL encryption and buyer protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Rider Community
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Get exclusive deals, early access to new products, and expert rider tips. Sign up for our newsletter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-3 rounded-lg text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
