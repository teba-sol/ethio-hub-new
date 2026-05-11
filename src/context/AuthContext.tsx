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
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

   useEffect(() => {
     const checkUserSession = async () => {
       try {
         const response = await fetch('/api/auth/session', { cache: 'no-store' });
         
         if (!response.ok) {
           console.error(`Session check failed with status: ${response.status}`);
           setUser(null);
           return;
         }

         const contentType = response.headers.get('content-type');
         if (!contentType || !contentType.includes('application/json')) {
           console.error('Session check received non-JSON response');
           setUser(null);
           return;
         }

         const data = await response.json();
         if (data && data.user) {
           const userData = {
             ...data.user,
             role: data.user.role?.toLowerCase()
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

   // Session Timeout Logic
   useEffect(() => {
     if (!user) return;

     const updateActivity = () => {
       setLastActivity(Date.now());
     };

     // Throttled version to avoid excessive state updates
     let throttleTimeout: NodeJS.Timeout | null = null;
     const handleActivity = () => {
       if (!throttleTimeout) {
         updateActivity();
         throttleTimeout = setTimeout(() => {
           throttleTimeout = null;
         }, 1000); // Only update once per second
       }
     };

     const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
     events.forEach(event => window.addEventListener(event, handleActivity));

     const checkInterval = setInterval(() => {
       const now = Date.now();
       if (now - lastActivity > TIMEOUT_DURATION) {
         console.log('Session timed out due to inactivity');
         logout();
       }
     }, 10000); // Check every 10 seconds

     return () => {
       events.forEach(event => window.removeEventListener(event, handleActivity));
       clearInterval(checkInterval);
       if (throttleTimeout) clearTimeout(throttleTimeout);
     };
   }, [user, lastActivity]);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Login failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If not JSON, use the raw text if it's short
          if (errorText.length < 100) errorMessage = errorText;
        }
        return { success: false, message: errorMessage };
      }

      const data = await response.json();
      if (data.success) {
        if (data.user) {
          data.user.role = data.user.role?.toLowerCase();
        }
        setUser(data.user);
        setLastActivity(Date.now());
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
      return data;
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
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
    const sanitizedData = { ...data };
    if (sanitizedData.role) {
      sanitizedData.role = sanitizedData.role.toLowerCase() as UserRole;
    }
    setUser(prev => prev ? { ...prev, ...sanitizedData } : null);
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

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Registration failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          if (errorText.length < 100) errorMessage = errorText;
        }
        return { success: false, message: errorMessage };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
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
