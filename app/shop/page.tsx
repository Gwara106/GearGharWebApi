'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { Filter, X } from 'lucide-react';

const categories = [
  'All Products',
  'Helmets',
  'Handlebars',
  'Gloves',
  'Tyres',
  'Exhaust Systems',
  'Accessories',
];

const priceRanges = [
  { label: 'Under $50', value: [0, 50] },
  { label: '$50 - $100', value: [50, 100] },
  { label: '$100 - $200', value: [100, 200] },
  { label: '$200 - $500', value: [200, 500] },
  { label: 'Over $500', value: [500, 10000] },
];

const allProducts = [
  {
    id: 1,
    name: 'Premium Safety Helmet - HD Vision',
    category: 'Helmets',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop',
    rating: 4.8,
    reviews: 124,
    inStock: true,
  },
  {
    id: 2,
    name: 'Sport Performance Gloves',
    category: 'Gloves',
    price: 89.99,
    originalPrice: 129.99,
    image: 'https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop',
    rating: 4.6,
    reviews: 87,
    inStock: true,
  },
  {
    id: 3,
    name: 'High-Grip Handlebar Grips Set',
    category: 'Handlebars',
    price: 59.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1606405162335-5e8e9d8f8f3d?w=400&h=400&fit=crop',
    rating: 4.7,
    reviews: 156,
    inStock: true,
  },
  {
    id: 4,
    name: 'Premium Racing Tyres (Front)',
    category: 'Tyres',
    price: 199.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1559056169-641ef2a8ec3f?w=400&h=400&fit=crop',
    rating: 4.5,
    reviews: 203,
    inStock: true,
  },
  {
    id: 5,
    name: 'Carbon Fiber Exhaust System',
    category: 'Exhaust Systems',
    price: 599.99,
    originalPrice: 799.99,
    image: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 89,
    inStock: true,
  },
  {
    id: 6,
    name: 'Professional Riding Suit',
    category: 'Accessories',
    price: 349.99,
    originalPrice: 499.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    rating: 4.7,
    reviews: 92,
    inStock: true,
  },
  {
    id: 7,
    name: 'Full-Face Safety Helmet Pro',
    category: 'Helmets',
    price: 399.99,
    originalPrice: 549.99,
    image: 'https://images.unsplash.com/photo-1570995676569-90f6b56a29c4?w=400&h=400&fit=crop',
    rating: 4.8,
    reviews: 156,
    inStock: true,
  },
  {
    id: 8,
    name: 'Leather Riding Gloves Premium',
    category: 'Gloves',
    price: 129.99,
    originalPrice: 179.99,
    image: 'https://images.unsplash.com/photo-1539077682343-0d85a6a6a9df?w=400&h=400&fit=crop',
    rating: 4.6,
    reviews: 73,
    inStock: false,
  },
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const filteredProducts = allProducts.filter((product) => {
    const categoryMatch =
      selectedCategory === 'All Products' ||
      product.category === selectedCategory;
    const priceMatch = !selectedPriceRange ||
      (product.price >= selectedPriceRange[0] &&
        product.price <= selectedPriceRange[1]);
    return categoryMatch && priceMatch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shop</h1>
          <p className="text-gray-600">
            Browse our complete collection of premium motorcycle parts and accessories
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div
            className={`fixed inset-0 z-40 bg-black/50 lg:static lg:bg-transparent lg:z-0 ${
              showFilters ? 'block' : 'hidden lg:block'
            }`}
            onClick={() => setShowFilters(false)}
          >
            <div
              className="fixed left-0 top-0 h-full w-80 bg-white overflow-y-auto lg:w-64 lg:relative lg:bg-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button for mobile */}
              <button
                onClick={() => setShowFilters(false)}
                className="absolute right-4 top-4 lg:hidden"
              >
                <X size={24} />
              </button>

              <div className="p-6 lg:p-0 pt-12 lg:pt-0">
                {/* Category Filter */}
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="ml-3 text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Price Range</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.label} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={
                            selectedPriceRange &&
                            selectedPriceRange[0] === range.value[0] &&
                            selectedPriceRange[1] === range.value[1]
                          }
                          onChange={() => setSelectedPriceRange(range.value as [number, number])}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="ml-3 text-gray-700">{range.label}</span>
                      </label>
                    ))}
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPriceRange === null}
                        onChange={() => setSelectedPriceRange(null)}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="ml-3 text-gray-700">All Prices</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg border border-gray-200">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 text-gray-700 font-semibold hover:text-primary transition"
              >
                <Filter size={20} />
                Filters
              </button>

              <div className="flex-1 ml-4 lg:ml-0">
                <p className="text-gray-600 text-sm">
                  Showing {sortedProducts.length} products
                </p>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Products Grid */}
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600 text-lg">No products found</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All Products');
                    setSelectedPriceRange(null);
                  }}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
