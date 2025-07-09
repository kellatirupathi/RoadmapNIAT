// server/routes/overallHubRoutes.js
import express from 'express';
import { getAllStatuses, updateOverallStatus } from '../controllers/overallHubController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes on this file
router.use(protect);

// Accessible by all authorized roles to view statuses
router.get('/', authorize('admin', 'manager', 'instructor', 'crm'), getAllStatuses);

// Only Admin, CRM, and certain Instructors can update the status
router.put('/status', authorize('admin', 'crm', 'instructor'), updateOverallStatus);

export default router;
