'use client';
import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache';

// --- สร้าง Theme ใหม่ทั้งหมดตามที่คุณต้องการ ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#26a69a', // Teal (สีเขียวอมฟ้า)
    },
    secondary: {
      main: '#ab47bc', // Magenta (สีม่วงอมชมพู)
    },
    background: {
      default: '#1a1b1e', // สีพื้นหลังหลัก (เทาเข้มเกือบดำ)
      paper: '#2c2d30',   // สีของ Card, Paper (เทาเข้มกว่า)
    },
    text: {
      primary: '#ffffff', // สีตัวอักษรหลัก (ขาว)
      secondary: 'rgba(255, 255, 255, 0.7)', // สีตัวอักษรรอง (เทา)
    },
  },
  // ปรับแก้สไตล์ของ Component อื่นๆ ให้สวยขึ้น
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // ป้องกัน Paper มี gradient แปลกๆ
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          fontWeight: 'bold',
        }
      }
    }
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={darkTheme}> {/* เปลี่ยนมาใช้ darkTheme */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}