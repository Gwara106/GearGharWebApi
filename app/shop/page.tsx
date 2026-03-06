'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { Filter, X } from 'lucide-react';

const categories = [
  'All Products',
  'Helmets',
  'Handlebars',
  'Gloves',
  'Tyres',
  'Exhaust System',
  'Accessories',
  'Clothing',
];

const priceRanges = [
  { label: 'Under Rs. 5000', value: [0, 5000] },
  { label: 'Rs. 5000 - Rs. 10000', value: [5000, 10000] },
  { label: 'Rs. 10000 - Rs. 20000', value: [10000, 20000] },
  { label: 'Rs. 20000 - Rs. 50000', value: [20000, 50000] },
  { label: 'Over Rs. 50000', value: [50000, 100000] },
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const products = await response.json();
        // Transform database products to match frontend format
        const transformedProducts = products.map((product: any) => ({
          id: product._id,
          name: product.name,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPriceUSD ? product.originalPriceUSD * 83 : null, // Convert back for display
          image: product.images?.[0] || product.imageUrl?.replace('assets/Product_Image/', '/products/') || '/products/placeholder.png',
          rating: 4.5 + Math.random() * 0.5, // Random rating for demo
          reviews: Math.floor(Math.random() * 200) + 50, // Random reviews for demo
          inStock: Boolean(product.status === 'active' && product.stock > 0),
        }));
        setAllProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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
                            selectedPriceRange != null &&
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
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
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
