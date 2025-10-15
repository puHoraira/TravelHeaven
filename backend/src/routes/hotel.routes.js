import express from 'express';
import { body } from 'express-validator';
import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  getMyHotels,
} from '../controllers/hotel.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const hotelValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('locationId').notEmpty().withMessage('Location ID is required'),
  body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

// Routes
router.post(
  '/',
  authenticate,
  authorize('guide'),
  upload.array('images', 5),
  hotelValidation,
  validate,
  createHotel
);

router.get('/', getHotels);
router.get('/my-hotels', authenticate, authorize('guide'), getMyHotels);
router.get('/:id', getHotelById);

router.put(
  '/:id',
  authenticate,
  authorize('guide', 'admin'),
  upload.array('images', 5),
  updateHotel
);

router.delete('/:id', authenticate, authorize('guide', 'admin'), deleteHotel);

export default router;
