'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, ArrowLeft, Minus, Plus, Truck, Shield, RefreshCw, Heart } from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
}

export default function ProductPage() {
  const params = useParams();
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

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }
      
      const data = await response.json();
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
    
    // TODO: Implement actual cart functionality
    console.log('Added to cart:', product.name, 'Quantity:', quantity);
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
