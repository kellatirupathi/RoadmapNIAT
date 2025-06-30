// // server/routes/internshipsTrackerRoutes.js
// import express from 'express';
// import {
//     getSheetData,
//     createSheetRow,
//     updateSheetRow,
//     deleteSheetRow,
//     deleteSheetData,
// } from '../controllers/internshipsTrackerController.js';
// import { protect, authorize } from '../middleware/auth.js';

// const router = express.Router();

// // GET routes are accessible by both admin and manager for viewing data.
// router.get('/:sheetName', protect, authorize('admin', 'manager'), getSheetData);

// // POST, PUT, DELETE routes are now restricted to admin only.
// router.post('/:sheetName', protect, authorize('admin'), createSheetRow);
// router.delete('/:sheetName', protect, authorize('admin'), deleteSheetData);
// router.put('/:sheetName/:id', protect, authorize('admin'), updateSheetRow);
// router.delete('/:sheetName/:id', protect, authorize('admin'), deleteSheetRow);


// export default router;

// server/routes/internshipsTrackerRoutes.js
import express from 'express';
import {
    getSheetData,
    createSheetRow,
    updateSheetRow,
    deleteSheetRow,
    deleteSheetData,
    bulkCreateSheetRows, // --- IMPORT NEW CONTROLLER FUNCTION ---
} from '../controllers/internshipsTrackerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET routes are accessible by both admin and manager for viewing data.
router.get('/:sheetName', protect, authorize('admin', 'manager'), getSheetData);

// POST, PUT, DELETE routes for single rows are restricted to admin only.
router.post('/:sheetName', protect, authorize('admin'), createSheetRow);
router.delete('/:sheetName', protect, authorize('admin'), deleteSheetData);
router.put('/:sheetName/:id', protect, authorize('admin'), updateSheetRow);
router.delete('/:sheetName/:id', protect, authorize('admin'), deleteSheetRow);

// --- NEW ROUTE FOR BULK UPLOAD ---
// This route is specifically for handling CSV uploads and is admin-only.
router.post('/:sheetName/bulk', protect, authorize('admin'), bulkCreateSheetRows);
// --- END NEW ROUTE ---

export default router;
