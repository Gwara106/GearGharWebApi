import express from 'express';

const router = express.Router();

// Mock reviews data
const mockReviews = [
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
  }
];

// POST /api/reviews/:id/helpful - Mark review as helpful (mock)
router.post('/:id/helpful', (req, res) => {
  try {
    const { id } = req.params;
    const review = mockReviews.find(r => r._id === id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.helpful += 1;

    res.json({
      message: 'Review marked as helpful'
    });
  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as reviewsMockRouter };
