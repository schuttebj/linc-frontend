/**
 * User Group Management Page
 * Implements user group management functionality for location infrastructure
 * Reference: LINC Location Management System - Priority 1
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  MenuItem,
  Tooltip,
  InputAdornment,
  Fab,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocationCity as LocationIcon,
  Business as BusinessIcon,
  Assessment as StatsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';

// Types and services
import {
  UserGroup,
  UserGroupCreate,
  UserGroupUpdate,
  UserGroupType,
  RegistrationStatus,
  UserGroupListFilter,
  UserGroupStatistics,
} from '../../types/location';
import { userGroupService } from '../../services/locationService';

// Validation schema
const userGroupSchema = yup.object({
  user_group_code: yup
    .string()
    .required('User group code is required')
    .matches(/^[A-Z]{2}[0-9]{2}$/, 'Code must be format XX00 (e.g., WC01, GP03)'),
  user_group_name: yup
    .string()
    .required('User group name is required')
    .min(3, 'Name must be at least 3 characters'),
  user_group_type: yup
    .string()
    .required('User group type is required'),
  infrastructure_type_code: yup
    .number()
    .required('Infrastructure type code is required'),
  province_code: yup
    .string()
    .required('Province code is required')
    .length(2, 'Province code must be 2 characters'),
  registration_status: yup
    .string()
    .required('Registration status is required'),
  description: yup.string(),
  contact_person: yup.string(),
  phone_number: yup
    .string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
  email_address: yup
    .string()
    .email('Please enter a valid email address'),
});

// Infrastructure type mapping
const INFRASTRUCTURE_TYPES = {
  10: 'Fixed DLTC',
  11: 'Mobile DLTC',
  20: 'Regional Authority',
  30: 'PLAMARK',
  40: 'NHELPDESK',
};

// Status color mapping
const STATUS_COLORS = {
  [RegistrationStatus.REGISTERED]: 'success',
  [RegistrationStatus.PENDING_REGISTRATION]: 'warning',
  [RegistrationStatus.CANCELLED]: 'default',
  [RegistrationStatus.SUSPENDED]: 'error',
} as const;

const UserGroupManagementPage: React.FC = () => {
  // State management
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [statistics, setStatistics] = useState<UserGroupStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserGroup, setEditingUserGroup] = useState<UserGroup | null>(null);
  const [filters, setFilters] = useState<UserGroupListFilter>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserGroupCreate>({
    resolver: yupResolver(userGroupSchema),
    defaultValues: {
      user_group_code: '',
      user_group_name: '',
      user_group_type: UserGroupType.FIXED_DLTC,
      infrastructure_type_code: 10,
      province_code: '',
      registration_status: RegistrationStatus.PENDING_REGISTRATION,
      description: '',
      contact_person: '',
      phone_number: '',
      email_address: '',
    },
  });

  // Load data on mount
  useEffect(() => {
    loadUserGroups();
    loadStatistics();
  }, [filters, page, rowsPerPage]);

  // Auto-set infrastructure type based on user group type
  const watchedUserGroupType = watch('user_group_type');
  useEffect(() => {
    const typeMapping = {
      [UserGroupType.FIXED_DLTC]: 10,
      [UserGroupType.MOBILE_DLTC]: 11,
      [UserGroupType.PRINTING_CENTER]: 12,
      [UserGroupType.REGISTERING_AUTHORITY]: 20,
      [UserGroupType.PROVINCIAL_HELP_DESK]: 30,
      [UserGroupType.NATIONAL_HELP_DESK]: 31,
      [UserGroupType.VEHICLE_TESTING_STATION]: 40,
      [UserGroupType.ADMIN_OFFICE]: 50,
    };
    setValue('infrastructure_type_code', typeMapping[watchedUserGroupType]);
  }, [watchedUserGroupType, setValue]);

  // Data loading functions
  const loadUserGroups = async () => {
    setLoading(true);
    try {
      const data = await userGroupService.getAll(filters, page + 1, rowsPerPage);
      setUserGroups(data);
    } catch (error) {
      console.error('Error loading user groups:', error);
      toast.error('Failed to load user groups');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await userGroupService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // CRUD operations
  const handleCreate = async (data: UserGroupCreate) => {
    try {
      await userGroupService.create(data);
      toast.success('User group created successfully');
      setDialogOpen(false);
      reset();
      loadUserGroups();
      loadStatistics();
    } catch (error: any) {
      console.error('Error creating user group:', error);
      toast.error(error.message || 'Failed to create user group');
    }
  };

  const handleUpdate = async (data: UserGroupUpdate) => {
    if (!editingUserGroup) return;
    
    try {
      await userGroupService.update(editingUserGroup.id, data);
      toast.success('User group updated successfully');
      setDialogOpen(false);
      setEditingUserGroup(null);
      reset();
      loadUserGroups();
      loadStatistics();
    } catch (error: any) {
      console.error('Error updating user group:', error);
      toast.error(error.message || 'Failed to update user group');
    }
  };

  const handleDelete = async (userGroup: UserGroup) => {
    if (!confirm(`Are you sure you want to delete "${userGroup.user_group_name}"?`)) {
      return;
    }

    try {
      await userGroupService.delete(userGroup.id);
      toast.success('User group deleted successfully');
      loadUserGroups();
      loadStatistics();
    } catch (error: any) {
      console.error('Error deleting user group:', error);
      toast.error(error.message || 'Failed to delete user group');
    }
  };

  // Dialog handlers
  const handleOpenDialog = (userGroup?: UserGroup) => {
    if (userGroup) {
      setEditingUserGroup(userGroup);
      reset({
        user_group_code: userGroup.user_group_code,
        user_group_name: userGroup.user_group_name,
        user_group_type: userGroup.user_group_type,
        infrastructure_type_code: userGroup.infrastructure_type_code,
        province_code: userGroup.province_code,
        registration_status: userGroup.registration_status,
        description: userGroup.description || '',
        contact_person: userGroup.contact_person || '',
        phone_number: userGroup.phone_number || '',
        email_address: userGroup.email_address || '',
      });
    } else {
      setEditingUserGroup(null);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUserGroup(null);
    reset();
  };

  // Filter handling
  const handleFilterChange = (key: keyof UserGroupListFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          User Group Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadUserGroups} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create User Group
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{statistics.total_user_groups}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total User Groups
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatsIcon color="success" />
                  <Box>
                    <Typography variant="h6">{statistics.active_count}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Groups
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon color="info" />
                  <Box>
                    <Typography variant="h6">
                      {Object.keys(statistics.by_province).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provinces Covered
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="warning" />
                  <Box>
                    <Typography variant="h6">{statistics.inactive_count}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inactive Groups
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search user groups..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                select
                label="Province"
                value={filters.province_code || ''}
                onChange={(e) => handleFilterChange('province_code', e.target.value)}
              >
                <MenuItem value="">All Provinces</MenuItem>
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
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                select
                label="Type"
                value={filters.user_group_type || ''}
                onChange={(e) => handleFilterChange('user_group_type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value={UserGroupType.FIXED_DLTC}>Fixed DLTC</MenuItem>
                <MenuItem value={UserGroupType.MOBILE_DLTC}>Mobile DLTC</MenuItem>
                <MenuItem value={UserGroupType.REGIONAL_AUTHORITY}>Regional Authority</MenuItem>
                <MenuItem value={UserGroupType.PLAMARK}>PLAMARK</MenuItem>
                <MenuItem value={UserGroupType.NHELPDESK}>NHELPDESK</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status"
                value={filters.registration_status || ''}
                onChange={(e) => handleFilterChange('registration_status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value={RegistrationStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={RegistrationStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={RegistrationStatus.INACTIVE}>Inactive</MenuItem>
                <MenuItem value={RegistrationStatus.SUSPENDED}>Suspended</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth onClick={handleClearFilters} size="small">
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* User Groups Table */}
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
              <TableCell>Statistics</TableCell>
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
                <TableCell>
                  <Typography variant="body2">
                    {userGroup.user_group_name}
                  </Typography>
                  {userGroup.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {userGroup.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {INFRASTRUCTURE_TYPES[userGroup.infrastructure_type_code as keyof typeof INFRASTRUCTURE_TYPES]}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {userGroup.province_code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={userGroup.registration_status}
                    color={STATUS_COLORS[userGroup.registration_status] as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {userGroup.contact_person && (
                    <Typography variant="body2">
                      {userGroup.contact_person}
                    </Typography>
                  )}
                  {userGroup.email_address && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {userGroup.email_address}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" display="block">
                    Offices: {userGroup.office_count || 0}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Locations: {userGroup.location_count || 0}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Users: {userGroup.user_count || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(userGroup)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(userGroup)}
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
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={statistics?.total_user_groups || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(editingUserGroup ? handleUpdate : handleCreate)}>
          <DialogTitle>
            {editingUserGroup ? 'Edit User Group' : 'Create User Group'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Code"
                      placeholder="e.g., WC01, GP03"
                      error={!!errors.user_group_code}
                      helperText={errors.user_group_code?.message}
                      disabled={!!editingUserGroup}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User Group Name"
                      error={!!errors.user_group_name}
                      helperText={errors.user_group_name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_group_type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="User Group Type"
                      error={!!errors.user_group_type}
                      helperText={errors.user_group_type?.message}
                    >
                      <MenuItem value={UserGroupType.FIXED_DLTC}>Fixed DLTC</MenuItem>
                      <MenuItem value={UserGroupType.MOBILE_DLTC}>Mobile DLTC</MenuItem>
                      <MenuItem value={UserGroupType.REGIONAL_AUTHORITY}>Regional Authority</MenuItem>
                      <MenuItem value={UserGroupType.PLAMARK}>PLAMARK</MenuItem>
                      <MenuItem value={UserGroupType.NHELPDESK}>NHELPDESK</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="infrastructure_type_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Infrastructure Type Code"
                      type="number"
                      error={!!errors.infrastructure_type_code}
                      helperText={errors.infrastructure_type_code?.message}
                      disabled
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="province_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Province"
                      error={!!errors.province_code}
                      helperText={errors.province_code?.message}
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
                  name="registration_status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Registration Status"
                      error={!!errors.registration_status}
                      helperText={errors.registration_status?.message}
                    >
                      <MenuItem value={RegistrationStatus.PENDING}>Pending</MenuItem>
                      <MenuItem value={RegistrationStatus.ACTIVE}>Active</MenuItem>
                      <MenuItem value={RegistrationStatus.INACTIVE}>Inactive</MenuItem>
                      <MenuItem value={RegistrationStatus.SUSPENDED}>Suspended</MenuItem>
                    </TextField>
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
                      label="Description"
                      multiline
                      rows={2}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
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
                      error={!!errors.contact_person}
                      helperText={errors.contact_person?.message}
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
                      error={!!errors.phone_number}
                      helperText={errors.phone_number?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="email_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!errors.email_address}
                      helperText={errors.email_address?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={isSubmitting}
            >
              {editingUserGroup ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default UserGroupManagementPage; 