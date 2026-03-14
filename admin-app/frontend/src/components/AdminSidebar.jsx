import React from 'react';

const NAV = [
  { key:'dashboard',    icon:'📊', label:'Dashboard' },
  { key:'products',     icon:'🚀', label:'Products' },
  { key:'users',        icon:'👥', label:'Users' },
  { key:'entities',     icon:'🏢', label:'Entities' },
  { key:'applications', icon:'📋', label:'Applications' },
  { key:'featured',     icon:'⭐', label:'Featured' },
  { key:'reports',      icon:'📈', label:'Reports' },
  { key:'activity',     icon:'📝', label:'Audit Log' },
  { key:'settings',     icon:'⚙️',  label:'Settings' },
  { key:'suggestions',  icon:'💡', label:'Suggestions' },
];

function CollapseIcon({ collapsed }) {
  return (
    <svg width="16" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.75" y="0.75" width="16.5" height="12.5" rx="2.25" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="5.75" y1="0.75" x2="5.75" y2="13.25" stroke="currentColor" strokeWidth="1.5"/>
      {collapsed
        ? <path d="M9 4.5L11.5 7L9 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="M11 4.5L8.5 7L11 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      }
    </svg>
  );
}

export default function AdminSidebar({ current, onChange, user, onLogout, isOpen, onClose, collapsed, onToggleCollapse }) {
  const role = user?.role || 'admin';
  const classes = [
    'admin-sidebar',
    isOpen     ? 'nav-open'       : '',
    collapsed  ? 'sidebar-collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Mobile close button */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close navigation">
        ✕
      </button>

      {/* Logo + collapse toggle */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-top">
          <img src="/logo.png" alt="Tech Launch MENA" className="sidebar-logo-icon" style={{width:32,height:32,borderRadius:8,display:'block',flexShrink:0}} />
          <div className="sidebar-logo-text">TL MENA</div>
          {/* Desktop collapse toggle — hidden on mobile via CSS */}
          <button
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>
        <span className="sidebar-badge">Admin Panel</span>
      </div>

      {/* When collapsed, show the toggle icon centred below the logo */}
      {collapsed && (
        <button
          className="sidebar-toggle-btn sidebar-toggle-collapsed"
          onClick={onToggleCollapse}
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <CollapseIcon collapsed={true} />
        </button>
      )}

      {/* Nav */}
      <nav>
        <div className="nav-section">Platform</div>
        {NAV.slice(0,3).map(item => (
          <div key={item.key}
            className={`nav-item${current===item.key?' active':''}`}
            onClick={() => onChange(item.key)}
            title={collapsed ? item.label : undefined}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}

        <div className="nav-section">Content</div>
        {NAV.slice(3,6).map(item => (
          <div key={item.key}
            className={`nav-item${current===item.key?' active':''}`}
            onClick={() => onChange(item.key)}
            title={collapsed ? item.label : undefined}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}

        <div className="nav-section">System</div>
        {NAV.slice(6).map(item => (
          <div key={item.key}
            className={`nav-item${current===item.key?' active':''}`}
            onClick={() => onChange(item.key)}
            title={collapsed ? item.label : undefined}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-admin-user">
          <div className="admin-avatar" style={{background:user?.avatar_color||'var(--orange)'}}>
            {(user?.name||'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="sidebar-user-info" style={{flex:1,minWidth:0}}>
            <div className="admin-name" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'Admin'}</div>
            <div className="admin-role">{role}</div>
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{background:'none',border:'none',cursor:'pointer',padding:4,borderRadius:6,color:'#AAAAAA',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
            onMouseEnter={e=>e.currentTarget.style.color='#E15033'}
            onMouseLeave={e=>e.currentTarget.style.color='#AAAAAA'}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
