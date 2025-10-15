'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Button, Box, Alert, Typography,
  FormControl, InputLabel, Select, MenuItem, IconButton, Paper, Divider,
  Grid, CircularProgress
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { Goal } from '../dashboard/goals/page';

// Interfaces
interface User {
  id: string;
  name: string;
}
interface Assignee {
  id: string; // Temporary ID for React key
  userId: string;
  target: string;
}

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Goal | null; 
}

export default function GoalForm({ open, onClose, onSave, initialData }: GoalFormProps) {
  const isEditing = !!initialData?.id;

  // Form States
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  // Data & UI States
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Effect to populate form with initialData for editing
  useEffect(() => {
    if (open) {
      // Fetch users every time the dialog opens
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const res = await fetch('/api/users');
          if (!res.ok) throw new Error('Failed to fetch users for assignment.');
          const data = await res.json();
          setUsers(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();

      // Populate form fields based on mode (edit/create)
      if (isEditing && initialData) {
        setTitle(initialData.title);
        setUnit(initialData.unit);
        setStartDate(dayjs(initialData.startDate));
        setEndDate(dayjs(initialData.endDate));
        if (initialData.assignments && initialData.assignments.length > 0) {
          setAssignees(initialData.assignments.map(a => ({
            id: `temp_${a.userId}_${Math.random()}`,
            userId: a.userId,
            target: a.target.toString(),
          })));
        } else {
          setAssignees([{ id: `temp_${Date.now()}`, userId: '', target: '' }]);
        }
      } else {
        setTitle('');
        setUnit('');
        setStartDate(dayjs());
        setEndDate(dayjs().add(1, 'year'));
        setAssignees([{ id: `temp_${Date.now()}`, userId: '', target: '' }]);
      }
      setError('');
    }
  }, [initialData, isEditing, open]);
  
  // Handlers for dynamic assignees list
  const handleAddAssignee = () => setAssignees([...assignees, { id: `temp_${Date.now()}`, userId: '', target: '' }]);
  const handleRemoveAssignee = (tempId: string) => setAssignees(assignees.filter(a => a.id !== tempId));
  const handleAssigneeChange = (tempId: string, field: 'userId' | 'target', value: string) => {
    setAssignees(assignees.map(a => a.id === tempId ? { ...a, [field]: value } : a));
  };
  
  const handleClose = () => onClose();

  const handleSubmit = async () => {
    setError('');
    
    if (!title || !unit || !startDate || !endDate) {
        setError("Please fill in all goal details."); return;
    }
    const validAssignees = assignees.filter(a => a.userId && a.target && parseInt(a.target) > 0);
    if (validAssignees.length === 0) {
        setError("Please add at least one valid assignee with a target greater than 0."); return;
    }
    const userIds = validAssignees.map(a => a.userId);
    if (new Set(userIds).size !== userIds.length) {
        setError("Each user can only be assigned once per goal."); return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/goals/${initialData?.id}` : '/api/goals';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          unit,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          assignees: validAssignees.map(({ userId, target }) => ({ userId, target })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} goal`);
      }

      onSave();
      handleClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{isEditing ? 'Edit Goal' : 'Add New Goal / KPI'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Typography variant="h6" gutterBottom>Goal Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField autoFocus margin="dense" label="Goal Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField margin="dense" label="Unit (e.g., ชิ้น)" fullWidth value={unit} onChange={(e) => setUnit(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker label="Start Date" value={startDate} sx={{ width: '100%' }} onChange={setStartDate} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker label="End Date" value={endDate} sx={{ width: '100%' }} onChange={setEndDate} />
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Assignees & Targets</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {assignees.map((assignee, index) => (
                <Grid container spacing={2} key={assignee.id} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <FormControl fullWidth>
                      <InputLabel>Assignee {index + 1}</InputLabel>
                      <Select
                        value={assignee.userId}
                        label={`Assignee ${index + 1}`}
                        onChange={(e) => handleAssigneeChange(assignee.id, 'userId', e.target.value as string)}
                        startAdornment={loadingUsers ? <CircularProgress size={20} sx={{mr: 1}} /> : null}
                      >
                        {loadingUsers && <MenuItem disabled>Loading users...</MenuItem>}
                        {!loadingUsers && users.length === 0 && <MenuItem disabled>No users found.</MenuItem>}
                        {users.map(user => <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={10} sm={3}>
                    <TextField label="Target" type="number" fullWidth value={assignee.target} onChange={(e) => handleAssigneeChange(assignee.id, 'target', e.target.value)} />
                  </Grid>
                  <Grid item xs={2} sm={1} sx={{ textAlign: 'center' }}>
                    <IconButton onClick={() => handleRemoveAssignee(assignee.id)} disabled={!isEditing && assignees.length <= 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Box>
            <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddAssignee} sx={{ mt: 2 }}>Add Assignee</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Goal'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}