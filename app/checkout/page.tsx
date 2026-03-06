'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArrowLeft, Check } from 'lucide-react';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { token, user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  useEffect(() => {
    setMounted(true);
    // Redirect to cart if no items
    if (mounted && items.length === 0 && !orderPlaced) {
      window.location.href = '/cart';
    }
  }, [mounted, items.length, orderPlaced]);

  const tax = total * 0.1;
  const shipping = total > 100 ? 0 : 9.99;
  const grandTotal = total + tax + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get form data for shipping address
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const shippingAddress = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address: formData.get('address') as string,
        phone: formData.get('phone') as string
      };

      // Prepare order data matching API expectations
      const orderData = {
        user: user?._id || '6971697a28e563e31f971e49', // Use actual user ID or fallback
        items: items.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
          name: item.name,
          images: [item.image]
        })),
        shippingAddress: {
          _id: user?._id || '1',
          name: user ? `${user.firstName} ${user.lastName}` : `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          streetAddress: user?.address || shippingAddress.address,
          city: 'Kathmandu', // Default city since User interface doesn't have city
          phone: user?.phone || shippingAddress.phone,
          isDefault: true
        },
        billingAddress: {
          _id: user?._id || '1',
          name: user ? `${user.firstName} ${user.lastName}` : `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          streetAddress: user?.address || shippingAddress.address,
          city: 'Kathmandu', // Default city since User interface doesn't have city
          phone: user?.phone || shippingAddress.phone,
          isDefault: true
        },
        paymentMethodId: paymentMethod === 'cash-on-delivery' ? 'cash' : 'card',
        subtotal: total,
        tax,
        shipping,
        discount: 0,
        total: grandTotal, // Complete total
        customerNotes: 'Order placed from web app',
        isGift: false,
        paymentStatus: 'pending'
      };

      // Get token from auth context
      if (!token) {
        throw new Error('Authentication required');
      }

      // Place order via API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const result = await response.json();
      console.log('Order placed successfully:', result.data);

      // Clear cart and show success
      clearCart();
      setOrderPlaced(true);
      
      // Store order number for confirmation
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastOrderNumber', result.data.orderNumber);
      }

    } catch (error) {
      console.error('Order placement error:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Success Screen
  if (orderPlaced) {
    // Get the stored order number
    const orderNumber = typeof window !== 'undefined' 
      ? localStorage.getItem('lastOrderNumber') || `ORD-${Math.random().toString().slice(2, 8)}`
      : `ORD-${Math.random().toString().slice(2, 8)}`;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-gray-600 mb-2">Thank you for your purchase!</p>
          <p className="text-gray-600 mb-8">
            Order confirmation has been sent to your email.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-2xl font-bold text-primary">{orderNumber}</p>
          </div>

          {/* Payment Method Confirmation */}
          <div className="bg-blue-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-600 mb-1">Payment Method</p>
            <p className="font-semibold text-blue-900">
              {paymentMethod === 'credit-card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
            </p>
            {paymentMethod === 'cash-on-delivery' && (
              <p className="text-sm text-blue-800 mt-2">
                Please have the exact amount ready when your order arrives.
              </p>
            )}
          </div>

          <p className="text-gray-600 mb-6">
            You will receive tracking information once your order ships.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              View Order Status
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="text-primary hover:underline inline-flex items-center gap-2 mb-4">
            <ArrowLeft size={20} />
            Back to Cart
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Step 1: Shipping Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123 Main Street"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="New York"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="NY"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="10001"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 border-primary rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="credit-card"
                      checked={paymentMethod === 'credit-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 font-semibold">Credit/Debit Card</span>
                  </label>

                  {/* Card Details Form - Only show when credit card is selected */}
                  {paymentMethod === 'credit-card' && (
                    <div className="space-y-4 p-4 border border-gray-300 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Card Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          required={paymentMethod === 'credit-card'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            MM/YY <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="12/25"
                            maxLength={5}
                            required={paymentMethod === 'credit-card'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            CVC <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            maxLength={3}
                            required={paymentMethod === 'credit-card'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            ZIP Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="10001"
                            required={paymentMethod === 'credit-card'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cash-on-delivery"
                      checked={paymentMethod === 'cash-on-delivery'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4" 
                    />
                    <span className="ml-3 font-semibold">Cash on Delivery</span>
                  </label>

                  {/* Cash on Delivery Info */}
                  {paymentMethod === 'cash-on-delivery' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-blue-600 mt-0.5">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Cash on Delivery</h4>
                          <p className="text-sm text-blue-800">
                            Pay with cash when your order arrives. Please have the exact amount ready.
                            Our delivery partner will provide you with a receipt upon payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Review */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Order Review</h2>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 mt-1"
                    />
                    <span className="ml-3 text-gray-700">
                      I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </span>
                  </label>

                  <label className="flex items-start">
                    <input type="checkbox" className="w-4 h-4 mt-1" />
                    <span className="ml-3 text-gray-700">
                      Send me promotional offers and updates
                    </span>
                  </label>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:bg-gray-400 transition text-lg"
              >
                {isLoading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="divide-y divide-gray-200 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="py-4 flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      Rs. {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>Rs. {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span>Rs. {shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Payment Method</span>
                  <span className="font-medium">
                    {paymentMethod === 'credit-card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center mt-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary">
                  Rs. {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
