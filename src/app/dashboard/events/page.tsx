'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Grid, Button, TextField, MenuItem, Chip } from '@mui/material';
import { Add, Event, Delete } from '@mui/icons-material';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', location: '', description: '', feeAmount: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) router.push('/login');
    else loadEvents();
  }, [router]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      setEvents([]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    setEvents([...events, { ...newEvent, id: Date.now(), status: 'upcoming' }]);
    setNewEvent({ title: '', date: '', time: '', location: '', description: '', feeAmount: '' });
    setOpenDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Events</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>Add Event</Button>
      </Box>

      {openDialog && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Create Event</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Event Title" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth type="date" label="Date" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Time" value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Location" value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Fee Amount" type="number" value={newEvent.feeAmount} onChange={(e) => setNewEvent({...newEvent, feeAmount: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description" value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={handleCreateEvent}>Create</Button>
            <Button variant="outlined" onClick={() => setOpenDialog(false)}>Cancel</Button>
          </Box>
        </Card>
      )}

      <Grid container spacing={2}>
        {events.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Event sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">No events yet. Create your first event!</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          events.map((event: any) => (
            <Grid item xs={12} md={6} key={event.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={600}>{event.title}</Typography>
                    <Chip label={event.status || 'Upcoming'} size="small" color="primary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {event.date} {event.time && `at ${event.time}`}
                  </Typography>
                  {event.location && <Typography variant="body2">📍 {event.location}</Typography>}
                  {event.feeAmount && <Typography variant="body2">💰 Fee: ${event.feeAmount}</Typography>}
                  {event.description && <Typography variant="body2" sx={{ mt: 1 }}>{event.description}</Typography>}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}