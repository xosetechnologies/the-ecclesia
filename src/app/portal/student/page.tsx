'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Grid, Button, Chip } from '@mui/material';
import { Assignment, School, EmojiEvents, CheckCircle } from '@mui/icons-material';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function StudentPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState('Learner');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      router.push('/portal/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (user.role !== 'STUDENT') {
      router.push('/login');
      return;
    }

    setStudent(user);
    loadStudentData();
  }, [router]);

  const loadStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Load assignments and gamification
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  const getLevelColor = (lvl: string) => {
    const colors: any = { Learner: 'default', Explorer: 'primary', Scholar: 'info', Champion: 'warning', Legend: 'success' };
    return colors[lvl] || 'default';
  };

  if (loading) return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>Student Portal</Typography>
        <Button size="small" onClick={() => { localStorage.clear(); router.push('/portal/login'); }}>Logout</Button>
      </Box>

      {/* Gamification */}
      <Card sx={{ mb: 3, bgcolor: '#1a365d', color: 'white' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>{points} pts</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Current Streak: {streak} Sundays</Typography>
          </Box>
          <Chip 
            label={level} 
            color={getLevelColor(level) as any} 
            sx={{ fontWeight: 700, fontSize: '1.2rem' }}
          />
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>My Assignments</Typography>

      <Grid container spacing={2}>
        {(assignments || []).length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">No pending assignments</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          assignments.map((assignment: any) => (
            <Grid item xs={12} md={6} key={assignment.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight={600}>{assignment.title}</Typography>
                    <Chip 
                      label={assignment.status === 'SUBMITTED' ? 'Submitted' : 'Pending'} 
                      size="small" 
                      color={assignment.status === 'SUBMITTED' ? 'success' : 'warning'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Typography>
                  <Button variant="contained" size="small" fullWidth>View</Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Leaderboard placeholder */}
      <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 2 }}>Top Students</Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">Leaderboard coming soon</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}