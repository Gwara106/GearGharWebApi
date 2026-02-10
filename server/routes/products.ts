import express from 'express';
import { connectToDatabase } from '../../lib/db';
import { ObjectId } from 'mongodb';

const router = express.Router();

// GET /api/products - Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1, search } = req.query;
    
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');

    // Build query
    const query: any = { status: 'active' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const products = await productsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .toArray();

    const total = await productsCollection.countDocuments(query);

    res.json({
      message: 'Products retrieved successfully',
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');

    let productId;
    try {
      productId = new ObjectId(id);
    } catch {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await productsCollection.findOne({ _id: productId, status: 'active' });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product retrieved successfully',
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/products/:id/reviews - Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const { db } = await connectToDatabase();
    const reviewsCollection = db.collection('reviews');

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const reviews = await reviewsCollection
      .find({ productId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .toArray();

    const total = await reviewsCollection.countDocuments({ productId: new ObjectId(id) });

    res.json({
      message: 'Reviews retrieved successfully',
      reviews,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/products/:id/reviews - Add product review
router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, content } = req.body;
    
    // Get user info from token (simplified - in real app, verify JWT)
    const userId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { db } = await connectToDatabase();
    const reviewsCollection = db.collection('reviews');
    const usersCollection = db.collection('users');

    // Get user info
    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await reviewsCollection.findOne({
      productId: id,
      userId: userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create review
    const review = {
      productId: new ObjectId(id),
      userId: new ObjectId(userId),
      userName: `${user.firstName} ${user.lastName}`,
      rating,
      title,
      content,
      helpful: 0,
      verified: true, // In real app, check if user actually purchased
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await reviewsCollection.insertOne(review);

    res.status(201).json({
      message: 'Review added successfully',
      review: { ...review, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as productsRouter };
