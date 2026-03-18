import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

const ALLOWED_ROLES = ['admin', 'moderator', 'editor', 'analyst'];

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.me();
      const u = data.data;
      if (ALLOWED_ROLES.includes(u?.role)) {
        setUser(u);
      } else {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
      }
    } catch {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { user, accessToken, refreshToken } = data.data;
    if (!ALLOWED_ROLES.includes(user?.role)) {
      throw new Error('Access denied. Admin privileges required.');
    }
    localStorage.setItem('adminAccessToken',  accessToken);
    localStorage.setItem('adminRefreshToken', refreshToken);
    setUser(user);
    return user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    try { await authAPI.logout({ refreshToken }); } catch {}
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
