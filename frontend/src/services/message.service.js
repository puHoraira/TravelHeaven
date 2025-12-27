import api from '../lib/api';

// Get all conversations
export const getConversations = async () => {
  const response = await api.get('/messages/conversations');
  return response.data;
};

// Get messages with a specific user
export const getMessages = async (userId, page = 1) => {
  const response = await api.get(`/messages/${userId}`, {
    params: { page, limit: 50 }
  });
  return response.data;
};

// Send a message
export const sendMessage = async (receiverId, message) => {
  const response = await api.post('/messages', {
    receiverId,
    message
  });
  return response.data;
};

// Mark messages as read
export const markAsRead = async (userId) => {
  const response = await api.put(`/messages/${userId}/read`);
  return response.data;
};

// Get unread count
export const getUnreadCount = async () => {
  const response = await api.get('/messages/unread/count');
  return response.data;
};
