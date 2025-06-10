import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  CssBaseline,
  IconButton,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Dashboard,
  People,
  Search,
  PersonAdd,
  AdminPanelSettings,
  ExpandLess,
  ExpandMore,
  AccountCircle,
  Logout,
  Settings
} from '@mui/icons-material';
import { useState } from 'react';
import { Collapse, List as MuiList } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const navigationItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { 
    text: 'Persons', 
    icon: <People />, 
    subItems: [
      { text: 'Manage Person', path: '/dashboard/persons/manage', icon: <PersonAdd /> },
      { text: 'Search & Browse', path: '/dashboard/persons/search', icon: <Search /> },
    ]
  },
  { text: 'Administration', path: '/dashboard/admin/countries', icon: <AdminPanelSettings /> },
];

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [personsOpen, setPersonsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();

  const handlePersonsClick = () => {
    setPersonsOpen(!personsOpen);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleUserMenuClose();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{ 
          width: `calc(100% - ${drawerWidth}px)`, 
          ml: `${drawerWidth}px`,
          bgcolor: 'primary.main'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            LINC - Driver's Licensing System
          </Typography>
          
          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={user?.username || 'User'} 
              variant="outlined" 
              size="small"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
            <IconButton
              onClick={handleUserMenuClick}
              sx={{ color: 'white' }}
            >
              <AccountCircle />
            </IconButton>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            LINC
          </Typography>
        </Toolbar>
        
        <List>
          {navigationItems.map((item) => (
            <div key={item.text}>
              {item.subItems ? (
                <>
                  <ListItem disablePadding>
                    <ListItemButton onClick={handlePersonsClick}>
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                      {personsOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={personsOpen} timeout="auto" unmountOnExit>
                    <MuiList component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItem key={subItem.text} disablePadding>
                          <ListItemButton
                            component={Link}
                            to={subItem.path}
                            selected={location.pathname === subItem.path}
                            sx={{ pl: 4 }}
                          >
                            <ListItemIcon>
                              {subItem.icon}
                            </ListItemIcon>
                            <ListItemText primary={subItem.text} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </MuiList>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )}
            </div>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout; 