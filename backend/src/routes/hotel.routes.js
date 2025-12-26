import express from 'express';
import { body } from 'express-validator';
import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  getMyHotels,
  addRoomToHotel,
  updateRoomInHotel,
  deleteRoomFromHotel,
  findNearbyHotels,
  trackHotelView,
} from '../controllers/hotel.controller.js';
import { authenticate, authenticateOptional, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload, saveToMongoDB } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const hotelValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  // locationId is optional, no validation needed
  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

// Routes
router.post(
  '/',
  authenticate,
  authorize('guide'),
  upload.any(), // Accept any field names including rooms[0][photos]
  saveToMongoDB,
  hotelValidation,
  validate,
  createHotel
);

router.get('/', getHotels);
router.get('/my-hotels', authenticate, authorize('guide'), getMyHotels);
router.get('/find-nearby', findNearbyHotels);
router.get('/:id', authenticateOptional, getHotelById);
router.post('/:id/track-view', trackHotelView);

router.put(
  '/:id',
  authenticate,
  authorize('guide', 'admin'),
  upload.any(), // Accept any field names including rooms[0][photos]
  saveToMongoDB,
  updateHotel
);

router.delete('/:id', authenticate, authorize('guide', 'admin'), deleteHotel);

// Rooms management
const roomValidation = [
  body('roomType').trim().notEmpty().withMessage('Room type is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('Price per night must be >= 0'),
  body('currency').optional().isString(),
  body('amenities').optional().isArray(),
  body('notes').optional().isString(),
];

router.post(
  '/:id/rooms',
  authenticate,
  authorize('guide', 'admin'),
  upload.array('photos', 10),
  saveToMongoDB,
  roomValidation,
  validate,
  addRoomToHotel
);

router.put(
  '/:id/rooms/:roomIndex',
  authenticate,
  authorize('guide', 'admin'),
  upload.array('photos', 10),
  saveToMongoDB,
  updateRoomInHotel
);

router.delete(
  '/:id/rooms/:roomIndex',
  authenticate,
  authorize('guide', 'admin'),
  deleteRoomFromHotel
);

export default router;
