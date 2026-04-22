'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Grid, Button, List, ListItem, ListItemText } from '@mui/material';
import { Refresh, Add } from '@mui/icons-material';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function DistrictDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      if (u.role !== 'DISTRICT_ADMIN') router.push('/login');
      else loadDashboard();
    } else {
      router.push('/login');
    }
  }, [router]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/district/dashboard');
      setStats({
        totalAssemblies: res.data.totalAssemblies,
        totalStudents: res.data.totalStudents,
        totalTeachers: res.data.totalTeachers,
        attendanceRate: res.data.attendanceRate,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box sx={{ width: 220, bgcolor: '#fff', borderRight: 1, borderColor: 'divider', p: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary.main">The Ecclesia</Typography>
        <Typography variant="caption" color="text.secondary">District Dashboard</Typography>
        <List dense sx={{ mt: 2 }}>
          <ListItem disablePadding><ListItemText primary="Dashboard" /></ListItem>
          <ListItem disablePadding><ListItemText primary="Assemblies" /></ListItem>
          <ListItem disablePadding><ListItemText primary="Contributions" /></ListItem>
        </List>
        <Button fullWidth onClick={handleLogout} sx={{ mt: 2 }}>Logout</Button>
      </Box>

      <Box sx={{ flex: 1, p: 3, bgcolor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Welcome{user ? `, ${user.firstName}` : ''}!</Typography>
            <Typography color="text.secondary">District Overview</Typography>
          </Box>
          <Button startIcon={<Refresh />} onClick={loadDashboard}>Refresh</Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="body2">Assemblies</Typography>
              <Typography variant="h4" fontWeight={700}>{stats.totalAssemblies}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="body2">Students</Typography>
              <Typography variant="h4" fontWeight={700}>{stats.totalStudents}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="body2">Teachers</Typography>
              <Typography variant="h4" fontWeight={700}>{stats.totalTeachers}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="body2">Attendance</Typography>
              <Typography variant="h4" fontWeight={700}>{stats.attendanceRate}%</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<Add />}>Add Assembly</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}