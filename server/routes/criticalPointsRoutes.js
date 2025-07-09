// server/routes/criticalPointsRoutes.js
import express from 'express';
// --- MODIFICATION: Removed companyStatusController ---
import { interactionsController } from '../controllers/criticalPointsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Custom authorization middleware for this page's features
const authorizeCriticalPoints = (req, res, next) => {
  const user = req.user;
  const isManagerViewOnly = user.role === 'manager'; 
  const hasAccess = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessCriticalPoints) || isManagerViewOnly;
  
  if (!hasAccess) {
    return res.status(403).json({ success: false, error: 'You are not authorized to access this resource.' });
  }
  
  // Prevent mutating requests from view-only roles
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && isManagerViewOnly) {
     return res.status(403).json({ success: false, error: 'You have view-only access.' });
  }
  
  next();
};

router.use(protect);
router.use(authorizeCriticalPoints);

// --- MODIFICATION: All /company-status routes have been removed ---

// Interaction Feedback Main Routes
router.route('/interactions').get(interactionsController.getAll).post(interactionsController.create);
router.route('/interactions/:id').put(interactionsController.update).delete(interactionsController.delete);
router.post('/interactions/bulk', interactionsController.bulkCreate);

// Nested Interaction Sub-document Routes
router.post('/interactions/:id/sub', interactionsController.addInteraction);
router.put('/interactions/:id/sub/:subId', interactionsController.updateSubInteraction);
router.delete('/interactions/:id/sub/:subId', interactionsController.deleteSubInteraction);

export default router;
