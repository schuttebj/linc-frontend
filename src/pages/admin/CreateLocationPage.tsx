import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  Breadcrumbs,
  Link,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AutoFixHigh as MagicWandIcon,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { locationService, userGroupService } from '../../services/locationService';
import { 
  InfrastructureType, 
  OperationalStatus, 
  LocationScope, 
  UserGroup, 
  Location 
} from '../../types/location';

// Constants
const PROVINCES = [
  { code: 'EC', name: 'Eastern Cape' },
  { code: 'FS', name: 'Free State' },
  { code: 'GP', name: 'Gauteng' },
  { code: 'KZN', name: 'KwaZulu-Natal' },
  { code: 'LP', name: 'Limpopo' },
  { code: 'MP', name: 'Mpumalanga' },
  { code: 'NC', name: 'Northern Cape' },
  { code: 'NW', name: 'North West' },
  { code: 'WC', name: 'Western Cape' },
];

// Validation functions
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

const CreateLocationPage: React.FC = () => {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Form setup with validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      location_name: '',
      location_code: '',
      user_group_id: '',
      infrastructure_type: InfrastructureType.FIXED_DLTC,
      operational_status: OperationalStatus.OPERATIONAL,
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
  const userGroupId = watch('user_group_id');
  const locationName = watch('location_name');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
    }
  };

  // Auto-generate location code
  const generateLocationCode = useCallback(() => {
    if (!userGroupId || !locationName) return;

    const userGroup = userGroups.find((ug: UserGroup) => ug.id === userGroupId);
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

    setValue('location_code', newCode);
  }, [userGroupId, locationName, userGroups, locations, setValue]);

  // Auto-fill location province when user group changes
  useEffect(() => {
    if (userGroupId) {
      const userGroup = userGroups.find((ug: UserGroup) => ug.id === userGroupId);
      if (userGroup) {
        setValue('province_code', userGroup.province_code);
      }
    }
  }, [userGroupId, userGroups, setValue]);

  const handleCreateLocation = async (data: any) => {
    try {
      const createData = {
        location_name: data.location_name,
        location_code: data.location_code,
        user_group_id: data.user_group_id,
        infrastructure_type: data.infrastructure_type,
        operational_status: data.operational_status || OperationalStatus.OPERATIONAL,
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
      navigate('/dashboard/admin/locations');
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to create location');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={() => navigate('/dashboard/admin/locations')}
            sx={{ cursor: 'pointer' }}
          >
            Location Management
          </Link>
          <Typography color="text.primary">Create Location</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/admin/locations')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Create New Location
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(handleCreateLocation)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="location_name"
                control={control}
                rules={{ required: 'Location name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Location Name"
                    placeholder="e.g., Cape Town DLTC - Main Office"
                    error={!!errors.location_name}
                    helperText={errors.location_name?.message}
                    inputProps={{ maxLength: 200 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <Controller
                  name="location_code"
                  control={control}
                  rules={{ required: 'Location code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location Code"
                      placeholder="e.g., WC01L001"
                      error={!!errors.location_code}
                      helperText={errors.location_code?.message || 'Format: UserGroupCode + L + 3 digits'}
                      inputProps={{ maxLength: 20, style: { textTransform: 'uppercase' } }}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Tooltip title="Auto-generate code">
                  <IconButton onClick={generateLocationCode} disabled={!userGroupId || !locationName}>
                    <MagicWandIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="user_group_id"
                control={control}
                rules={{ required: 'User group is required' }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={userGroups}
                    getOptionLabel={(option: UserGroup) => `${option.user_group_code} - ${option.user_group_name}`}
                    value={userGroups.find((ug: UserGroup) => ug.id === field.value) || null}
                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="User Group"
                        error={!!errors.user_group_id}
                        helperText={errors.user_group_id?.message || 'Select the authority managing this location'}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="infrastructure_type"
                control={control}
                rules={{ required: 'Infrastructure type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Infrastructure Type"
                    error={!!errors.infrastructure_type}
                    helperText={errors.infrastructure_type?.message}
                  >
                    <MenuItem value={InfrastructureType.FIXED_DLTC}>Fixed DLTC</MenuItem>
                    <MenuItem value={InfrastructureType.MOBILE_DLTC}>Mobile DLTC</MenuItem>
                    <MenuItem value={InfrastructureType.PRINTING_CENTER}>Printing Center</MenuItem>
                    <MenuItem value={InfrastructureType.REGISTERING_AUTHORITY}>Registering Authority</MenuItem>
                    <MenuItem value={InfrastructureType.PROVINCIAL_OFFICE}>Provincial Office</MenuItem>
                    <MenuItem value={InfrastructureType.NATIONAL_OFFICE}>National Office</MenuItem>
                    <MenuItem value={InfrastructureType.VEHICLE_TESTING}>Vehicle Testing</MenuItem>
                    <MenuItem value={InfrastructureType.HELP_DESK}>Help Desk</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="operational_status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Operational Status"
                    error={!!errors.operational_status}
                    helperText={errors.operational_status?.message}
                  >
                    <MenuItem value={OperationalStatus.OPERATIONAL}>Operational</MenuItem>
                    <MenuItem value={OperationalStatus.MAINTENANCE}>Maintenance</MenuItem>
                    <MenuItem value={OperationalStatus.SUSPENDED}>Suspended</MenuItem>
                    <MenuItem value={OperationalStatus.SETUP}>Setup</MenuItem>
                    <MenuItem value={OperationalStatus.DECOMMISSIONED}>Decommissioned</MenuItem>
                    <MenuItem value={OperationalStatus.INSPECTION}>Inspection</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="location_scope"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Location Scope"
                    error={!!errors.location_scope}
                    helperText={errors.location_scope?.message}
                  >
                    <MenuItem value={LocationScope.NATIONAL}>National</MenuItem>
                    <MenuItem value={LocationScope.PROVINCIAL}>Provincial</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                Address Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="address_line_1"
                control={control}
                rules={{ required: 'Address line 1 is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address Line 1"
                    placeholder="Street address"
                    error={!!errors.address_line_1}
                    helperText={errors.address_line_1?.message}
                    inputProps={{ maxLength: 100 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="address_line_2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address Line 2"
                    placeholder="Apartment, suite, etc. (optional)"
                    error={!!errors.address_line_2}
                    helperText={errors.address_line_2?.message}
                    inputProps={{ maxLength: 100 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="city"
                control={control}
                rules={{ required: 'City is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="City"
                    placeholder="e.g., Cape Town"
                    error={!!errors.city}
                    helperText={errors.city?.message}
                    inputProps={{ maxLength: 50 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="province_code"
                control={control}
                rules={{ required: 'Province is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Province"
                    error={!!errors.province_code}
                    helperText={errors.province_code?.message || 'Auto-filled from User Group'}
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

            <Grid item xs={12} md={6}>
              <Controller
                name="postal_code"
                control={control}
                rules={{ validate: validatePostalCode }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Postal Code"
                    placeholder="e.g., 8001"
                    error={!!errors.postal_code}
                    helperText={errors.postal_code?.message || 'South African 4-digit postal code'}
                    inputProps={{ maxLength: 4 }}
                  />
                )}
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="contact_person"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Contact Person"
                    placeholder="Name of location manager"
                    error={!!errors.contact_person}
                    helperText={errors.contact_person?.message}
                    inputProps={{ maxLength: 100 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="phone_number"
                control={control}
                rules={{ validate: validatePhoneNumber }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    placeholder="+27123456789 or 0123456789"
                    error={!!errors.phone_number}
                    helperText={errors.phone_number?.message || 'South African format: +27 or 0 + 9 digits'}
                    inputProps={{ maxLength: 15 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="email_address"
                control={control}
                rules={{ validate: validateEmail }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    placeholder="location@example.co.za"
                    error={!!errors.email_address}
                    helperText={errors.email_address?.message}
                    inputProps={{ maxLength: 100 }}
                  />
                )}
              />
            </Grid>

            {/* Capacity Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                Capacity Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="max_users"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label="Maximum Users"
                    placeholder="e.g., 50"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    error={!!errors.max_users}
                    helperText={errors.max_users?.message || 'Maximum concurrent users at this location'}
                    inputProps={{ min: 1, max: 10000 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="max_daily_capacity"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label="Maximum Daily Capacity"
                    placeholder="e.g., 500"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    error={!!errors.max_daily_capacity}
                    helperText={errors.max_daily_capacity?.message || 'Maximum services per day'}
                    inputProps={{ min: 1, max: 100000 }}
                  />
                )}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/admin/locations')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Location'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateLocationPage; 