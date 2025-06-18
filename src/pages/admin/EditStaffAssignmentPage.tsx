/**
 * Edit Staff Assignment Page
 * Form to edit existing staff assignments to locations
 */

import React, { useState, useEffect } from 'react';
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
  Breadcrumbs,
  Link,
  Alert,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
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
import {
  Location,
  UserGroup,
  AssignmentType,
  AssignmentStatus,
  StaffAssignmentUpdate,
  UserLocationAssignment
} from '../../types/location';

const EditStaffAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  
  // State management
  const [locations, setLocations] = useState<Location[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [assignment] = useState<UserLocationAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<StaffAssignmentUpdate>({
    defaultValues: {
      assignment_type: AssignmentType.PRIMARY,
      assignment_status: AssignmentStatus.ACTIVE,
      effective_date: '',
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

  useEffect(() => {
    if (assignmentId) {
      loadData();
    }
  }, [assignmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locData, ugData] = await Promise.all([
        locationService.getAll(),
        userGroupService.getAll(),
      ]);
      setLocations(locData);
      setUserGroups(ugData);
      
      // Load assignment data - we need to get all assignments and find the one we need
      // Since we don't have a direct getById method, we'll need to load by location
      // This is a limitation we might need to address in the backend
      await loadAssignment();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignment = async () => {
    // For now, we'll need to show an error since we don't have a direct way to load a single assignment
    // This would need to be implemented in the backend
    toast.error('Assignment loading not yet implemented - requires backend endpoint');
    navigate('/dashboard/admin/staff-management');
  };

  const handleUpdateAssignment = async (data: StaffAssignmentUpdate) => {
    if (!assignment || !assignmentId) {
      toast.error('Assignment data not available');
      return;
    }

    try {
      const updateData = {
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

      await staffAssignmentService.updateAssignment(assignment.location_id, assignmentId, updateData);
      toast.success('Staff assignment updated successfully');
      navigate('/dashboard/admin/staff-management');
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to update assignment');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Assignment not found. This feature requires additional backend implementation.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard/admin/staff-management')}
          sx={{ mt: 2 }}
        >
          Back to Staff Management
        </Button>
      </Box>
    );
  }

  // Get assignment location details
  const assignmentLocation = locations.find((loc: Location) => loc.id === assignment.location_id);
  const assignmentUserGroup = assignmentLocation ? userGroups.find((ug: UserGroup) => ug.id === assignmentLocation.user_group_id) : null;

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
          <Typography color="text.primary">Edit Assignment</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Edit Staff Assignment
          </Typography>
        </Box>
      </Box>

      {/* Assignment Information */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Staff Member:</strong> {assignment.user_full_name || assignment.user_username}
          <br />
          <strong>Location:</strong> {assignmentLocation?.location_name} ({assignmentLocation?.location_code})
          {assignmentUserGroup && (
            <>
              <br />
              <strong>User Group:</strong> {assignmentUserGroup.user_group_name} ({assignmentUserGroup.user_group_code})
            </>
          )}
        </Typography>
      </Alert>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(handleUpdateAssignment)}>
          
          {/* Assignment Configuration */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Assignment Configuration
            </Typography>
            
            <Grid container spacing={3}>
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
              {isSubmitting ? 'Updating...' : 'Update Assignment'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default EditStaffAssignmentPage; 