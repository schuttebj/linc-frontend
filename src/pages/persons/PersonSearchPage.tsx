import { Box, Typography, Paper } from '@mui/material';

const PersonSearchPage = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Person Search
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Person search functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default PersonSearchPage; 