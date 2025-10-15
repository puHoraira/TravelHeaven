import { NotificationRepository } from '../patterns/Repository.js';

const notificationRepo = new NotificationRepository();

export const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const result = await notificationRepo.findAll(filter, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load notifications',
      error: error.message,
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationRepo.findById(id);
    if (!notification || notification.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message,
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await notificationRepo.model.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message,
    });
  }
};
