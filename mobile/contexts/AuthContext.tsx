import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api } from '@/lib/api';
import { authEvents } from '@/lib/authEvents';
import { adaptUser } from '@/lib/adapters';
import { storage } from '@/lib/storage';
import type { User } from '@/types';

interface RawAuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: Record<string, unknown>;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, handle?: string, persona?: string, country?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await storage.getToken();
        if (savedToken) {
          setToken(savedToken);
          try {
            const res = await api.get<{ success: boolean; data: Record<string, unknown> }>('/auth/me');
            const adapted = adaptUser(res.data.data);
            setUser(adapted);
            await storage.setUser(adapted);
          } catch {
            const savedUser = await storage.getUser<User>();
            if (savedUser) setUser(savedUser);
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        try {
          const currentToken = await storage.getToken();
          if (!currentToken) return;
          const res = await api.get<{ success: boolean; data: Record<string, unknown> }>('/auth/me');
          const adapted = adaptUser(res.data.data);
          setUser(adapted);
          await storage.setUser(adapted);
        } catch {
          // Silently ignore — token may have expired; the 401 interceptor handles re-auth
        }
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = authEvents.onUnauthorized(() => {
      setToken(null);
      setUser(null);
    });
    return () => { unsubscribe(); };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; data: RawAuthResponse }>('/auth/login', { email, password });
    const raw = res.data.data;
    const adapted = adaptUser(raw.user);
    await storage.setToken(raw.accessToken);
    await storage.setUser(adapted);
    if (raw.refreshToken) await storage.setRefreshToken(raw.refreshToken);
    setToken(raw.accessToken);
    setUser(adapted);
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    handle?: string,
    persona?: string,
    country?: string,
  ) => {
    const payload: Record<string, string> = { name, email, password };
    if (handle) payload.handle = handle;
    if (persona) payload.persona = persona;
    if (country) payload.country = country;
    const res = await api.post<{ success: boolean; data: RawAuthResponse }>('/auth/register', payload);
    const raw = res.data.data;
    const adapted = adaptUser(raw.user);
    await storage.setToken(raw.accessToken);
    await storage.setUser(adapted);
    if (raw.refreshToken) await storage.setRefreshToken(raw.refreshToken);
    setToken(raw.accessToken);
    setUser(adapted);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await storage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
    storage.setUser(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
