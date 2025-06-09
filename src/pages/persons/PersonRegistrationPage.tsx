import { Box, Typography, Paper } from '@mui/material';

const PersonRegistrationPage = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Person Registration
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Person registration form will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default PersonRegistrationPage; 