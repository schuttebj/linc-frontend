/**
 * User Management Page
 * Complete user management interface with card wrapper styling
 * Follows the same design pattern as PersonManagementPage
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import {
  User,
  UserListFilter,
  UserStatus,
  UserType,
  AuthorityLevel,
  UserGroup,
  Province
} from '../../types/user';

// Validation schema
const filterSchema = yup.object({
  search: yup.string(),
  status: yup.string(),
  userType: yup.string(),
  provinceCode: yup.string(),
  userGroupCode: yup.string(),
  authorityLevel: yup.string(),
  department: yup.string(),
  isActive: yup.boolean()
});

interface FilterFormData {
  search?: string;
  status?: UserStatus;
  userType?: UserType;
  provinceCode?: string;
  userGroupCode?: string;
  authorityLevel?: AuthorityLevel;
  department?: string;
  isActive?: boolean;
}

const UserManagementPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Lookup data
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  // Filter state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const { } = useAuth();

  // Form setup
  const {
    control,
    handleSubmit,
    reset
  } = useForm<FilterFormData>({
    resolver: yupResolver(filterSchema),
    defaultValues: {
      isActive: true // Default to show active users
    }
  });

  // Load initial data
  useEffect(() => {
    loadLookupData();
    loadUsers();
  }, []);

  // Load users when page/filters change
  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage]);

  const loadLookupData = async () => {
    try {
      const [userGroupsData, provincesData] = await Promise.all([
        userService.getUserGroups(),
        userService.getProvinces()
      ]);
      
      setUserGroups(userGroupsData);
      setProvinces(provincesData);
      
      // Departments would be loaded from API in real implementation
    } catch (err) {
      console.error('Error loading lookup data:', err);
    }
  };

  const loadUsers = async (filters?: FilterFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const filterParams: UserListFilter = {};
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            (filterParams as any)[key] = value;
          }
        });
      }

      const response = await userService.listUsers(page + 1, rowsPerPage, filterParams);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (data: FilterFormData) => {
    setPage(0); // Reset to first page
    loadUsers(data);
  };

  const handleClearFilters = () => {
    reset();
    setPage(0);
    loadUsers();
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    navigate(`/dashboard/admin/users/${user.id}/edit`);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await userService.deleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    navigate('/dashboard/admin/users/create');
  };

  const formatUserDisplayName = (user: User): string => {
    return userService.formatUserDisplayName(user);
  };

  const getUserStatusColor = (status: UserStatus) => {
    return userService.getUserStatusColor(status);
  };

  // Render filter card
  const renderFiltersCard = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Search & Filter Users
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            startIcon={<FilterIcon />}
          >
            {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        <form onSubmit={handleSubmit(handleFilter)}>
          <Grid container spacing={3}>
            {/* Search */}
            <Grid item xs={12} md={6}>
              <Controller
                name="search"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Search Users"
                    placeholder="Search by name, username, email, or employee ID"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: field.value && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => field.onChange('')} size="small">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            {/* Active Status */}
            <Grid item xs={12} md={3}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Active Users Only"
                  />
                )}
              />
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={loading}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Box>
            </Grid>

            {/* Extended Filters */}
            {filtersExpanded && (
              <>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select {...field} label="Status">
                          <MenuItem value="">All Statuses</MenuItem>
                          <MenuItem value={UserStatus.ACTIVE}>Active</MenuItem>
                          <MenuItem value={UserStatus.SUSPENDED}>Suspended</MenuItem>
                          <MenuItem value={UserStatus.INACTIVE}>Inactive</MenuItem>
                          <MenuItem value={UserStatus.LOCKED}>Locked</MenuItem>
                          <MenuItem value={UserStatus.PENDING_ACTIVATION}>Pending Activation</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="userType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>User Type</InputLabel>
                        <Select {...field} label="User Type">
                          <MenuItem value="">All Types</MenuItem>
                          <MenuItem value={UserType.STANDARD}>Standard</MenuItem>
                          <MenuItem value={UserType.EXAMINER}>Examiner</MenuItem>
                          <MenuItem value={UserType.SUPERVISOR}>Supervisor</MenuItem>
                          <MenuItem value={UserType.ADMIN}>Administrator</MenuItem>
                          <MenuItem value={UserType.SYSTEM}>System</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="provinceCode"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Province</InputLabel>
                        <Select {...field} label="Province">
                          <MenuItem value="">All Provinces</MenuItem>
                          {provinces.map((province) => (
                            <MenuItem key={province.code} value={province.code}>
                              {province.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="userGroupCode"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>User Group</InputLabel>
                        <Select {...field} label="User Group">
                          <MenuItem value="">All User Groups</MenuItem>
                          {userGroups.map((group) => (
                            <MenuItem key={group.id} value={group.userGroupCode}>
                              {group.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </form>
      </CardContent>
    </Card>
  );

  // Render user table card
  const renderUserTableCard = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Users ({totalUsers} total)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => loadUsers()}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateUser}
              startIcon={<PersonAddIcon />}
            >
              Create User
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>User Group</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Authority Level</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {formatUserDisplayName(user)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.personalDetails?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.userGroup?.name || user.userGroupCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.department || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={getUserStatusColor(user.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.authorityLevel}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewUser(user)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </CardContent>
    </Card>
  );

  // Render user details dialog
  const renderUserDetailsDialog = () => (
    <Dialog 
      open={viewDialogOpen} 
      onClose={() => setViewDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        User Details: {selectedUser ? formatUserDisplayName(selectedUser) : ''}
      </DialogTitle>
      <DialogContent>
        {selectedUser && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                  <Typography variant="body1">{selectedUser.personalDetails?.fullName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                  <Typography variant="body1">{selectedUser.username}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedUser.personalDetails?.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedUser.personalDetails?.phoneNumber || '-'}</Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Work Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Work Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">User Group</Typography>
                  <Typography variant="body1">{selectedUser.userGroup?.name || selectedUser.userGroupCode}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Office</Typography>
                  <Typography variant="body1">{selectedUser.office?.code || selectedUser.officeCode}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{selectedUser.department || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Job Title</Typography>
                  <Typography variant="body1">{selectedUser.jobTitle || '-'}</Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Status Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Status & Permissions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip label={selectedUser.status} size="small" color={getUserStatusColor(selectedUser.status)} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Authority Level</Typography>
                  <Typography variant="body1">{selectedUser.authorityLevel}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Active</Typography>
                  <Typography variant="body1">{selectedUser.isActive ? 'Yes' : 'No'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Superuser</Typography>
                  <Typography variant="body1">{selectedUser.isSuperuser ? 'Yes' : 'No'}</Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Audit Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                Audit Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">{new Date(selectedUser.createdAt).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1">{new Date(selectedUser.updatedAt).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                  <Typography variant="body1">{selectedUser.createdBy || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                  <Typography variant="body1">
                    {selectedUser.lastLoginAt 
                      ? new Date(selectedUser.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            setViewDialogOpen(false);
            if (selectedUser) handleEditUser(selectedUser);
          }}
          startIcon={<EditIcon />}
        >
          Edit User
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render delete confirmation dialog
  const renderDeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>Confirm Delete User</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete user "{selectedUser ? formatUserDisplayName(selectedUser) : ''}"?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This will deactivate the user account. This action can be reversed later.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleDeleteUser} 
          color="error" 
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete User'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Export Users
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage system users, their roles, and permissions.
      </Typography>

      {/* Filter Card */}
      {renderFiltersCard()}

      {/* User Table Card */}
      {renderUserTableCard()}

      {/* Dialogs */}
      {renderUserDetailsDialog()}
      {renderDeleteDialog()}
    </Box>
  );
};

export default UserManagementPage; 