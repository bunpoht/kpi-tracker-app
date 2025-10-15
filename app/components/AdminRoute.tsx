// app/components/AdminRoute.tsx
'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Container, Typography, Alert } from '@mui/material';
import ProtectedRoute from './ProtectedRoute';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // ถ้ายัง loading หรือ user ยังไม่มีข้อมูล ให้ ProtectedRoute จัดการ
  if (isLoading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // เมื่อมีข้อมูล user แล้ว ให้ตรวจสอบ role
  if (user.role !== 'ADMIN') {
    // ถ้าไม่ใช่ Admin ให้แสดงหน้า Access Denied
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          <Typography variant="h6">Access Denied</Typography>
          You do not have permission to view this page.
        </Alert>
      </Container>
    );
  }

  // ถ้าเป็น Admin ให้แสดงเนื้อหาของหน้านั้นๆ
  return <>{children}</>;
}