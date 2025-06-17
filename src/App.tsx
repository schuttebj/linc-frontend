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
import CreateUserGroupPage from './pages/admin/CreateUserGroupPage';
import CreateLocationPage from './pages/admin/CreateLocationPage';

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
                path="locations" 
                element={
                  <ProtectedRoute requiredPermission="user_group_read">
                    <LocationManagementPage />
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
                path="locations/create" 
                element={
                  <ProtectedRoute requiredPermission="location_create">
                    <CreateLocationPage />
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