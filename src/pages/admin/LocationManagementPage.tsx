import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocationCity as LocationIcon,
  Business as BusinessIcon,
  Assessment as StatsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { UserGroup, Location } from '../../types/location';
import { userGroupService, locationService } from '../../services/locationService';

const LocationManagementPage: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [userGroupDialogOpen, setUserGroupDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const { control: ugControl, handleSubmit: ugHandleSubmit, reset: ugReset } = useForm();
  const { control: locControl, handleSubmit: locHandleSubmit, reset: locReset } = useForm();

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

  const handleCreateUserGroup = async (data: any) => {
    try {
      await userGroupService.create({
        user_group_code: data.user_group_code,
        user_group_name: data.user_group_name,
        user_group_type: data.user_group_type,
        infrastructure_type_code: data.infrastructure_type_code,
        province_code: data.province_code,
        registration_status: data.registration_status || 'pending',
        description: data.description,
        contact_person: data.contact_person,
        phone_number: data.phone_number,
        email_address: data.email_address,
      });
      toast.success('User group created successfully');
      setUserGroupDialogOpen(false);
      ugReset();
      loadData();
    } catch (error: any) {
      console.error('Error creating user group:', error);
      toast.error(error.message || 'Failed to create user group');
    }
  };

  const handleCreateLocation = async (data: any) => {
    try {
      await locationService.create({
        location_name: data.location_name,
        location_code: data.location_code,
        user_group_id: data.user_group_id,
        infrastructure_type: data.infrastructure_type,
        operational_status: data.operational_status || 'active',
        location_scope: data.location_scope || 'provincial',
        address: {
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          city: data.city,
          province_code: data.province_code,
          postal_code: data.postal_code,
          country_code: 'ZA',
        },
        contact_person: data.contact_person,
        phone_number: data.phone_number,
        email_address: data.email_address,
        max_users: data.max_users,
        max_daily_capacity: data.max_daily_capacity,
      });
      toast.success('Location created successfully');
      setLocationDialogOpen(false);
      locReset();
      loadData();
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast.error(error.message || 'Failed to create location');
    }
  };

  const handleDeleteUserGroup = async (userGroup: UserGroup) => {
    if (!confirm(`Are you sure you want to delete "${userGroup.user_group_name}"?`)) {
      return;
    }
    try {
      await userGroupService.delete(userGroup.id);
      toast.success('User group deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting user group:', error);
      toast.error(error.message || 'Failed to delete user group');
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.location_name}"?`)) {
      return;
    }
    try {
      await locationService.delete(location.id);
      toast.success('Location deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast.error(error.message || 'Failed to delete location');
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
                    {locations.filter(l => l.operational_status === 'active').length}
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
              onClick={() => setUserGroupDialogOpen(true)}
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userGroups.map((userGroup) => (
                  <TableRow key={userGroup.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {userGroup.user_group_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{userGroup.user_group_name}</TableCell>
                    <TableCell>{userGroup.user_group_type}</TableCell>
                    <TableCell>{userGroup.province_code}</TableCell>
                    <TableCell>
                      <Chip
                        label={userGroup.registration_status}
                        color={userGroup.registration_status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUserGroup(userGroup)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
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
              onClick={() => setLocationDialogOpen(true)}
            >
              Create Location
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>User Group</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id} hover>
                    <TableCell>{location.location_name}</TableCell>
                    <TableCell>{location.location_code}</TableCell>
                    <TableCell>
                      {userGroups.find(ug => ug.id === location.user_group_id)?.user_group_name}
                    </TableCell>
                    <TableCell>
                      {location.address?.address_line_1}, {location.address?.city}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={location.operational_status}
                        color={location.operational_status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteLocation(location)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Group Create Dialog */}
      <Dialog 
        open={userGroupDialogOpen} 
        onClose={() => setUserGroupDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={ugHandleSubmit(handleCreateUserGroup)}>
          <DialogTitle>Create User Group</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_code"
                  control={ugControl}
                  rules={{ required: 'User group code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Code"
                      placeholder="e.g., WC01, GP03"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_name"
                  control={ugControl}
                  rules={{ required: 'User group name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Name"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_type"
                  control={ugControl}
                  rules={{ required: 'User group type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="User Group Type"
                    >
                      <MenuItem value="fixed_dltc">Fixed DLTC</MenuItem>
                      <MenuItem value="mobile_dltc">Mobile DLTC</MenuItem>
                      <MenuItem value="regional_authority">Regional Authority</MenuItem>
                      <MenuItem value="plamark">PLAMARK</MenuItem>
                      <MenuItem value="nhelpdesk">NHELPDESK</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="infrastructure_type_code"
                  control={ugControl}
                  rules={{ required: 'Infrastructure type code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Infrastructure Type Code"
                      type="number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="province_code"
                  control={ugControl}
                  rules={{ required: 'Province is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Province"
                    >
                      <MenuItem value="WC">Western Cape</MenuItem>
                      <MenuItem value="GP">Gauteng</MenuItem>
                      <MenuItem value="KZN">KwaZulu-Natal</MenuItem>
                      <MenuItem value="EC">Eastern Cape</MenuItem>
                      <MenuItem value="FS">Free State</MenuItem>
                      <MenuItem value="LP">Limpopo</MenuItem>
                      <MenuItem value="MP">Mpumalanga</MenuItem>
                      <MenuItem value="NC">Northern Cape</MenuItem>
                      <MenuItem value="NW">North West</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_person"
                  control={ugControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone_number"
                  control={ugControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email_address"
                  control={ugControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={ugControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserGroupDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Location Create Dialog */}
      <Dialog 
        open={locationDialogOpen} 
        onClose={() => setLocationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={locHandleSubmit(handleCreateLocation)}>
          <DialogTitle>Create Location</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_name"
                  control={locControl}
                  rules={{ required: 'Location name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location Name"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_code"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location Code"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_id"
                  control={locControl}
                  rules={{ required: 'User group is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="User Group"
                    >
                      {userGroups.map((ug) => (
                        <MenuItem key={ug.id} value={ug.id}>
                          {ug.user_group_code} - {ug.user_group_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="infrastructure_type"
                  control={locControl}
                  rules={{ required: 'Infrastructure type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Infrastructure Type"
                    >
                      <MenuItem value="fixed_dltc">Fixed DLTC</MenuItem>
                      <MenuItem value="mobile_dltc">Mobile DLTC</MenuItem>
                      <MenuItem value="regional_authority">Regional Authority</MenuItem>
                      <MenuItem value="plamark">PLAMARK</MenuItem>
                      <MenuItem value="nhelpdesk">NHELPDESK</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Address Information</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="address_line_1"
                  control={locControl}
                  rules={{ required: 'Address line 1 is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 1"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="address_line_2"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 2"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="city"
                  control={locControl}
                  rules={{ required: 'City is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="province_code"
                  control={locControl}
                  rules={{ required: 'Province is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Province"
                    >
                      <MenuItem value="WC">Western Cape</MenuItem>
                      <MenuItem value="GP">Gauteng</MenuItem>
                      <MenuItem value="KZN">KwaZulu-Natal</MenuItem>
                      <MenuItem value="EC">Eastern Cape</MenuItem>
                      <MenuItem value="FS">Free State</MenuItem>
                      <MenuItem value="LP">Limpopo</MenuItem>
                      <MenuItem value="MP">Mpumalanga</MenuItem>
                      <MenuItem value="NC">Northern Cape</MenuItem>
                      <MenuItem value="NW">North West</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="postal_code"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Postal Code"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_person"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone_number"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email_address"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="max_users"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Max Users"
                      type="number"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LocationManagementPage; 