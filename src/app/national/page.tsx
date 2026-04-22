'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, ListItemButton } from '@mui/material';
import { Add, TrendingUp, People, School, Settings, Announcement, Church, Map, Warning, Refresh } from '@mui/icons-material';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function NationalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [insight, setInsight] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      if (u.role !== 'NATIONAL_ADMIN') router.push('/login');
      else loadDashboard();
    } else {
      router.push('/login');
    }
  }, [router]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/national/dashboard');
      setStats({
        totalAssemblies: res.data.totalAssemblies,
        totalStudents: res.data.totalStudents,
        totalTeachers: res.data.totalTeachers,
        attendanceRate: res.data.attendanceRate,
      });
      setAssemblies(res.data.assemblies || []);
      setInsight(res.data.insight || '');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <TrendingUp />, path: '/national' },
    { text: 'Structure', icon: <Church />, path: '/national/structure' },
    { text: 'Announcements', icon: <Announcement />, path: '/national/announcements' },
    { text: 'Contributions', icon: <School />, path: '/national/contributions' },
    { text: 'Reports', icon: <Map />, path: '/national/reports' },
    { text: 'Settings', icon: <Settings />, path: '/national/settings' },
  ];

  if (loading) return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box sx={{ width: 240, bgcolor: '#fff', borderRight: 1, borderColor: 'divider' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">The Ecclesia</Typography>
          <Typography variant="caption" color="text.secondary">National Dashboard</Typography>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => router.push(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3, bgcolor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Welcome{user ? `, ${user.firstName}` : ''}!
            </Typography>
            <Typography color="text.secondary">{stats.totalAssemblies || 0} assemblies across the denomination</Typography>
          </Box>
          <Button startIcon={<Refresh />} onClick={loadDashboard}>Refresh</Button>
        </Box>

        {/* AI Insight */}
        {insight && (
          <Card sx={{ mb: 3, bgcolor: '#e3f2fd', borderLeft: 4, borderColor: '#1976d2' }}>
            <CardContent>
              <Typography fontWeight={600} sx={{ mb: 1 }}>AI Insight</Typography>
              <Typography>{insight}</Typography>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Total Assemblies</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.totalAssemblies}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Total Students</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.totalStudents}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Total Teachers</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.totalTeachers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">Attendance Rate</Typography>
                <Typography variant="h4" fontWeight={700}>{stats.attendanceRate}%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button variant="contained" startIcon={<Add />}>Add Region</Button>
          <Button variant="outlined">Add District</Button>
          <Button variant="outlined">Add Assembly</Button>
        </Box>

        {/* Assembly List */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>All Assemblies</Typography>
            {(assemblies || []).length === 0 ? (
              <Typography color="text.secondary">No assemblies yet</Typography>
            ) : (
              <List dense>
                {(assemblies || []).slice(0, 10).map((assembly: any) => (
                  <ListItem key={assembly.id} secondaryAction={
                    <Chip label="Active" size="small" color="success" />
                  }>
                    <ListItemText 
                      primary={assembly.name} 
                      secondary={assembly.pastorLeader || 'No pastor assigned'} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}