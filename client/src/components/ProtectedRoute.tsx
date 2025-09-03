import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('access_token');

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

