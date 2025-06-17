import React from 'react';
import { Box, Typography } from '@mui/material';

const StaffManagementPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
        Staff Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Dedicated page for managing staff assignments across locations
      </Typography>
    </Box>
  );
};

export default StaffManagementPage; 