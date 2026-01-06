'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚙️</span>
            </div>
            <span className="text-xl font-bold text-gray-900">GearGhar</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary font-medium transition">
              Home
            </Link>
            <Link href="/shop" className="text-gray-700 hover:text-primary font-medium transition">
              Shop
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-primary font-medium transition">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary font-medium transition">
              About
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative hidden sm:inline-flex p-2 text-gray-700 hover:text-primary transition">
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link href="/login" className="hidden sm:inline-flex items-center space-x-1 p-2 text-gray-700 hover:text-primary transition">
              <User size={20} />
              <span className="text-sm font-medium">Login</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Home
            </Link>
            <Link href="/shop" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Shop
            </Link>
            <Link href="/categories" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Categories
            </Link>
            <Link href="/about" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              About
            </Link>
            <Link href="/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Login
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
