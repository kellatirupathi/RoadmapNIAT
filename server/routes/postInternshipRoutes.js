// server/routes/postInternshipRoutes.js
import express from 'express';
import {
  getAllPostInternships,
  getPostInternshipById,
  createPostInternship,
  updatePostInternship,
  deletePostInternship,
  addTaskToStudent,
  updateTaskForStudent,
  deleteTaskFromStudent
} from '../controllers/postInternshipController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// This custom middleware checks if a user is an Admin/CRM/Manager OR an Instructor with specific permission
const authorizeTaskManagement = (req, res, next) => {
    const user = req.user;
    // Admins, CRMs, and Managers always have access
    if (user.role === 'admin' || user.role === 'crm' || user.role === 'manager') {
        return next();
    }
    // Instructors have access ONLY if their permission flag is true
    if (user.role === 'instructor' && user.canAccessPostInternships) {
        return next();
    }
    // All others are denied
    return res.status(403).json({ success: false, error: 'You are not authorized to access this route' });
};

router.use(protect); // All routes require authentication

// --- START: MODIFIED ROUTE ---
// GET list is now also governed by the custom authorization logic.
router.get('/', authorizeTaskManagement, getAllPostInternships);
// --- END: MODIFIED ROUTE ---

// CUD on the main placement record are restricted to admin and crm
router.post('/', authorize('admin', 'crm'), createPostInternship);
router.put('/:id', authorize('admin', 'crm'), updatePostInternship);
router.delete('/:id', authorize('admin', 'crm'), deletePostInternship);


// --- START: MODIFIED TASK ROUTES ---
// The following routes now use the new custom authorization middleware.

// This route allows viewing a specific student record (tasks page).
// It's accessible to Admins, CRMs, Managers, AND Instructors with the special permission.
router.get('/:id', authorizeTaskManagement, getPostInternshipById);

// CUD on tasks are also accessible by this group.
router.post('/:id/tasks', authorizeTaskManagement, addTaskToStudent);
router.put('/:id/tasks/:taskId', authorizeTaskManagement, updateTaskForStudent);
router.delete('/:id/tasks/:taskId', authorizeTaskManagement, deleteTaskFromStudent);
// --- END: MODIFIED TASK ROUTES ---

export default router;
