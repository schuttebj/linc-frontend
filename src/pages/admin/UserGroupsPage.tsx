/**
 * User Groups Management Page
 * Dedicated page for managing user groups (authorities)
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
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

// Services and types
import { userGroupService } from '../../services/locationService';
import {
  UserGroup,
  RegistrationStatus,
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

const UserGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<UserGroupStatistics | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Load data
  useEffect(() => {
    loadUserGroups();
    loadStatistics();
  }, []);

  const loadUserGroups = async () => {
    setLoading(true);
    try {
      const data = await userGroupService.getAll();
      setUserGroups(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load user groups');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await userGroupService.getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleDeleteUserGroup = async (userGroup: UserGroup) => {
    if (!window.confirm(`Are you sure you want to delete user group "${userGroup.user_group_name}"?`)) {
      return;
    }

    try {
      await userGroupService.delete(userGroup.id);
      toast.success('User group deleted successfully');
      loadUserGroups();
      loadStatistics();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user group');
    }
  };

  // Filter data
  const filteredUserGroups = userGroups.filter((ug: UserGroup) => {
    const matchesSearch = !searchTerm || 
      ug.user_group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ug.user_group_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !selectedProvince || ug.province_code === selectedProvince;
    const matchesStatus = !selectedStatus || ug.registration_status === selectedStatus;
    return matchesSearch && matchesProvince && matchesStatus;
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
              User Groups Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage authorities and user groups across provinces
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadUserGroups} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/admin/user-groups/create')}
          >
            Create User Group
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon color="primary" />
                <Box>
                  <Typography variant="h6">{statistics?.total_user_groups || userGroups.length}</Typography>
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
                <BusinessIcon color="success" />
                <Box>
                  <Typography variant="h6">
                    {statistics?.active_count || userGroups.filter((ug: UserGroup) => ug.registration_status === RegistrationStatus.REGISTERED).length}
                  </Typography>
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
                <BusinessIcon color="warning" />
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
                <BusinessIcon color="info" />
                <Box>
                  <Typography variant="h6">
                    {Object.keys(statistics?.by_type || {}).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Group Types
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
                placeholder="Search user groups..."
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(RegistrationStatus).map(status => (
                    <MenuItem key={status} value={status}>{status.replace('_', ' ')}</MenuItem>
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
                  setSelectedStatus('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* User Groups Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              User Groups ({filteredUserGroups.length})
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredUserGroups.length === 0 ? (
            <Alert severity="info">
              {userGroups.length === 0 ? 'No user groups found. Create your first user group to get started.' : 'No user groups match your search criteria.'}
            </Alert>
          ) : (
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
                          label={userGroup.registration_status.replace('_', ' ')}
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
                          onClick={() => navigate(`/dashboard/admin/locations-management?user_group=${userGroup.id}`)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/dashboard/admin/user-groups/${userGroup.id}/edit`)}
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserGroupsPage; 