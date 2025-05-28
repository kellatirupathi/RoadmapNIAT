// client/src/services/userService.js
import api from './api';

// Get all users (admin only)
const getUsers = async () => {
  return api.get('/users');
};

// Get user by ID (admin only)
const getUserById = async (id) => {
  return api.get(`/users/${id}`);
};

// Create a new user (admin only)
const createUser = async (userData) => {
  return api.post('/users', userData);
};

// Update user (admin only)
const updateUser = async (id, userData) => {
  return api.put(`/users/${id}`, userData);
};

// Reset user password (admin only)
const resetUserPassword = async (id, passwordData) => {
  return api.put(`/users/${id}/reset-password`, passwordData);
};

// Delete user (admin only)
const deleteUser = async (id) => {
  return api.delete(`/users/${id}`);
};

// Get user activity (admin and manager)
const getUserActivity = async (id) => {
  return api.get(`/users/${id}/activity`);
};

const userService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  getUserActivity
};

export default userService;