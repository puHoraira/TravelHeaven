import express from 'express';
import { getRouteAdvice } from '../controllers/ai.controller.js';
// import { protect } from '../middleware/auth.js'; // if you want auth

const router = express.Router();

router.post('/route-advisor', /* protect, */ getRouteAdvice);

export default router;
