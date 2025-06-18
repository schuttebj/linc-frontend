import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Authentication
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PersonSearchPage from './pages/persons/PersonSearchPage';
import PersonManagementPage from './pages/persons/PersonManagementPage';
import CountryConfigurationPage from './pages/admin/CountryConfigurationPage';
import LocationManagementPage from './pages/admin/LocationManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import UserFormPage from './pages/admin/UserFormPage';
import CreateUserGroupPage from './pages/admin/CreateUserGroupPage';
import CreateLocationPage from './pages/admin/CreateLocationPage';
import EditLocationPage from './pages/admin/EditLocationPage';
import UserGroupsPage from './pages/admin/UserGroupsPage';
import LocationsPage from './pages/admin/LocationsPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';

function App() {
  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Protected Dashboard routes with layout */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            
            {/* Person Management - requires person:read permission */}
            <Route path="persons">
              <Route 
                path="manage" 
                element={
                  <ProtectedRoute requiredPermission="person:create">
                    <PersonManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="register" 
                element={
                  <ProtectedRoute requiredPermission="person:create">
                    <PersonManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="search" 
                element={
                  <ProtectedRoute requiredPermission="person:read">
                    <PersonSearchPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Administration - requires admin role */}
            <Route path="admin">
              <Route 
                path="countries" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <CountryConfigurationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requiredPermission="user_management_read">
                    <UserManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="users/create" 
                element={
                  <ProtectedRoute requiredPermission="user_management_create">
                    <UserFormPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="users/:userId/edit" 
                element={
                  <ProtectedRoute requiredPermission="user_management_update">
                    <UserFormPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="locations" 
                element={
                  <ProtectedRoute requiredPermission="user_group_read">
                    <LocationManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="user-groups" 
                element={
                  <ProtectedRoute requiredPermission="user_group_read">
                    <UserGroupsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="locations-management" 
                element={
                  <ProtectedRoute requiredPermission="location_read">
                    <LocationsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="staff-management" 
                element={
                  <ProtectedRoute requiredPermission="assignment_read">
                    <StaffManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="locations/user-groups/create" 
                element={
                  <ProtectedRoute requiredPermission="user_group_create">
                    <CreateUserGroupPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="user-groups/create" 
                element={
                  <ProtectedRoute requiredPermission="user_group_create">
                    <CreateUserGroupPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="locations/create" 
                element={
                  <ProtectedRoute requiredPermission="location_create">
                    <CreateLocationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="locations-management/create" 
                element={
                  <ProtectedRoute requiredPermission="location_create">
                    <CreateLocationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="locations-management/:locationId/edit" 
                element={
                  <ProtectedRoute requiredPermission="location_update">
                    <EditLocationPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Route>
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </AuthProvider>
  );
}

export default App; 