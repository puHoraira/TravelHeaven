import express from 'express';
import { searchRailwayRoutes, getRailwaySeatClasses, getRailwayInfo } from '../controllers/railway.controller.js';

const router = express.Router();

/**
 * Railway Routes
 * Public routes - no authentication required for searching
 */

// Search trains
router.get('/search', searchRailwayRoutes);

// Get available seat classes
router.get('/seat-classes', getRailwaySeatClasses);

// Get railway info
router.get('/info', getRailwayInfo);

export default router;
