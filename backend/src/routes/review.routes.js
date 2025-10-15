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

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Review routes
router.post('/', createReview);
router.get('/', getReviews);
router.get('/my-reviews', getMyReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/like', toggleLikeReview);

export default router;
