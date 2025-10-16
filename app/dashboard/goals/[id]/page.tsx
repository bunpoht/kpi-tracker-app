'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  LinearProgress, Card, CardContent, Modal, Fade, Backdrop, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList } from 'recharts';
import dayjs from 'dayjs';

interface GoalDetail {
  id: string;
  title: string;
  target: number;
  unit: string;
  workLogs: {
    id: string;
    description: string;
    quantity: number;
    completedAt: string;
    author: { name: string };
    images: { id: string; url: string }[];
  }[];
  currentProgress: number;
  percentage: number;
  monthlyChartData: {
    name: string;
    quantity: number;
  }[];
}

export default function GoalDetailPage() {
  const params = useParams();
  const { id } = params;

  const [goalData, setGoalData] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openImage, setOpenImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchGoalDetail = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/dashboard?goalId=${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch goal details.');
          }
          const data = await response.json();
          if (data.length === 0) throw new Error('Goal not found.');
          setGoalData(data[0]);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchGoalDetail();
    }
  }, [id]);

  if (loading)
    return (
      <ProtectedRoute>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    );

  if (error || !goalData)
    return (
      <ProtectedRoute>
        <Container>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error || 'Goal data could not be loaded.'}
          </Alert>
        </Container>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {goalData.title}
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" component="p">
            {goalData.currentProgress} / {goalData.target}{' '}
            <Typography variant="h6" component="span" color="text.secondary">
              {goalData.unit}
            </Typography>
          </Typography>
          <LinearProgress
            variant="determinate"
            value={goalData.percentage > 100 ? 100 : goalData.percentage}
            sx={{ height: 10, borderRadius: 5, mt: 1 }}
          />
          <Typography variant="h6" sx={{ textAlign: 'right', mt: 1 }}>
            {`${goalData.percentage.toFixed(2)}% Complete`}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, height: 400, mb: 4 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Fiscal Year Performance (Monthly)
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={goalData.monthlyChartData}
              margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.7)" />
              <YAxis stroke="rgba(255, 255, 255, 0.7)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                labelStyle={{ color: 'white' }}
              />
              <Legend wrapperStyle={{ color: 'white' }} />
              <Bar
                dataKey="quantity"
                name={`Progress (${goalData.unit})`}
                fill="#82ca9d"
              >
                <LabelList 
                  dataKey="quantity" 
                  position="top" 
                  formatter={(value: any) => {
                    const numValue = Number(value);
                    return numValue > 0 ? numValue : '';
                  }}
                  fill="white"
                  style={{ fontSize: 20, fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          All Logs for this Goal
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mt: 1 }}>
          {goalData.workLogs.length > 0 ? (
            goalData.workLogs.map((log) => (
              <Card key={log.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                {log.images.length > 0 && (
                  <Box
                    component="img"
                    src={log.images[0].url}
                    alt={log.description}
                    onClick={() => setOpenImage(log.images[0].url)}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'scale(1.03)' },
                    }}
                  />
                )}

                <CardContent>
                  <Typography variant="h6" component="div">
                    {log.description} -{' '}
                    <strong>
                      {log.quantity} {goalData.unit}
                    </strong>
                  </Typography>
                  <Typography
                    sx={{ mb: 1.5 }}
                    color="text.secondary"
                    variant="body2"
                  >
                    by {log.author.name} on{' '}
                    {dayjs(log.completedAt).format('DD MMMM YYYY')}
                  </Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No work logs have been submitted for this goal yet.
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Modal แสดงภาพใหญ่ */}
        <Modal
          open={!!openImage}
          onClose={() => setOpenImage(null)}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{ backdrop: { timeout: 500 } }}
        >
          <Fade in={!!openImage}>
            <Box
              sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0,0,0,0.9)',
                p: 2,
                borderRadius: 2,
                outline: 'none',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IconButton
                onClick={() => setOpenImage(null)}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <CloseIcon />
              </IconButton>

              {openImage && (
                <Box
                  component="img"
                  src={openImage}
                  alt="Enlarged"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: 1,
                  }}
                />
              )}
            </Box>
          </Fade>
        </Modal>
      </Container>
    </ProtectedRoute>
  );
}