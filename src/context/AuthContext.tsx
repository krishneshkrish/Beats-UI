'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  username: string;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize username from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = window.localStorage.getItem('beats_user_profile');
        if (storedUser) {
          setUsername(storedUser);
        }
      } catch (err) {
        console.error('Error reading localStorage for auth', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (name: string) => {
    setUsername(name);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('beats_user_profile', name);
      } catch (err) {
        console.error('Error writing to localStorage for login', err);
      }
    }
  };

  const logout = () => {
    setUsername('');
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('beats_user_profile');
      } catch (err) {
        console.error('Error writing to localStorage for logout', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ username, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
