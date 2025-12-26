import express from 'express';
import { getTravelerDashboardSuggestions } from '../controllers/suggestion.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Traveler dashboard suggestions
router.get('/dashboard', authenticate, authorize('user', 'guide', 'admin'), getTravelerDashboardSuggestions);

export default router;
