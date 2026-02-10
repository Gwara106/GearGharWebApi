// Shared mock data for products and reviews
export const mockProducts = [
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
    tags: ['exhaust', 'carbon', 'performance'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockReviews = [
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
