const { MongoClient } = require('mongodb');

async function seedProducts() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gearghar');
  
  try {
    await client.connect();
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Clear existing products
    await productsCollection.deleteMany({});
    
    const products = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life, superior sound quality, and comfortable fit for all-day listening.',
        price: 199.99,
        category: 'electronics',
        brand: 'AudioTech',
        sku: 'ATH-001',
        stock: 15,
        images: ['/products/headphones1.jpg', '/products/headphones2.jpg'],
        status: 'active',
        tags: ['wireless', 'bluetooth', 'noise-cancelling'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking watch with heart rate monitor, GPS, water resistance, and 7-day battery life.',
        price: 299.99,
        category: 'electronics',
        brand: 'FitTech',
        sku: 'FTW-002',
        stock: 8,
        images: ['/products/watch1.jpg', '/products/watch2.jpg'],
        status: 'active',
        tags: ['fitness', 'smartwatch', 'health'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt, perfect for everyday wear. Made with 100% certified organic cotton.',
        price: 29.99,
        category: 'clothing',
        brand: 'EcoWear',
        sku: 'EWT-003',
        stock: 25,
        images: ['/products/tshirt1.jpg', '/products/tshirt2.jpg'],
        status: 'active',
        tags: ['organic', 'cotton', 'sustainable'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Professional Yoga Mat',
        description: 'Extra thick, non-slip yoga mat with alignment markers. Perfect for yoga, pilates, and floor exercises.',
        price: 49.99,
        category: 'sports',
        brand: 'YogaPro',
        sku: 'YPM-004',
        stock: 12,
        images: ['/products/yogamat1.jpg', '/products/yogamat2.jpg'],
        status: 'active',
        tags: ['yoga', 'exercise', 'fitness'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated stainless steel water bottle keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and eco-friendly.',
        price: 34.99,
        category: 'accessories',
        brand: 'HydroMax',
        sku: 'HMB-005',
        stock: 30,
        images: ['/products/bottle1.jpg', '/products/bottle2.jpg'],
        status: 'active',
        tags: ['water', 'bottle', 'insulated'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await productsCollection.insertMany(products);
    console.log('Products seeded successfully:', result.insertedIds.length);
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedProducts();
