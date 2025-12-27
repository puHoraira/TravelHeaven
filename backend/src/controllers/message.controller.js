import Message from '../models/Message.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

// Generate unique conversation ID between two users
const generateConversationId = (userId1, userId2) => {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting conversations for user:', userId.toString());

    // Convert to ObjectId for aggregation
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all unique conversations
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { receiver: userObjectId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$createdAt' },
          sender: { $first: '$sender' },
          receiver: { $first: '$receiver' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', userObjectId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    console.log('Found conversations:', messages.length);

    // Populate other user details
    const conversations = await Promise.all(
      messages.map(async (conv) => {
        const otherUserId = conv.sender.equals(userObjectId) ? conv.receiver : conv.sender;
        const otherUser = await User.findById(otherUserId).select('username email profile role guideInfo');
        
        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message,
    });
  }
};

/**
 * Get messages for a specific conversation
 */
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const conversationId = generateConversationId(currentUserId, userId);
    
    console.log('Getting messages for conversation:', conversationId);
    console.log('Current user:', currentUserId.toString());
    console.log('Other user:', userId);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('sender', '_id username profile')
      .populate('receiver', '_id username profile');

    console.log('Found messages:', messages.length);

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message,
    });
  }
};

/**
 * Send a message
 */
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required',
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    const conversationId = generateConversationId(senderId, receiverId);
    
    console.log('Sending message with conversationId:', conversationId);
    console.log('Sender:', senderId.toString());
    console.log('Receiver:', receiverId);

    const newMessage = await Message.create({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
    });

    await newMessage.populate('sender', '_id username profile');
    await newMessage.populate('receiver', '_id username profile');

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const conversationId = generateConversationId(currentUserId, userId);

    await Message.updateMany(
      {
        conversationId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message,
    });
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Message.countDocuments({
      receiver: userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
};
