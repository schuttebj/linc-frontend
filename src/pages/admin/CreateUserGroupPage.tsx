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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AutoFixHigh as MagicWandIcon,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userGroupService } from '../../services/locationService';
import { UserGroupType, RegistrationStatus, UserGroup } from '../../types/location';

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
  { value: UserGroupType.MOBILE_DLTC, label: 'Mobile DLTC', code: 20 },
  { value: UserGroupType.REGIONAL_AUTHORITY, label: 'Regional Authority', code: 30 },
  { value: UserGroupType.PLAMARK, label: 'Provincial Help Desk', code: 40 },
  { value: UserGroupType.NHELPDESK, label: 'National Help Desk', code: 50 },
];

// Validation functions
const validateUserGroupCode = (value: string, provinceCode?: string) => {
  if (!value) return 'User group code is required';
  if (!/^[A-Z0-9]{4}$/.test(value)) return 'Code must be 4 alphanumeric characters';
  if (provinceCode && !value.startsWith(provinceCode)) return `Code must start with ${provinceCode}`;
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

const CreateUserGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  // Form setup with validation
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
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

  // Watch form values for auto-generation
  const provinceCode = watch('province_code');
  const userGroupType = watch('user_group_type');

  useEffect(() => {
    loadUserGroups();
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

  // Auto-generate user group name
  const generateUserGroupName = useCallback(() => {
    if (!provinceCode || !userGroupType) return;

    const province = PROVINCES.find(p => p.code === provinceCode);
    const type = USER_GROUP_TYPES.find(t => t.value === userGroupType);
    
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

      setValue('user_group_name', baseName);
    }
  }, [provinceCode, userGroupType, setValue]);

  // Auto-fill infrastructure type code when user group type changes
  useEffect(() => {
    const selectedType = USER_GROUP_TYPES.find(t => t.value === userGroupType);
    if (selectedType) {
      setValue('infrastructure_type_code', selectedType.code);
    }
  }, [userGroupType, setValue]);

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
      navigate('/dashboard/admin/locations');
    } catch (error: any) {
      console.error('Error creating user group:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to create user group');
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
          <Typography color="text.primary">Create User Group</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/admin/locations')}>
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
                    helperText={errors.province_code?.message}
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
                    label="User Group Type"
                    error={!!errors.user_group_type}
                    helperText={errors.user_group_type?.message}
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

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <Controller
                  name="user_group_code"
                  control={control}
                  rules={{ 
                    required: 'User group code is required',
                    validate: (value) => validateUserGroupCode(value, provinceCode)
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Code"
                      placeholder="e.g., WC01"
                      error={!!errors.user_group_code}
                      helperText={errors.user_group_code?.message || 'Format: 2 letters + 2 numbers (e.g., WC01)'}
                      inputProps={{ maxLength: 4, style: { textTransform: 'uppercase' } }}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Tooltip title="Auto-generate code">
                  <IconButton onClick={generateUserGroupCode} disabled={!provinceCode || !userGroupType}>
                    <MagicWandIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <Controller
                  name="user_group_name"
                  control={control}
                  rules={{ required: 'User group name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Name"
                      placeholder="e.g., Western Cape DLTC"
                      error={!!errors.user_group_name}
                      helperText={errors.user_group_name?.message}
                      inputProps={{ maxLength: 100 }}
                    />
                  )}
                />
                <Tooltip title="Auto-generate name">
                  <IconButton onClick={generateUserGroupName} disabled={!provinceCode || !userGroupType}>
                    <MagicWandIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="infrastructure_type_code"
                control={control}
                rules={{ required: 'Infrastructure type code is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label="Infrastructure Type Code"
                    error={!!errors.infrastructure_type_code}
                    helperText={errors.infrastructure_type_code?.message || 'Auto-filled based on user group type'}
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
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Registration Status"
                    error={!!errors.registration_status}
                    helperText={errors.registration_status?.message}
                  >
                    <MenuItem value={RegistrationStatus.ACTIVE}>Active</MenuItem>
                    <MenuItem value={RegistrationStatus.INACTIVE}>Inactive</MenuItem>
                    <MenuItem value={RegistrationStatus.PENDING}>Pending</MenuItem>
                    <MenuItem value={RegistrationStatus.SUSPENDED}>Suspended</MenuItem>
                  </TextField>
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
                    placeholder="Name of primary contact"
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
                    placeholder="contact@example.co.za"
                    error={!!errors.email_address}
                    helperText={errors.email_address?.message}
                    inputProps={{ maxLength: 100 }}
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
                    placeholder="Additional information about this user group..."
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    inputProps={{ maxLength: 500 }}
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
                  {isSubmitting ? 'Creating...' : 'Create User Group'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateUserGroupPage; 