import React from 'react';
import { Box, Typography } from '@mui/material';

const LocationsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
        Locations Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Dedicated page for managing locations and facilities
      </Typography>
    </Box>
  );
};

export default LocationsPage; 