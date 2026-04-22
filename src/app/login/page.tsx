'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  InputAdornment,
  IconButton,
  Grid,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff, Church, ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const countries = [
  'Ghana', 'Nigeria', 'Kenya', 'Uganda', 'Tanzania', 'South Africa',
  'United States', 'United Kingdom', 'Canada', 'Australia',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = response.data.user.role;
      if (role === 'PLATFORM_SUPER_ADMIN') {
        router.push('/platform');
      } else if (role === 'NATIONAL_ADMIN') {
        router.push('/national');
      } else if (role === 'REGIONAL_ADMIN') {
        router.push('/regional');
      } else if (role === 'DISTRICT_ADMIN') {
        router.push('/district');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'secondary.main',
                mb: 2,
              }}
            >
              <Church sx={{ fontSize: 32, color: 'primary.main' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              The Ecclesia
            </Typography>
            <Typography color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              New denomination?{' '}
              <Link href="/register" passHref>
                <MuiLink>Register your church</MuiLink>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}