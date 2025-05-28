// server/routes/statsRoutes.js
import express from 'express';
import {
  getTechStackStats,
  getUserActivityStats,
  getTimelineStats,
  getDashboardSummary,
  getInstructorProgressByDate
} from '../controllers/statsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard summary - for admin, manager, instructor
router.get('/dashboard', authorize('admin', 'manager', 'instructor'), getDashboardSummary);

// Tech stack stats - for all roles except CRM
router.get('/techstacks', authorize('admin', 'manager', 'instructor', 'content'), getTechStackStats);

// User activity stats - for admin and manager only
router.get('/user-activity', authorize('admin', 'manager'), getUserActivityStats);

// Timeline stats - for admin, manager, instructor
router.get('/timeline', authorize('admin', 'manager', 'instructor'), getTimelineStats);

// Instructor progress by date - for admin, manager
router.get('/instructor-progress', protect, authorize('admin', 'manager'), getInstructorProgressByDate);

export default router;