import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import { authAPI, setToken, getToken } from './utils/api.js';
import AdminLayout from './components/AdminLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(({ data }) => setUser(data.data?.user || null))
      .catch(() => { setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#AAAAAA', fontSize:14 }}>
        Loading…
      </div>
    );
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <Toaster position="top-right" toastOptions={{ style:{ fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600 } }}/>
      {user ? <AdminLayout /> : <LoginPage />}
    </AuthCtx.Provider>
  );
}
