import express from 'express';
import { body } from 'express-validator';
import {
  getPendingApprovals,
  approveSubmission,
  rejectSubmission,
  getStatistics,
  getAllSubmissions,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// All routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Routes
router.get('/pending', getPendingApprovals);
router.get('/statistics', getStatistics);
router.get('/submissions', getAllSubmissions);

router.put(
  '/approve/:type/:id',
  approveSubmission
);

router.put(
  '/reject/:type/:id',
  [body('reason').trim().notEmpty().withMessage('Rejection reason is required')],
  validate,
  rejectSubmission
);

export default router;
