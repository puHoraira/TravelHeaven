import express from 'express';
import { body } from 'express-validator';
import {
  getPendingApprovals,
  approveSubmission,
  rejectSubmission,
  getStatistics,
  getAllSubmissions,
  getPendingGuides,
  approveGuide,
  rejectGuide,
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

// Guide verification routes
router.get('/pending-guides', getPendingGuides);
router.post('/approve-guide/:guideId', approveGuide);
router.post(
  '/reject-guide/:guideId',
  [body('reason').trim().notEmpty().withMessage('Rejection reason is required')],
  validate,
  rejectGuide
);

export default router;
