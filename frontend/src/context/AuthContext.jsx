import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.me();
      setUser(data.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const STAFF_ROLES = ['admin', 'moderator', 'editor', 'analyst'];

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (STAFF_ROLES.includes(user?.role)) {
      localStorage.setItem('adminAccessToken',  accessToken);
      localStorage.setItem('adminRefreshToken', refreshToken);
    }
    setUser(user);
    return user;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    return user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await authAPI.logout({ refreshToken }); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  const isAdmin = user?.role === 'admin';
  const isMod   = ['admin','moderator'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isMod }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
