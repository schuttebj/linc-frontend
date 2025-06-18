/**
 * Assign Staff Page
 * Form to assign users to locations with roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Autocomplete,
  Avatar,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

// Services and types
import { 
  staffAssignmentService, 
  locationService, 
  userGroupService 
} from '../../services/locationService';
import { userService } from '../../services/userService';
import {
  Location,
  UserGroup,
  AssignmentType,
  AssignmentStatus,
  StaffAssignmentCreate
} from '../../types/location';
import { User, UserStatus } from '../../types/user';

const AssignStaffPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLocationId = searchParams.get('locationId');
  
  // State management
  const [locations, setLocations] = useState<Location[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form setup with location_id
  interface FormData extends StaffAssignmentCreate {
    location_id: string;
  }
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      user_id: '',
      assignment_type: AssignmentType.PRIMARY,
      assignment_status: AssignmentStatus.ACTIVE,
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      access_level: 'Standard',
      can_manage_location: false,
      can_assign_others: false,
      can_view_reports: true,
      can_manage_resources: false,
      work_schedule: '',
      responsibilities: '',
      assignment_reason: '',
      notes: '',
      is_active: true
    }
  });

  const locationId = watch('location_id');

  useEffect(() => {
    loadData();
    loadUsers();
    
    // Set preselected location if provided
    if (preselectedLocationId) {
      setValue('location_id', preselectedLocationId);
    }
  }, [preselectedLocationId, setValue]);

  const loadData = async () => {
    try {
      const [locData, ugData] = await Promise.all([
        locationService.getAll(),
        userGroupService.getAll(),
      ]);
      setLocations(locData);
      setUserGroups(ugData);
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
      loadUsers();
      return;
    }
    
    try {
      setLoadingUsers(true);
      const searchResults = await userService.searchUsers(searchTerm, 50, {
        excludeAssignedToLocation: locationId || undefined,
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

  // Update user information when user is selected
  const handleUserChange = (user: User | null) => {
    setSelectedUser(user);
    if (user) {
      setValue('user_id', user.id || '');
    } else {
      setValue('user_id', '');
    }
  };

  // Helper function to format user display in autocomplete
  const formatUserOption = (user: User) => {
    if (!user) return 'Unknown User';
    
    let fullName = 'No Name';
    let email = '';
    
    if (user.personalDetails) {
      fullName = user.personalDetails.fullName || 'No Name';
      email = user.personalDetails.email || '';
    } else if (user.personal_details) {
      fullName = user.personal_details.full_name || 'No Name';
      email = user.personal_details.email || '';
    }
    
    const username = user.username || 'No Username';
    return `${fullName} (${username})${email ? ' - ' + email : ''}`;
  };

  const handleAssignStaff = async (data: FormData) => {
    if (!data.location_id) {
      toast.error('Please select a location');
      return;
    }

    try {
      const assignmentData = {
        user_id: data.user_id,
        assignment_type: data.assignment_type,
        assignment_status: data.assignment_status,
        effective_date: data.effective_date,
        expiry_date: data.expiry_date || undefined,
        access_level: data.access_level,
        can_manage_location: data.can_manage_location,
        can_assign_others: data.can_assign_others,
        can_view_reports: data.can_view_reports,
        can_manage_resources: data.can_manage_resources,
        work_schedule: data.work_schedule,
        responsibilities: data.responsibilities,
        assignment_reason: data.assignment_reason,
        notes: data.notes,
        is_active: data.is_active
      };

      await staffAssignmentService.assignStaff(data.location_id, assignmentData);
      toast.success('Staff assigned successfully');
      
      // Navigate back to staff management or location
      if (preselectedLocationId) {
        navigate(`/dashboard/admin/locations-management`);
      } else {
        navigate('/dashboard/admin/staff-management');
      }
    } catch (error: any) {
      console.error('Error assigning staff:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to assign staff');
    }
  };

  // Get selected location details
  const selectedLocation = locations.find((loc: Location) => loc.id === locationId);
  const selectedUserGroup = selectedLocation ? userGroups.find((ug: UserGroup) => ug.id === selectedLocation.user_group_id) : null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={() => navigate('/dashboard/admin/staff-management')}
            sx={{ cursor: 'pointer' }}
          >
            Staff Management
          </Link>
          <Typography color="text.primary">Assign Staff</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Assign Staff to Location
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(handleAssignStaff)}>
          
          {/* Basic Assignment Information */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Assignment Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_id"
                  control={control}
                  rules={{ required: 'Location is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Location *"
                      error={!!errors.location_id}
                      helperText={errors.location_id?.message || 'Select the location for assignment'}
                      sx={{ backgroundColor: 'white' }}
                    >
                      {locations.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          {location.location_code} - {location.location_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="assignment_type"
                  control={control}
                  rules={{ required: 'Assignment type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Assignment Type *"
                      error={!!errors.assignment_type}
                      helperText={errors.assignment_type?.message}
                      sx={{ backgroundColor: 'white' }}
                    >
                      {Object.values(AssignmentType).map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Location Info Display */}
              {selectedLocation && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Location:</strong> {selectedLocation.location_name} ({selectedLocation.location_code})
                      {selectedUserGroup && (
                        <>
                          <br />
                          <strong>User Group:</strong> {selectedUserGroup.user_group_name} ({selectedUserGroup.user_group_code})
                        </>
                      )}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* User Selection */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Staff Member Selection
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  options={users}
                  getOptionLabel={formatUserOption}
                  loading={loadingUsers}
                  onInputChange={(_, value) => {
                    if (value.length >= 2) {
                      searchUsers(value);
                    } else if (value.length === 0) {
                      loadUsers();
                    }
                  }}
                  onChange={(_, user) => handleUserChange(user)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search and Select User *"
                      placeholder="Type name, username, or email..."
                      error={!!errors.user_id}
                      helperText={errors.user_id?.message || 'Search for users by name, username, or email (min 2 characters)'}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                  renderOption={(props, user) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {user.personalDetails?.fullName || user.personal_details?.full_name || user.username || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.username} • {user.personalDetails?.email || user.personal_details?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              {/* Selected User Display */}
              {selectedUser && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          Selected: {selectedUser.personalDetails?.fullName || selectedUser.personal_details?.full_name || selectedUser.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedUser.username} • {selectedUser.personalDetails?.email || selectedUser.personal_details?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Assignment Configuration */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Assignment Configuration
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="effective_date"
                  control={control}
                  rules={{ required: 'Effective date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Effective Date *"
                      error={!!errors.effective_date}
                      helperText={errors.effective_date?.message}
                      InputLabelProps={{ shrink: true }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="expiry_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Expiry Date (Optional)"
                      helperText="Leave empty for permanent assignment"
                      InputLabelProps={{ shrink: true }}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="assignment_status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Assignment Status"
                      sx={{ backgroundColor: 'white' }}
                    >
                      {Object.values(AssignmentStatus).map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="access_level"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Access Level"
                      sx={{ backgroundColor: 'white' }}
                    >
                      <MenuItem value="Standard">Standard</MenuItem>
                      <MenuItem value="Supervisor">Supervisor</MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                      <MenuItem value="Administrator">Administrator</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Permissions */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Permissions & Capabilities
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="can_manage_location"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Can Manage Location"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="can_assign_others"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Can Assign Others"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="can_view_reports"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Can View Reports"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="can_manage_resources"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Can Manage Resources"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Assignment Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Additional Information */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Additional Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="work_schedule"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Work Schedule"
                      placeholder="e.g., Monday-Friday 8:00-17:00"
                      multiline
                      rows={2}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="assignment_reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Assignment Reason"
                      placeholder="e.g., Operational requirement, Staff rotation"
                      multiline
                      rows={2}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="responsibilities"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Responsibilities"
                      placeholder="Describe specific responsibilities and duties..."
                      multiline
                      rows={3}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      placeholder="Additional notes or comments..."
                      multiline
                      rows={2}
                      sx={{ backgroundColor: 'white' }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Form Actions */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Staff'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AssignStaffPage; 