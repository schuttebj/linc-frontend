import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material';
import { Search, Person, Work, Email, Phone } from '@mui/icons-material';
import { User } from '../types/user';
import { userService } from '../services/userService';

interface UserSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  excludeLocationId?: string;
  title?: string;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  open,
  onClose,
  onSelectUser,
  excludeLocationId,
  title = 'Search Users for Assignment'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // User type options
  const userTypes = [
    { value: '', label: 'All User Types' },
    { value: '1', label: 'Standard User' },
    { value: '3', label: 'Examiner' },
    { value: '4', label: 'Supervisor' },
    { value: '5', label: 'Administrator' },
    { value: '2', label: 'System User' }
  ];

  // Search users when search term changes (with debounce)
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
      setHasSearched(false);
    }
  }, [searchTerm, userType]);

  const handleSearch = async () => {
    if (searchTerm.length < 2) return;

    setLoading(true);
    setError(null);
    try {
      const searchResults = await userService.searchUsers(
        searchTerm,
        50,
        {
          excludeAssignedToLocation: excludeLocationId,
          userType: userType || undefined
        }
      );
      setUsers(searchResults);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onClose();
    // Reset search
    setSearchTerm('');
    setUsers([]);
    setHasSearched(false);
  };

  const getUserTypeLabel = (typeCode: string) => {
    const type = userTypes.find(t => t.value === typeCode);
    return type?.label || typeCode;
  };

  const getUserStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'locked': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: '80%', md: '70%', lg: '60%' },
        maxWidth: 800,
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search by name, username, email, or employee ID
          </Typography>
        </Box>

        {/* Search Controls */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>User Type</InputLabel>
              <Select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                label="User Type"
              >
                {userTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Please enter at least 2 characters to search
            </Alert>
          )}
        </Box>

        {/* Results */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {hasSearched && users.length === 0 && !loading && !error && (
            <Alert severity="info">
              No users found matching your search criteria
              {excludeLocationId && ' (excluding users already assigned to this location)'}
            </Alert>
          )}

          {users.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Found {users.length} user{users.length !== 1 ? 's' : ''}
              </Typography>
              <List>
                {users.map((user) => (
                  <ListItem
                    key={user.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" component="span">
                            {user.personalDetails?.fullName || user.fullName || user.username}
                          </Typography>
                          <Chip
                            label={user.status}
                            size="small"
                            color={getUserStatusColor(user.status) as any}
                            variant="outlined"
                          />
                          <Chip
                            label={getUserTypeLabel(user.userTypeCode)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Person fontSize="small" />
                            {user.username}
                          </Typography>
                          {user.personalDetails?.email && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Email fontSize="small" />
                              {user.personalDetails.email}
                            </Typography>
                          )}
                          {user.employeeId && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Work fontSize="small" />
                              Employee ID: {user.employeeId}
                            </Typography>
                          )}
                          {user.userGroupCode && (
                            <Typography variant="body2" color="text.secondary">
                              User Group: {user.userGroupCode}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSelectUser(user)}
                        size="small"
                      >
                        Select
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserSearchModal; 