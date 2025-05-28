// server/routes/authRoutes.js
import express from 'express';
import { login, getCurrentUser, logout, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

export default router;