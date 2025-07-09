// server/controllers/userController.js
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

// Get all users (admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).populate('assignedTechStacks', 'name');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get user by ID (admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('assignedTechStacks', 'name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create a new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { 
      username, email, password, firstName, lastName, role, 
      assignedTechStacks, canManageRoadmaps, techStackPermission, canAccessCriticalPoints, 
      canAccessPostInternships, canAccessStudentsTracker, canAccessOverallHub
    } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    const userData = {
      username, email, password, firstName, lastName, role
    };

    // --- START MODIFICATION: Add CRM to the conditional permission logic ---
    if (role === 'instructor' || role === 'crm') {
      if (canAccessStudentsTracker !== undefined) userData.canAccessStudentsTracker = canAccessStudentsTracker;
      if (canAccessOverallHub !== undefined) userData.canAccessOverallHub = canAccessOverallHub;
    }

    // Instructor-specific permissions
    if (role === 'instructor') {
      if (assignedTechStacks) userData.assignedTechStacks = assignedTechStacks;
      if (canManageRoadmaps !== undefined) userData.canManageRoadmaps = canManageRoadmaps;
      if (techStackPermission) userData.techStackPermission = techStackPermission;
      if (canAccessCriticalPoints !== undefined) userData.canAccessCriticalPoints = canAccessCriticalPoints;
      if (canAccessPostInternships !== undefined) userData.canAccessPostInternships = canAccessPostInternships;
    }
    // --- END MODIFICATION ---
    
    const user = await User.create(userData);
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'user_management',
      details: {
        operation: 'create',
        targetUser: user._id
      }
    });
    
    user.password = undefined;
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already in use'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { 
      username, email, firstName, lastName, role, isActive, assignedTechStacks, 
      canManageRoadmaps, techStackPermission, canAccessCriticalPoints, canAccessPostInternships,
      canAccessStudentsTracker, canAccessOverallHub
    } = req.body;
    
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // --- START MODIFICATION: Separate shared and role-specific permissions ---
    // Page access for both Instructor and CRM
    if (role === 'instructor' || role === 'crm') {
        if (canAccessStudentsTracker !== undefined) updateData.canAccessStudentsTracker = Boolean(canAccessStudentsTracker);
        if (canAccessOverallHub !== undefined) updateData.canAccessOverallHub = Boolean(canAccessOverallHub);
    } else {
        updateData.canAccessStudentsTracker = false;
        updateData.canAccessOverallHub = false;
    }

    // Instructor-only permissions
    if (role === 'instructor') {
      if (assignedTechStacks !== undefined) updateData.assignedTechStacks = assignedTechStacks;
      if (canManageRoadmaps !== undefined) updateData.canManageRoadmaps = Boolean(canManageRoadmaps);
      if (techStackPermission !== undefined) updateData.techStackPermission = techStackPermission;
      if (canAccessCriticalPoints !== undefined) updateData.canAccessCriticalPoints = Boolean(canAccessCriticalPoints);
      if (canAccessPostInternships !== undefined) updateData.canAccessPostInternships = Boolean(canAccessPostInternships);
    } else {
      updateData.assignedTechStacks = [];
      updateData.canManageRoadmaps = false;
      updateData.techStackPermission = 'none';
      updateData.canAccessCriticalPoints = false;
      updateData.canAccessPostInternships = false;
    }
    // --- END MODIFICATION ---
    
    const user = await User.findByIdAndUpdate( req.params.id, updateData, { new: true, runValidators: true } ).select('-password').populate('assignedTechStacks', 'name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    await ActivityLog.create({ user: req.user.id, action: 'user_management', details: { operation: 'update', targetUser: user._id, updatedFields: Object.keys(updateData) }});
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already in use'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Reset user password (admin only)
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a new password'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'user_management',
      details: {
        operation: 'reset_password',
        targetUser: user._id
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }
    
    const deletedUserId = user._id;
    
    await User.deleteOne({ _id: req.params.id });
    
    await ActivityLog.create({
      user: req.user.id,
      action: 'user_management',
      details: {
        operation: 'delete',
        targetUser: deletedUserId
      }
    });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get user activity logs (admin and manager)
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    const logs = await ActivityLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('resourceId', 'name');
    
    const total = await ActivityLog.countDocuments({ user: userId });
    
    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: logs
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
