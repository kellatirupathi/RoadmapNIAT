// server/routes/activityLogRoutes.js
import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all activity logs - Admin only
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .populate('user', 'username firstName lastName role')
      .populate('resourceId', 'name'); // Populate resource if it's a reference

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching all activity logs:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Get recent activity logs - Accessible by admin, manager
router.get('/recent', protect, authorize('admin', 'manager'), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const logs = await ActivityLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('user', 'username firstName lastName role')
        .populate('resourceId', 'name');
  
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      console.error('Error fetching recent activity logs:', error);
      res.status(500).json({ success: false, error: 'Server Error' });
    }
  });

export default router;