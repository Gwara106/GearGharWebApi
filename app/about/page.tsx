import Link from 'next/link';
import { Check } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-4">About GearGhar</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your trusted source for premium motorcycle parts and accessories since 2020
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4 text-lg">
                GearGhar was founded in 2020 with a simple mission: to provide riders with access to
                premium motorcycle parts and accessories at competitive prices.
              </p>
              <p className="text-gray-600 mb-4 text-lg">
                We started as a small operation but have grown into one of the leading online retailers
                for motorcycle enthusiasts across the country.
              </p>
              <p className="text-gray-600 text-lg">
                Today, we're proud to serve thousands of satisfied customers who trust us for quality,
                authenticity, and exceptional service.
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🏍️</div>
              <p className="text-gray-700 text-lg font-semibold">
                Trusted by Riders Worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Why Choose GearGhar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Authentic Products',
                description:
                  'All our products are sourced directly from manufacturers to ensure 100% authenticity and quality.',
              },
              {
                title: 'Expert Support',
                description:
                  'Our team of motorcycle enthusiasts is ready to help you find the perfect parts for your ride.',
              },
              {
                title: 'Fast Shipping',
                description:
                  'Free shipping on orders over $100 with express options available for urgent needs.',
              },
              {
                title: 'Competitive Pricing',
                description:
                  'We offer the best prices in the market without compromising on quality or authenticity.',
              },
              {
                title: 'Easy Returns',
                description:
                  '30-day money-back guarantee. If you\'re not satisfied, we\'ll make it right.',
              },
              {
                title: 'Wide Selection',
                description:
                  'Browse thousands of products from helmets to exhausts, all in one place.',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Check size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'Happy Customers' },
              { number: '500+', label: 'Products Available' },
              { number: '4.8★', label: 'Average Rating' },
              { number: '24/7', label: 'Customer Support' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { name: 'Ronak Prajpati', role: 'Founder & CEO' },
              { name: 'Sarah Johnson', role: 'Product Manager' },
              { name: 'Mike Davis', role: 'Customer Support Lead' },
              { name: 'Lisa Chen', role: 'Marketing Director' },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Gear Up?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Explore our full range of motorcycle parts and find everything you need for your next ride.
          </p>
          <Link
            href="/shop"
            className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition inline-block"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
