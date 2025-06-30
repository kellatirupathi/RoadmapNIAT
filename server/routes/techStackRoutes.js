// // server/routes/techStackRoutes.js
// import express from 'express';
// import {
//   getAllTechStacks,
//   getTechStackById,
//   getTechStackByName,
//   createTechStack,
//   updateTechStack,
//   deleteTechStack,
//   deleteAllTechStacks,
//   addRoadmapItem,
//   updateRoadmapItem,
//   deleteRoadmapItem,
//   updateRoadmapItemSchedule // ** IMPORTED **
// } from '../controllers/techStackController.js';
// import { protect, authorize } from '../middleware/auth.js'; // ** IMPORTED **

// const router = express.Router();

// // Get all tech stacks and create a new tech stack
// router
//   .route('/')
//   .get(getAllTechStacks)
//   .post(createTechStack);

// // Delete all tech stacks
// router.route('/all').delete(deleteAllTechStacks);

// // Get, update, and delete a tech stack by ID
// router
//   .route('/:id')
//   .get(getTechStackById)
//   .put(updateTechStack)
//   .delete(deleteTechStack);

// // Get a tech stack by name
// router.route('/name/:name').get(getTechStackByName);

// // Add a roadmap item to a tech stack
// router.route('/:id/roadmap-item').post(addRoadmapItem);

// // Update and delete a roadmap item
// router
//   .route('/:id/roadmap-item/:itemId')
//   .put(updateRoadmapItem)
//   .delete(deleteRoadmapItem);

// // Schedule a roadmap item (instructor only for their assigned tech stacks, or admin)
// router.put('/:id/roadmap-item/:itemId/schedule', protect, authorize('instructor', 'admin'), updateRoadmapItemSchedule); // Admin can also schedule for management

// export default router;

// server/routes/techStackRoutes.js
import express from 'express';
import {
  getAllTechStacks,
  getTechStackById,
  getTechStackByName,
  createTechStack,
  updateTechStack,
  deleteTechStack,
  deleteAllTechStacks,
  addRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  updateRoadmapItemSchedule
} from '../controllers/techStackController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes, so req.user is always available
router.use(protect);

// GET routes (view permissions handled in controller logic)
router.route('/')
  .get(authorize('admin', 'manager', 'content', 'instructor'), getAllTechStacks);

router.route('/:id')
  .get(authorize('admin', 'manager', 'content', 'instructor'), getTechStackById);

router.route('/name/:name')
  .get(authorize('admin', 'manager', 'content', 'instructor'), getTechStackByName);

// CUD routes (create/update/delete permissions handled in controller logic)
router.route('/')
  .post(authorize('admin', 'content', 'instructor'), createTechStack);

router.route('/:id')
  .put(authorize('admin', 'content', 'instructor'), updateTechStack)
  .delete(authorize('admin', 'content', 'instructor'), deleteTechStack);

router.route('/all')
  .delete(authorize('admin'), deleteAllTechStacks);

// Roadmap Item routes
router.route('/:id/roadmap-item')
  .post(authorize('admin', 'content', 'instructor'), addRoadmapItem);

router.route('/:id/roadmap-item/:itemId')
  .put(authorize('admin', 'content', 'instructor'), updateRoadmapItem)
  .delete(authorize('admin', 'content', 'instructor'), deleteRoadmapItem);

// Scheduling route
router.put('/:id/roadmap-item/:itemId/schedule', 
  authorize('admin', 'instructor'), 
  updateRoadmapItemSchedule
);

export default router;
