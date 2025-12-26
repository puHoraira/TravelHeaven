import express from 'express';
import {
  getAllGuides,
  getGuideById,
  updateGuideProfile,
  updateGuideGeneralProfile,
  updateGuidePricing,
  updateGuideContactMethods,
  resubmitGuideVerification,
  getGuideMetrics,
  getGuidesForAdmin,
} from '../controllers/guide.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload, saveToMongoDB } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/admin/list', authenticate, authorize('admin'), getGuidesForAdmin);
router.get('/', getAllGuides);

// Protected guide self-service routes
router.get('/metrics', authenticate, authorize('guide'), getGuideMetrics);
router.put('/profile/general', authenticate, authorize('guide'), updateGuideGeneralProfile);
router.put('/profile/pricing', authenticate, authorize('guide'), updateGuidePricing);
router.put('/profile/contact', authenticate, authorize('guide'), updateGuideContactMethods);
router.post(
  '/verification/resubmit',
  authenticate,
  authorize('guide'),
  upload.single('verificationDocument'),
  saveToMongoDB,
  resubmitGuideVerification
);

// Protected routes
router.put('/profile', authenticate, authorize('guide'), updateGuideProfile);
router.get('/:id', getGuideById);

export default router;
