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

export default function AdminSidebar({ current, onChange, user, onLogout }) {
  const role = user?.role || 'admin';
  return (
    <div className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-top">
          <img src="/logo.png" alt="Tech Launch MENA" className="sidebar-logo-icon" style={{width:32,height:32,borderRadius:8,display:'block'}} />
          <div className="sidebar-logo-text">TL MENA</div>
        </div>
        <span className="sidebar-badge">Admin Panel</span>
      </div>

      {/* Nav */}
      <nav>
        <div className="nav-section">Platform</div>
        {NAV.slice(0,3).map(item => (
          <div key={item.key}
            className={`nav-item${current===item.key?' active':''}`}
            onClick={() => onChange(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div className="nav-section">Content</div>
        {NAV.slice(3,6).map(item => (
          <div key={item.key}
            className={`nav-item${current===item.key?' active':''}`}
            onClick={() => onChange(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div className="nav-section">System</div>
        {NAV.slice(6).map(item => (
          <div key={item.key}
            className={`nav-item${current===item.key?' active':''}`}
            onClick={() => onChange(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-admin-user">
          <div className="admin-avatar" style={{background:user?.avatar_color||'var(--orange)'}}>
            {(user?.name||'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
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
