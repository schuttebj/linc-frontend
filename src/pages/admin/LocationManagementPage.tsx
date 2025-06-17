/**
 * Location Management Dashboard
 * Overview dashboard with navigation to separate management pages
 * Provides quick access to User Groups, Locations, and Staff Management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Analytics as StatsIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  LocationCity as LocationCityIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

// Services and types
import { 
  locationService, 
  userGroupService
} from '../../services/locationService';
import {
  LocationStatistics,
  UserGroupStatistics
} from '../../types/location';

// Dashboard navigation items
const DASHBOARD_ITEMS = [
  {
    title: 'User Groups',
    description: 'Manage authorities and user groups across provinces',
    icon: GroupIcon,
    path: '/dashboard/admin/user-groups',
    color: 'primary' as const,
    stats: 'user groups'
  },
  {
    title: 'Locations',
    description: 'Manage locations and facilities',
    icon: LocationCityIcon,
    path: '/dashboard/admin/locations-management',
    color: 'secondary' as const,
    stats: 'locations'
  },
  {
    title: 'Staff Management',
    description: 'Manage staff assignments across locations',
    icon: AssignmentIcon,
    path: '/dashboard/admin/staff-management',
    color: 'success' as const,
    stats: 'assignments'
  }
];

const LocationManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Statistics
  const [userGroupStats, setUserGroupStats] = useState<UserGroupStatistics | null>(null);
  const [locationStats, setLocationStats] = useState<LocationStatistics | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);

  // Load data
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [userGroupStatsData, locationStatsData] = await Promise.all([
        userGroupService.getStatistics(),
        locationService.getStatistics()
      ]);
      setUserGroupStats(userGroupStatsData);
      setLocationStats(locationStatsData);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStatsForItem = (item: typeof DASHBOARD_ITEMS[0]) => {
    switch (item.stats) {
      case 'user groups':
        return userGroupStats?.total_user_groups || 0;
      case 'locations':
        return locationStats?.total_locations || 0;
      case 'assignments':
        return locationStats?.active_count || 0;
      default:
        return 0;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Location Management Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user groups, locations, and staff assignments across your organization
          </Typography>
        </Box>
        <Tooltip title="Refresh Statistics">
          <IconButton onClick={loadStatistics} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overview Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <GroupIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {loading ? <CircularProgress size={24} /> : (userGroupStats?.total_user_groups || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total User Groups
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {userGroupStats?.active_count || 0} active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocationCityIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {loading ? <CircularProgress size={24} /> : (locationStats?.total_locations || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Locations
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {locationStats?.active_count || 0} operational
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {loading ? <CircularProgress size={24} /> : (locationStats?.active_count || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Staff Assignments
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {locationStats?.active_count || 0} active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Management Sections */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Management Sections
      </Typography>
      
      <Grid container spacing={3}>
        {DASHBOARD_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const statsValue = getStatsForItem(item);
          
          return (
            <Grid item xs={12} md={4} key={item.title}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <IconComponent color={item.color} sx={{ fontSize: 48 }} />
                    <IconButton size="small" color={item.color}>
                      <ArrowForwardIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {item.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" color={`${item.color}.main`} sx={{ fontWeight: 600 }}>
                      {loading ? <CircularProgress size={20} /> : statsValue}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color={item.color}
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Manage
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GroupIcon />}
                onClick={() => navigate('/dashboard/admin/user-groups/create')}
              >
                Create User Group
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LocationCityIcon />}
                onClick={() => navigate('/dashboard/admin/locations-management/create')}
              >
                Add Location
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/dashboard/admin/staff-management')}
              >
                Assign Staff
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<StatsIcon />}
                onClick={() => navigate('/dashboard/admin/reports')}
              >
                View Reports
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* System Status */}
      {(userGroupStats || locationStats) && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
                       System Overview: {userGroupStats?.total_user_groups || 0} user groups managing {locationStats?.total_locations || 0} locations 
           with {locationStats?.active_count || 0} staff assignments across {Object.keys(userGroupStats?.by_province || {}).length} provinces.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default LocationManagementPage; 