import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import { usersAPI } from './utils/api';
import api from './utils/api';
import { LoadingPage } from './components/ui';

import AdminLayout  from './components/admin/AdminLayout';

import HomePage         from './pages/home/HomePage';
import ProductDetailPage from './pages/home/ProductDetailPage';
import AllProductsPage  from './pages/home/AllProductsPage';
import DirectoryPage    from './pages/home/DirectoryPage';
import AcceleratorsPage from './pages/home/AcceleratorsPage';
import ListingPage      from './pages/home/ListingPages';
import BookmarksPage    from './pages/home/BookmarksPage';
import PeoplePage       from './pages/home/PeoplePage';
import UserProfilePage  from './pages/home/UserProfilePage';
import SettingsPage     from './pages/home/SettingsPage';
import { LoginPage, RegisterPage, SetPasswordPage, ResetPasswordPage } from './pages/home/AuthPages';
import { ArticlesList, ArticleDetail } from './pages/home/ArticlesPage';
import AboutPage   from './pages/home/AboutPage';
import PrivacyPage from './pages/home/PrivacyPage';
import TermsPage   from './pages/home/TermsPage';
import ContactPage, { WriteForUsPage } from './pages/home/ContactPage';
import LauncherPage from './pages/home/LauncherPage';
import PostDetailPage from './pages/home/PostDetailPage';

import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminProducts    from './pages/admin/AdminProducts';
import AdminSuggestions from './pages/admin/AdminSuggestions';
import {
  AdminUsers, AdminEntities, AdminApplications,
  AdminFeatured, AdminReports, AdminSettings, AdminProfile, AdminEmailSignups
} from './pages/admin/AdminPages';

import SubmitProductModal from './components/home/SubmitProductModal';
import InboxModal         from './components/home/InboxModal';
import EntityProfileModal from './components/home/EntityProfileModal';
import ApplyModal         from './components/home/ApplyModal';
import WaitlistModal      from './components/home/WaitlistModal';
import AuthModal          from './components/home/AuthModal';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingPage/>;
  if (!user)   return <Navigate to="/login" state={{ from: location.pathname }} replace/>;
  return children;
};

function DataSync() {
  const { user } = useAuth();
  const { loadNotifications, loadBookmarks, setUnreadMsgCount } = useUI();

  const fetchMsgCount = React.useCallback(() => {
    if (!user) return;
    api.get('/messages/unread-count').then(({ data }) => {
      if (data?.success) setUnreadMsgCount(data.data?.count ?? 0);
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    usersAPI.notifications().then(({ data }) => {
      if (data?.data) loadNotifications(data.data);
    }).catch(() => {});
    usersAPI.bookmarks().then(({ data }) => {
      if (data?.data) loadBookmarks(data.data);
    }).catch(() => {});
    fetchMsgCount();
    const poll = setInterval(fetchMsgCount, 30000);
    return () => clearInterval(poll);
  }, [user?.id]);
  return null;
}

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
      <ApplyModal/>
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
      <DataSync/>
      <Routes>
        {/* Auth */}
        <Route path="/login"         element={<GuestOnly><LoginPage/></GuestOnly>}/>
        <Route path="/register"      element={<GuestOnly><RegisterPage/></GuestOnly>}/>
        <Route path="/set-password"    element={<SetPasswordPage/>}/>
        <Route path="/reset-password"  element={<ResetPasswordPage/>}/>

        {/* Admin panel */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout/></RequireAdmin>}>
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
        </Route>

        {/* Public site — all wrapped with auth callbacks */}
        <Route path="/"             element={<WithAuthCallbacks Component={HomePage}/>}/>
        <Route path="/products"     element={<WithAuthCallbacks Component={AllProductsPage}/>}/>
        <Route path="/products/:id" element={<WithAuthCallbacks Component={ProductDetailPage}/>}/>
        <Route path="/directory"    element={<WithAuthCallbacks Component={DirectoryPage}/>}/>
        <Route path="/accelerators" element={<WithAuthCallbacks Component={AcceleratorsPage}/>}/>
        <Route path="/list/:type"   element={<WithAuthCallbacks Component={ListingPage}/>}/>
        <Route path="/bookmarks"    element={<WithAuthCallbacks Component={BookmarksPage}/>}/>
        <Route path="/people"       element={<WithAuthCallbacks Component={PeoplePage}/>}/>
        <Route path="/u/:handle"    element={<WithAuthCallbacks Component={UserProfilePage}/>}/>
        <Route path="/settings"          element={<RequireAuth><SettingsPage/></RequireAuth>}/>
        <Route path="/launcher"           element={<LauncherPage/>}/>
        <Route path="/launcher/posts/:id" element={<PostDetailPage/>}/>
        <Route path="/articles"          element={<WithAuthCallbacks Component={ArticlesList}/>}/>
        <Route path="/articles/:slug"    element={<WithAuthCallbacks Component={ArticleDetail}/>}/>
        <Route path="/about"             element={<AboutPage/>}/>
        <Route path="/privacy"           element={<PrivacyPage/>}/>
        <Route path="/terms"             element={<TermsPage/>}/>
        <Route path="/contact"           element={<ContactPage/>}/>
        <Route path="/write-for-us"      element={<WriteForUsPage/>}/>
        <Route path="/submit"            element={<Navigate to="/" replace/>}/>
        <Route path="*"                  element={<NotFound/>}/>
      </Routes>
      <GlobalModals/>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop/>
      <AuthProvider>
        <UIProvider>
          <AppRoutes/>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius:'12px', fontSize:'14px', fontWeight:500 },
              success: { iconTheme: { primary:'#16a34a', secondary:'#fff' } },
            }}
          />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
