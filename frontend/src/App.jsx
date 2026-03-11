import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingPage } from './components/ui';

// Layouts
import Navbar       from './components/layout/Navbar';
import AdminLayout  from './components/admin/AdminLayout';

// Home pages
import HomePage            from './pages/home/HomePage';
import { LoginPage, RegisterPage } from './pages/home/AuthPages';

// Admin pages
import AdminDashboard      from './pages/admin/AdminDashboard';
import AdminProducts       from './pages/admin/AdminProducts';
import {
  AdminUsers, AdminEntities, AdminApplications,
  AdminFeatured, AdminReports, AdminSettings, AdminProfile
} from './pages/admin/AdminPages';

// ── Protected routes
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage/>;
  if (!user)   return <Navigate to="/login" replace/>;
  return children;
};

const RequireAdmin = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage/>;
  if (!user)   return <Navigate to="/login" replace/>;
  if (!['admin','moderator','editor','analyst'].includes(user.role))
    return <Navigate to="/" replace/>;
  return children;
};

const GuestOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage/>;
  if (user)    return <Navigate to="/" replace/>;
  return children;
};

// ── Home layout wrapper
function HomeLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <Routes>
        <Route index element={<HomePage/>}/>
        <Route path="products"          element={<HomePage/>}/>
        <Route path="entities"          element={<ComingSoon title="Entities"/>}/>
        <Route path="products/:id"      element={<ComingSoon title="Product Detail"/>}/>
        <Route path="u/:handle"         element={<ComingSoon title="User Profile"/>}/>
        <Route path="submit"            element={<RequireAuth><ComingSoon title="Submit Product"/></RequireAuth>}/>
        <Route path="bookmarks"         element={<RequireAuth><ComingSoon title="Bookmarks"/></RequireAuth>}/>
        <Route path="notifications"     element={<RequireAuth><ComingSoon title="Notifications"/></RequireAuth>}/>
        <Route path="*"                 element={<NotFound/>}/>
      </Routes>
    </div>
  );
}

// ── Placeholder for pages in progress
function ComingSoon({ title }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-ink mb-2">{title}</h2>
      <p className="text-gray-500">This page is ready in the full version. The backend API is fully wired.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">404</div>
      <h2 className="text-2xl font-bold text-ink mb-2">Page not found</h2>
      <a href="/" className="btn btn-primary mt-4 inline-flex">Go Home</a>
    </div>
  );
}

// ── Root App
function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login"    element={<GuestOnly><LoginPage/></GuestOnly>}/>
      <Route path="/register" element={<GuestOnly><RegisterPage/></GuestOnly>}/>

      {/* Admin panel */}
      <Route path="/admin" element={<RequireAdmin><AdminLayout/></RequireAdmin>}>
        <Route index                 element={<AdminDashboard/>}/>
        <Route path="products"       element={<AdminProducts/>}/>
        <Route path="users"          element={<AdminUsers/>}/>
        <Route path="entities"       element={<AdminEntities/>}/>
        <Route path="applications"   element={<AdminApplications/>}/>
        <Route path="featured"       element={<AdminFeatured/>}/>
        <Route path="reports"        element={<AdminReports/>}/>
        <Route path="settings"       element={<AdminSettings/>}/>
        <Route path="profile"        element={<AdminProfile/>}/>
      </Route>

      {/* Home site */}
      <Route path="/*" element={<HomeLayout/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes/>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius:'12px', fontSize:'14px', fontWeight:500 },
            success: { iconTheme: { primary:'#E15033', secondary:'#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
