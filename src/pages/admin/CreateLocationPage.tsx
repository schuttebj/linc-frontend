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
  Breadcrumbs,
  Link,
  Autocomplete,
  Avatar,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AutoFixHigh as MagicWandIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { locationService, userGroupService } from '../../services/locationService';
import { userService } from '../../services/userService';
import { 
  InfrastructureType, 
  OperationalStatus, 
  LocationScope, 
  UserGroup, 
  Location 
} from '../../types/location';
import { User, UserStatus } from '../../types/user';

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
const validatePostalCode = (value: string) => {
  if (!value) return true; // Optional field
  if (!/^[0-9]{4}$/.test(value)) return 'Postal code must be 4 digits';
  return true;
};

const CreateLocationPage: React.FC = () => {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedContactUser, setSelectedContactUser] = useState<User | null>(null);

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
      contact_user_id: '',
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
    loadUsers();
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

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.listUsers(1, 100, { 
        status: UserStatus.ACTIVE,
        isActive: true 
      });
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      // Reset to initial users list when search is cleared
      loadUsers();
      return;
    }
    
    try {
      setLoadingUsers(true);
      const searchResults = await userService.searchUsers(searchTerm, 50, {
        excludeAssignedToLocation: undefined,
        userType: undefined // Allow all user types
      });
      setUsers(searchResults || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      toast.error('Failed to search users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Update contact information when user is selected
  const handleContactUserChange = (user: User | null) => {
    setSelectedContactUser(user);
    if (user && (user.personalDetails || user.personal_details)) {
      // Handle both camelCase and snake_case API responses with proper type checking
      let fullName = '';
      let email = '';
      let phoneNumber = '';
      
      if (user.personalDetails) {
        fullName = user.personalDetails.fullName || '';
        email = user.personalDetails.email || '';
        phoneNumber = user.personalDetails.phoneNumber || '';
      } else if (user.personal_details) {
        fullName = user.personal_details.full_name || '';
        email = user.personal_details.email || '';
        phoneNumber = user.personal_details.phone_number || '';
      }
      
      setValue('contact_user_id', user.id || '');
      setValue('contact_person', fullName);
      setValue('email_address', email);
      setValue('phone_number', phoneNumber);
    } else {
      setValue('contact_user_id', '');
      setValue('contact_person', '');
      setValue('email_address', '');
      setValue('phone_number', '');
    }
  };

  // Helper function to format user display in autocomplete with safety checks
  const formatUserOption = (user: User) => {
    if (!user) return 'Unknown User';
    
    // Handle both camelCase and snake_case API responses with proper type checking
    let fullName = 'No Name';
    
    if (user.personalDetails && user.personalDetails.fullName) {
      fullName = user.personalDetails.fullName;
    } else if (user.personal_details && user.personal_details.full_name) {
      fullName = user.personal_details.full_name;
    }
    
    const username = user.username || 'No Username';
    return `${fullName} (${username})`;
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
      
      // TODO: If contact_user_id is provided, create staff assignment
      // This will be implemented when integrating with staff management
      
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
          {/* Basic Information Section */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_name"
                  control={control}
                  rules={{ required: 'Location name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location Name *"
                      placeholder="e.g., Cape Town DLTC Main Branch"
                      error={!!errors.location_name}
                      helperText={errors.location_name?.message}
                      inputProps={{ maxLength: 100 }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_id"
                  control={control}
                  rules={{ required: 'User group is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="User Group *"
                      error={!!errors.user_group_id}
                      helperText={errors.user_group_id?.message || 'Select the managing user group'}
                      sx={{ backgroundColor: 'white' }}
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
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <Controller
                    name="location_code"
                    control={control}
                    rules={{ required: 'Location code is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Location Code *"
                        placeholder="e.g., WC001L001"
                        error={!!errors.location_code}
                        helperText={errors.location_code?.message || 'Unique location identifier'}
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                        sx={{ backgroundColor: 'white' }}
                      />
                    )}
                  />
                  <Tooltip title="Auto-generate code">
                    <IconButton onClick={generateLocationCode} color="primary">
                      <MagicWandIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="infrastructure_type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Infrastructure Type"
                      sx={{ backgroundColor: 'white' }}
                    >
                      <MenuItem value={InfrastructureType.FIXED_DLTC}>Fixed DLTC</MenuItem>
                      <MenuItem value={InfrastructureType.MOBILE_DLTC}>Mobile DLTC</MenuItem>
                      <MenuItem value={InfrastructureType.PRINTING_CENTER}>Printing Center</MenuItem>
                      <MenuItem value={InfrastructureType.REGISTERING_AUTHORITY}>Registering Authority</MenuItem>
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
                      sx={{ backgroundColor: 'white' }}
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
                      sx={{ backgroundColor: 'white' }}
                    >
                      <MenuItem value={LocationScope.PROVINCIAL}>Provincial</MenuItem>
                      <MenuItem value={LocationScope.REGIONAL}>Regional</MenuItem>
                      <MenuItem value={LocationScope.LOCAL}>Local</MenuItem>
                      <MenuItem value={LocationScope.NATIONAL}>National</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Address Information Section */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Address Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="address_line_1"
                  control={control}
                  rules={{ required: 'Address is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address Line 1 *"
                      placeholder="e.g., 123 Main Street"
                      error={!!errors.address_line_1}
                      helperText={errors.address_line_1?.message}
                      inputProps={{ maxLength: 100 }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
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
                      sx={{ backgroundColor: 'white' }}
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
                      label="City *"
                      placeholder="e.g., Cape Town"
                      error={!!errors.city}
                      helperText={errors.city?.message}
                      inputProps={{ maxLength: 50 }}
                      sx={{ backgroundColor: 'white' }}
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
                      label="Province *"
                      error={!!errors.province_code}
                      helperText={errors.province_code?.message || 'Auto-filled from User Group'}
                      sx={{ backgroundColor: 'white' }}
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
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Contact Information Section */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Contact Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a user to automatically populate contact details. This user can later be assigned as the primary contact for this location.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  options={users}
                  getOptionLabel={formatUserOption}
                  value={selectedContactUser}
                  onChange={(_, newValue) => handleContactUserChange(newValue)}
                  onInputChange={(_, newInputValue) => {
                    if (newInputValue && newInputValue.length >= 2) {
                      searchUsers(newInputValue);
                    }
                  }}
                  loading={loadingUsers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Contact User (Optional)"
                      placeholder="Search for a user by name or username..."
                      sx={{ backgroundColor: 'white' }}
                      helperText="Start typing to search for users. Selected user's details will auto-populate below."
                    />
                  )}
                  renderOption={(props, user) => {
                    if (!user) return null;
                    
                    // Handle both camelCase and snake_case API responses with proper type checking
                    let fullName = 'No Name';
                    let email = 'No Email';
                    
                    if (user.personalDetails) {
                      fullName = user.personalDetails.fullName || 'No Name';
                      email = user.personalDetails.email || 'No Email';
                    } else if (user.personal_details) {
                      fullName = user.personal_details.full_name || 'No Name';
                      email = user.personal_details.email || 'No Email';
                    }
                    
                    const username = user.username || 'No Username';
                    
                    return (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {fullName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {username} • {email}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  sx={{ backgroundColor: 'white' }}
                />
              </Grid>

              {selectedContactUser && ((selectedContactUser as any).personalDetails || (selectedContactUser as any).personal_details) && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: 'white' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      Selected Contact User
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(() => {
                        const personalDetails = (selectedContactUser as any).personalDetails || (selectedContactUser as any).personal_details;
                        const fullName = personalDetails.fullName || personalDetails.full_name || 'No Name';
                        const email = personalDetails.email || 'No Email';
                        const phoneNumber = personalDetails.phoneNumber || personalDetails.phone_number;
                        
                        return (
                          <>
                            <Chip label={`Name: ${fullName}`} variant="outlined" />
                            <Chip label={`Email: ${email}`} variant="outlined" />
                            {phoneNumber && (
                              <Chip label={`Phone: ${phoneNumber}`} variant="outlined" />
                            )}
                            <Chip label={`Username: ${selectedContactUser.username || 'No Username'}`} variant="outlined" />
                          </>
                        );
                      })()}
                    </Box>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_person"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person Name"
                      placeholder="Auto-populated from selected user"
                      error={!!errors.contact_person}
                      helperText={selectedContactUser ? 'Auto-populated from selected user' : 'Select a user above or enter manually'}
                      inputProps={{ maxLength: 100 }}
                      sx={{ backgroundColor: 'white' }}
                      InputProps={{ readOnly: !!selectedContactUser }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="phone_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      placeholder="Auto-populated from selected user"
                      error={!!errors.phone_number}
                      helperText={selectedContactUser ? 'Auto-populated from selected user' : 'Select a user above or enter manually'}
                      inputProps={{ maxLength: 15 }}
                      sx={{ backgroundColor: 'white' }}
                      InputProps={{ readOnly: !!selectedContactUser }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="email_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="email"
                      label="Email Address"
                      placeholder="Auto-populated from selected user"
                      error={!!errors.email_address}
                      helperText={selectedContactUser ? 'Auto-populated from selected user' : 'Select a user above or enter manually'}
                      inputProps={{ maxLength: 100 }}
                      sx={{ backgroundColor: 'white' }}
                      InputProps={{ readOnly: !!selectedContactUser }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Capacity Information Section */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Capacity Information
            </Typography>
            
            <Grid container spacing={3}>
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
                      sx={{ backgroundColor: 'white' }}
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
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Hidden fields */}
          <Controller
            name="contact_user_id"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
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
        </form>
      </Paper>
    </Box>
  );
};

export default CreateLocationPage; 