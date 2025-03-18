// src/shared/components/ProtectedRoutes.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

// Route only accessible to staff (redirects patients to dashboard)
export const StaffRoute = () => {
  const { mode } = useAuth();
  
  if (mode !== 'staff') {
    return <Navigate to="/" replace />;
  }
  
  // Use Outlet to render the child route element
  return <Outlet />;
};

// Route only accessible to patients (redirects staff to patient info)
export const PatientRoute = () => {
  const { mode } = useAuth();
  
  if (mode === 'staff') {
    return <Navigate to="/patient-info" replace />;
  }
  
  // Use Outlet to render the child route element
  return <Outlet />;
};

export default { StaffRoute, PatientRoute };