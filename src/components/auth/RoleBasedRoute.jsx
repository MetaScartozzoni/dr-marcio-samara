// src/components/auth/RoleBasedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Redirect to unauthorized page or dashboard based on role
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' :
                        userRole === 'funcionario' ? '/funcionario/dashboard' :
                        '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;
