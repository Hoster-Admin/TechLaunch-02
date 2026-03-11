import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import { LoadingPage } from './components/ui';

import AdminLayout  from './components/admin/AdminLayout';

import HomePage         from './pages/home/HomePage';
import ProductDetailPage from './pages/home/ProductDetailPage';
import AllProductsPage  from './pages/home/AllProductsPage';
import DirectoryPage    from './pages/home/DirectoryPage';
import AcceleratorsPage from './pages/home/AcceleratorsPage';
import ListingPage      from './pages/home/ListingPages';
import BookmarksPage    from './pages/home/BookmarksPage';
import UserProfilePage  from './pages/home/UserProfilePage';
import { LoginPage, RegisterPage } from './pages/home/AuthPages';

import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminProducts    from './pages/admin/AdminProducts';
import {
  AdminUsers, AdminEntities, AdminApplications,
  AdminFeatured, AdminReports, AdminSettings, AdminProfile
} from './pages/admin/AdminPages';

import SubmitProductModal from './components/home/SubmitProductModal';
import InboxModal         from './components/home/InboxModal';
import EntityProfileModal from './components/home/EntityProfileModal';
import WaitlistModal      from './components/home/WaitlistModal';
import AuthModal          from './components/home/AuthModal';

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

function NotFound() {
  return (
    <div style={{ maxWidth:600, margin:'120px auto 80px', textAlign:'center', padding:'0 20px' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>404</div>
      <h2 style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>Page not found</h2>
      <p style={{ color:'#888', marginBottom:24 }}>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ padding:'12px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', display:'inline-block' }}>Go Home</a>
    </div>
  );
}

function GlobalModals() {
  const { submitOpen, setSubmitOpen, waitlistModal, setWaitlistModal } = useUI();
  return (
    <>
      <AuthModal/>
      <SubmitProductModal open={submitOpen} onClose={() => setSubmitOpen(false)}/>
      <InboxModal/>
      <EntityProfileModal/>
      <WaitlistModal product={waitlistModal} onClose={() => setWaitlistModal(null)}/>
    </>
  );
}

// Wrapper to inject auth gate callback into pages
function WithAuthCallbacks({ Component, ...props }) {
  const { setAuthModal } = useUI();
  const onSignIn = () => setAuthModal('gate');
  const onSignUp = () => setAuthModal('signup');
  return <Component {...props} onSignIn={onSignIn} onSignUp={onSignUp}/>;
}

function AppRoutes() {
  return (
    <>
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

        {/* Public site — all wrapped with auth callbacks */}
        <Route path="/"             element={<WithAuthCallbacks Component={HomePage}/>}/>
        <Route path="/products"     element={<WithAuthCallbacks Component={AllProductsPage}/>}/>
        <Route path="/products/:id" element={<WithAuthCallbacks Component={ProductDetailPage}/>}/>
        <Route path="/directory"    element={<WithAuthCallbacks Component={DirectoryPage}/>}/>
        <Route path="/accelerators" element={<WithAuthCallbacks Component={AcceleratorsPage}/>}/>
        <Route path="/list/:type"   element={<WithAuthCallbacks Component={ListingPage}/>}/>
        <Route path="/bookmarks"    element={<WithAuthCallbacks Component={BookmarksPage}/>}/>
        <Route path="/u/:handle"    element={<WithAuthCallbacks Component={UserProfilePage}/>}/>
        <Route path="/submit"       element={<Navigate to="/" replace/>}/>
        <Route path="*"             element={<NotFound/>}/>
      </Routes>
      <GlobalModals/>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <AppRoutes/>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius:'12px', fontSize:'14px', fontWeight:500 },
              success: { iconTheme: { primary:'#E15033', secondary:'#fff' } },
            }}
          />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
