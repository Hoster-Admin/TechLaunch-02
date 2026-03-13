import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar.jsx';
import AdminDashboard from '../pages/Dashboard.jsx';
import AdminProducts  from '../pages/Products.jsx';
import AdminUsers     from '../pages/Users.jsx';
import AdminEntities  from '../pages/Entities.jsx';
import AdminApplications from '../pages/Applications.jsx';
import AdminFeatured  from '../pages/Featured.jsx';
import AdminReports   from '../pages/Reports.jsx';
import AdminSettings  from '../pages/Settings.jsx';
import AdminSuggestions from '../pages/Suggestions.jsx';
import { useAuth } from '../App.jsx';

const PAGES = {
  dashboard:    { title:'Dashboard',             sub:'Overview of platform activity', Component: AdminDashboard },
  products:     { title:'Products',              sub:'Manage all submitted products',  Component: AdminProducts },
  users:        { title:'User Management',       sub:'Manage all platform users',      Component: AdminUsers },
  entities:     { title:'Entities',              sub:'Startups, accelerators, investors', Component: AdminEntities },
  applications: { title:'Applications & Waitlists', sub:'Review applications and waitlists', Component: AdminApplications },
  featured:     { title:'Featured & Spotlight',  sub:'Control what appears on homepage', Component: AdminFeatured },
  reports:      { title:'Reports & Analytics',   sub:'Platform performance metrics',   Component: AdminReports },
  settings:     { title:'Platform Settings',     sub:'Configure platform behaviour',   Component: AdminSettings },
  suggestions:  { title:'Suggestions',           sub:'User feedback and feature requests', Component: AdminSuggestions },
};

export default function AdminLayout() {
  const [page, setPage] = useState('dashboard');
  const { user, logout } = useAuth();
  const { title, sub, Component } = PAGES[page] || PAGES.dashboard;

  return (
    <div className="admin-app">
      <AdminSidebar current={page} onChange={setPage} user={user} onLogout={logout} />
      <div className="admin-main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-sub">{sub}</div>
          </div>
          <div className="topbar-right">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:10, background: user?.avatar_color || 'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff' }}>
                {(user?.name || 'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <button onClick={logout} style={{ padding:'6px 14px', borderRadius:9, border:'1.5px solid #E8E8E8', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#666' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
        <div className="admin-content">
          <Component />
        </div>
      </div>
    </div>
  );
}
