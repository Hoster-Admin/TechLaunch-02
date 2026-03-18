import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ICONS = {
  dashboard:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  products:     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  users:        <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  entities:     <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  applications: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  featured:     <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  reports:      <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  suggestions:  <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  emailsignups: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  settings:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  profile:      <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
};

const ROLE_MAP = {
  admin:      'Super Admin',
  moderator:  'Moderator',
  editor:     'Editor',
  analyst:    'Analyst',
  support:    'Support',
};

const NavIcon = ({ name }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

export default function AdminSidebar({ pendingCount = 0, appsCount = 0, usersCount = 0 }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials  = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'SA';
  const roleLabel = ROLE_MAP[user?.role] || 'Admin';

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-top">
          <div className="sidebar-logo-icon">🚀</div>
          <span className="sidebar-logo-text">Tech Launch</span>
        </div>
        <div className="sidebar-badge">⚙ Admin Panel</div>
      </div>

      <div className="nav-section">Overview</div>
      <Link to="/" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
        <NavIcon name="dashboard"/>
        <span>Dashboard</span>
      </Link>

      <div className="nav-section">Content</div>
      <Link to="/products" className={`nav-item ${isActive('/admin/products') ? 'active' : ''}`}>
        <NavIcon name="products"/>
        <span>Products</span>
        {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
      </Link>
      <Link to="/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
        <NavIcon name="users"/>
        <span>Users</span>
        {usersCount > 0 && <span className="nav-badge gray">{usersCount}</span>}
      </Link>
      <Link to="/entities" className={`nav-item ${isActive('/admin/entities') ? 'active' : ''}`}>
        <NavIcon name="entities"/>
        <span>Entities</span>
      </Link>
      <Link to="/applications" className={`nav-item ${isActive('/admin/applications') ? 'active' : ''}`}>
        <NavIcon name="applications"/>
        <span>Applications</span>
        {appsCount > 0 && <span className="nav-badge">{appsCount}</span>}
      </Link>

      <div className="nav-section">Platform</div>
      <Link to="/featured" className={`nav-item ${isActive('/admin/featured') ? 'active' : ''}`}>
        <NavIcon name="featured"/>
        <span>Featured</span>
      </Link>
      <Link to="/suggestions" className={`nav-item ${isActive('/admin/suggestions') ? 'active' : ''}`}>
        <NavIcon name="suggestions"/>
        <span>Suggestions</span>
      </Link>
      <Link to="/reports" className={`nav-item ${isActive('/admin/reports') ? 'active' : ''}`}>
        <NavIcon name="reports"/>
        <span>Reports</span>
      </Link>
      <Link to="/email-signups" className={`nav-item ${isActive('/admin/email-signups') ? 'active' : ''}`}>
        <NavIcon name="emailsignups"/>
        <span>Email Signups</span>
      </Link>
      <Link to="/settings" className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}>
        <NavIcon name="settings"/>
        <span>Settings</span>
      </Link>

      <div className="nav-section">Account</div>
      <Link to="/profile" className={`nav-item ${isActive('/admin/profile') ? 'active' : ''}`}>
        <NavIcon name="profile"/>
        <span>My Profile</span>
      </Link>

      <div className="sidebar-footer">
        <div style={{ position:'relative' }}>
          {popupOpen && (
            <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:0, right:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:12, padding:'6px', boxShadow:'0 8px 32px rgba(0,0,0,.15)', zIndex:100 }}>
              <div onClick={() => { navigate('/profile'); setPopupOpen(false); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#333' }}
                onMouseOver={e => e.currentTarget.style.background='#f8f8f8'} onMouseOut={e => e.currentTarget.style.background=''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View My Profile
              </div>
              <div onClick={() => { navigate('/settings'); setPopupOpen(false); }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#333' }}
                onMouseOver={e => e.currentTarget.style.background='#f8f8f8'} onMouseOut={e => e.currentTarget.style.background=''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                Settings
              </div>
              <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>
              <div onClick={handleLogout}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#dc2626' }}
                onMouseOver={e => e.currentTarget.style.background='#fff5f5'} onMouseOut={e => e.currentTarget.style.background=''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </div>
            </div>
          )}
          <div className="sidebar-admin-user" onClick={() => setPopupOpen(o => !o)} style={{ cursor:'pointer' }}>
            <div className="admin-avatar" style={{ background: user?.avatar_color || 'var(--orange)' }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="admin-name">{user?.name || 'Super Admin'}</div>
              <div className="admin-role">{roleLabel}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}
