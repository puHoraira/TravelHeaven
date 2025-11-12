import express from 'express';
import { body } from 'express-validator';
import {
  createTransport,
  getTransportation,
  getTransportById,
  updateTransport,
  deleteTransport,
  getMyTransport,
  findRoutes,
  getPopularRoutes,
  searchByOperator,
  incrementViewCount,
  recordBooking,
} from '../controllers/transport.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const transportValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['bus', 'train', 'taxi', 'rental-car', 'flight', 'boat', 'launch', 'cng', 'rickshaw', 'other']).withMessage('Invalid transport type'),
  body('locationId').optional(), // Make locationId optional since we now use route GPS coordinates
];

// Public routes
router.get('/', getTransportation);
router.get('/find-routes', findRoutes); // NEW: Find routes
router.get('/popular', getPopularRoutes); // NEW: Popular routes
router.get('/search-operator', searchByOperator); // NEW: Search by operator
router.get('/my-transport', authenticate, authorize('guide'), getMyTransport);
router.get('/:id', getTransportById);
router.post('/:id/view', incrementViewCount); // NEW: Track views
router.post('/:id/book', recordBooking); // NEW: Track bookings

// Guide routes
router.post(
  '/',
  authenticate,
  authorize('guide'),
  upload.array('images', 5),
  transportValidation,
  validate,
  createTransport
);

router.put(
  '/:id',
  authenticate,
  authorize('guide', 'admin'),
  upload.array('images', 5),
  updateTransport
);

router.delete('/:id', authenticate, authorize('guide', 'admin'), deleteTransport);

export default router;
