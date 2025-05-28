// client/src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import PageLoader from '../components/UI/PageLoader';

const ProtectedRoute = ({ 
  element, 
  requiredRoles = [],
  requiredPermission = null
}) => {
  const { isAuthenticated, loading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();
  
  // Show loader while checking authentication
  if (loading) {
    return <PageLoader />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user has required role(s)
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }
  
  // Check if user has required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/not-authorized" replace />;
  }
  
  // Render the protected component
  return element;
};

export default ProtectedRoute;