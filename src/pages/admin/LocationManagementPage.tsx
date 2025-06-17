/**
 * Location Management Page - Enhanced
 * Comprehensive location, user group, and staff assignment management
 * Matches person page styling patterns and uses enhanced backend APIs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Analytics as StatsIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  LocationCity as LocationCityIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';

// Services and types
import { 
  locationService, 
  userGroupService, 
  staffAssignmentService 
} from '../../services/locationService';
import {
  UserGroup,
  Location,
  UserLocationAssignment,
  StaffAssignmentCreate,

  RegistrationStatus,
  OperationalStatus,
  AssignmentType,
  AssignmentStatus,
  LocationStatistics,
  UserGroupStatistics
} from '../../types/location';

// Province mapping for display
const PROVINCES = {
  'EC': 'Eastern Cape',
  'FS': 'Free State',
  'GP': 'Gauteng',
  'KN': 'KwaZulu-Natal',
  'LP': 'Limpopo',
  'MP': 'Mpumalanga',
  'NC': 'Northern Cape',
  'NW': 'North West',
  'WC': 'Western Cape'
};

// Status color mapping
const STATUS_COLORS = {
  [RegistrationStatus.REGISTERED]: 'success',
  [RegistrationStatus.PENDING_REGISTRATION]: 'warning',
  [RegistrationStatus.PENDING_RENEWAL]: 'warning',
  [RegistrationStatus.PENDING_INSPECTION]: 'warning',
  [RegistrationStatus.CANCELLED]: 'default',
  [RegistrationStatus.DEREGISTERED]: 'default',
  [RegistrationStatus.INSPECTION_FAILED]: 'error',
  [RegistrationStatus.SUSPENDED]: 'error',
} as const;

const OPERATIONAL_STATUS_COLORS = {
  [OperationalStatus.OPERATIONAL]: 'success',
  [OperationalStatus.MAINTENANCE]: 'warning',
  [OperationalStatus.SUSPENDED]: 'error',
  [OperationalStatus.SETUP]: 'info',
  [OperationalStatus.DECOMMISSIONED]: 'default',
  [OperationalStatus.INSPECTION]: 'warning',
} as const;

// Validation schemas
const staffAssignmentSchema = yup.object({
  user_id: yup.string().required('User is required'),
  assignment_type: yup.string().required('Assignment type is required'),
  effective_date: yup.string().required('Effective date is required'),
  expiry_date: yup.string().nullable(),
  access_level: yup.string().required('Access level is required'),
  can_manage_location: yup.boolean(),
  can_assign_others: yup.boolean(),
  can_view_reports: yup.boolean(),
  can_manage_resources: yup.boolean(),
  work_schedule: yup.string(),
  responsibilities: yup.string(),
  assignment_reason: yup.string(),
  notes: yup.string()
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`location-tabpanel-${index}`}
      aria-labelledby={`location-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const LocationManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<UserLocationAssignment[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Statistics
  const [userGroupStats, setUserGroupStats] = useState<UserGroupStatistics | null>(null);
  const [locationStats, setLocationStats] = useState<LocationStatistics | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  
  // Dialog states
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<UserLocationAssignment | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedUserGroup, setSelectedUserGroup] = useState('');

  // Form handling for staff assignments
  const {
    control: staffControl,
    handleSubmit: handleStaffSubmit,
    reset: resetStaffForm,
    formState: { errors: staffErrors, isSubmitting: staffSubmitting }
  } = useForm<StaffAssignmentCreate>({
    resolver: yupResolver(staffAssignmentSchema),
    defaultValues: {
      user_id: '',
      assignment_type: AssignmentType.PRIMARY,
      assignment_status: AssignmentStatus.ACTIVE,
      effective_date: new Date().toISOString().split('T')[0],
      access_level: 'standard',
      can_manage_location: false,
      can_assign_others: false,
      can_view_reports: true,
      can_manage_resources: false,
      is_active: true
    }
  });

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ugData, locData, ugStats, locStats] = await Promise.all([
        userGroupService.getAll(),
        locationService.getAll(),
        userGroupService.getStatistics(),
        locationService.getStatistics()
      ]);
      
      setUserGroups(ugData);
      setLocations(locData);
      setUserGroupStats(ugStats);
      setLocationStats(locStats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStaffAssignments = async (locationId: string) => {
    setStaffLoading(true);
    try {
      const assignments = await staffAssignmentService.getByLocation(locationId);
      setStaffAssignments(assignments);
    } catch (error) {
      console.error('Error loading staff assignments:', error);
      toast.error('Failed to load staff assignments');
    } finally {
      setStaffLoading(false);
    }
  };

  // Event handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location);
    if (location) {
      await loadStaffAssignments(location.id);
    }
  };

  const handleDeleteUserGroup = async (userGroup: UserGroup) => {
    if (!confirm(`Are you sure you want to delete "${userGroup.user_group_name}"?`)) {
      return;
    }
    try {
      await userGroupService.delete(userGroup.id);
      toast.success('User group deleted successfully');
      await loadAllData();
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
      await loadAllData();
      if (selectedLocation?.id === location.id) {
        setSelectedLocation(null);
        setStaffAssignments([]);
      }
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete location');
    }
  };

  const handleStaffAssignmentSubmit = async (data: StaffAssignmentCreate) => {
    if (!selectedLocation) return;
    
    try {
      if (editingAssignment) {
        await staffAssignmentService.updateAssignment(
          selectedLocation.id,
          editingAssignment.id,
          data
        );
        toast.success('Staff assignment updated successfully');
      } else {
        await staffAssignmentService.assignStaff(selectedLocation.id, data);
        toast.success('Staff assigned successfully');
      }
      
      await loadStaffAssignments(selectedLocation.id);
      handleCloseStaffDialog();
    } catch (error: any) {
      console.error('Error with staff assignment:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to save staff assignment');
    }
  };

  const handleRemoveStaffAssignment = async (assignment: UserLocationAssignment) => {
    if (!selectedLocation) return;
    
    if (!confirm(`Are you sure you want to remove ${assignment.user_full_name || 'this user'} from ${selectedLocation.location_name}?`)) {
      return;
    }
    
    try {
      await staffAssignmentService.removeAssignment(selectedLocation.id, assignment.id);
      toast.success('Staff assignment removed successfully');
      await loadStaffAssignments(selectedLocation.id);
    } catch (error: any) {
      console.error('Error removing staff assignment:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to remove staff assignment');
    }
  };

  const handleOpenStaffDialog = (assignment?: UserLocationAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      resetStaffForm({
        user_id: assignment.user_id,
        assignment_type: assignment.assignment_type as AssignmentType,
        assignment_status: assignment.assignment_status as AssignmentStatus,
        effective_date: assignment.effective_date?.split('T')[0] || '',
        expiry_date: assignment.expiry_date?.split('T')[0] || '',
        access_level: assignment.access_level || 'standard',
        can_manage_location: assignment.can_manage_location || false,
        can_assign_others: assignment.can_assign_others || false,
        can_view_reports: assignment.can_view_reports || true,
        can_manage_resources: assignment.can_manage_resources || false,
        work_schedule: assignment.work_schedule || '',
        responsibilities: assignment.responsibilities || '',
        assignment_reason: assignment.assignment_reason || '',
        notes: assignment.notes || '',
        is_active: assignment.is_active
      });
    } else {
      setEditingAssignment(null);
      resetStaffForm();
    }
    setStaffDialogOpen(true);
  };

  const handleCloseStaffDialog = () => {
    setStaffDialogOpen(false);
    setEditingAssignment(null);
    resetStaffForm();
  };

  // Filter data
  const filteredUserGroups = userGroups.filter(ug => {
    const matchesSearch = !searchTerm || 
      ug.user_group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ug.user_group_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !selectedProvince || ug.province_code === selectedProvince;
    return matchesSearch && matchesProvince;
  });

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = !searchTerm || 
      loc.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.location_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !selectedProvince || loc.province_code === selectedProvince;
    const matchesUserGroup = !selectedUserGroup || loc.user_group_id === selectedUserGroup;
    return matchesSearch && matchesProvince && matchesUserGroup;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Location Management System
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadAllData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="h6">{userGroupStats?.total_user_groups || userGroups.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    User Groups
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
                <LocationIcon color="success" />
                <Box>
                  <Typography variant="h6">{locationStats?.total_locations || locations.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Locations
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
                <StatsIcon color="info" />
                <Box>
                  <Typography variant="h6">
                    {locationStats?.active_count || locations.filter(l => l.operational_status === 'operational').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Locations
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
                <PeopleIcon color="warning" />
                <Box>
                  <Typography variant="h6">{staffAssignments.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Staff Assignments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search user groups or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Province</InputLabel>
                <Select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  label="Province"
                >
                  <MenuItem value="">All Provinces</MenuItem>
                  {Object.entries(PROVINCES).map(([code, name]) => (
                    <MenuItem key={code} value={code}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>User Group</InputLabel>
                <Select
                  value={selectedUserGroup}
                  onChange={(e) => setSelectedUserGroup(e.target.value)}
                  label="User Group"
                >
                  <MenuItem value="">All User Groups</MenuItem>
                  {userGroups.map(ug => (
                    <MenuItem key={ug.id} value={ug.id}>
                      {ug.user_group_code} - {ug.user_group_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedProvince('');
                  setSelectedUserGroup('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="location management tabs">
            <Tab 
              label={`User Groups (${filteredUserGroups.length})`}
              icon={<GroupIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`Locations (${filteredLocations.length})`}
              icon={<LocationCityIcon />}
              iconPosition="start"
            />
            {selectedLocation && (
              <Tab 
                label={`Staff (${staffAssignments.length})`}
                icon={<AssignmentIcon />}
                iconPosition="start"
              />
            )}
          </Tabs>
        </Box>

        {/* User Groups Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">User Groups</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/admin/locations/user-groups/create')}
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
                  <TableCell>Locations</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUserGroups.map((userGroup) => (
                  <TableRow key={userGroup.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {userGroup.user_group_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{userGroup.user_group_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={userGroup.user_group_type}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${userGroup.province_code} - ${PROVINCES[userGroup.province_code as keyof typeof PROVINCES]}`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userGroup.registration_status}
                        color={STATUS_COLORS[userGroup.registration_status as keyof typeof STATUS_COLORS]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{userGroup.contact_person || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={userGroup.location_count || 0}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/dashboard/admin/locations/user-groups/${userGroup.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUserGroup(userGroup)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Locations Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Locations</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/admin/locations/create')}
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
                  <TableCell>Province</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Staff</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow 
                    key={location.id} 
                    hover
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedLocation?.id === location.id ? 'action.selected' : 'inherit'
                    }}
                    onClick={() => handleLocationSelect(location)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {location.location_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{location.location_name}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {location.user_group?.user_group_code} - {location.user_group?.user_group_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${location.province_code} - ${PROVINCES[location.province_code as keyof typeof PROVINCES]}`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={location.operational_status}
                        color={OPERATIONAL_STATUS_COLORS[location.operational_status as keyof typeof OPERATIONAL_STATUS_COLORS]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {location.daily_capacity ? (
                        <Typography variant="body2">
                          {location.current_load || 0} / {location.daily_capacity}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={location.user_assignment_count || 0}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Staff">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLocationSelect(location);
                            setActiveTab(2);
                          }}
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/admin/locations/${location.id}/edit`);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(location);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Staff Assignments Tab - Only shows when location is selected */}
        {selectedLocation && (
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">Staff Assignments</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLocation.location_name} ({selectedLocation.location_code})
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => handleOpenStaffDialog()}
              >
                Assign Staff
              </Button>
            </Box>
            
            {staffLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading staff assignments...</Typography>
              </Box>
            ) : staffAssignments.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Assignment Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Effective Date</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Access Level</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffAssignments.map((assignment) => (
                      <TableRow key={assignment.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {assignment.user_full_name || assignment.user_username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.user_email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.assignment_type}
                            color={assignment.assignment_type === AssignmentType.PRIMARY ? 'primary' : 'default'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.assignment_status}
                            color={assignment.assignment_status === AssignmentStatus.ACTIVE ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {assignment.effective_date ? new Date(assignment.effective_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment.expiry_date ? new Date(assignment.expiry_date).toLocaleDateString() : 'No expiry'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.access_level || 'Standard'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {assignment.can_manage_location && (
                              <Chip label="Manage" color="primary" size="small" />
                            )}
                            {assignment.can_assign_others && (
                              <Chip label="Assign" color="secondary" size="small" />
                            )}
                            {assignment.can_view_reports && (
                              <Chip label="Reports" color="info" size="small" />
                            )}
                            {assignment.can_manage_resources && (
                              <Chip label="Resources" color="warning" size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Assignment">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenStaffDialog(assignment)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Assignment">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveStaffAssignment(assignment)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No staff assignments found for this location.
              </Alert>
            )}
          </TabPanel>
        )}
      </Card>

      {/* Staff Assignment Dialog */}
      <Dialog
        open={staffDialogOpen}
        onClose={handleCloseStaffDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <form onSubmit={handleStaffSubmit(handleStaffAssignmentSubmit)}>
          <DialogTitle>
            {editingAssignment ? 'Edit Staff Assignment' : 'Assign Staff to Location'}
            {selectedLocation && (
              <Typography variant="body2" color="text.secondary">
                {selectedLocation.location_name} ({selectedLocation.location_code})
              </Typography>
            )}
          </DialogTitle>
          
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Assignment Info */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Assignment Details</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="user_id"
                  control={staffControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="User ID"
                      placeholder="Enter user ID"
                      error={!!staffErrors.user_id}
                      helperText={staffErrors.user_id?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="assignment_type"
                  control={staffControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!staffErrors.assignment_type}>
                      <InputLabel>Assignment Type</InputLabel>
                      <Select {...field} label="Assignment Type">
                        {Object.values(AssignmentType).map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="effective_date"
                  control={staffControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Effective Date"
                      InputLabelProps={{ shrink: true }}
                      error={!!staffErrors.effective_date}
                      helperText={staffErrors.effective_date?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="expiry_date"
                  control={staffControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Expiry Date (Optional)"
                      InputLabelProps={{ shrink: true }}
                      error={!!staffErrors.expiry_date}
                      helperText={staffErrors.expiry_date?.message}
                    />
                  )}
                />
              </Grid>
              
              {/* Access Level and Permissions */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Access & Permissions
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="access_level"
                  control={staffControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Access Level</InputLabel>
                      <Select {...field} label="Access Level">
                        <MenuItem value="basic">Basic</MenuItem>
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                        <MenuItem value="admin">Administrator</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Controller
                    name="can_manage_location"
                    control={staffControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Can manage location"
                      />
                    )}
                  />
                  <Controller
                    name="can_assign_others"
                    control={staffControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Can assign other staff"
                      />
                    )}
                  />
                  <Controller
                    name="can_view_reports"
                    control={staffControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Can view reports"
                      />
                    )}
                  />
                  <Controller
                    name="can_manage_resources"
                    control={staffControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Can manage resources"
                      />
                    )}
                  />
                </Box>
              </Grid>
              
              {/* Additional Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Additional Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="work_schedule"
                  control={staffControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Work Schedule"
                      placeholder="e.g., Monday-Friday 8:00-17:00"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="responsibilities"
                  control={staffControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Responsibilities"
                      placeholder="Key responsibilities..."
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="assignment_reason"
                  control={staffControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Assignment Reason"
                      placeholder="Reason for this assignment..."
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="notes"
                  control={staffControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      placeholder="Additional notes..."
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseStaffDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={staffSubmitting}
            >
              {staffSubmitting ? 'Saving...' : (editingAssignment ? 'Update Assignment' : 'Assign Staff')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Fab
          color="primary"
          aria-label="create user group"
          onClick={() => navigate('/dashboard/admin/locations/user-groups/create')}
        >
          <GroupIcon />
        </Fab>
        <Fab
          color="secondary"
          aria-label="create location"
          onClick={() => navigate('/dashboard/admin/locations/create')}
        >
          <LocationCityIcon />
        </Fab>
      </Box>
    </Box>
  );
};

export default LocationManagementPage; 