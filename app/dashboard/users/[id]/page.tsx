'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert, 
  Paper, 
  LinearProgress, 
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ProtectedRoute from '../../../components/ProtectedRoute';
import dayjs from 'dayjs';

// Interfaces for the fetched data structure
interface GoalProgress {
    goalId: string;
    goalTitle: string;
    goalTarget: number;
    unit: string;
    userContribution: number;
    percentageOfTotalTarget: number;
}
interface UserDashboardData {
  user: { name: string; email: string };
  goalProgress: GoalProgress[];
  recentLogs: {
    id: string;
    quantity: number;
    goal: { title: string; unit: string; };
    completedAt: string;
    description: string;
  }[];
  summary: {
    totalLogs: number;
    totalUnitsContributed: number;
    involvedGoalsCount: number;
  };
}

// Reusable Stat Card Component
const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>{title}</Typography>
    <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>{value}</Typography>
  </Paper>
);

// New Contribution Card Component
const ContributionCard = ({ progress }: { progress: GoalProgress }) => (
    <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" noWrap title={progress.goalTitle}>{progress.goalTitle}</Typography>
        <Typography variant="h5" component="p" sx={{ mt: 1 }}>
            {progress.userContribution}{' '}
            <Typography variant="body1" component="span" color="text.secondary">
                / {progress.goalTarget} {progress.unit}
            </Typography>
        </Typography>
        <LinearProgress 
            variant="determinate" 
            value={progress.percentageOfTotalTarget > 100 ? 100 : progress.percentageOfTotalTarget} 
            sx={{ height: 8, borderRadius: 4, mt: 1 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', mt: 0.5 }}>
            {progress.percentageOfTotalTarget}% of total goal
        </Typography>
    </Paper>
);

export default function IndividualDashboardPage() {
  const params = useParams();
  const { id } = params;

  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/users/${id}/dashboard`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user data.');
          }
          const result = await response.json();
          setData(result);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  if (loading) return <ProtectedRoute><Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box></ProtectedRoute>;
  if (error || !data) return <ProtectedRoute><Container><Alert severity="error" sx={{ mt: 4 }}>{error || 'User data could not be loaded.'}</Alert></Container></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Typography variant="h4" component="h1">{data.user.name}'s Dashboard</Typography>
        <Typography color="text.secondary" gutterBottom>{data.user.email}</Typography>
        <Divider sx={{ my: 2 }} />

        {/* Summary Section - CSS Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          <StatCard title="Total Logs Submitted" value={data.summary.totalLogs} />
          <StatCard title="Total Units Contributed" value={data.summary.totalUnitsContributed} />
          <StatCard title="Involved in Goals" value={`${data.summary.involvedGoalsCount} KPI(s)`} />
        </Box>

        {/* Goal Contribution Section - CSS Grid */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>Contribution to Goals</Typography>
          {data.goalProgress.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {data.goalProgress.map(progress => (
                <ContributionCard key={progress.goalId} progress={progress} />
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">This user has not contributed to any goals yet.</Typography>
            </Paper>
          )}
        </Box>

        {/* Recent Activity Section */}
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>Recent Activity</Typography>
          <Paper>
            <List>
              {data.recentLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <ListItem>
                    <ListItemText 
                      primary={`${log.quantity} ${log.goal.unit} for "${log.goal.title}"`}
                      secondary={`On ${dayjs(log.completedAt).format('DD MMM YYYY')} - "${log.description}"`}
                    />
                  </ListItem>
                  {index < data.recentLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>

      </Container>
    </ProtectedRoute>
  );
}