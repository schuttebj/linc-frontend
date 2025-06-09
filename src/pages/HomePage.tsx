import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Grid,
  Chip
} from '@mui/material';


const HomePage = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to LINC Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Driver's Licensing Management System
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Backend: Online" color="success" size="small" />
                <Chip label="Database: Connected" color="success" size="small" />
                <Chip label="Services: Active" color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the navigation menu to access system features:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">• Register new persons</Typography>
                <Typography variant="body2">• Search existing records</Typography>
                <Typography variant="body2">• Configure country settings</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Version</Typography>
                  <Typography variant="body1">1.0.0</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Environment</Typography>
                  <Typography variant="body1">Production</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Country</Typography>
                  <Typography variant="body1">Multi-Country Support</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Architecture</Typography>
                  <Typography variant="body1">Single-Country Deployment</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage; 