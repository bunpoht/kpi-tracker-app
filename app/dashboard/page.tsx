'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, CircularProgress, Alert } from '@mui/material';
import ProtectedRoute from '../components/ProtectedRoute';
import WorkLogForm, { WorkLogFormData } from '../components/WorkLogForm';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';

// Interface สำหรับ WorkLog ที่สมบูรณ์ (ควรจะตรงกับ ActivityFeed และ API response)
interface WorkLog {
    id: string;
    description: string;
    quantity: number;
    completedAt: string;
    goalId: string;
    author: {
        id: string;
        name: string;
    };
    goal: {
        id: string;
        title: string;
        unit: string;
    };
    images: {
        id: string;
        url: string;
    }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States สำหรับจัดการฟอร์มแก้ไข
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLogFormData | null>(null);

  // ฟังก์ชันสำหรับดึงข้อมูล work logs ทั้งหมด
  const fetchWorkLogs = async () => {
    setError('');
    try {
      const response = await fetch('/api/worklogs');
      if (!response.ok) throw new Error('Failed to fetch activities.');
      const data = await response.json();
      setWorkLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลครั้งแรกเมื่อหน้าโหลด
  useEffect(() => {
    setLoading(true);
    fetchWorkLogs();
  }, []);

  // --- LOGIC การจัดการ Edit/Delete ---

  // เมื่อกดปุ่ม Edit ใน ActivityFeed
  const handleEdit = (logToEdit: WorkLog) => {
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ WorkLogForm ต้องการ
    const formData: WorkLogFormData = {
      id: logToEdit.id,
      description: logToEdit.description,
      quantity: logToEdit.quantity,
      completedAt: logToEdit.completedAt,
      goalId: logToEdit.goal.id, // ใช้ goal.id แทน goalId เพื่อความแน่นอน
      images: logToEdit.images, // ส่ง array images ที่มี id และ url
    };
    setEditingLog(formData);
    setIsEditFormOpen(true);
  };

  // เมื่อกดปุ่ม Delete ใน ActivityFeed
  const handleDelete = async (logId: string) => {
    if (window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
        try {
            const res = await fetch(`/api/worklogs/${logId}`, { method: 'DELETE' });
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ message: 'Failed to delete the log.' }));
              throw new Error(errorData.message);
            }
            // เมื่อลบสำเร็จ ให้ re-fetch ข้อมูลใหม่เพื่ออัปเดต UI
            fetchWorkLogs();
        } catch (err: any) {
            setError(err.message);
        }
    }
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
    setEditingLog(null);
  };
  
  const handleSaveSuccess = () => {
    handleCloseEditForm();
    fetchWorkLogs(); // re-fetch ข้อมูลหลังบันทึกสำเร็จ
  };


  return (
    <ProtectedRoute>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name}!
          </Typography>
          
          {error && <Alert severity="error" onClose={() => setError('')} sx={{mb: 2}}>{error}</Alert>}

          <Grid container spacing={4}>
            {/* Left Column: ฟอร์มสำหรับสร้าง Work Log ใหม่ */}
            <Grid item xs={12} md={5}>
              <WorkLogForm onSave={fetchWorkLogs} />
            </Grid>
            
            {/* Right Column: รายการ Activity ล่าสุด */}
            <Grid item xs={12} md={7}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ActivityFeed 
                  workLogs={workLogs} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                />
              )}
            </Grid>
          </Grid>

          {/* ฟอร์มสำหรับแก้ไข (จะแสดงเป็น Dialog เมื่อ isEditFormOpen เป็น true) */}
          {isEditFormOpen && (
            <WorkLogForm 
              open={isEditFormOpen}
              onClose={handleCloseEditForm}
              onSave={handleSaveSuccess}
              initialData={editingLog}
            />
          )}
        </Box>
      </Container>
    </ProtectedRoute>
  );
}