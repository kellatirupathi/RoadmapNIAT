// server/controllers/authController.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const JWT_EXPIRES_IN = '30d';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Your account has been deactivated. Please contact an administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    user.lastLogin = Date.now();
    await user.save();

    try {
      await ActivityLog.create({ user: user._id, action: 'login', ip: req.ip });
    } catch (logError) {
      console.warn('Failed to create activity log:', logError);
    }

    const token = generateToken(user._id);
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        displayName: user.displayName,
        canManageRoadmaps: user.canManageRoadmaps,
        techStackPermission: user.techStackPermission,
        canAccessCriticalPoints: user.canAccessCriticalPoints,
        // --- START NEW FIELD ---
        canAccessPostInternships: user.canAccessPostInternships
        // --- END NEW FIELD ---
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        displayName: user.displayName,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        canManageRoadmaps: user.canManageRoadmaps,
        techStackPermission: user.techStackPermission,
        canAccessCriticalPoints: user.canAccessCriticalPoints,
        // --- START NEW FIELD ---
        canAccessPostInternships: user.canAccessPostInternships
        // --- END NEW FIELD ---
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user) {
      await ActivityLog.create({ user: req.user.id, action: 'logout', ip: req.ip });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
