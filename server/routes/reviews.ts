import express from 'express';
import { connectToDatabase } from '../../lib/db';
import { ObjectId } from 'mongodb';

const router = express.Router();

// POST /api/reviews/:id/helpful - Mark review as helpful
router.post('/:id/helpful', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { db } = await connectToDatabase();
    const reviewsCollection = db.collection('reviews');

    let reviewId;
    try {
      reviewId = new ObjectId(id);
    } catch {
      return res.status(400).json({ message: 'Invalid review ID' });
    }

    const result = await reviewsCollection.updateOne(
      { _id: reviewId },
      { $inc: { helpful: 1 } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({
      message: 'Review marked as helpful'
    });
  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as reviewsRouter };
