import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h3>Loading session...</h3>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // If password change is forced, restrict access to only the change-password page
  if (user?.must_change_password && location.pathname !== '/change-password-force') {
    return <Navigate to="/change-password-force" replace />;
  }

  // Get user role from context state or localStorage fallback
  const userRole = user?.role || localStorage.getItem('user_role');

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to dashboard if user doesn't have privileges for this route
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
