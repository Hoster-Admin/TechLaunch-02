import React from 'react';

function getPublicBaseUrl() {
  const { protocol, hostname } = window.location;
  if (hostname === 'admin.tlmena.com') return 'https://tlmena.com';
  if (hostname.includes('.replit.dev')) {
    const dot = hostname.indexOf('.');
    const sub = hostname.slice(0, dot).replace(/-\d+$/, '');
    const rest = hostname.slice(dot);
    return `${protocol}//${sub}-3001${rest}`;
  }
  return 'https://tlmena.com';
}

const ALL_NAV_PLATFORM = [
  { key:'dashboard',    icon:'📊', label:'Dashboard' },
  { key:'products',     icon:'🚀', label:'Products' },
  { key:'users',        icon:'👥', label:'Users' },
];
const ALL_NAV_CONTENT = [
  { key:'entities',     icon:'🏢', label:'Entities' },
  { key:'applications', icon:'📋', label:'Applications' },
  { key:'featured',     icon:'⭐', label:'Featured' },
  { key:'launcher',     icon:'🔥', label:'Launcher Activity' },
  { key:'suggestions',  icon:'💡', label:'Suggestions' },
];
const ALL_NAV_SYSTEM = [
  { key:'activity',     icon:'📝', label:'Audit Log' },
  { key:'settings',     icon:'⚙️',  label:'Settings' },
];
const ALL_NAV_PLATFORM_SECTION = [
  { key:'platformprofile', icon:'🌐', label:'Public Profile' },
];

// Pages each role can access
const ROLE_ACCESS = {
  admin:     null, // null = all pages
  moderator: new Set(['dashboard','products','users','entities','launcher','suggestions','platformprofile']),
  editor:    new Set(['dashboard','products','entities','featured','platformprofile']),
};

function filterNav(items, role) {
  const allowed = ROLE_ACCESS[role];
  if (!allowed) return items; // admin sees everything
  return items.filter(i => allowed.has(i.key));
}

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

const ROLE_PILL = {
  admin:     { bg:'rgba(225,80,51,.18)', color:'#E15033' },
  moderator: { bg:'rgba(37,99,235,.15)', color:'#2563eb' },
  editor:    { bg:'rgba(124,58,237,.15)', color:'#7c3aed' },
};

export default function AdminSidebar({ current, onChange, user, onLogout, isOpen, onClose, collapsed, onToggleCollapse, panelName, panelAvatar, onEditProfile }) {
  const role = user?.role || 'admin';
  const pill = ROLE_PILL[role] || ROLE_PILL.admin;

  const navPlatform = filterNav(ALL_NAV_PLATFORM, role);
  const navContent  = filterNav(ALL_NAV_CONTENT,  role);
  const navSystem   = filterNav(ALL_NAV_SYSTEM,   role);
  const navPlatformSection = filterNav(ALL_NAV_PLATFORM_SECTION, role);

  const classes = [
    'admin-sidebar',
    isOpen    ? 'nav-open'         : '',
    collapsed ? 'sidebar-collapsed': '',
  ].filter(Boolean).join(' ');

  const NavItem = ({ item }) => (
    <div
      className={`nav-item${current===item.key?' active':''}`}
      onClick={() => onChange(item.key)}
      title={item.label}>
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
    </div>
  );

  return (
    <div className={classes}>
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close navigation">✕</button>

      <div className="sidebar-logo">
        <div className="sidebar-logo-top">
          {panelAvatar
            ? <img src={panelAvatar} alt={panelName||'TL MENA'} className="sidebar-logo-icon" style={{width:32,height:32,borderRadius:8,objectFit:'cover',display:'block',flexShrink:0}}/>
            : <div className="sidebar-logo-icon" style={{width:32,height:32,borderRadius:8,background:'#E15033',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>TL</div>
          }
          <div className="sidebar-logo-text">{panelName||'TL MENA'}</div>
          <button className="sidebar-toggle-btn" onClick={onToggleCollapse} title={collapsed?'Expand sidebar':'Collapse sidebar'} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}>
            <CollapseIcon collapsed={collapsed}/>
          </button>
        </div>
        <span className="sidebar-badge">Admin Panel</span>
      </div>

      {collapsed && (
        <button className="sidebar-toggle-btn sidebar-toggle-collapsed" onClick={onToggleCollapse} title="Expand sidebar" aria-label="Expand sidebar">
          <CollapseIcon collapsed={true}/>
        </button>
      )}

      <nav>
        {navPlatform.length > 0 && <>
          <div className="nav-section">Overview</div>
          {navPlatform.map(item => <NavItem key={item.key} item={item}/>)}
        </>}

        {navContent.length > 0 && <>
          <div className="nav-section">Content</div>
          {navContent.map(item => <NavItem key={item.key} item={item}/>)}
        </>}

        {navSystem.length > 0 && <>
          <div className="nav-section">System</div>
          {navSystem.map(item => <NavItem key={item.key} item={item}/>)}
        </>}

        {navPlatformSection.length > 0 && <>
          <div className="nav-section">Platform</div>
          <NavItem item={{key:'platformprofile',icon:'🌐',label:'Public Profile'}}/>
        </>}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-admin-user"
          onClick={onEditProfile}
          title="Edit your profile"
          style={{cursor: onEditProfile ? 'pointer' : 'default', position:'relative'}}
          onMouseEnter={e=>{ if(onEditProfile) e.currentTarget.querySelector('.edit-profile-hint')?.style && (e.currentTarget.querySelector('.edit-profile-hint').style.opacity='1'); }}
          onMouseLeave={e=>{ if(onEditProfile) e.currentTarget.querySelector('.edit-profile-hint')?.style && (e.currentTarget.querySelector('.edit-profile-hint').style.opacity='0'); }}>
          <div className="admin-avatar" style={{background:user?.avatar_color||'var(--orange)',position:'relative',overflow:'hidden',flexShrink:0}}>
            {(user?.admin_avatar_url || user?.avatar_url)
              ? <img src={user.admin_avatar_url || user.avatar_url} alt={user.admin_display_name || user.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
              : ((user?.admin_display_name || user?.name||'A')).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
            }
          </div>
          <div className="sidebar-user-info" style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <div className="admin-name" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.admin_display_name || user?.name||'Admin'}</div>
              <span style={{fontSize:10,fontWeight:700,borderRadius:5,padding:'2px 7px',background:pill.bg,color:pill.color,whiteSpace:'nowrap',textTransform:'capitalize',flexShrink:0}}>{role}</span>
            </div>
            {onEditProfile && (
              <div className="edit-profile-hint" style={{fontSize:10,color:'var(--orange)',opacity:0,transition:'opacity .15s',marginTop:2}}>
                Edit profile
              </div>
            )}
          </div>
          <button onClick={e=>{ e.stopPropagation(); onLogout(); }} title="Sign out"
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
