import React from 'react';
import { Box, Typography } from '@mui/material';

const LocationManagementPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1">
        Location Management System
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Welcome to the Location Management System. This page will allow you to:
      </Typography>
      <ul>
        <li>Manage User Groups (DLTC authorities like WC01, GP03)</li>
        <li>Create and manage testing locations</li>
        <li>Assign users to locations</li>
        <li>Track resources and capacity</li>
      </ul>
    </Box>
  );
};

export default LocationManagementPage; 