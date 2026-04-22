'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
} from '@mui/material';
import { Check, Block, Refresh } from '@mui/icons-material';
import axios from 'axios';
import PlatformLayout from '../layout';

export default function PlatformChaptersPage() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, []);

  const loadChapters = async () => {
    try {
      const res = await axios.get('/api/organization', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setChapters(res.data);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.post(
        `/api/organization/${id}/status`,
        { status: 'ACTIVE' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      loadChapters();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await axios.post(
        `/api/organization/${id}/status`,
        { status: 'SUSPENDED' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      loadChapters();
    } catch (error) {
      console.error('Failed to suspend:', error);
    }
  };

  const getStatusChip = (status: string) => {
    const colors: any = {
      ACTIVE: { bg: '#4caf50', text: 'white' },
      PENDING: { bg: '#ff9800', text: 'white' },
      SUSPENDED: { bg: '#f44336', text: 'white' },
    };
    return (
      <Chip
        label={status}
        size="small"
        sx={{ bgcolor: colors[status]?.bg || '#999', color: colors[status]?.text || 'white' }}
      />
    );
  };

  return (
    <PlatformLayout>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Chapters
                </Typography>
                <Typography variant="h3">{chapters.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active
                </Typography>
                <Typography variant="h3" color="success.main">
                  {chapters.filter((c) => c.status === 'ACTIVE').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {chapters.filter((c) => c.status === 'PENDING').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Suspended
                </Typography>
                <Typography variant="h3" color="error.main">
                  {chapters.filter((c) => c.status === 'SUSPENDED').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Card>
        <CardContent
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6">National Chapters</Typography>
          <IconButton onClick={loadChapters}>
            <Refresh />
          </IconButton>
        </CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Registered</TableCell>
                <TableCell>Regions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chapters.map((chapter) => (
                <TableRow key={chapter.id}>
                  <TableCell>{chapter.name}</TableCell>
                  <TableCell>{chapter.country}</TableCell>
                  <TableCell>{getStatusChip(chapter.status)}</TableCell>
                  <TableCell>
                    {new Date(chapter.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{chapter._count?.children || 0}</TableCell>
                  <TableCell>
                    {chapter.status === 'PENDING' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApprove(chapter.id)}
                        startIcon={<Check />}
                      >
                        Approve
                      </Button>
                    )}
                    {chapter.status === 'ACTIVE' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleSuspend(chapter.id)}
                        startIcon={<Block />}
                      >
                        Suspend
                      </Button>
                    )}
                    {chapter.status === 'SUSPENDED' && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleApprove(chapter.id)}
                      >
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </PlatformLayout>
  );
}