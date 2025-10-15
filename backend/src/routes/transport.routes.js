import express from 'express';
import { body } from 'express-validator';
import {
  createTransport,
  getTransportation,
  getTransportById,
  updateTransport,
  deleteTransport,
  getMyTransport,
} from '../controllers/transport.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const transportValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['bus', 'train', 'taxi', 'rental-car', 'flight', 'boat', 'other']).withMessage('Invalid transport type'),
  body('locationId').notEmpty().withMessage('Location ID is required'),
];

// Routes
router.post(
  '/',
  authenticate,
  authorize('guide'),
  upload.array('images', 5),
  transportValidation,
  validate,
  createTransport
);

router.get('/', getTransportation);
router.get('/my-transport', authenticate, authorize('guide'), getMyTransport);
router.get('/:id', getTransportById);

router.put(
  '/:id',
  authenticate,
  authorize('guide', 'admin'),
  upload.array('images', 5),
  updateTransport
);

router.delete('/:id', authenticate, authorize('guide', 'admin'), deleteTransport);

export default router;
