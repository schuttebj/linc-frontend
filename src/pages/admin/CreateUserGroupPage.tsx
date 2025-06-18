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
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Avatar,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userGroupService } from '../../services/locationService';
import { UserGroupType, RegistrationStatus, UserGroup } from '../../types/location';
import { userService } from '../../services/userService';
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

const USER_GROUP_TYPES = [
  { value: UserGroupType.FIXED_DLTC, label: 'Fixed DLTC', code: 10 },
  { value: UserGroupType.MOBILE_DLTC, label: 'Mobile DLTC', code: 11 },
  { value: UserGroupType.PRINTING_CENTER, label: 'Printing Center', code: 12 },
  { value: UserGroupType.REGISTERING_AUTHORITY, label: 'Registering Authority', code: 20 },
  { value: UserGroupType.PROVINCIAL_HELP_DESK, label: 'Provincial Help Desk', code: 30 },
  { value: UserGroupType.NATIONAL_HELP_DESK, label: 'National Help Desk', code: 31 },
  { value: UserGroupType.VEHICLE_TESTING_STATION, label: 'Vehicle Testing Station', code: 40 },
  { value: UserGroupType.ADMIN_OFFICE, label: 'Admin Office', code: 50 },
];

const CreateUserGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
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
      user_group_code: '',
      user_group_name: '',
      additional_name: '', // New field for additional naming
      user_group_type: UserGroupType.FIXED_DLTC,
      infrastructure_type_code: 10,
      province_code: '',
      registration_status: RegistrationStatus.REGISTERED,
      description: '',
      contact_user_id: '', // New field for selected user
      contact_person: '',
      phone_number: '',
      email_address: '',
    }
  });

  // Watch form values for auto-generation
  const provinceCode = watch('province_code');
  const userGroupType = watch('user_group_type');
  const additionalName = watch('additional_name');

  useEffect(() => {
    loadUserGroups();
    loadUsers();
  }, []);

  const loadUserGroups = async () => {
    try {
      const data = await userGroupService.getAll();
      setUserGroups(data);
    } catch (error) {
      console.error('Error loading user groups:', error);
      toast.error('Failed to load user groups');
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.listUsers(1, 100, { 
        status: UserStatus.ACTIVE,
        isActive: true 
      });
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    try {
      setLoadingUsers(true);
      const searchResults = await userService.searchUsers(searchTerm, 50, {
        excludeAssignedToLocation: undefined,
        userType: undefined // Allow all user types
      });
      setUsers(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Auto-generate user group code
  const generateUserGroupCode = useCallback(() => {
    if (!provinceCode || !userGroupType) return;

    const existingCodes = userGroups
      .filter((ug: UserGroup) => ug.user_group_code.startsWith(provinceCode))
      .map((ug: UserGroup) => ug.user_group_code);

    // Generate sequential number
    let sequence = 1;
    let newCode = `${provinceCode}${sequence.toString().padStart(2, '0')}`;
    
    while (existingCodes.includes(newCode) && sequence < 99) {
      sequence++;
      newCode = `${provinceCode}${sequence.toString().padStart(2, '0')}`;
    }

    setValue('user_group_code', newCode);
  }, [provinceCode, userGroupType, userGroups, setValue]);

  // Auto-generate base user group name
  const generateBaseUserGroupName = useCallback(() => {
    if (!provinceCode || !userGroupType) return '';

    const province = PROVINCES.find(p => p.code === provinceCode);
    const type = USER_GROUP_TYPES.find(t => t.value === userGroupType);
    
    if (province && type) {
      if (type.value === UserGroupType.FIXED_DLTC) {
        return `${province.name} DLTC`;
      } else if (type.value === UserGroupType.MOBILE_DLTC) {
        return `${province.name} Mobile DLTC`;
      } else if (type.value === UserGroupType.REGISTERING_AUTHORITY) {
        return `${province.name} Registering Authority`;
      } else if (type.value === UserGroupType.PROVINCIAL_HELP_DESK) {
        return `${province.name} Help Desk`;
      } else if (type.value === UserGroupType.NATIONAL_HELP_DESK) {
        return 'National Help Desk';
      } else if (type.value === UserGroupType.PRINTING_CENTER) {
        return `${province.name} Printing Center`;
      } else if (type.value === UserGroupType.VEHICLE_TESTING_STATION) {
        return `${province.name} Testing Station`;
      } else if (type.value === UserGroupType.ADMIN_OFFICE) {
        return `${province.name} Admin Office`;
      }
    }
    return '';
  }, [provinceCode, userGroupType]);

  // Update full name when base name or additional name changes
  useEffect(() => {
    const baseName = generateBaseUserGroupName();
    if (baseName) {
      const fullName = additionalName ? `${baseName} ${additionalName}` : baseName;
      setValue('user_group_name', fullName);
    }
  }, [provinceCode, userGroupType, additionalName, generateBaseUserGroupName, setValue]);

  // Auto-generate code when province or type changes
  useEffect(() => {
    if (provinceCode && userGroupType) {
      generateUserGroupCode();
    }
  }, [provinceCode, userGroupType, generateUserGroupCode]);

  // Auto-fill infrastructure type code when user group type changes
  useEffect(() => {
    const selectedType = USER_GROUP_TYPES.find(t => t.value === userGroupType);
    if (selectedType) {
      setValue('infrastructure_type_code', selectedType.code);
    }
  }, [userGroupType, setValue]);

  // Update contact information when user is selected
  const handleContactUserChange = (user: User | null) => {
    setSelectedContactUser(user);
    if (user) {
      setValue('contact_user_id', user.id);
      setValue('contact_person', user.personalDetails.fullName);
      setValue('email_address', user.personalDetails.email);
      setValue('phone_number', user.personalDetails.phoneNumber || '');
    } else {
      setValue('contact_user_id', '');
      setValue('contact_person', '');
      setValue('email_address', '');
      setValue('phone_number', '');
    }
  };

  const handleCreateUserGroup = async (data: any) => {
    try {
      const createData = {
        user_group_code: data.user_group_code,
        user_group_name: data.user_group_name,
        user_group_type: data.user_group_type,
        infrastructure_type_code: data.infrastructure_type_code,
        province_code: data.province_code,
        registration_status: data.registration_status || RegistrationStatus.REGISTERED,
        description: data.description,
        contact_person: data.contact_person,
        phone_number: data.phone_number,
        email_address: data.email_address,
        // Note: contact_user_id can be used later for staff assignment integration
      };

      await userGroupService.create(createData);
      toast.success('User group created successfully');
      
      // TODO: If contact_user_id is provided, create staff assignment
      // This will be implemented when integrating with staff management
      
      navigate('/dashboard/admin/user-groups');
    } catch (error: any) {
      console.error('Error creating user group:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to create user group');
    }
  };

  // Helper function to format user display in autocomplete
  const formatUserOption = (user: User) => {
    return `${user.personalDetails.fullName} (${user.username})`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={() => navigate('/dashboard/admin/user-groups')}
            sx={{ cursor: 'pointer' }}
          >
            User Groups
          </Link>
          <Typography color="text.primary">Create User Group</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/admin/user-groups')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Create New User Group
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(handleCreateUserGroup)}>
          {/* Basic Information Section */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="province_code"
                  control={control}
                  rules={{ required: 'Province is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Province *</InputLabel>
                      <Select 
                        {...field} 
                        label="Province *" 
                        sx={{ backgroundColor: 'white' }}
                        error={!!errors.province_code}
                      >
                        {PROVINCES.map((province) => (
                          <MenuItem key={province.code} value={province.code}>
                            {province.name} ({province.code})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.province_code && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {errors.province_code.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_type"
                  control={control}
                  rules={{ required: 'User group type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>User Group Type *</InputLabel>
                      <Select 
                        {...field} 
                        label="User Group Type *" 
                        sx={{ backgroundColor: 'white' }}
                        error={!!errors.user_group_type}
                      >
                        {USER_GROUP_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.user_group_type && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {errors.user_group_type.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Code (Auto-Generated)"
                      error={!!errors.user_group_code}
                      helperText={errors.user_group_code?.message || 'Auto-generated based on province and type'}
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                      sx={{ backgroundColor: 'white' }}
                      InputProps={{ readOnly: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="additional_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Additional Name (Optional)"
                      placeholder="e.g., Main Branch, City Center"
                      error={!!errors.additional_name}
                      helperText="Optional additional identifier for the user group"
                      inputProps={{ maxLength: 50 }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="user_group_name"
                  control={control}
                  rules={{ required: 'User group name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full User Group Name (Auto-Generated)"
                      error={!!errors.user_group_name}
                      helperText={errors.user_group_name?.message || 'Auto-generated from province, type, and additional name'}
                      inputProps={{ maxLength: 150 }}
                      sx={{ backgroundColor: 'white' }}
                      InputProps={{ readOnly: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="registration_status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Registration Status</InputLabel>
                      <Select 
                        {...field} 
                        label="Registration Status" 
                        sx={{ backgroundColor: 'white' }}
                      >
                        <MenuItem value={RegistrationStatus.REGISTERED}>Registered</MenuItem>
                        <MenuItem value={RegistrationStatus.PENDING_REGISTRATION}>Pending Registration</MenuItem>
                        <MenuItem value={RegistrationStatus.SUSPENDED}>Suspended</MenuItem>
                        <MenuItem value={RegistrationStatus.PENDING_RENEWAL}>Pending Renewal</MenuItem>
                        <MenuItem value={RegistrationStatus.CANCELLED}>Cancelled</MenuItem>
                        <MenuItem value={RegistrationStatus.PENDING_INSPECTION}>Pending Inspection</MenuItem>
                        <MenuItem value={RegistrationStatus.INSPECTION_FAILED}>Inspection Failed</MenuItem>
                        <MenuItem value={RegistrationStatus.DEREGISTERED}>Deregistered</MenuItem>
                      </Select>
                    </FormControl>
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
              Select a user to automatically populate contact details. This user can later be assigned as the primary contact for this user group.
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
                  renderOption={(props, user) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.personalDetails.fullName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.personalDetails.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.username} • {user.personalDetails.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  sx={{ backgroundColor: 'white' }}
                />
              </Grid>

              {selectedContactUser && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: 'white' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      Selected Contact User
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label={`Name: ${selectedContactUser.personalDetails.fullName}`} variant="outlined" />
                      <Chip label={`Email: ${selectedContactUser.personalDetails.email}`} variant="outlined" />
                      {selectedContactUser.personalDetails.phoneNumber && (
                        <Chip label={`Phone: ${selectedContactUser.personalDetails.phoneNumber}`} variant="outlined" />
                      )}
                      <Chip label={`Username: ${selectedContactUser.username}`} variant="outlined" />
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

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      placeholder="Additional notes about this user group..."
                      error={!!errors.description}
                      helperText={errors.description?.message || 'Optional - Additional information'}
                      inputProps={{ maxLength: 500 }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Hidden fields */}
          <Controller
            name="infrastructure_type_code"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />
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
              onClick={() => navigate('/dashboard/admin/user-groups')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create User Group'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateUserGroupPage; 