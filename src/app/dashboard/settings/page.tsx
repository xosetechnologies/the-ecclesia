'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { Save, Settings as SettingsIcon } from '@mui/icons-material';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    churchName: '',
    duesAmount: '',
    duesPeriod: 'MONTHLY',
    gradeBoundaries: { A: 80, B: 70, C: 60, D: 50 },
    smsEnabled: false,
    whatsappEnabled: false,
    gamificationEnabled: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) router.push('/login');
  }, [router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      alert('Settings saved!');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Settings</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Church Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Church Name" value={settings.churchName} 
                onChange={(e) => setSettings({...settings, churchName: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Dues Amount" type="number" value={settings.duesAmount}
                onChange={(e) => setSettings({...settings, duesAmount: e.target.value})} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Dues Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Dues Period" value={settings.duesPeriod}
                onChange={(e) => setSettings({...settings, duesPeriod: e.target.value})}>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Grade Boundaries</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><TextField fullWidth label="A (%)" type="number" defaultValue={80} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="B (%)" type="number" defaultValue={70} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="C (%)" type="number" defaultValue={60} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="D (%)" type="number" defaultValue={50} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Integrations</Typography>
          <FormControlLabel control={<Switch checked={settings.smsEnabled}
            onChange={(e) => setSettings({...settings, smsEnabled: e.target.checked})} />} label="SMS Notifications" /><br />
          <FormControlLabel control={<Switch checked={settings.whatsappEnabled}
            onChange={(e) => setSettings({...settings, whatsappEnabled: e.target.checked})} />} label="WhatsApp Notifications" /><br />
          <FormControlLabel control={<Switch checked={settings.gamificationEnabled}
            onChange={(e) => setSettings({...settings, gamificationEnabled: e.target.checked})} />} label="Student Gamification" />
        </CardContent>
      </Card>

      <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </Box>
  );
}