// src/routes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Dashboard Pages
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import StaffDashboard from './pages/dashboard/StaffDashboard';

// Medical Pages
import PatientRecords from './pages/medical/PatientRecords';
import Appointments from './pages/medical/Appointments';
import DigitalNotebook from './pages/medical/DigitalNotebook';
import PatientJourney from './pages/medical/PatientJourney';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import FinancialManagement from './pages/admin/FinancialManagement';
import SystemConfig from './pages/admin/SystemConfig';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

// Role-based Route Component
import RoleBasedRoute from './components/auth/RoleBasedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={
        <AuthLayout>
          <Login />
        </AuthLayout>
      } />
      <Route path="/register" element={
        <AuthLayout>
          <Register />
        </AuthLayout>
      } />
      <Route path="/forgot-password" element={
        <AuthLayout>
          <ForgotPassword />
        </AuthLayout>
      } />
      <Route path="/verify-email" element={
        <AuthLayout>
          <VerifyEmail />
        </AuthLayout>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <PatientDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard/doctor" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['doctor', 'admin']}>
            <Layout>
              <DoctorDashboard />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      <Route path="/dashboard/admin" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      <Route path="/dashboard/staff" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['staff', 'admin']}>
            <Layout>
              <StaffDashboard />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      {/* Medical Routes */}
      <Route path="/medical/records" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['doctor', 'staff', 'admin']}>
            <Layout>
              <PatientRecords />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      <Route path="/medical/appointments" element={
        <ProtectedRoute>
          <Layout>
            <Appointments />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/medical/notebook" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['doctor', 'staff', 'admin']}>
            <Layout>
              <DigitalNotebook />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      <Route path="/medical/journey" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['doctor', 'staff', 'admin']}>
            <Layout>
              <PatientJourney />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/users" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <Layout>
              <UserManagement />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      <Route path="/admin/financial" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <Layout>
              <FinancialManagement />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      <Route path="/admin/config" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <Layout>
              <SystemConfig />
            </Layout>
          </RoleBasedRoute>
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
