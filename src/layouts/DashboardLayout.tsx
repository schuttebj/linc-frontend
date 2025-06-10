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
  People,
  Search,
  PersonAdd,
  AdminPanelSettings,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useState } from 'react';
import { Collapse, List as MuiList } from '@mui/material';

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

  const handlePersonsClick = () => {
    setPersonsOpen(!personsOpen);
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