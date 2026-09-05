import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('coldstorage_user') || localStorage.getItem('transport_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('coldstorage_token') || localStorage.getItem('transport_token'));
  const [loading, setLoading] = useState(() => {
    const savedUser = localStorage.getItem('coldstorage_user') || localStorage.getItem('transport_user');
    const savedToken = localStorage.getItem('coldstorage_token') || localStorage.getItem('transport_token');
    return !(savedToken && savedUser);
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('coldstorage_user', JSON.stringify(res.user));
          }
        } catch (error) {
          console.error('Session expired or invalid:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('coldstorage_token', res.token);
      localStorage.setItem('coldstorage_user', JSON.stringify(res.user));
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('coldstorage_token');
    localStorage.removeItem('coldstorage_user');
    localStorage.removeItem('transport_token');
    localStorage.removeItem('transport_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
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
