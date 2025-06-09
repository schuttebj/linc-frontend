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
} from '@mui/material';
import {
  Dashboard,
  PersonAdd,
  Search,
  AdminPanelSettings,
} from '@mui/icons-material';

const drawerWidth = 240;

const navigationItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { text: 'Register Person', path: '/dashboard/persons/register', icon: <PersonAdd /> },
  { text: 'Search Persons', path: '/dashboard/persons/search', icon: <Search /> },
  { text: 'Country Config', path: '/dashboard/admin/countries', icon: <AdminPanelSettings /> },
];

const DashboardLayout: React.FC = () => {
  const location = useLocation();

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
          <Typography variant="h6" noWrap component="div">
            LINC - Driver's Licensing System
          </Typography>
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
            <ListItem key={item.text} disablePadding>
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