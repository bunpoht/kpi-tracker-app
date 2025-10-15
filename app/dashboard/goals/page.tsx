'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  AvatarGroup
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminRoute from '../../components/AdminRoute';
import GoalForm from '../../components/GoalForm';
import dayjs from 'dayjs';

// Interface for Goal data received from the API
export interface Goal {
  id: string;
  title: string;
  target: number;
  unit: string;
  startDate: string;
  endDate: string;
  assignments: {
    userId: string;
    target: number;
    user: {
      id: string;
      name: string;
    };
  }[];
}

// Function to generate a colored avatar from a name
function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}


export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for managing the form dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Function to fetch all goals from the API
  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      const data = await response.json();
      setGoals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial component load
  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenForm = (goal: Goal | null = null) => {
    setEditingGoal(goal); // If goal is provided, it's for editing
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGoal(null); // Clear editing data on close
  };
  
  const handleSaveSuccess = () => {
    handleCloseForm();
    fetchGoals(); // Refresh the table after a successful save
  };
  
  const handleDelete = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This will also delete all related work logs and assignments.')) {
      try {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete goal');
        }
        setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };


  if (loading) {
    return (
      <AdminRoute>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Manage Goals / KPIs
            </Typography>
            <Button variant="contained" onClick={() => handleOpenForm()}>
              + Add New Goal
            </Button>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="goals table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assignees</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Target</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {goals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No goals found. Add one to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  goals.map((goal) => (
                    <TableRow 
                      key={goal.id} 
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Link 
                          href={`/dashboard/goals/${goal.id}`} 
                          passHref
                          style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}
                        >
                          {goal.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                          {goal.assignments.map(assignment => (
                            <Tooltip key={assignment.userId} title={`${assignment.user.name}: ${assignment.target} ${goal.unit}`}>
                              <Avatar sx={{ bgcolor: stringToColor(assignment.user.name), width: 32, height: 32, fontSize: '0.8rem' }}>
                                {assignment.user.name.split(' ').map(n => n[0]).join('')}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </TableCell>
                      <TableCell align="right">{goal.target} {goal.unit}</TableCell>
                      <TableCell>
                        {dayjs(goal.startDate).format('DD MMM YYYY')} - {dayjs(goal.endDate).format('DD MMM YYYY')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton aria-label="edit" onClick={() => handleOpenForm(goal)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton aria-label="delete" onClick={() => handleDelete(goal.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {isFormOpen && (
            <GoalForm
              open={isFormOpen}
              onClose={handleCloseForm}
              onSave={handleSaveSuccess}
              initialData={editingGoal}
            />
          )}
        </Box>
      </Container>
    </AdminRoute>
  );
}