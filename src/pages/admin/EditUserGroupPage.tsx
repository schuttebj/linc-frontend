import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AutoFixHigh as MagicWandIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userGroupService } from '../../services/locationService';
import { userService } from '../../services/userService';
import { 
  UserGroupType, 
  RegistrationStatus, 
  UserGroup 
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

const EditUserGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const { userGroupId } = useParams<{ userGroupId: string }>();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUserGroup, setLoadingUserGroup] = useState(true);
  const [selectedContactUser, setSelectedContactUser] = useState<User | null>(null);

  // Form setup with validation
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      user_group_name: '',
      user_group_code: '',
      user_group_type: UserGroupType.DLTC,
      province_code: '',
      registration_status: RegistrationStatus.ACTIVE,
      address_line_1: '',
      address_line_2: '',
      city: '',
      postal_code: '',
      contact_user_id: '',
      contact_person: '',
      phone_number: '',
      email_address: '',
      description: '',
    }
  });

  // Watch form values for auto-generation
  const provinceCode = watch('province_code');
  const userGroupType = watch('user_group_type');

  useEffect(() => {
    if (userGroupId) {
      loadData();
      loadUsers();
      loadUserGroup();
    }
  }, [userGroupId]);

  const loadData = async () => {
    try {
      const ugData = await userGroupService.getAll();
      setUserGroups(ugData);
    } catch (error) {
      console.error('Error loading user groups:', error);
      toast.error('Failed to load user groups');
    }
  };

  const loadUserGroup = async () => {
    if (!userGroupId) {
      toast.error('User Group ID is required');
      navigate('/dashboard/admin/user-groups');
      return;
    }

    try {
      setLoadingUserGroup(true);
      const userGroup = await userGroupService.getById(userGroupId);
      
      // Populate form with user group data
      reset({
        user_group_name: userGroup.user_group_name || '',
        user_group_code: userGroup.user_group_code || '',
        user_group_type: userGroup.user_group_type || UserGroupType.DLTC,
        province_code: userGroup.province_code || '',
        registration_status: userGroup.registration_status || RegistrationStatus.ACTIVE,
        address_line_1: userGroup.address?.address_line_1 || '',
        address_line_2: userGroup.address?.address_line_2 || '',
        city: userGroup.address?.city || '',
        postal_code: userGroup.address?.postal_code || '',
        contact_user_id: userGroup.contact_user_id || '',
        contact_person: userGroup.contact_person || '',
        phone_number: userGroup.phone_number || '',
        email_address: userGroup.email_address || '',
        description: userGroup.description || '',
      });

      // If there's a contact_user_id, try to find and set the contact user
      if (userGroup.contact_user_id) {
        try {
          const contactUser = await userService.getUserById(userGroup.contact_user_id);
          setSelectedContactUser(contactUser);
        } catch (error) {
          console.error('Failed to load contact user:', error);
          // Don't show error for this, just continue without pre-selected user
        }
      }
    } catch (error: any) {
      console.error('Error loading user group:', error);
      toast.error(error.message || 'Failed to load user group');
      navigate('/dashboard/admin/user-groups');
    } finally {
      setLoadingUserGroup(false);
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
      loadUsers();
      return;
    }
    
    try {
      setLoadingUsers(true);
      const searchResults = await userService.searchUsers(searchTerm, 50, {
        excludeAssignedToUserGroup: undefined,
        userType: undefined
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

  // Auto-generate user group code
  const generateUserGroupCode = useCallback(() => {
    if (!provinceCode || !userGroupType) return;

    const existingCodes = userGroups
      .filter((ug: UserGroup) => ug.user_group_code?.startsWith(provinceCode) && ug.id !== userGroupId)
      .map((ug: UserGroup) => ug.user_group_code);

    // Generate sequential code
    let sequence = 1;
    let newCode = `${provinceCode}${sequence.toString().padStart(3, '0')}`;
    
    while (existingCodes.includes(newCode) && sequence < 999) {
      sequence++;
      newCode = `${provinceCode}${sequence.toString().padStart(3, '0')}`;
    }

    setValue('user_group_code', newCode);
  }, [provinceCode, userGroupType, userGroups, setValue, userGroupId]);

  // Auto-generate user group name
  const generateUserGroupName = useCallback(() => {
    if (!provinceCode || !userGroupType) return;

    const provinceName = PROVINCES.find(p => p.code === provinceCode)?.name;
    if (!provinceName) return;

    let baseName = '';
    switch (userGroupType) {
      case UserGroupType.DLTC:
        baseName = `${provinceName} DLTC`;
        break;
      case UserGroupType.PRINTING_CENTER:
        baseName = `${provinceName} Printing Center`;
        break;
      case UserGroupType.REGISTERING_AUTHORITY:
        baseName = `${provinceName} Registering Authority`;
        break;
      case UserGroupType.PROVINCIAL_OFFICE:
        baseName = `${provinceName} Provincial Office`;
        break;
      case UserGroupType.REGIONAL_OFFICE:
        baseName = `${provinceName} Regional Office`;
        break;
      case UserGroupType.HELP_DESK:
        baseName = `${provinceName} Help Desk`;
        break;
      default:
        baseName = `${provinceName} ${userGroupType}`;
    }

    setValue('user_group_name', baseName);
  }, [provinceCode, userGroupType, setValue]);

  const handleUpdateUserGroup = async (data: any) => {
    if (!userGroupId) {
      toast.error('User Group ID is required');
      return;
    }

    try {
      const updateData = {
        user_group_name: data.user_group_name,
        user_group_code: data.user_group_code,
        user_group_type: data.user_group_type,
        province_code: data.province_code,
        registration_status: data.registration_status || RegistrationStatus.ACTIVE,
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
        description: data.description,
        // Note: contact_user_id can be used later for staff assignment integration
      };

      await userGroupService.update(userGroupId, updateData);
      toast.success('User Group updated successfully');
      
      // TODO: If contact_user_id is provided, update staff assignment
      // This will be implemented when integrating with staff management
      
      navigate('/dashboard/admin/user-groups');
    } catch (error: any) {
      console.error('Error updating user group:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to update user group');
    }
  };

  if (loadingUserGroup) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
          <Typography color="text.primary">Edit User Group</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/admin/user-groups')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Edit User Group
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(handleUpdateUserGroup)}>
          {/* Basic Information Section */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_name"
                  control={control}
                  rules={{ required: 'User group name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Name *"
                      placeholder="e.g., Western Cape DLTC"
                      error={!!errors.user_group_name}
                      helperText={errors.user_group_name?.message}
                      inputProps={{ maxLength: 100 }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <Controller
                    name="user_group_name"
                    control={control}
                    render={() => (
                      <Tooltip title="Auto-generate name">
                        <IconButton onClick={generateUserGroupName} color="primary">
                          <MagicWandIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  />
                </Box>
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
                      helperText={errors.province_code?.message || 'Select the province this group operates in'}
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
                  name="user_group_type"
                  control={control}
                  rules={{ required: 'User group type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="User Group Type *"
                      error={!!errors.user_group_type}
                      helperText={errors.user_group_type?.message || 'Select the type of services this group provides'}
                      sx={{ backgroundColor: 'white' }}
                    >
                      <MenuItem value={UserGroupType.DLTC}>DLTC (Driving License Testing Center)</MenuItem>
                      <MenuItem value={UserGroupType.PRINTING_CENTER}>Printing Center</MenuItem>
                      <MenuItem value={UserGroupType.REGISTERING_AUTHORITY}>Registering Authority</MenuItem>
                      <MenuItem value={UserGroupType.PROVINCIAL_OFFICE}>Provincial Office</MenuItem>
                      <MenuItem value={UserGroupType.REGIONAL_OFFICE}>Regional Office</MenuItem>
                      <MenuItem value={UserGroupType.HELP_DESK}>Help Desk</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <Controller
                    name="user_group_code"
                    control={control}
                    rules={{ required: 'User group code is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="User Group Code *"
                        placeholder="e.g., WC001"
                        error={!!errors.user_group_code}
                        helperText={errors.user_group_code?.message || 'Unique identifier for this user group'}
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                        sx={{ backgroundColor: 'white' }}
                      />
                    )}
                  />
                  <Tooltip title="Auto-generate code">
                    <IconButton onClick={generateUserGroupCode} color="primary">
                      <MagicWandIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="registration_status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Registration Status"
                      sx={{ backgroundColor: 'white' }}
                    >
                      <MenuItem value={RegistrationStatus.ACTIVE}>Active</MenuItem>
                      <MenuItem value={RegistrationStatus.PENDING}>Pending</MenuItem>
                      <MenuItem value={RegistrationStatus.SUSPENDED}>Suspended</MenuItem>
                      <MenuItem value={RegistrationStatus.CANCELLED}>Cancelled</MenuItem>
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
                  name="postal_code"
                  control={control}
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

          {/* Description Section */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Additional Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      placeholder="Additional details about this user group..."
                      error={!!errors.description}
                      helperText={errors.description?.message || 'Optional description of the user group\'s role and responsibilities'}
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
              {isSubmitting ? 'Updating...' : 'Update User Group'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default EditUserGroupPage; 