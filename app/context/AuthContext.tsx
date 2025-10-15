// app/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // เมื่อแอปเริ่มทำงาน ให้ลองดึง token จาก local storage
    try {
      const storedToken = localStorage.getItem('jwt_token');
      if (storedToken) {
        const decodedUser: User = jwtDecode(storedToken);
        // ในอนาคตสามารถเพิ่มการตรวจสอบวันหมดอายุของ token ตรงนี้ได้
        // const isExpired = decodedUser.exp * 1000 < Date.now();
        // if (!isExpired) {
          setUser(decodedUser);
          setToken(storedToken);
        // } else {
        //   localStorage.removeItem('jwt_token');
        // }
      }
    } catch (error) {
        console.error("Failed to decode token:", error)
        // ถ้า token มีปัญหา ให้ลบทิ้ง
        localStorage.removeItem('jwt_token');
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('jwt_token', newToken);
    const decodedUser: User = jwtDecode(newToken);
    setUser(decodedUser);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};