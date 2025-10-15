'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  CircularProgress, 
  Alert, 
  Paper,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import ProtectedRoute from '../../components/ProtectedRoute';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import dayjs from 'dayjs';

// Interface for Dashboard Data
interface ProgressData {
  id: string;
  title: string;
  target: number;
  unit: string;
  currentProgress: number;
  percentage: number;
  workLogs: any[]; 
}

// Progress Card Component with Gradient Progress Bar
const ProgressCard = ({ data }: { data: ProgressData }) => {
  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" component="h3" noWrap gutterBottom title={data.title}>
        {data.title}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>
          {data.currentProgress} <Typography variant="body1" component="span">/ {data.target}</Typography>
        </Typography>
        <Typography variant="body1" color="text.secondary">{data.unit}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={data.percentage > 100 ? 100 : data.percentage}
        sx={{
          height: 8,
          borderRadius: 5,
          mt: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          [`& .MuiLinearProgress-bar`]: {
            borderRadius: 5,
            backgroundImage: 'linear-gradient(to right, #26a69a, #ab47bc)',
          },
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', mt: 0.5 }}>
          {`${data.percentage.toFixed(1)}%`}
      </Typography>
    </Paper>
  );
};

export default function ProgressDashboardPage() {
  const [dashboardData, setDashboardData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fiscal Year Logic
  const getCurrentFiscalYear = () => {
    const now = dayjs();
    return now.month() >= 9 ? now.year() + 1 : now.year();
  };
  
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(getCurrentFiscalYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month() + 1);

  // Data Fetching Function
  const fetchData = async (month: number, fiscalYear: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/dashboard?month=${month}&year=${fiscalYear}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard data.');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedMonth, selectedFiscalYear);
  }, [selectedMonth, selectedFiscalYear]);

  // Dropdown options
  const fiscalYears = useMemo(() => Array.from({ length: 5 }, (_, i) => getCurrentFiscalYear() - i), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: dayjs().month(i).format('MMMM') })), []);
  
  // Main Content Renderer
  const renderContent = () => {
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Container><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container>;
    if (dashboardData.length === 0) {
        return (
            <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>No Data Available</Typography>
                <Typography color="text.secondary">There is no work log data for the selected period.</Typography>
                <Button component={Link} href="/dashboard" variant="contained" sx={{ mt: 3 }}>Log Some Work</Button>
            </Paper>
        );
    }

    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardData.map(data => (
            <Grid item xs={12} sm={6} md={4} key={data.id}>
              <Link href={`/dashboard/goals/${data.id}`} passHref style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                <ProgressCard data={data} />
              </Link>
            </Grid>
          ))}
        </Grid>
        
        <Paper sx={{ p: 2, height: 400, mb: 4 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Completion Percentage Overview
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={dashboardData}
              margin={{ top: 30, right: 30, left: 0, bottom: 60 }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#26a69a" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#ab47bc" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
              <XAxis 
                dataKey="title" 
                tick={{ fontSize: 18, fill: 'rgba(255, 255, 255, 0.8)' }}
                interval={0} 
                angle={-35}
                textAnchor="end" 
              />
              <YAxis domain={[0, 100]} unit="%" stroke="rgba(255, 255, 255, 0.7)" />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}%`, "Completed"]} 
                contentStyle={{ backgroundColor: '#2c2d30', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                labelStyle={{ color: 'white' }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px', color: 'white' }}/>
              <Bar dataKey="percentage" name="Completed (%)" fill="url(#colorGradient)">
                <LabelList 
                  dataKey="percentage" 
                  position="top" 
                  formatter={(value: number) => value > 0 ? `${Math.round(value)}%` : ''} 
                  fill="white"
                  fontSize={20}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </>
    );
  };

  return (
    <ProtectedRoute>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Overall Progress Dashboard
          </Typography>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item><Typography>Filter by period:</Typography></Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month</InputLabel>
                  <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value as number)}>
                    {months.map(m => <MenuItem key={m.value} value={m.value}>{m.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Fiscal Year</InputLabel>
                  <Select value={selectedFiscalYear} label="Fiscal Year" onChange={(e) => setSelectedFiscalYear(e.target.value as number)}>
                    {fiscalYears.map(y => <MenuItem key={y} value={y}>Fiscal Year {y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {renderContent()}

        </Box>
      </Container>
    </ProtectedRoute>
  );
}