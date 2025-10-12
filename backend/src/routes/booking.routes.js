import express from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getAllBookings,
} from '../controllers/booking.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const bookingValidation = [
  body('bookingType').isIn(['hotel', 'transport', 'package']).withMessage('Invalid booking type'),
  body('referenceId').notEmpty().withMessage('Reference ID is required'),
  body('bookingDetails.numberOfPeople').optional().isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
];

// Routes
router.post(
  '/',
  authenticate,
  authorize('user'),
  bookingValidation,
  validate,
  createBooking
);

router.get('/', authenticate, authorize('user'), getMyBookings);
router.get('/all', authenticate, authorize('admin'), getAllBookings);
router.get('/:id', authenticate, getBookingById);

router.put('/:id', authenticate, updateBooking);
router.put('/:id/cancel', authenticate, cancelBooking);

export default router;
