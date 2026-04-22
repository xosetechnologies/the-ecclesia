'use client';

import { useRouter } from 'next/navigation';
import { Box, Typography, Alert } from '@mui/material';
import Link from 'next/link';

export default function RegisterSuccessPage() {
  const router = useRouter();

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
      <Box sx={{ textAlign: 'center', color: 'white', maxWidth: 500 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Registration Successful!
        </Typography>
        <Typography sx={{ mb: 3, opacity: 0.9 }}>
          Your denomination has been registered. A temporary password has been sent to your email.
        </Typography>
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left', color: 'primary' }}>
          <strong>Next steps:</strong>
          <br />1. Check your email for the temporary password
          <br />2. Login and change your password
          <br />3. Start setting up your organization
        </Alert>
        <Typography
          onClick={() => router.push('/login')}
          sx={{
            cursor: 'pointer',
            textDecoration: 'underline',
            color: 'white',
            '&:hover': { opacity: 0.8 },
          }}
        >
          Return to Login
        </Typography>
      </Box>
    </Box>
  );
}