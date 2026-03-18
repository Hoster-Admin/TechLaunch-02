import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminSuggestions from './pages/AdminSuggestions';
import {
  AdminUsers, AdminEntities, AdminApplications,
  AdminFeatured, AdminReports, AdminSettings, AdminProfile, AdminEmailSignups
} from './pages/AdminPages';

const ALLOWED_ROLES = ['admin', 'moderator', 'editor', 'analyst'];

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#AAA', fontSize:14 }}>
      Loading…
    </div>
  );
  if (!user || !ALLOWED_ROLES.includes(user.role)) return <Navigate to="/login" replace/>;
  return children;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right"/>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/*" element={
          <RequireAdmin>
            <AdminLayout/>
          </RequireAdmin>
        }>
          <Route index                 element={<AdminDashboard/>}/>
          <Route path="products"       element={<AdminProducts/>}/>
          <Route path="users"          element={<AdminUsers/>}/>
          <Route path="entities"       element={<AdminEntities/>}/>
          <Route path="applications"   element={<AdminApplications/>}/>
          <Route path="featured"       element={<AdminFeatured/>}/>
          <Route path="suggestions"    element={<AdminSuggestions/>}/>
          <Route path="reports"        element={<AdminReports/>}/>
          <Route path="email-signups"  element={<AdminEmailSignups/>}/>
          <Route path="settings"       element={<AdminSettings/>}/>
          <Route path="profile"        element={<AdminProfile/>}/>
          <Route path="*"              element={<Navigate to="/" replace/>}/>
        </Route>
      </Routes>
    </>
  );
}
