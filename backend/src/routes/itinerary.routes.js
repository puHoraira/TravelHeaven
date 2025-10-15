import express from 'express';
import { body } from 'express-validator';
import {
  createItinerary,
  getMyItineraries,
  getPublicItineraries,
  getItineraryById,
  updateItinerary,
  deleteItinerary,
  addCollaborator,
  removeCollaborator,
  addExpense,
} from '../controllers/itinerary.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const itineraryValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
];

const collaboratorValidation = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('permission').optional().isIn(['view', 'edit']).withMessage('Invalid permission'),
];

const expenseValidation = [
  body('name').trim().notEmpty().withMessage('Expense name is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
];

// Public routes
router.get('/public', getPublicItineraries);
router.get('/:id/view', getItineraryById); // Public view if isPublic

// Protected routes
router.post(
  '/',
  authenticate,
  itineraryValidation,
  validate,
  createItinerary
);

router.get('/my', authenticate, getMyItineraries);
router.get('/:id', authenticate, getItineraryById);

router.put(
  '/:id',
  authenticate,
  updateItinerary
);

router.delete('/:id', authenticate, deleteItinerary);

// Collaboration routes
router.post(
  '/:id/collaborators',
  authenticate,
  collaboratorValidation,
  validate,
  addCollaborator
);

router.delete(
  '/:id/collaborators',
  authenticate,
  collaboratorValidation,
  validate,
  removeCollaborator
);

// Budget/expense routes
router.post(
  '/:id/expenses',
  authenticate,
  expenseValidation,
  validate,
  addExpense
);

export default router;
