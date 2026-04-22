'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Grid, Card, CardContent
} from '@mui/material';
import {
  Dashboard as DashboardIcon, School as SchoolIcon, People as PeopleIcon,
  CalendarMonth as CalendarIcon, Assessment as AssessmentIcon,
  Settings as SettingsIcon, Logout as LogoutIcon, Menu as MenuIcon, Church as ChurchIcon
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;
const api = axios.create({ baseURL: '/api' });

export default function DashboardPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ students: 0, classes: 0, teachers: 0, attendance: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else router.push('/login');
  }, [router]);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({
        students: res.data.totalStudents || 0,
        teachers: res.data.totalTeachers || 0,
        classes: 0,
        attendance: res.data.attendanceRate || 0,
      });
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Students', icon: <PeopleIcon />, path: '/dashboard/students' },
    { text: 'Classes', icon: <SchoolIcon />, path: '/dashboard/classes' },
    { text: 'Attendance', icon: <CalendarIcon />, path: '/dashboard/attendance' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/dashboard/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
  ];

  const drawer = (
    <Box sx={{ bgcolor: '#fff', height: '100%' }}>
      <Toolbar>
        <ChurchIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={700} color="primary.main">The Ecclesia</Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => router.push(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ bgcolor: '#fff', color: '#333', boxShadow: 1 }}>
        <Toolbar>
          <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}><MenuIcon /></IconButton>
          <Typography variant="h6" noWrap>Dashboard</Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(!mobileOpen)}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome{user ? `, ${user.firstName}` : ''}!
          </Typography>
          <Typography color="text.secondary">Here&apos;s your Sunday school overview</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Total Students</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.students}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Classes</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.classes}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Teachers</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.teachers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Attendance</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.attendance}%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}