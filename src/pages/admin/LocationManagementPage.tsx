import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  Alert,
  Autocomplete,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocationCity as LocationIcon,
  Business as BusinessIcon,
  Assessment as StatsIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { 
  UserGroup, 
  Location, 
  UserGroupType, 
  RegistrationStatus, 
  InfrastructureType,
  OperationalStatus,
  LocationScope 
} from '../../types/location';
import { userGroupService, locationService } from '../../services/locationService';

// Constants
const PROVINCES = [
  { code: 'WC', name: 'Western Cape' },
  { code: 'GP', name: 'Gauteng' },
  { code: 'KZN', name: 'KwaZulu-Natal' },
  { code: 'EC', name: 'Eastern Cape' },
  { code: 'FS', name: 'Free State' },
  { code: 'LP', name: 'Limpopo' },
  { code: 'MP', name: 'Mpumalanga' },
  { code: 'NC', name: 'Northern Cape' },
  { code: 'NW', name: 'North West' },
];

const USER_GROUP_TYPES = [
  { value: UserGroupType.FIXED_DLTC, label: 'Fixed DLTC', code: 10 },
  { value: UserGroupType.MOBILE_DLTC, label: 'Mobile DLTC', code: 11 },
  { value: UserGroupType.REGIONAL_AUTHORITY, label: 'Regional Authority', code: 20 },
  { value: UserGroupType.PLAMARK, label: 'Provincial Help Desk', code: 30 },
  { value: UserGroupType.NHELPDESK, label: 'National Help Desk', code: 31 },
];

const INFRASTRUCTURE_TYPES = [
  { value: InfrastructureType.FIXED_DLTC, label: 'Fixed DLTC' },
  { value: InfrastructureType.MOBILE_DLTC, label: 'Mobile DLTC' },
  { value: InfrastructureType.REGIONAL_AUTHORITY, label: 'Regional Authority' },
  { value: InfrastructureType.PLAMARK, label: 'Provincial Help Desk' },
  { value: InfrastructureType.NHELPDESK, label: 'National Help Desk' },
];

// Validation functions
const validateUserGroupCode = (value: string, provinceCode?: string) => {
  if (!value) return 'User group code is required';
  if (!/^[A-Z0-9]{4}$/.test(value)) return 'Code must be 4 alphanumeric characters (e.g., WC01, GP03)';
  if (provinceCode && !value.startsWith(provinceCode)) return 'Code must start with selected province code';
  return true;
};

const validatePhoneNumber = (value: string) => {
  if (!value) return true; // Optional field
  if (!/^(\+27|0)[0-9]{9}$/.test(value)) return 'Please enter a valid South African phone number';
  return true;
};

const validateEmail = (value: string) => {
  if (!value) return true; // Optional field
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
  return true;
};

const validatePostalCode = (value: string) => {
  if (!value) return true; // Optional field
  if (!/^[0-9]{4}$/.test(value)) return 'Postal code must be 4 digits';
  return true;
};

const LocationManagementPage: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [userGroupDialogOpen, setUserGroupDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  // Form setup with validation
  const {
    control: ugControl,
    handleSubmit: ugHandleSubmit,
    reset: ugReset,
    watch: ugWatch,
    setValue: ugSetValue,
    formState: { errors: ugErrors, isSubmitting: ugSubmitting }
  } = useForm({
    defaultValues: {
      user_group_code: '',
      user_group_name: '',
      user_group_type: UserGroupType.FIXED_DLTC,
      infrastructure_type_code: 10,
      province_code: '',
      registration_status: RegistrationStatus.ACTIVE,
      description: '',
      contact_person: '',
      phone_number: '',
      email_address: '',
    }
  });

  const {
    control: locControl,
    handleSubmit: locHandleSubmit,
    reset: locReset,
    watch: locWatch,
    setValue: locSetValue,
    formState: { errors: locErrors, isSubmitting: locSubmitting }
  } = useForm({
    defaultValues: {
      location_name: '',
      location_code: '',
      user_group_id: '',
      infrastructure_type: InfrastructureType.FIXED_DLTC,
      operational_status: OperationalStatus.ACTIVE,
      location_scope: LocationScope.PROVINCIAL,
      address_line_1: '',
      address_line_2: '',
      city: '',
      province_code: '',
      postal_code: '',
      contact_person: '',
      phone_number: '',
      email_address: '',
      max_users: undefined,
      max_daily_capacity: undefined,
    }
  });

  // Watch form values for auto-generation
  const ugProvinceCode = ugWatch('province_code');
  const ugUserGroupType = ugWatch('user_group_type');

  const locUserGroupId = locWatch('user_group_id');
  const locLocationName = locWatch('location_name');

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

  // Auto-generate user group code
  const generateUserGroupCode = useCallback(() => {
    if (!ugProvinceCode || !ugUserGroupType) return;

    const existingCodes = userGroups
      .filter((ug: UserGroup) => ug.user_group_code.startsWith(ugProvinceCode))
      .map((ug: UserGroup) => ug.user_group_code);

    // Generate sequential number
    let sequence = 1;
    let newCode = `${ugProvinceCode}${sequence.toString().padStart(2, '0')}`;
    
    while (existingCodes.includes(newCode) && sequence < 99) {
      sequence++;
      newCode = `${ugProvinceCode}${sequence.toString().padStart(2, '0')}`;
    }

    ugSetValue('user_group_code', newCode);
  }, [ugProvinceCode, ugUserGroupType, userGroups, ugSetValue]);

  // Auto-generate user group name
  const generateUserGroupName = useCallback(() => {
    if (!ugProvinceCode || !ugUserGroupType) return;

    const province = PROVINCES.find(p => p.code === ugProvinceCode);
    const type = USER_GROUP_TYPES.find(t => t.value === ugUserGroupType);
    
    if (province && type) {
      let baseName = '';
      if (type.value === UserGroupType.FIXED_DLTC) {
        baseName = `${province.name} DLTC`;
      } else if (type.value === UserGroupType.MOBILE_DLTC) {
        baseName = `${province.name} Mobile DLTC`;
      } else if (type.value === UserGroupType.REGIONAL_AUTHORITY) {
        baseName = `${province.name} Regional Authority`;
      } else if (type.value === UserGroupType.PLAMARK) {
        baseName = `${province.name} Help Desk`;
      } else if (type.value === UserGroupType.NHELPDESK) {
        baseName = 'National Help Desk';
      }

      ugSetValue('user_group_name', baseName);
    }
  }, [ugProvinceCode, ugUserGroupType, ugSetValue]);

  // Auto-generate location code
  const generateLocationCode = useCallback(() => {
    if (!locUserGroupId || !locLocationName) return;

    const userGroup = userGroups.find((ug: UserGroup) => ug.id === locUserGroupId);
    if (!userGroup) return;

    const existingCodes = locations
      .filter((loc: Location) => loc.location_code?.startsWith(userGroup.user_group_code))
      .map((loc: Location) => loc.location_code);

    // Generate sequential code
    let sequence = 1;
    let newCode = `${userGroup.user_group_code}L${sequence.toString().padStart(3, '0')}`;
    
    while (existingCodes.includes(newCode) && sequence < 999) {
      sequence++;
      newCode = `${userGroup.user_group_code}L${sequence.toString().padStart(3, '0')}`;
    }

    locSetValue('location_code', newCode);
  }, [locUserGroupId, locLocationName, userGroups, locations, locSetValue]);

  // Auto-fill infrastructure type code when user group type changes
  useEffect(() => {
    const selectedType = USER_GROUP_TYPES.find(t => t.value === ugUserGroupType);
    if (selectedType) {
      ugSetValue('infrastructure_type_code', selectedType.code);
    }
  }, [ugUserGroupType, ugSetValue]);

  // Auto-fill location province when user group changes
  useEffect(() => {
    if (locUserGroupId) {
      const userGroup = userGroups.find((ug: UserGroup) => ug.id === locUserGroupId);
      if (userGroup) {
        locSetValue('province_code', userGroup.province_code);
      }
    }
  }, [locUserGroupId, userGroups, locSetValue]);

  const handleCreateUserGroup = async (data: any) => {
    try {
      const createData = {
        user_group_code: data.user_group_code,
        user_group_name: data.user_group_name,
        user_group_type: data.user_group_type,
        infrastructure_type_code: data.infrastructure_type_code,
        province_code: data.province_code,
        registration_status: data.registration_status || RegistrationStatus.ACTIVE,
        description: data.description,
        contact_person: data.contact_person,
        phone_number: data.phone_number,
        email_address: data.email_address,
      };

      await userGroupService.create(createData);
      toast.success('User group created successfully');
      setUserGroupDialogOpen(false);
      ugReset();
      await loadData();
    } catch (error: any) {
      console.error('Error creating user group:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to create user group');
    }
  };

  const handleCreateLocation = async (data: any) => {
    try {
      const createData = {
        location_name: data.location_name,
        location_code: data.location_code,
        user_group_id: data.user_group_id,
        infrastructure_type: data.infrastructure_type,
        operational_status: data.operational_status || OperationalStatus.ACTIVE,
        location_scope: data.location_scope || LocationScope.PROVINCIAL,
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
      };

      await locationService.create(createData);
      toast.success('Location created successfully');
      setLocationDialogOpen(false);
      locReset();
      await loadData();
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to create location');
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
                    {locations.filter((l: Location) => l.operational_status === 'active').length}
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
                        color={userGroup.registration_status === 'active' ? 'success' : 'default'}
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
              onClick={() => setLocationDialogOpen(true)}
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
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Address</TableCell>
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
                      {userGroups.find((ug: UserGroup) => ug.id === location.user_group_id)?.user_group_name}
                    </TableCell>
                    <TableCell>{location.infrastructure_type}</TableCell>
                    <TableCell>
                      <Chip
                        label={location.operational_status}
                        color={location.operational_status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{location.address?.city}</TableCell>
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

      {/* User Group Create Dialog */}
      <Dialog 
        open={userGroupDialogOpen} 
        onClose={() => setUserGroupDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={ugHandleSubmit(handleCreateUserGroup)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon />
              Create User Group
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              User Group codes and names can be auto-generated based on your selections.
            </Alert>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Province Selection */}
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
                      error={!!ugErrors.province_code}
                      helperText={ugErrors.province_code?.message}
                    >
                      {PROVINCES.map((province) => (
                        <MenuItem key={province.code} value={province.code}>
                          {province.name} ({province.code})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* User Group Type */}
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
                      error={!!ugErrors.user_group_type}
                      helperText={ugErrors.user_group_type?.message}
                    >
                      {USER_GROUP_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* User Group Code with auto-generate */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_code"
                  control={ugControl}
                  rules={{ 
                    required: 'User group code is required',
                    validate: (value) => validateUserGroupCode(value, ugProvinceCode)
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Code"
                      placeholder="e.g., WC01, GP03"
                      error={!!ugErrors.user_group_code}
                      helperText={ugErrors.user_group_code?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={generateUserGroupCode}
                              disabled={!ugProvinceCode || !ugUserGroupType}
                              size="small"
                            >
                              <AutoIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* User Group Name with auto-generate */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_name"
                  control={ugControl}
                  rules={{ 
                    required: 'User group name is required',
                    minLength: { value: 3, message: 'Name must be at least 3 characters' },
                    maxLength: { value: 100, message: 'Name must not exceed 100 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Name"
                      error={!!ugErrors.user_group_name}
                      helperText={ugErrors.user_group_name?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={generateUserGroupName}
                              disabled={!ugProvinceCode || !ugUserGroupType}
                              size="small"
                            >
                              <AutoIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Infrastructure Type Code (auto-filled) */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="infrastructure_type_code"
                  control={ugControl}
                  rules={{ 
                    required: 'Infrastructure type code is required',
                    min: { value: 1, message: 'Must be a positive number' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Infrastructure Type Code"
                      type="number"
                      error={!!ugErrors.infrastructure_type_code}
                      helperText={ugErrors.infrastructure_type_code?.message || "Auto-filled based on type"}
                    />
                  )}
                />
              </Grid>

              {/* Registration Status */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="registration_status"
                  control={ugControl}
                  rules={{ required: 'Registration status is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Registration Status"
                      error={!!ugErrors.registration_status}
                      helperText={ugErrors.registration_status?.message}
                    >
                      <MenuItem value={RegistrationStatus.ACTIVE}>Active</MenuItem>
                      <MenuItem value={RegistrationStatus.PENDING}>Pending</MenuItem>
                      <MenuItem value={RegistrationStatus.INACTIVE}>Inactive</MenuItem>
                      <MenuItem value={RegistrationStatus.SUSPENDED}>Suspended</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Contact Information (Optional)
                </Typography>
              </Grid>

              {/* Contact Person */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_person"
                  control={ugControl}
                  rules={{ 
                    maxLength: { value: 100, message: 'Contact person must not exceed 100 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person"
                      error={!!ugErrors.contact_person}
                      helperText={ugErrors.contact_person?.message}
                    />
                  )}
                />
              </Grid>

              {/* Phone Number */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone_number"
                  control={ugControl}
                  rules={{ validate: validatePhoneNumber }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      placeholder="+27123456789 or 0123456789"
                      error={!!ugErrors.phone_number}
                      helperText={ugErrors.phone_number?.message}
                    />
                  )}
                />
              </Grid>

              {/* Email Address */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="email_address"
                  control={ugControl}
                  rules={{ validate: validateEmail }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!ugErrors.email_address}
                      helperText={ugErrors.email_address?.message}
                    />
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={ugControl}
                  rules={{ 
                    maxLength: { value: 500, message: 'Description must not exceed 500 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                      error={!!ugErrors.description}
                      helperText={ugErrors.description?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserGroupDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={ugSubmitting}
            >
              {ugSubmitting ? 'Creating...' : 'Create User Group'}
            </Button>
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
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon />
              Create Location
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Location codes are auto-generated based on the selected User Group.
            </Alert>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* User Group Selection */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_id"
                  control={locControl}
                  rules={{ required: 'User group is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={userGroups}
                      getOptionLabel={(option: UserGroup) => `${option.user_group_code} - ${option.user_group_name}`}
                      value={userGroups.find((ug: UserGroup) => ug.id === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="User Group"
                          error={!!locErrors.user_group_id}
                          helperText={locErrors.user_group_id?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Infrastructure Type */}
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
                      error={!!locErrors.infrastructure_type}
                      helperText={locErrors.infrastructure_type?.message}
                    >
                      {INFRASTRUCTURE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Location Name */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_name"
                  control={locControl}
                  rules={{ 
                    required: 'Location name is required',
                    minLength: { value: 3, message: 'Name must be at least 3 characters' },
                    maxLength: { value: 200, message: 'Name must not exceed 200 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location Name"
                      error={!!locErrors.location_name}
                      helperText={locErrors.location_name?.message}
                    />
                  )}
                />
              </Grid>

              {/* Location Code (auto-generated) */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_code"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location Code"
                      error={!!locErrors.location_code}
                      helperText={locErrors.location_code?.message || "Auto-generated"}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={generateLocationCode}
                              disabled={!locUserGroupId || !locLocationName}
                              size="small"
                            >
                              <AutoIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Operational Status */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="operational_status"
                  control={locControl}
                  rules={{ required: 'Operational status is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Operational Status"
                      error={!!locErrors.operational_status}
                      helperText={locErrors.operational_status?.message}
                    >
                      <MenuItem value={OperationalStatus.ACTIVE}>Active</MenuItem>
                      <MenuItem value={OperationalStatus.INACTIVE}>Inactive</MenuItem>
                      <MenuItem value={OperationalStatus.MAINTENANCE}>Maintenance</MenuItem>
                      <MenuItem value={OperationalStatus.SUSPENDED}>Suspended</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              {/* Location Scope */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_scope"
                  control={locControl}
                  rules={{ required: 'Location scope is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Location Scope"
                      error={!!locErrors.location_scope}
                      helperText={locErrors.location_scope?.message}
                    >
                      <MenuItem value={LocationScope.NATIONAL}>National</MenuItem>
                      <MenuItem value={LocationScope.PROVINCIAL}>Provincial</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Address Information
                </Typography>
              </Grid>

              {/* Address Line 1 */}
              <Grid item xs={12}>
                <Controller
                  name="address_line_1"
                  control={locControl}
                  rules={{ 
                    required: 'Address line 1 is required',
                    maxLength: { value: 100, message: 'Address line 1 must not exceed 100 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 1"
                      error={!!locErrors.address_line_1}
                      helperText={locErrors.address_line_1?.message}
                    />
                  )}
                />
              </Grid>

              {/* Address Line 2 */}
              <Grid item xs={12}>
                <Controller
                  name="address_line_2"
                  control={locControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 2 (Optional)"
                    />
                  )}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="city"
                  control={locControl}
                  rules={{ 
                    required: 'City is required',
                    maxLength: { value: 50, message: 'City must not exceed 50 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                      error={!!locErrors.city}
                      helperText={locErrors.city?.message}
                    />
                  )}
                />
              </Grid>

              {/* Province (auto-filled) */}
              <Grid item xs={12} md={3}>
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
                      error={!!locErrors.province_code}
                      helperText={locErrors.province_code?.message || "Auto-filled"}
                    >
                      {PROVINCES.map((province) => (
                        <MenuItem key={province.code} value={province.code}>
                          {province.code}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Postal Code */}
              <Grid item xs={12} md={3}>
                <Controller
                  name="postal_code"
                  control={locControl}
                  rules={{ validate: validatePostalCode }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Postal Code"
                      placeholder="1234"
                      error={!!locErrors.postal_code}
                      helperText={locErrors.postal_code?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Contact & Capacity (Optional)
                </Typography>
              </Grid>

              {/* Contact Person */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_person"
                  control={locControl}
                  rules={{ 
                    maxLength: { value: 100, message: 'Contact person must not exceed 100 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person"
                      error={!!locErrors.contact_person}
                      helperText={locErrors.contact_person?.message}
                    />
                  )}
                />
              </Grid>

              {/* Phone Number */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone_number"
                  control={locControl}
                  rules={{ validate: validatePhoneNumber }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      placeholder="+27123456789 or 0123456789"
                      error={!!locErrors.phone_number}
                      helperText={locErrors.phone_number?.message}
                    />
                  )}
                />
              </Grid>

              {/* Email Address */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="email_address"
                  control={locControl}
                  rules={{ validate: validateEmail }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!locErrors.email_address}
                      helperText={locErrors.email_address?.message}
                    />
                  )}
                />
              </Grid>

              {/* Max Users */}
              <Grid item xs={12} md={3}>
                <Controller
                  name="max_users"
                  control={locControl}
                  rules={{
                    min: { value: 1, message: 'Must be a positive number' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Max Users"
                      type="number"
                      error={!!locErrors.max_users}
                      helperText={locErrors.max_users?.message}
                    />
                  )}
                />
              </Grid>

              {/* Max Daily Capacity */}
              <Grid item xs={12} md={3}>
                <Controller
                  name="max_daily_capacity"
                  control={locControl}
                  rules={{
                    min: { value: 1, message: 'Must be a positive number' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Daily Capacity"
                      type="number"
                      error={!!locErrors.max_daily_capacity}
                      helperText={locErrors.max_daily_capacity?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={locSubmitting}
            >
              {locSubmitting ? 'Creating...' : 'Create Location'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LocationManagementPage; 