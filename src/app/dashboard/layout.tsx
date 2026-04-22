'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {
  Dashboard as DashboardIcon,
  Church as ChurchIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Storage as StorageIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Campaign as CampaignIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  CheckCircle,
  Assignment,
} from '@mui/icons-material';

const drawerWidth = 240;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Organizational Structure', icon: <ChurchIcon />, path: '/dashboard/structure' },
    { text: 'Students', icon: <PeopleIcon />, path: '/dashboard/students' },
    { text: 'Classes', icon: <SchoolIcon />, path: '/dashboard/classes' },
    { text: 'Attendance', icon: <CheckCircle />, path: '/dashboard/attendance' },
    { text: 'Lesson Plans', icon: <StorageIcon />, path: '/dashboard/lessons' },
    { text: 'Assignments', icon: <Assignment />, path: '/dashboard/assignments' },
    { text: 'Fees & Payments', icon: <ReceiptIcon />, path: '/dashboard/fees' },
    { text: 'Calendar', icon: <CalendarIcon />, path: '/dashboard/calendar' },
    { text: 'Announcements', icon: <CampaignIcon />, path: '/dashboard/announcements' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/dashboard/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const drawer = (
    <Box sx={{ bgcolor: '#1a1a2e', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
          The Ecclesia
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: '#2a2a4e' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => router.push(item.path)}
              sx={{ color: '#ccc', '&:hover': { bgcolor: '#2a2a4e' } }}
            >
              <ListItemIcon sx={{ color: '#888' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ bgcolor: '#2a2a4e' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ color: '#ff6b6b', '&:hover': { bgcolor: '#2a2a4e' } }}
          >
            <ListItemIcon sx={{ color: '#ff6b6b' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
            {user.role.replace('_', ' ')}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#1a1a2e',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#1a1a2e',
              borderRight: '1px solid #2a2a4e',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}