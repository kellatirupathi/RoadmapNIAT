// server/routes/userRoutes.js
import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  getUserActivity
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All these routes require authentication
router.use(protect);

// Admin-only routes
router.route('/')
  .get(authorize('admin', 'manager'), getUsers) // UPDATED: Allow 'manager'
  .post(authorize('admin'), createUser);

router.route('/:id')
  .get(authorize('admin', 'manager'), getUserById) // Managers can also view individual users if needed
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

router.put('/:id/reset-password', authorize('admin'), resetUserPassword);

// Activity logs - accessible by admins and managers
router.get('/:id/activity', authorize('admin', 'manager'), getUserActivity);

export default router;