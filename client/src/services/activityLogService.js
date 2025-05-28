// client/src/services/activityLogService.js
import api from './api';

// Get all activity logs (admin only - ensure backend route is protected)
const getAllActivityLogs = async () => {
  return api.get('/activitylogs'); // Assuming this is your backend route
};

// Get recent activity logs (might be limited by backend)
const getRecentActivityLogs = async (limit = 10) => {
    return api.get(`/activitylogs/recent?limit=${limit}`);
};

const activityLogService = {
  getAllActivityLogs,
  getRecentActivityLogs,
};

export default activityLogService;