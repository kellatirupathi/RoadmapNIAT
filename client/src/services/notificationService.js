// client/src/services/notificationService.js
import api from './api';

// Get notifications for the current user
const getMyNotifications = async () => {
  return api.get('/notifications');
};

// Mark a notification as read
const markNotificationAsRead = async (notificationId) => {
  return api.put(`/notifications/${notificationId}/read`);
};

// Mark all notifications as read
const markAllNotificationsAsRead = async () => {
  return api.put('/notifications/read-all');
};

const notificationService = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

export default notificationService;