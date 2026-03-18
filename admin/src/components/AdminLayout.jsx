import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../utils/api';

const TITLES = {
  '/':              { title: 'Dashboard',               sub: 'Overview of platform activity' },
  '/products':      { title: 'Products',                sub: 'Manage, approve and feature listings' },
  '/users':         { title: 'User Management',         sub: 'View, verify and manage platform members' },
  '/entities':      { title: 'Entities',                sub: 'Startups, accelerators, investors and studios' },
  '/applications':  { title: 'Applications & Waitlists',sub: 'Track applications and waitlist signups' },
  '/featured':      { title: 'Featured & Spotlight',    sub: 'Control what appears on the homepage' },
  '/suggestions':   { title: 'Suggestions',             sub: 'Member suggestions and recommendations' },
  '/reports':       { title: 'Reports & Analytics',     sub: 'Platform-wide metrics and growth data' },
  '/settings':      { title: 'Platform Settings',       sub: 'Configure platform behaviour and integrations' },
  '/email-signups': { title: 'Email Signups',            sub: 'Waitlist and discount signup emails collected' },
  '/profile':       { title: 'My Profile',              sub: 'Your account and preferences' },
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [appsCount,    setAppsCount]    = useState(0);
  const [usersCount,   setUsersCount]   = useState(0);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  const info = TITLES[location.pathname] || { title: 'Admin', sub: '' };

  useEffect(() => {
    adminAPI.dashboard().then(({ data }) => {
      const s = data.data?.stats;
      setPendingCount(parseInt(s?.products?.pending) || 0);
      setUsersCount(parseInt(s?.users?.total) || 0);
    }).catch(() => {});
  }, [location.pathname]);

  return (
    /* Exact HTML structure: .app > .sidebar + .main > .topbar + .content */
    <div className="admin-app">

      {/* Sidebar desktop */}
      <AdminSidebar pendingCount={pendingCount} appsCount={appsCount} usersCount={usersCount}/>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} onClick={() => setMobileOpen(false)}/>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240 }}>
            <AdminSidebar pendingCount={pendingCount} appsCount={appsCount} usersCount={usersCount}/>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="admin-main">

        {/* Topbar — exact HTML: title + sub + topbar-right (search + export + add) */}
        <div className="topbar">
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginRight: 4 }}
            className="admin-mobile-ham">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div>
            <div className="topbar-title">{info.title}</div>
            {info.sub && <div className="topbar-sub">{info.sub}</div>}
          </div>

          <div className="topbar-right">
            {/* Search — exact HTML */}
            <div className="topbar-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search anything…"/>
            </div>

            {/* Export — exact HTML */}
            <button className="btn-topbar btn-tghost">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Export
            </button>

            {/* Add Product — exact HTML */}
            <button className="btn-topbar btn-tprimary" onClick={() => window.open('/', '_blank')}>
              View Public Site
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="admin-content">
          <Outlet context={{ pendingCount, setPendingCount, appsCount, setAppsCount, usersCount, setUsersCount }}/>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .admin-app > .admin-sidebar:first-child { display: none !important; }
          .admin-mobile-ham { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
