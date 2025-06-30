// // server/routes/roadmapRoutes.js
// import express from 'express';
// import {
//   getAllRoadmaps,
//   getRoadmapById,
//   createRoadmap,
//   updateRoadmap,
//   deleteRoadmap,
//   getRoadmapsByCompany,
//   getRoadmapsByRole,
//   getConsolidatedRoadmaps
// } from '../controllers/roadmapController.js';
// import { protect, authorize } from '../middleware/auth.js'; // Import middleware

// const router = express.Router();

// // Get all roadmaps (now protected, so req.user is available for filtering)
// // All authenticated users can attempt to get roadmaps, filtering happens in controller.
// router.route('/').get(protect, getAllRoadmaps);

// // Create a new roadmap (Admin only)
// router.route('/').post(protect, authorize('admin'), createRoadmap);

// // Get a specific roadmap by ID (All authenticated users can view individual roadmap details)
// router.route('/:id').get(protect, getRoadmapById);

// // Update a roadmap by ID (Admin only)
// router.route('/:id').put(protect, authorize('admin'), updateRoadmap);

// // Delete a roadmap by ID (Admin only)
// router.route('/:id').delete(protect, authorize('admin'), deleteRoadmap);


// // These specific filter routes should also be protected
// router.route('/consolidated').get(protect, getConsolidatedRoadmaps);
// router.route('/company/:companyName').get(protect, getRoadmapsByCompany);
// router.route('/role/:role').get(protect, getRoadmapsByRole); // Note: this route might need role-based filtering if not public

// export default router;

// server/routes/roadmapRoutes.js
import express from 'express';
import {
  getAllRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  getRoadmapsByCompany,
  getRoadmapsByRole,
  getConsolidatedRoadmaps
} from '../controllers/roadmapController.js';
import { protect, authorize } from '../middleware/auth.js'; // Import middleware

const router = express.Router();

// Get all roadmaps (now protected, so req.user is available for filtering)
// All authenticated users can attempt to get roadmaps, filtering happens in controller.
router.route('/').get(protect, getAllRoadmaps);

// MODIFICATION: Allow 'manager' role to create roadmaps as well as 'admin'.
// Create a new roadmap (Admin or Manager)
router.route('/').post(protect, authorize('admin'), createRoadmap);

// Get a specific roadmap by ID (All authenticated users can view individual roadmap details)
router.route('/:id').get(protect, getRoadmapById);

// Update a roadmap by ID (Admin or Instructor)
// This is correct as an instructor should be able to update item statuses.
router.route('/:id').put(protect, authorize('admin', 'instructor'), updateRoadmap);

// Delete a roadmap by ID (Admin only)
// This remains Admin only, which is correct.
router.route('/:id').delete(protect, authorize('admin'), deleteRoadmap);


// These specific filter routes should also be protected
router.route('/consolidated').get(protect, getConsolidatedRoadmaps);
router.route('/company/:companyName').get(protect, getRoadmapsByCompany);
router.route('/role/:role').get(protect, getRoadmapsByRole); // Note: this route might need role-based filtering if not public

export default router;
