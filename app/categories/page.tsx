import Link from 'next/link';
import CategoryCard from '@/components/CategoryCard';

const categories = [
  {
    id: 1,
    name: 'Helmets',
    icon: '🪖',
    description: 'Premium protective helmets with advanced safety features',
    count: 45,
  },
  {
    id: 2,
    name: 'Handlebars',
    icon: '🏍️',
    description: 'Quality handlebars and handle controls',
    count: 32,
  },
  {
    id: 3,
    name: 'Gloves',
    icon: '🧤',
    description: 'Protective and comfortable riding gloves',
    count: 28,
  },
  {
    id: 4,
    name: 'Tyres',
    icon: '🛞',
    description: 'Premium motorcycle tyres for all conditions',
    count: 56,
  },
  {
    id: 5,
    name: 'Exhaust Systems',
    icon: '💨',
    description: 'Performance exhaust systems and silencers',
    count: 24,
  },
  {
    id: 6,
    name: 'Accessories',
    icon: '🔧',
    description: 'Various motorcycle accessories and parts',
    count: 78,
  },
  {
    id: 7,
    name: 'Mirrors',
    icon: '🔍',
    description: 'Replacement mirrors and reflective parts',
    count: 18,
  },
  {
    id: 8,
    name: 'Lights',
    icon: '💡',
    description: 'LED lights and lighting systems',
    count: 42,
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Browse Categories
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore our complete range of motorcycle parts and accessories organized by category
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-20 bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Not sure what you're looking for?
            </h2>
            <p className="text-gray-600 mb-8">
              Our customer service team is here to help you find exactly what you need for your motorcycle.
              Feel free to reach out with any questions!
            </p>
            <Link
              href="/contact"
              className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition inline-block"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
