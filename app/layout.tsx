// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./components/ThemeRegistry";
import { AuthProvider } from "./context/AuthContext"; // Import เข้ามา
import Navbar from './components/Navbar'; // Import Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KPI Tracker App",
  description: "Track your work and KPIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* ห่อข้างนอกสุด */}
         <ThemeRegistry>
            <Navbar /> {/* เพิ่ม Navbar ตรงนี้ */}
            <main>{children}</main> {/* ห่อ children ด้วย main เพื่อความหมายที่ดี */}
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}