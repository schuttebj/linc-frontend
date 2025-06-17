/**
 * Staff Management Page
 * Dedicated page for managing staff assignments across locations
 * Extracted from LocationManagementPage for better scalability
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

// Services and types
import { 
  staffAssignmentService, 
  locationService, 
  userGroupService 
} from '../../services/locationService';
import {
  UserLocationAssignment,
  Location,
  UserGroup,
  AssignmentType,
  AssignmentStatus
} from '../../types/location';



// Status color mapping
const ASSIGNMENT_STATUS_COLORS = {
  [AssignmentStatus.ACTIVE]: 'success',
  [AssignmentStatus.INACTIVE]: 'default',
  [AssignmentStatus.SUSPENDED]: 'error',
  [AssignmentStatus.PENDING]: 'warning'
} as const;

// Assignment type color mapping
const ASSIGNMENT_TYPE_COLORS = {
  [AssignmentType.PRIMARY]: 'primary',
  [AssignmentType.SECONDARY]: 'secondary',
  [AssignmentType.TEMPORARY]: 'info'
} as const;

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationFilter = searchParams.get('location');
  
  // State management
  const [assignments, setAssignments] = useState<UserLocationAssignment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(locationFilter || '');
  const [selectedUserGroup, setSelectedUserGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Load data
  useEffect(() => {
    loadAssignments();
    loadLocations();
    loadUserGroups();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      // For now, we'll use a placeholder since we need all assignments, not just by location
      // This would need to be implemented in the backend as a general getAll method
      const data: UserLocationAssignment[] = [];
      setAssignments(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load staff assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationService.getAll();
      setLocations(data);
    } catch (error: any) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadUserGroups = async () => {
    try {
      const data = await userGroupService.getAll();
      setUserGroups(data);
    } catch (error: any) {
      console.error('Failed to load user groups:', error);
    }
  };

  const handleDeleteAssignment = async (assignment: UserLocationAssignment) => {
    if (!window.confirm(`Are you sure you want to delete assignment for "${assignment.user_full_name}"?`)) {
      return;
    }

    try {
      await staffAssignmentService.removeAssignment(assignment.location_id, assignment.id);
      toast.success('Staff assignment deleted successfully');
      loadAssignments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete assignment');
    }
  };

  // Filter data
  const filteredAssignments = assignments.filter((assignment: UserLocationAssignment) => {
    const matchesSearch = !searchTerm || 
      assignment.user_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !selectedLocation || assignment.location_id === selectedLocation;
    const matchesUserGroup = !selectedUserGroup || assignment.location?.user_group_id === selectedUserGroup;
    const matchesStatus = !selectedStatus || assignment.assignment_status === selectedStatus;
    const matchesType = !selectedType || assignment.assignment_type === selectedType;
    return matchesSearch && matchesLocation && matchesUserGroup && matchesStatus && matchesType;
  });

  // Statistics
  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter((a: UserLocationAssignment) => a.assignment_status === AssignmentStatus.ACTIVE).length;
  const uniqueLocations = new Set(assignments.map((a: UserLocationAssignment) => a.location_id)).size;
  const uniqueUserGroups = new Set(assignments.map((a: UserLocationAssignment) => a.location?.user_group_id).filter(Boolean)).size;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/admin/locations')} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Staff Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage staff assignments across locations
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadAssignments} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/admin/staff-management/create')}
          >
            Assign Staff
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="primary" />
                <Box>
                  <Typography variant="h6">{totalAssignments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Assignments
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
                <PersonIcon color="success" />
                <Box>
                  <Typography variant="h6">{activeAssignments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Staff
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
                <LocationIcon color="warning" />
                <Box>
                  <Typography variant="h6">{uniqueLocations}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Locations Covered
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
                <GroupIcon color="info" />
                <Box>
                  <Typography variant="h6">{uniqueUserGroups}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    User Groups
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
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search staff..."
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
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  label="Location"
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locations.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.location_code} - {loc.location_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
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
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(AssignmentStatus).map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.values(AssignmentType).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
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
                  setSelectedLocation(locationFilter || '');
                  setSelectedUserGroup('');
                  setSelectedStatus('');
                  setSelectedType('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Staff Assignments Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Staff Assignments ({filteredAssignments.length})
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredAssignments.length === 0 ? (
            <Alert severity="info">
              {assignments.length === 0 ? 'No staff assignments found. Create your first assignment to get started.' : 'No assignments match your search criteria.'}
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff Member</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>User Group</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {assignment.user_full_name?.[0] || assignment.user_username?.[0] || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {assignment.user_full_name || assignment.user_username || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.user_email || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.location?.location_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.location?.location_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {assignment.location?.user_group?.user_group_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.location?.user_group?.user_group_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.access_level || 'Standard'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.assignment_type}
                          color={ASSIGNMENT_TYPE_COLORS[assignment.assignment_type as keyof typeof ASSIGNMENT_TYPE_COLORS]}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.assignment_status}
                          color={ASSIGNMENT_STATUS_COLORS[assignment.assignment_status as keyof typeof ASSIGNMENT_STATUS_COLORS]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {assignment.effective_date ? new Date(assignment.effective_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/dashboard/admin/staff-management/${assignment.id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAssignment(assignment)}
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StaffManagementPage; 