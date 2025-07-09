// server/routes/studentsTrackerRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    aseRatingsController,
    companyInteractionsController,
    assignmentRatingsController,
    incrutierRatingsController,
    companyClosingsController,
} from '../controllers/studentsTrackerController.js';

const router = express.Router();

// All routes are protected and for admins, managers, instructors, and CRMs only
router.use(protect, authorize('admin', 'manager', 'instructor', 'crm'));

// Helper to create CRUD routes for a controller
const createCrudRoutes = (path, controller) => {
    router.route(path).get(controller.getAll).post(controller.create);
    router.route(`${path}/:id`).put(controller.update).delete(controller.delete);
};

createCrudRoutes('/ase-ratings', aseRatingsController);
createCrudRoutes('/company-interactions', companyInteractionsController);
createCrudRoutes('/assignment-ratings', assignmentRatingsController);
createCrudRoutes('/incrutier-ratings', incrutierRatingsController);
createCrudRoutes('/company-closings', companyClosingsController);

export default router;
