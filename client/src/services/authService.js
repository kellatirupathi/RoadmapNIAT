// client/src/services/authService.js
import api from './api';

// Login user
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response;
};

// Logout user
const logout = async () => {
  return api.post('/auth/logout');
};

// Get current user
const getCurrentUser = async () => {
  return api.get('/auth/me');
};

// Change password
const changePassword = async (currentPassword, newPassword) => {
  return api.put('/auth/change-password', { currentPassword, newPassword });
};

const authService = {
  login,
  logout,
  getCurrentUser,
  changePassword
};

export default authService;