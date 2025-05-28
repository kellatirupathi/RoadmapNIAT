// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// JWT secret from environment variables with proper fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// Protect routes
export const protect = async (req, res, next) => {
  let token;
  
  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      // Check if user was found and is active
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user is inactive or deleted'
        });
      }
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        error: 'Not authorized, token failed'
      });
    }
  } else {
    res.status(401).json({
      success: false,
      error: 'Not authorized, no token'
    });
  }
};

// Role authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};