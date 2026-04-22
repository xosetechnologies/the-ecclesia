'use client';

import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Tabs, Tab } from '@mui/material';
import { School, Login as LoginIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function PortalLogin() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = tab === 0 ? '/api/portal/login' : '/api/auth/login';
      const data = tab === 0 ? { pin } : { email, password };
      
      const response = await axios.post(endpoint, data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (response.data.user.role === 'STUDENT') {
        router.push('/portal/student');
      } else if (response.data.user.role === 'PARENT') {
        router.push('/portal/parent');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <School sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>The Ecclesia</Typography>
            <Typography color="text.secondary">Portal Login</Typography>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3 }}>
            <Tab label="Student PIN" />
            <Tab label="Parent/Teacher" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {tab === 0 ? (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Student PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Enter your PIN"
              />
              <Button fullWidth variant="contained" type="submit" disabled={loading} startIcon={<LoginIcon />}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" type="submit" disabled={loading} startIcon={<LoginIcon />}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          )}

          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            <Box component="span" onClick={() => router.push('/login')} sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
              Admin Login
            </Box>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}