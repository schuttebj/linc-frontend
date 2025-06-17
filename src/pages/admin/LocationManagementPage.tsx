import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Analytics as StatsIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { locationService, userGroupService } from '../../services/locationService';
import { UserGroup, Location } from '../../types/location';

const LocationManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ugData, locData] = await Promise.all([
        userGroupService.getAll(),
        locationService.getAll(),
      ]);
      setUserGroups(ugData);
      setLocations(locData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUserGroup = async (userGroup: UserGroup) => {
    if (!confirm(`Are you sure you want to delete "${userGroup.user_group_name}"?`)) {
      return;
    }
    try {
      await userGroupService.delete(userGroup.id);
      toast.success('User group deleted successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting user group:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete user group');
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.location_name}"?`)) {
      return;
    }
    try {
      await locationService.delete(location.id);
      toast.success('Location deleted successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete location');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Location Management System
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="h6">{userGroups.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    User Groups
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="success" />
                <Box>
                  <Typography variant="h6">{locations.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Locations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatsIcon color="info" />
                <Box>
                                      <Typography variant="h6">
                      {locations.filter((l: Location) => l.operational_status === 'operational').length}
                    </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Locations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Groups Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">User Groups</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/admin/locations/user-groups/create')}
            >
              Create User Group
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Province</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userGroups.map((userGroup: UserGroup) => (
                  <TableRow key={userGroup.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {userGroup.user_group_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{userGroup.user_group_name}</TableCell>
                    <TableCell>{userGroup.user_group_type}</TableCell>
                    <TableCell>{userGroup.province_code}</TableCell>
                    <TableCell>
                      <Chip
                        label={userGroup.registration_status}
                        color={userGroup.registration_status === '2' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{userGroup.contact_person || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteUserGroup(userGroup)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Locations Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Locations</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/admin/locations/create')}
            >
              Create Location
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>User Group</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((location: Location) => (
                  <TableRow key={location.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {location.location_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{location.location_name}</TableCell>
                    <TableCell>
                      {userGroups.find((ug: UserGroup) => ug.id === location.user_group_id)?.user_group_code || '-'}
                    </TableCell>
                    <TableCell>{location.address?.city || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={location.operational_status}
                        color={location.operational_status === 'operational' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{location.contact_person || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteLocation(location)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LocationManagementPage; 