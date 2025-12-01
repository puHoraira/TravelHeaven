/**
 * Recommendation Routes
 * Defines API endpoints for itinerary recommendation feature
 */

import express from 'express';
import {
  generateRecommendation,
  getQuickRecommendation,
  compareStrategies,
  getRecommendationByStrategy,
  saveItinerary,
  getItinerary,
  updateItinerary,
  deleteItinerary,
} from '../controllers/recommendation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/recommendations/generate
 * Generate personalized itinerary recommendation
 * 
 * Body:
 * - budget: number (required)
 * - duration: number (required, in days)
 * - startDate: date (required)
 * - endDate: date (required)
 * - interests: string[] (e.g., ['cultural', 'adventure', 'relaxation'])
 * - optimizationGoal: string ('budget' | 'activity' | 'comfort' | 'time')
 * - minRating: number (optional, default 3.5)
 * - enhancements: string[] (e.g., ['luxury', 'cultural', 'adventure'])
 * - destination: string (optional)
 * - region: string (optional)
 */
router.post('/generate', generateRecommendation);

/**
 * POST /api/recommendations/quick
 * Get quick recommendation with minimal input
 * 
 * Body:
 * - budget: number (optional, default 1000)
 * - duration: number (optional, default 3 days)
 * - interests: string[] (optional, default ['cultural'])
 */
router.post('/quick', getQuickRecommendation);

/**
 * POST /api/recommendations/compare
 * Compare all recommendation strategies for given preferences
 * 
 * Body: Same as /generate
 * 
 * Returns comparison of budget, activity, comfort, and time strategies
 */
router.post('/compare', compareStrategies);

/**
 * POST /api/recommendations/strategy/:strategyType
 * Generate recommendation using specific strategy
 * 
 * Params:
 * - strategyType: 'budget' | 'activity' | 'comfort' | 'time'
 * 
 * Body: Same as /generate
 */
router.post('/strategy/:strategyType', getRecommendationByStrategy);

/**
 * POST /api/recommendations/save
 * Save generated itinerary to database
 * 
 * Body: Complete itinerary object
 */
router.post('/save', saveItinerary);

/**
 * GET /api/recommendations/itinerary/:id
 * Get saved itinerary by ID
 */
router.get('/itinerary/:id', getItinerary);

/**
 * PUT /api/recommendations/itinerary/:id
 * Update saved itinerary
 * 
 * Body: Partial itinerary updates
 */
router.put('/itinerary/:id', updateItinerary);

/**
 * DELETE /api/recommendations/itinerary/:id
 * Delete saved itinerary
 */
router.delete('/itinerary/:id', deleteItinerary);

export default router;
