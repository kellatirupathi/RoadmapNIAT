// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Create the Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Get current user with the stored token
        const response = await authService.getCurrentUser();
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Token verification failed:', err);
        // If token is invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    };
    
    verifyToken();
  }, [token]);
  
  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password);
      
      // Save token to localStorage and state
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
      
      setLoading(false);
      return response.user;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
      throw err;
    }
  };
  
  // Logout user
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local storage and state even if API call fails
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };
  
  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };
  
  // Check if user has specific permission (to be expanded later)
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // For now, use a simple permissions model (this can be extended later)
    const rolePermissions = {
      'admin': ['*'], // All permissions
      'content': ['view_roadmaps', 'manage_techstacks'],
      'instructor': ['view_roadmaps', 'update_status', 'add_comments'],
      'crm': ['view_published_roadmaps'],
      'manager': ['view_roadmaps', 'view_stats']
    };
    
    if (!rolePermissions[user.role]) return false;
    
    // Check if role has wildcard permission
    if (rolePermissions[user.role].includes('*')) return true;
    
    // Check if role has the specific permission
    return rolePermissions[user.role].includes(permission);
  };
  
  // Provide the context value
  const contextValue = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    hasPermission
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};