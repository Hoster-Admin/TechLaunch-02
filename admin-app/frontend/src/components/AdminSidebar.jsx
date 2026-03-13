import React from 'react';

const NAV = [
  { key:'dashboard',    icon:'📊', label:'Dashboard' },
  { key:'products',     icon:'🚀', label:'Products' },
  { key:'users',        icon:'👥', label:'Users' },
  { key:'entities',     icon:'🏢', label:'Entities' },
  { key:'applications', icon:'📋', label:'Applications' },
  { key:'featured',     icon:'⭐', label:'Featured' },
  { key:'reports',      icon:'📈', label:'Reports' },
  { key:'settings',     icon:'⚙️', label:'Settings' },
  { key:'suggestions',  icon:'💡', label:'Suggestions' },
];

export default function AdminSidebar({ current, onChange, user, onLogout }) {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-top">
          <div className="sidebar-logo-icon">📡</div>
          <div className="sidebar-logo-text">TL MENA</div>
        </div>
        <div className="sidebar-badge">Admin Panel</div>
      </div>

      <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
        {NAV.map(item => (
          <div key={item.key}
            className={`nav-item${current === item.key ? ' active' : ''}`}
            onClick={() => onChange(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-admin-user">
          <div className="admin-avatar" style={{ background: user?.avatar_color || 'var(--orange)' }}>
            {(user?.name || 'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div className="admin-name">{user?.name || 'Admin'}</div>
            <div className="admin-role">{user?.role || 'admin'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
