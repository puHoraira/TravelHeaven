import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations
router.get('/conversations', getConversations);

// Get messages with a specific user
router.get('/:userId', getMessages);

// Send a message
router.post('/', sendMessage);

// Mark messages as read
router.put('/:userId/read', markAsRead);

// Get unread message count
router.get('/unread/count', getUnreadCount);

export default router;
