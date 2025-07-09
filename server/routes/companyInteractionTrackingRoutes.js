// server/routes/companyInteractionTrackingRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import companyInteractionTrackingController from '../controllers/companyInteractionTrackingController.js';

const router = express.Router();

// --- PUBLIC ROUTES (NO AUTHENTICATION NEEDED) ---
router.get('/public/:publicId', companyInteractionTrackingController.getPublicInteraction);
router.put('/public/:publicId/:sessionId/:studentId', companyInteractionTrackingController.updatePublicInteraction);


// --- PROTECTED ADMIN/MANAGER ROUTES ---
router.use(protect, authorize('admin', 'manager', 'crm', 'instructor'));

router.route('/')
    .get(companyInteractionTrackingController.getAllInteractions)
    .post(companyInteractionTrackingController.createCompanyInteraction);

// --- NEW: Routes for single record management ---
router.route('/:id')
    .get(companyInteractionTrackingController.getById) // Get details for editing
    .put(companyInteractionTrackingController.updateCompanyInteraction) // Save updates
    .delete(companyInteractionTrackingController.deleteCompanyInteraction); // Delete a record

router.put('/:id/add-session', companyInteractionTrackingController.addInteractionSession);
router.put('/:id/remove-session', companyInteractionTrackingController.removeInteractionSession);


export default router;
