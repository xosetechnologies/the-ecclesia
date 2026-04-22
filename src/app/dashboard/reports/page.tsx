'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, TextField } from '@mui/material';
import { Download, Assessment } from '@mui/icons-material';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('attendance');
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) router.push('/login');
  }, [router]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports?type=${reportType}&format=json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setData(result.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      window.open(`/api/reports?type=${reportType}&format=csv`, '_blank');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Reports</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Generate Report</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField select label="Report Type" value={reportType} onChange={(e) => setReportType(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="attendance">Attendance Report</MenuItem>
              <MenuItem value="students">Student List</MenuItem>
              <MenuItem value="payments">Payment Summary</MenuItem>
            </TextField>
            <Button variant="contained" onClick={handleGenerateReport} disabled={loading}>
              Generate
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV} disabled={loading}>
              Export CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      {data.length > 0 && (
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {Object.keys(data[0] || {}).map((key) => (
                      <TableCell key={key}><strong>{key}</strong></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <TableCell key={j}>{val}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {data.length > 50 && (
              <Typography sx={{ p: 2, color: 'text.secondary' }}>Showing 50 of {data.length} records</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {data.length === 0 && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Assessment sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">Select a report type and click Generate</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}