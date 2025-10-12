import express from 'express';
import { body } from 'express-validator';
import {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  getMyLocations,
} from '../controllers/location.controller.js';
import { authenticate, authorize, authorizeResource } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const locationValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('category').optional().isIn(['historical', 'natural', 'adventure', 'cultural', 'beach', 'mountain', 'other']),
];

// Routes
router.post(
  '/',
  authenticate,
  authorize('guide'),
  upload.array('images', 5),
  locationValidation,
  validate,
  createLocation
);

router.get('/', authenticate, getLocations);
router.get('/my-locations', authenticate, authorize('guide'), getMyLocations);
router.get('/:id', authenticate, getLocationById);

router.put(
  '/:id',
  authenticate,
  authorize('guide', 'admin'),
  upload.array('images', 5),
  updateLocation
);

router.delete('/:id', authenticate, authorize('guide', 'admin'), deleteLocation);

export default router;
