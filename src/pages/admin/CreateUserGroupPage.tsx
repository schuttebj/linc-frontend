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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
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
  { value: UserGroupType.MOBILE_DLTC, label: 'Mobile DLTC', code: 11 },
  { value: UserGroupType.PRINTING_CENTER, label: 'Printing Center', code: 12 },
  { value: UserGroupType.REGISTERING_AUTHORITY, label: 'Registering Authority', code: 20 },
  { value: UserGroupType.PROVINCIAL_HELP_DESK, label: 'Provincial Help Desk', code: 30 },
  { value: UserGroupType.NATIONAL_HELP_DESK, label: 'National Help Desk', code: 31 },
  { value: UserGroupType.VEHICLE_TESTING_STATION, label: 'Vehicle Testing Station', code: 40 },
  { value: UserGroupType.ADMIN_OFFICE, label: 'Admin Office', code: 50 },
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

const CreateUserGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

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
      };

      await userGroupService.create(createData);
      toast.success('User group created successfully');
      navigate('/dashboard/admin/user-groups');
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
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_person"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person"
                      placeholder="Full name of contact person"
                      error={!!errors.contact_person}
                      helperText={errors.contact_person?.message}
                      inputProps={{ maxLength: 100 }}
                      sx={{ backgroundColor: 'white' }}
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
                      placeholder="e.g., 0123456789 or +27123456789"
                      error={!!errors.phone_number}
                      helperText={errors.phone_number?.message || 'Optional - South African format'}
                      inputProps={{ maxLength: 15 }}
                      sx={{ backgroundColor: 'white' }}
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
                      type="email"
                      label="Email Address"
                      placeholder="contact@example.com"
                      error={!!errors.email_address}
                      helperText={errors.email_address?.message || 'Optional - Primary contact email'}
                      inputProps={{ maxLength: 100 }}
                      sx={{ backgroundColor: 'white' }}
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

          {/* Hidden field for infrastructure_type_code */}
          <Controller
            name="infrastructure_type_code"
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