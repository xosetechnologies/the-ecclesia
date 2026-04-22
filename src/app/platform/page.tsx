'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, IconButton, Chip
} from '@mui/material';
import { CheckCircle, PauseCircle, PlayArrow, Refresh } from '@mui/icons-material';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function PlatformDashboard() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChapters(); }, []);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizations');
      setChapters(res.data.chapters || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAction = async (chapterId: string, action: string) => {
    try {
      await api.patch(`/organizations/${chapterId}`, { organizationId: chapterId, action });
      loadChapters();
    } catch (e) { console.error(e); }
  };

  const getStatusColor = (status: string) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'SUSPENDED') return 'error';
    return 'warning';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Chapters</Typography>
              <Typography variant="h3" fontWeight={700}>{chapters.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Active</Typography>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {chapters.filter((c: any) => c.status === 'ACTIVE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Pending</Typography>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {chapters.filter((c: any) => c.status === 'PENDING').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Suspended</Typography>
              <Typography variant="h3" fontWeight={700} color="error.main">
                {chapters.filter((c: any) => c.status === 'SUSPENDED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>National Chapters</Typography>
            <Button startIcon={<Refresh />} onClick={loadChapters}>Refresh</Button>
          </Box>

          {chapters.length === 0 ? (
            <Typography color="text.secondary">No chapters registered yet</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {chapters.map((chapter: any) => (
                <Card key={chapter.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography fontWeight={600}>{chapter.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{chapter.country}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={chapter.status || 'PENDING'} color={getStatusColor(chapter.status)} size="small" />
                      <Chip label={chapter.subscriptionStatus || 'ACTIVE'} color={chapter.subscriptionStatus === 'ACTIVE' ? 'success' : 'error'} size="small" />
                      <IconButton size="small" onClick={() => handleAction(chapter.id, 'approve')} title="Approve"><CheckCircle /></IconButton>
                      <IconButton size="small" onClick={() => handleAction(chapter.id, 'suspend')} title="Suspend"><PauseCircle /></IconButton>
                      <IconButton size="small" onClick={() => handleAction(chapter.id, 'reactivate')} title="Reactivate"><PlayArrow /></IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}