import express from 'express';
import { getRouteAdvice, previewItineraryPlan } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/route-advisor', /* protect, */ getRouteAdvice);

// Structured itinerary preview (requires login)
router.post('/itinerary/preview', authenticate, previewItineraryPlan);

export default router;
