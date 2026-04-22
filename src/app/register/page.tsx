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
  Grid,
  Link as MuiLink,
  InputAdornment,
  IconButton,
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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    denominationName: '',
    country: '',
    headquartersAddress: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    estimatedAssemblies: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/register', formData);
      router.push('/register/success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
      <Card sx={{ maxWidth: 560, width: '100%', borderRadius: 4 }}>
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
              Register Your Denomination
            </Typography>
            <Typography color="text.secondary">
              Join The Ecclesia platform
            </Typography>
          </Box>

          <Link href="/login" passHref>
            <MuiLink sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ArrowBack fontSize="small" sx={{ mr: 0.5 }} /> Back to Login
            </MuiLink>
          </Link>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Denomination Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Denomination Name"
                  name="denominationName"
                  value={formData.denominationName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Methodist Church of Ghana"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                >
                  {countries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Local Assemblies"
                  name="estimatedAssemblies"
                  type="number"
                  value={formData.estimatedAssemblies}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Headquarters Address"
                  name="headquartersAddress"
                  value={formData.headquartersAddress}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Contact Person
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 4 }}
            >
              {loading ? 'Registering...' : 'Register Denomination'}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            By registering, you agree to our Terms of Service
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}