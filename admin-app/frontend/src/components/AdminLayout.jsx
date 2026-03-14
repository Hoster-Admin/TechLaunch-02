import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar.jsx';
import AdminDashboard    from '../pages/Dashboard.jsx';
import AdminProducts     from '../pages/Products.jsx';
import AdminUsers        from '../pages/Users.jsx';
import AdminEntities     from '../pages/Entities.jsx';
import AdminApplications from '../pages/Applications.jsx';
import AdminFeatured     from '../pages/Featured.jsx';
import AdminReports      from '../pages/Reports.jsx';
import AdminSettings     from '../pages/Settings.jsx';
import AdminSuggestions  from '../pages/Suggestions.jsx';
import AdminActivityLog  from '../pages/ActivityLog.jsx';
import { useAuth } from '../App.jsx';

const PAGES = {
  dashboard:    { title:'Dashboard',               sub:'Overview of platform activity',        Component: AdminDashboard },
  products:     { title:'Products',                sub:'Manage all submitted products',         Component: AdminProducts },
  users:        { title:'User Management',         sub:'Manage all platform users',             Component: AdminUsers },
  entities:     { title:'Entities',                sub:'Startups, accelerators, investors',     Component: AdminEntities },
  applications: { title:'Applications & Waitlists',sub:'Review applications and waitlists',    Component: AdminApplications },
  featured:     { title:'Featured & Spotlight',    sub:'Control what appears on homepage',      Component: AdminFeatured },
  reports:      { title:'Reports & Analytics',     sub:'Platform performance metrics',          Component: AdminReports },
  activity:     { title:'Audit Log',               sub:'Full history of admin actions',         Component: AdminActivityLog },
  settings:     { title:'Platform Settings',       sub:'Configure platform behaviour',          Component: AdminSettings },
  suggestions:  { title:'Suggestions',             sub:'User feedback and feature requests',    Component: AdminSuggestions },
};

export default function AdminLayout() {
  const [page, setPage]         = useState('dashboard');
  const [navOpen, setNavOpen]   = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('tlmena-sidebar-collapsed') === 'true'
  );
  const { user, logout } = useAuth();
  const { title, sub, Component } = PAGES[page] || PAGES.dashboard;

  const handleNavChange = (key) => {
    setPage(key);
    setNavOpen(false);
  };

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('tlmena-sidebar-collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="admin-app">
      {navOpen && <div className="admin-overlay" onClick={() => setNavOpen(false)}/>}

      <AdminSidebar
        current={page}
        onChange={handleNavChange}
        user={user}
        onLogout={logout}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className="admin-main">
        {/* Topbar */}
        <div className="topbar">
          <button
            className="hamburger-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <span/><span/><span/>
          </button>

          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-sub">{sub}</div>
          </div>

          <div className="topbar-right">
            <div className="topbar-search" style={{display:'flex',alignItems:'center',gap:10,border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'7px 12px',background:'var(--gray-50)',width:200,transition:'border-color .15s'}}
              onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'}
              onBlur={e=>e.currentTarget.style.borderColor='var(--gray-200)'}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{color:'var(--gray-400)',flexShrink:0}}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input placeholder="Search anything…" style={{border:'none',background:'none',outline:'none',fontSize:13,fontFamily:'inherit',color:'var(--ink)',width:'100%'}}/>
            </div>
            <a href="https://tlmena.com" target="_blank" rel="noreferrer" className="topbar-view-site"
              style={{padding:'7px 14px',borderRadius:9,border:'1.5px solid var(--gray-200)',background:'var(--gray-50)',fontSize:12,fontWeight:600,color:'var(--ink)',textDecoration:'none',whiteSpace:'nowrap'}}>
              ↗ View Site
            </a>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-content">
          <Component />
        </div>
      </div>
    </div>
  );
}
