'use client';

import { Container, Typography, Box, Button, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // useEffect จะทำงานหลังจาก component render เสร็จแล้ว
  // เพื่อตรวจสอบสถานะการล็อกอิน
  useEffect(() => {
    // ถ้ายังไม่ได้โหลดข้อมูล user เสร็จ และ user มีข้อมูล (เคยล็อกอินแล้ว)
    // ให้ทำการ redirect ไปยังหน้า dashboard
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);
  
  // ระหว่างที่กำลังตรวจสอบสถานะการล็อกอิน (isLoading)
  // หรือถ้าตรวจสอบแล้วพบว่า user ล็อกอินอยู่ (user is not null)
  // ให้แสดงหน้า loading กลางจอ เพื่อป้องกันการกระพริบของหน้า Landing Page
  if (isLoading || user) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ส่วนนี้จะแสดงผลก็ต่อเมื่อ isLoading เป็น false และ user เป็น null (ยังไม่ได้ล็อกอิน)
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          my: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome to KPI Tracker
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          The simple and powerful way to track your team's goals and performance. 
          Log your work, visualize your progress, and achieve more together.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            component={Link} 
            href="/login" 
            variant="contained" 
            size="large"
            sx={{ 
              px: 5, 
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Get Started
          </Button>
        </Box>
      </Box>
    </Container>
  );
}