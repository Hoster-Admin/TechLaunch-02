import React, { useState, useEffect, useRef } from 'react';
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
import PlatformProfile   from '../pages/PlatformProfile.jsx';
import { useAuth } from '../App.jsx';
import { adminAPI } from '../utils/api.js';

const PAGES = {
  dashboard:    { title:'Dashboard',               sub:'Overview of platform activity',        Component: AdminDashboard },
  products:     { title:'Products',                sub:'Manage all submitted products',         Component: AdminProducts },
  users:        { title:'User Management',         sub:'Manage all platform users',             Component: AdminUsers },
  entities:     { title:'Entities',                sub:'Startups, accelerators, investors',     Component: AdminEntities },
  applications: { title:'Applications & Waitlists',sub:'Review applications and waitlists',    Component: AdminApplications },
  featured:     { title:'Featured & Spotlight',    sub:'Control what appears on homepage',      Component: AdminFeatured },
  reports:      { title:'Reports & Analytics',     sub:'Platform performance metrics',          Component: AdminReports },
  activity:     { title:'Audit Log',               sub:'Full history of admin actions',         Component: AdminActivityLog },
  settings:     { title:'Settings',                sub:'Configure platform behaviour',          Component: AdminSettings },
  suggestions:      { title:'Suggestions',             sub:'User feedback and feature requests',    Component: AdminSuggestions },
  platformprofile:  { title:'Public Profile',           sub:'Manage TechLaunch public account',      Component: PlatformProfile },
};

const TYPE_ICON = { product: '📦', user: '👤', entity: '🏢' };

export default function AdminLayout() {
  const [page, setPage]         = useState('dashboard');
  const [navOpen, setNavOpen]   = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('tlmena-sidebar-collapsed') === 'true'
  );
  const [panelProfile, setPanelProfile] = useState({ name: 'TL MENA', avatar_url: '' });
  const { user, logout } = useAuth();

  useEffect(() => {
    adminAPI.platformProfile()
      .then(r => {
        const d = r.data?.data || {};
        setPanelProfile({ name: d.name || 'TL MENA', avatar_url: d.avatar_url || '' });
      })
      .catch(() => {});

    const handleUpdate = (e) => {
      const { name, avatar_url } = e.detail || {};
      setPanelProfile({ name: name || 'TL MENA', avatar_url: avatar_url || '' });
    };
    window.addEventListener('panelProfileUpdated', handleUpdate);
    return () => window.removeEventListener('panelProfileUpdated', handleUpdate);
  }, []);
  const { title, sub, Component } = PAGES[page] || PAGES.dashboard;

  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef   = useRef(null);
  const searchTimer = useRef(null);

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
    const onKey = (e) => { if (e.key === 'Escape') { setNavOpen(false); setShowSearch(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    clearTimeout(searchTimer.current);
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const [pr, ur, er] = await Promise.all([
          adminAPI.products({ search: q, limit: 4 }),
          adminAPI.users({ search: q, limit: 4 }),
          adminAPI.entities({ search: q, limit: 3 }),
        ]);
        const results = [
          ...(pr.data.data || []).map(p => ({ type:'product', id:p.id, label:p.name, sub:p.status, page:'products' })),
          ...(ur.data.data || []).map(u => ({ type:'user', id:u.id, label:u.name||u.handle, sub:u.email||u.handle, page:'users' })),
          ...(er.data.data || []).map(e => ({ type:'entity', id:e.id, label:e.name, sub:e.type, page:'entities' })),
        ];
        setSearchResults(results);
        setShowSearch(true);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
  };

  const handleResultClick = (result) => {
    setPage(result.page);
    setSearchQuery('');
    setShowSearch(false);
    setSearchResults([]);
  };

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
        panelName={panelProfile.name}
        panelAvatar={panelProfile.avatar_url}
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
            <div ref={searchRef} style={{ position:'relative' }}>
              <div className="topbar-search" style={{display:'flex',alignItems:'center',gap:10,border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'7px 12px',background:'var(--gray-50)',width:220,transition:'border-color .15s'}}
                onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'}
                onBlur={e=>e.currentTarget.style.borderColor='var(--gray-200)'}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{color:'var(--gray-400)',flexShrink:0}}>
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchResults.length) setShowSearch(true); }}
                  placeholder="Search anything…"
                  style={{border:'none',background:'none',outline:'none',fontSize:13,fontFamily:'inherit',color:'var(--ink)',width:'100%'}}
                />
                {searchLoading && (
                  <div style={{width:12,height:12,border:'2px solid #f0f0f0',borderTopColor:'var(--orange)',borderRadius:'50%',animation:'spin 0.6s linear infinite',flexShrink:0}}/>
                )}
              </div>

              {showSearch && (
                <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,background:'#fff',border:'1px solid var(--gray-200)',borderRadius:12,boxShadow:'0 8px 28px rgba(0,0,0,.12)',zIndex:1000,overflow:'hidden',minWidth:280}}>
                  {searchResults.length === 0 ? (
                    <div style={{padding:'16px 14px',fontSize:13,color:'var(--gray-400)',textAlign:'center'}}>No results found</div>
                  ) : (
                    <>
                      {['product','user','entity'].map(type => {
                        const group = searchResults.filter(r => r.type === type);
                        if (!group.length) return null;
                        const labels = { product:'Products', user:'Users', entity:'Entities' };
                        return (
                          <div key={type}>
                            <div style={{padding:'8px 14px 4px',fontSize:10,fontWeight:700,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.8,borderTop: type!=='product'?'1px solid var(--gray-100)':'none'}}>
                              {labels[type]}
                            </div>
                            {group.map(r => (
                              <div key={r.id} onClick={() => handleResultClick(r)}
                                style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',cursor:'pointer',transition:'background .1s'}}
                                onMouseEnter={e=>e.currentTarget.style.background='var(--gray-50)'}
                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                <span style={{fontSize:16,flexShrink:0}}>{TYPE_ICON[r.type]}</span>
                                <div style={{minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:600,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.label}</div>
                                  <div style={{fontSize:11,color:'var(--gray-400)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.sub}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      <div style={{padding:'8px 14px',borderTop:'1px solid var(--gray-100)',fontSize:11,color:'var(--gray-400)',textAlign:'center'}}>
                        Click a result to navigate to that section
                      </div>
                    </>
                  )}
                </div>
              )}
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
