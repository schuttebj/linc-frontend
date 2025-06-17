/**
 * Locations Management Page
 * Dedicated page for managing locations and facilities
 * Extracted from LocationManagementPage for better scalability
 */

import React, { useState, useEffect } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  LocationCity as LocationCityIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

// Services and types
import { locationService, userGroupService } from '../../services/locationService';
import {
  Location,
  UserGroup,
  OperationalStatus,
  LocationStatistics
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
const OPERATIONAL_STATUS_COLORS = {
  [OperationalStatus.OPERATIONAL]: 'success',
  [OperationalStatus.MAINTENANCE]: 'warning',
  [OperationalStatus.SUSPENDED]: 'error',
  [OperationalStatus.SETUP]: 'info',
  [OperationalStatus.DECOMMISSIONED]: 'default',
  [OperationalStatus.INSPECTION]: 'warning',
} as const;

const LocationsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [locations, setLocations] = useState<Location[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<LocationStatistics | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedUserGroup, setSelectedUserGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Load data
  useEffect(() => {
    loadLocations();
    loadUserGroups();
    loadStatistics();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await locationService.getAll();
      setLocations(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load locations');
    } finally {
      setLoading(false);
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

  const loadStatistics = async () => {
    try {
      const stats = await locationService.getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (!window.confirm(`Are you sure you want to delete location "${location.location_name}"?`)) {
      return;
    }

    try {
      await locationService.delete(location.id);
      toast.success('Location deleted successfully');
      loadLocations();
      loadStatistics();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete location');
    }
  };

  // Filter data
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = !searchTerm || 
      loc.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.location_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !selectedProvince || loc.province_code === selectedProvince;
    const matchesUserGroup = !selectedUserGroup || loc.user_group_id === selectedUserGroup;
    const matchesStatus = !selectedStatus || loc.operational_status === selectedStatus;
    return matchesSearch && matchesProvince && matchesUserGroup && matchesStatus;
  });

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
              Locations Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage locations and facilities across your organization
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadLocations} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/admin/locations-management/create')}
          >
            Create Location
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationCityIcon color="primary" />
                <Box>
                  <Typography variant="h6">{statistics?.total_locations || locations.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Locations
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
                  <Typography variant="h6">
                    {statistics?.active_count || locations.filter(loc => loc.operational_status === 'operational').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Operational Locations
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
                  <Typography variant="h6">
                    {Object.keys(statistics?.by_province || {}).length || Object.keys(PROVINCES).length}
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
                <PeopleIcon color="info" />
                <Box>
                  <Typography variant="h6">
                    {statistics?.total_capacity || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Capacity
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search locations..."
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
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(OperationalStatus).map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
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
                  setSelectedStatus('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Locations ({filteredLocations.length})
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredLocations.length === 0 ? (
            <Alert severity="info">
              {locations.length === 0 ? 'No locations found. Create your first location to get started.' : 'No locations match your search criteria.'}
            </Alert>
          ) : (
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
                    <TableRow key={location.id} hover>
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
                          onClick={() => navigate(`/dashboard/admin/staff-management?location=${location.id}`)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Staff">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/dashboard/admin/staff-management?location=${location.id}`)}
                          >
                            <PeopleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/dashboard/admin/locations-management/${location.id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteLocation(location)}
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

export default LocationsPage; 