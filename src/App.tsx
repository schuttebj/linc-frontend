
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import PersonRegistrationPage from './pages/persons/PersonRegistrationPage';
import PersonSearchPage from './pages/persons/PersonSearchPage';
import CountryConfigurationPage from './pages/admin/CountryConfigurationPage';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard routes with layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<HomePage />} />
          
          {/* Person Management */}
          <Route path="persons">
            <Route path="register" element={<PersonRegistrationPage />} />
            <Route path="search" element={<PersonSearchPage />} />
          </Route>
          
          {/* Administration */}
          <Route path="admin">
            <Route path="countries" element={<CountryConfigurationPage />} />
          </Route>
        </Route>
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Box>
  );
}

export default App; 