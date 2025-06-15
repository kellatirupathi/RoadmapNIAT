// server/routes/internshipsTrackerRoutes.js
import express from 'express';
import {
    getSheetData,
    createSheetRow,
    updateSheetRow,
    deleteSheetRow,
    deleteSheetData,
} from '../controllers/internshipsTrackerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET routes are accessible by both admin and manager for viewing data.
router.get('/:sheetName', protect, authorize('admin', 'manager'), getSheetData);

// POST, PUT, DELETE routes are now restricted to admin only.
router.post('/:sheetName', protect, authorize('admin'), createSheetRow);
router.delete('/:sheetName', protect, authorize('admin'), deleteSheetData);
router.put('/:sheetName/:id', protect, authorize('admin'), updateSheetRow);
router.delete('/:sheetName/:id', protect, authorize('admin'), deleteSheetRow);


export default router;