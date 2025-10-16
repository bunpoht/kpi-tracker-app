'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';

// Interface สำหรับข้อมูล User ที่จะใช้ในฟอร์ม
export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  password?: string;
}

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: UserFormData | null;
}

export default function UserForm({ open, onClose, onSave, initialData }: UserFormProps) {
  const [formData, setFormData] = useState<Partial<UserFormData>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (initialData) {
      // สำหรับโหมดแก้ไข ไม่ต้องแสดง password
      setFormData({ ...initialData, password: '' });
    } else {
      // สำหรับโหมดสร้างใหม่ ตั้งค่า default
      setFormData({ name: '', email: '', password: '', role: 'USER' });
    }
  }, [initialData]);
  
  // สำหรับ TextField
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // สำหรับ Select component
  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!formData.email || !formData.name || (!isEditing && !formData.password)) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/users/${initialData?.id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
      }

      onSave(); // แจ้งหน้าหลักให้ fetch ข้อมูลใหม่

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField autoFocus margin="dense" id="name" name="name" label="Full Name" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
        <TextField margin="dense" id="email" name="email" label="Email Address" type="email" fullWidth value={formData.email || ''} onChange={handleChange} />
        
        {!isEditing && ( // แสดงช่อง password เฉพาะตอนสร้างใหม่
            <TextField margin="dense" id="password" name="password" label="Password" type="password" fullWidth value={formData.password || ''} onChange={handleChange} />
        )}

        <FormControl fullWidth margin="dense">
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
                labelId="role-select-label"
                id="role"
                name="role"
                value={formData.role || 'USER'}
                label="Role"
                onChange={handleSelectChange}
            >
                <MenuItem value={'USER'}>User</MenuItem>
                <MenuItem value={'ADMIN'}>Admin</MenuItem>
            </Select>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}