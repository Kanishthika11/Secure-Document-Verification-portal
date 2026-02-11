'use client';

import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="error-page">
        <div className="error-title">Access Denied</div>
        <div className="error-message">You do not have permission to access this page</div>
      </div>
    );
  }

  return children;
};
