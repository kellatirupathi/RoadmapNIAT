// server/routes/commentRoutes.js
import express from 'express';
import {
  getComments,
  addComment,
  deleteComment
  // updateComment, // Add if needed later
  // getUserComments // Add if needed later
} from '../controllers/commentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get comments for a specific tech stack roadmap item
// Instructors, Admins, Managers can view comments
router.get('/techstack/:techStackId/item/:roadmapItemId', 
  authorize('admin', 'manager', 'instructor', 'content'), // Content might need to see comments for context
  getComments
);

// Add a comment to a tech stack roadmap item
// Only instructors and admins can add comments directly on timeline items.
// If other roles need to comment, add them to authorize.
router.post('/techstack/:techStackId/item/:roadmapItemId', 
  authorize('admin', 'instructor', 'manager'), // Allow managers to comment too
  addComment
);

// Delete a comment
// User who made the comment, or admin/manager can delete
router.delete('/techstack/:techStackId/item/:roadmapItemId/:commentId', 
  authorize('admin', 'manager', 'instructor'), // Author check is in controller
  deleteComment
);

// Future routes if needed:
// router.put('/:commentId', authorize('admin', 'instructor'), updateComment);
// router.get('/user/:userId?', authorize('admin', 'manager'), getUserComments);

export default router;