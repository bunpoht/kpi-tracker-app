'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link component
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
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminRoute from '../../components/AdminRoute';
import UserForm, { UserFormData } from '../../components/UserForm';

// Interface สำหรับข้อมูล User ที่จะแสดงในตาราง
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State สำหรับจัดการฟอร์ม
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);

  // ฟังก์ชันสำหรับดึงข้อมูล Users ทั้งหมดจาก API
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // useEffect จะทำงานครั้งแรกเมื่อ component โหลดเสร็จ
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenForm = (user: UserFormData | null = null) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleSaveSuccess = () => {
    handleCloseForm();
    fetchUsers(); // ดึงข้อมูลใหม่หลังจากบันทึกสำเร็จ
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This may fail if the user has existing work logs.')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete user');
        }
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
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
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          <Button variant="contained" onClick={() => handleOpenForm()}>
            + Add New User
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Link 
                      href={`/dashboard/users/${user.id}`} 
                      passHref 
                      style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}
                    >
                      {user.name}
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role}
                      color={user.role === 'ADMIN' ? 'success' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton aria-label="edit" size="small" onClick={() => handleOpenForm(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="delete" size="small" onClick={() => handleDelete(user.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {isFormOpen && (
          <UserForm
            open={isFormOpen}
            onClose={handleCloseForm}
            onSave={handleSaveSuccess}
            initialData={editingUser}
          />
        )}
      </Container>
    </AdminRoute>
  );
}