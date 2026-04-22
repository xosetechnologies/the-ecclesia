'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Grid, Button, Avatar, Chip, Divider } from '@mui/material';
import { Person, School, Payment, Announcement, Event, CheckCircle } from '@mui/icons-material';

export default function ParentPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      router.push('/portal/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (user.role !== 'PARENT') {
      router.push('/login');
      return;
    }

    loadParentData();
  }, [router]);

  const loadParentData = async () => {
    try {
      // Load children, announcements, payments
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  if (loading) return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>Parent Portal</Typography>
        <Button size="small" onClick={() => { localStorage.clear(); router.push('/portal/login'); }}>Logout</Button>
      </Box>

      {/* My Children */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>My Children</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {(children || []).length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">No children linked</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          children.map((child: any) => (
            <Grid item xs={12} md={6} key={child.id}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                    {child.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600}>{child.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{child.class}</Typography>
                    <Chip label="Present" size="small" color="success" icon={<CheckCircle />} sx={{ mt: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Announcements */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Announcements</Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography color="text.secondary">No announcements</Typography>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Upcoming Events</Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">No upcoming events</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}