// server/routes/notificationRoutes.js
import express from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Allow admin, manager, AND instructor to access these notification routes
// The controllers themselves will ensure users can only access/modify their own notifications
router.use(authorize('admin', 'manager', 'instructor')); 

router.get('/', getMyNotifications);
router.put('/:id/read', markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);

export default router;