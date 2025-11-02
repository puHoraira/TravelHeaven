import express from 'express';
import {
  createReview,
  getReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleLikeReview,
} from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/', getReviews);

// Protected routes (authentication required)
router.use(authenticate);

router.post('/', createReview);
router.post('/with-images', upload.array('images', 5), createReview);
router.get('/my-reviews', getMyReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/like', toggleLikeReview);

export default router;
