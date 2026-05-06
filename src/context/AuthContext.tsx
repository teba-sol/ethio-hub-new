"use client";

import React, { createContext, useContext, useState, ReactNode ,useEffect} from 'react';
import { User, UserRole, ArtisanStatus, OrganizerStatus } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  logout: () => void;
  register: (userData: any) => Promise<any>;
  updateUser: (data: Partial<User>) => void;
  setAuthenticatedUser: (data: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
     const checkUserSession = async () => {
       try {
         const response = await fetch('/api/auth/session', { cache: 'no-store' });
         const data = await response.json();
         if (data && data.success && data.user) {
           const userData = {
             ...data.user,
             role: data.user.role // Keep original case stored in DB
           };
           setUser(userData);
         } else {
           setUser(null);
         }
       } catch (error) {
         console.error('Session check failed:', error);
         setUser(null);
       } finally {
         setLoading(false);
       }
     };

     checkUserSession();
   }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
      } else {
        throw new Error(data.message || 'Login failed');
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // We will create this API route next
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const setAuthenticatedUser = (data: User) => {
    setUser(data);
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        register,
        updateUser,
        setAuthenticatedUser,
      }}
    >
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
