// app/components/ProtectedRoute.tsx
'use client';

import React, { useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // ถ้าโหลดเสร็จแล้ว และไม่มี user (ยังไม่ login)
      router.push('/login'); // ให้เด้งกลับไปหน้า login
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    // ระหว่างที่กำลังโหลด หรือยังไม่มี user ให้แสดงหน้า loading
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ถ้ามี user (login แล้ว) ให้แสดงเนื้อหาของหน้านั้นๆ
  return <>{children}</>;
}