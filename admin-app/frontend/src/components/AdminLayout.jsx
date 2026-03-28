import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from './AdminSidebar.jsx';

function getPublicBaseUrl() {
  const { protocol, hostname } = window.location;
  if (hostname === 'admin.tlmena.com') return 'https://tlmena.com';
  if (hostname.includes('.replit.dev')) {
    // Replit uses subdomain-based port routing: <base>-<port>.<cluster>.replit.dev
    const dot = hostname.indexOf('.');
    const sub = hostname.slice(0, dot).replace(/-\d+$/, ''); // strip any existing port suffix
    const rest = hostname.slice(dot);
    return `${protocol}//${sub}-3001${rest}`;
  }
  return 'https://tlmena.com';
}
import AdminDashboard    from '../pages/Dashboard.jsx';
import AdminProducts     from '../pages/Products.jsx';
import AdminUsers        from '../pages/Users.jsx';
import AdminEntities     from '../pages/Entities.jsx';
import AdminApplications from '../pages/Applications.jsx';
import AdminFeatured     from '../pages/Featured.jsx';
import AdminSettings       from '../pages/Settings.jsx';
import LauncherActivity    from '../pages/LauncherActivity.jsx';
import AdminSuggestions  from '../pages/Suggestions.jsx';
import AdminActivityLog  from '../pages/ActivityLog.jsx';
import PlatformProfile   from '../pages/PlatformProfile.jsx';
import EntityClaims      from '../pages/EntityClaims.jsx';
import { useAuth } from '../App.jsx';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';

const PAGES = {
  dashboard:    { title:'Dashboard',               sub:'Overview of platform activity',        Component: AdminDashboard },
  products:     { title:'Products',                sub:'Manage all submitted products',         Component: AdminProducts },
  users:        { title:'User Management',         sub:'Manage all platform users',             Component: AdminUsers },
  entities:     { title:'Entities',                sub:'Startups, accelerators, investors',     Component: AdminEntities },
  entityclaims: { title:'Entity Claims',           sub:'Review user entity association requests', Component: EntityClaims },
  applications: { title:'Applications & Waitlists',sub:'Review applications and waitlists',    Component: AdminApplications },
  featured:     { title:'Featured & Spotlight',    sub:'Control what appears on homepage',      Component: AdminFeatured },
  launcher:     { title:'Launcher Activity',        sub:'Community posts, comments and moderation', Component: LauncherActivity },
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
  const [exportOpen, setExportOpen]   = useState(false);
  const [exportFrom, setExportFrom]   = useState('');
  const [exportTo,   setExportTo]     = useState('');
  const [exporting,  setExporting]    = useState('');
  const exportRef = useRef(null);
  const { user, logout, refreshUser } = useAuth();

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdNew,        setPwdNew]        = useState('');
  const [pwdConfirm,    setPwdConfirm]    = useState('');
  const [pwdSaving,     setPwdSaving]     = useState(false);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName,        setEditName]        = useState('');
  const [editAvatar,      setEditAvatar]      = useState('');
  const [editSaving,      setEditSaving]      = useState(false);
  const avatarInputRef = useRef(null);

  const CROP_SIZE = 220;
  const [cropSrc,         setCropSrc]         = useState('');
  const [cropScale,       setCropScale]       = useState(1);
  const [cropOffset,      setCropOffset]      = useState({ x: 0, y: 0 });
  const [cropNatural,     setCropNatural]     = useState({ w: 1, h: 1 });
  const [cropUploading,   setCropUploading]   = useState(false);
  const cropDragRef = useRef(null);

  const openEditProfile = () => {
    setEditName(user?.admin_display_name || user?.name || '');
    setEditAvatar(user?.admin_avatar_url || '');
    setEditProfileOpen(true);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onerror = () => toast.error('Could not read the image file');
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
      setCropScale(1);
      setCropOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleCropImgLoad = (e) => {
    setCropNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  const handleCropPointerDown = (e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropDragRef.current = { startX: clientX - cropOffset.x, startY: clientY - cropOffset.y };
    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      setCropOffset({ x: cx - cropDragRef.current.startX, y: cy - cropDragRef.current.startY });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      cropDragRef.current = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };

  const applyCrop = () => {
    const { w: natW, h: natH } = cropNatural;
    if (!cropSrc || !natW || !natH) return;
    const coverScale = Math.max(CROP_SIZE / natW, CROP_SIZE / natH);
    const totalScale = coverScale * cropScale;
    const dispW = natW * totalScale;
    const dispH = natH * totalScale;
    const imgLeft = (CROP_SIZE - dispW) / 2 + cropOffset.x;
    const imgTop  = (CROP_SIZE - dispH) / 2 + cropOffset.y;
    const srcX = -imgLeft / totalScale;
    const srcY = -imgTop  / totalScale;
    const srcW = CROP_SIZE / totalScale;
    const srcH = CROP_SIZE / totalScale;
    const OUT = 500;
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onerror = () => toast.error('Could not process image');
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUT, OUT);
      canvas.toBlob((blob) => {
        if (!blob) { toast.error('Image processing failed'); return; }
        setCropUploading(true);
        const fd = new FormData();
        fd.append('file', blob, 'avatar.jpg');
        const token = localStorage.getItem('tlmena_admin_token');
        fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
          .then(r => r.json())
          .then(d => {
            if (d.url) { setEditAvatar(d.url); setCropSrc(''); }
            else toast.error('Upload failed: ' + (d.message || 'unknown error'));
          })
          .catch(err => toast.error('Upload failed: ' + (err.message || 'network error')))
          .finally(() => setCropUploading(false));
      }, 'image/jpeg', 0.88);
    };
    img.src = cropSrc;
  };

  const submitEditProfile = async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setEditSaving(true);
    try {
      await adminAPI.updateMe({ name: editName.trim(), avatar_url: editAvatar || null });
      toast.success('Profile updated');
      setEditProfileOpen(false);
      if (typeof refreshUser === 'function') refreshUser();
    } catch(e) { toast.error(e.message || 'Failed to save profile'); }
    finally { setEditSaving(false); }
  };

  useEffect(() => {
    if (user?.force_password_change) setShowChangePwd(true);
  }, [user?.force_password_change]);

  const submitChangePwd = async () => {
    if (!pwdNew || pwdNew.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (pwdNew !== pwdConfirm) { toast.error('Passwords do not match'); return; }
    setPwdSaving(true);
    try {
      await adminAPI.changePassword(pwdNew);
      toast.success('Password updated — welcome aboard!');
      setPwdNew(''); setPwdConfirm('');
      setShowChangePwd(false);
      if (typeof refreshUser === 'function') refreshUser();
    } catch(e) { toast.error(e.message || 'Failed to update password'); }
    finally { setPwdSaving(false); }
  };

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

  const ROLE_ACCESS = {
    moderator: new Set(['dashboard','products','users','entities','entityclaims','launcher','suggestions','platformprofile']),
    editor:    new Set(['dashboard','products','entities','featured','platformprofile']),
  };

  const handleNavChange = (key) => {
    const role = user?.role;
    const allowed = ROLE_ACCESS[role];
    if (allowed && !allowed.has(key)) {
      toast.error(`Your ${role} role does not have access to that section.`);
      return;
    }
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

  // Close export dropdown on outside click
  useEffect(() => {
    const h = e => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const doExport = async (type) => {
    setExporting(type);
    try {
      const p = {};
      if (exportFrom) p.from = exportFrom;
      if (exportTo)   p.to   = exportTo;
      await adminAPI.exportCSV(type, p);
      toast.success(`${type} CSV downloaded`);
    } catch(e) { toast.error(e.message || 'Export failed'); }
    finally { setExporting(''); }
  };

  return (
    <div className="admin-app">
      {/* Force password change overlay */}
      {showChangePwd && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff',borderRadius:20,padding:36,width:420,maxWidth:'92vw',boxShadow:'0 24px 72px rgba(0,0,0,.28)'}}>
            <div style={{fontSize:22,marginBottom:8}}>🔐</div>
            <div style={{fontSize:16,fontWeight:800,color:'#0A0A0A',marginBottom:4}}>Set your password</div>
            <div style={{fontSize:13,color:'#888',marginBottom:24,lineHeight:1.5}}>
              Your account was created by an admin. Please set a new password before continuing.
            </div>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>New Password</label>
            <input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)}
              placeholder="At least 8 characters"
              style={{width:'100%',borderRadius:10,border:'1.5px solid #E8E8E8',padding:'10px 12px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',marginBottom:14}}
            />
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>Confirm Password</label>
            <input type="password" value={pwdConfirm} onChange={e=>setPwdConfirm(e.target.value)}
              placeholder="Repeat your new password"
              onKeyDown={e=>{ if(e.key==='Enter') submitChangePwd(); }}
              style={{width:'100%',borderRadius:10,border:'1.5px solid #E8E8E8',padding:'10px 12px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',marginBottom:20}}
            />
            <div style={{display:'flex',gap:10}}>
              <button onClick={submitChangePwd} disabled={pwdSaving}
                style={{flex:1,padding:'11px',borderRadius:10,border:'none',background:'var(--orange)',color:'#fff',fontSize:13,fontWeight:700,cursor:pwdSaving?'not-allowed':'pointer',opacity:pwdSaving?0.6:1,fontFamily:'inherit'}}>
                {pwdSaving ? 'Saving…' : 'Set Password & Continue'}
              </button>
              <button onClick={logout}
                style={{padding:'11px 16px',borderRadius:10,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#555',fontFamily:'inherit'}}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

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
        onEditProfile={openEditProfile}
      />

      {/* Edit my profile modal */}
      {editProfileOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}
          onClick={e=>{ if(e.target===e.currentTarget) setEditProfileOpen(false); }}>
          <div style={{background:'#fff',borderRadius:20,padding:36,width:400,maxWidth:'92vw',boxShadow:'0 24px 72px rgba(0,0,0,.28)'}}>
            <div style={{fontSize:18,fontWeight:800,color:'#0A0A0A',marginBottom:4}}>Edit Profile</div>
            <div style={{fontSize:13,color:'#888',marginBottom:24}}>Update your name and photo</div>

            {/* Avatar picker */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:22,gap:8}}>
              <label htmlFor="admin-avatar-file-input" style={{cursor:'pointer',position:'relative',display:'block'}}>
                <div style={{width:80,height:80,borderRadius:'50%',overflow:'hidden',background:user?.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,color:'#fff',border:'3px solid #e8e8e8'}}>
                  {editAvatar
                    ? <img src={editAvatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : (editName||'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
                  }
                </div>
                <div style={{position:'absolute',bottom:0,right:0,background:'var(--orange)',borderRadius:'50%',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',border:'3px solid #fff',boxShadow:'0 2px 6px rgba(0,0,0,.18)'}}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </div>
              </label>
              <input
                id="admin-avatar-file-input"
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                style={{display:'none'}}
                onChange={handleAvatarFile}
              />
              {editAvatar
                ? <button onClick={()=>setEditAvatar('')} style={{background:'none',border:'none',fontSize:11,color:'#aaa',cursor:'pointer',textDecoration:'underline',padding:0}}>Remove photo</button>
                : <span style={{fontSize:11,color:'#aaa'}}>Click photo to upload</span>
              }
            </div>

            {/* Name field */}
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>Display Name</label>
            <input
              value={editName}
              onChange={e=>setEditName(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') submitEditProfile(); }}
              placeholder="Your name"
              style={{width:'100%',borderRadius:10,border:'1.5px solid var(--gray-200)',padding:'10px 12px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',marginBottom:22}}
              onFocus={e=>e.target.style.borderColor='var(--orange)'}
              onBlur={e=>e.target.style.borderColor='var(--gray-200)'}
            />

            <div style={{display:'flex',gap:10}}>
              <button onClick={submitEditProfile} disabled={editSaving}
                style={{flex:1,padding:'11px',borderRadius:10,border:'none',background:'var(--orange)',color:'#fff',fontSize:13,fontWeight:700,cursor:editSaving?'not-allowed':'pointer',opacity:editSaving?0.6:1,fontFamily:'inherit'}}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={()=>setEditProfileOpen(false)}
                style={{padding:'11px 18px',borderRadius:10,border:'1.5px solid var(--gray-200)',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#555',fontFamily:'inherit'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop / Resize overlay */}
      {cropSrc && (() => {
        const coverScale = cropNatural.w && cropNatural.h
          ? Math.max(CROP_SIZE / cropNatural.w, CROP_SIZE / cropNatural.h) : 1;
        const dispW = cropNatural.w * coverScale * cropScale;
        const dispH = cropNatural.h * coverScale * cropScale;
        const imgLeft = (CROP_SIZE - dispW) / 2 + cropOffset.x;
        const imgTop  = (CROP_SIZE - dispH) / 2 + cropOffset.y;
        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',zIndex:10001,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)'}}>
            <div style={{background:'#fff',borderRadius:22,padding:'32px 28px',width:300,maxWidth:'92vw',display:'flex',flexDirection:'column',alignItems:'center',gap:18,boxShadow:'0 28px 80px rgba(0,0,0,.35)'}}>
              <div style={{fontSize:17,fontWeight:800,color:'#0A0A0A'}}>Crop Photo</div>
              <div style={{fontSize:12,color:'#aaa',marginTop:-14,textAlign:'center'}}>Drag to reposition · Slider to zoom</div>

              {/* Circle crop preview */}
              <div
                style={{width:CROP_SIZE,height:CROP_SIZE,borderRadius:'50%',overflow:'hidden',background:'#f0f0f0',position:'relative',cursor:'grab',border:'3px solid #e0e0e0',flexShrink:0,touchAction:'none'}}
                onMouseDown={handleCropPointerDown}
                onTouchStart={handleCropPointerDown}
              >
                <img
                  src={cropSrc}
                  alt="crop preview"
                  draggable={false}
                  onLoad={handleCropImgLoad}
                  style={{
                    position:'absolute',
                    width: dispW,
                    height: dispH,
                    left: imgLeft,
                    top: imgTop,
                    userSelect:'none',
                    pointerEvents:'none',
                  }}
                />
              </div>

              {/* Zoom slider */}
              <div style={{width:'100%',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:18,color:'#bbb',lineHeight:1,cursor:'pointer',userSelect:'none'}} onClick={()=>setCropScale(s=>Math.max(1,+(s-0.1).toFixed(2)))}>−</span>
                <input
                  type="range" min="1" max="4" step="0.02"
                  value={cropScale}
                  onChange={e=>setCropScale(parseFloat(e.target.value))}
                  style={{flex:1,accentColor:'var(--orange)',height:4,cursor:'pointer'}}
                />
                <span style={{fontSize:18,color:'#bbb',lineHeight:1,cursor:'pointer',userSelect:'none'}} onClick={()=>setCropScale(s=>Math.min(4,+(s+0.1).toFixed(2)))}>+</span>
              </div>
              <div style={{fontSize:11,color:'#ccc',marginTop:-10}}>{Math.round(cropScale * 100)}% zoom</div>

              {/* Buttons */}
              <div style={{display:'flex',gap:10,width:'100%'}}>
                <button
                  onClick={()=>setCropSrc('')}
                  disabled={cropUploading}
                  style={{flex:1,padding:'11px',borderRadius:10,border:'1.5px solid #e8e8e8',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#555',fontFamily:'inherit'}}>
                  Cancel
                </button>
                <button
                  onClick={applyCrop}
                  disabled={cropUploading}
                  style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:'var(--orange)',color:'#fff',fontSize:13,fontWeight:700,cursor:cropUploading?'not-allowed':'pointer',opacity:cropUploading?0.7:1,fontFamily:'inherit'}}>
                  {cropUploading ? 'Uploading…' : 'Use Photo'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

            {/* Export dropdown */}
            <div ref={exportRef} style={{position:'relative'}}>
              <button
                onClick={() => setExportOpen(v => !v)}
                style={{padding:'7px 12px',borderRadius:9,border:'1.5px solid var(--gray-200)',background: exportOpen ? 'var(--orange-light)' : 'var(--gray-50)',fontSize:12,fontWeight:600,color: exportOpen ? 'var(--orange)' : 'var(--ink)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap',transition:'all .15s'}}>
                ↓ Export
                <span style={{fontSize:9,opacity:.6,transition:'transform .2s',display:'inline-block',transform: exportOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
              </button>

              {exportOpen && (
                <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'#fff',border:'1.5px solid var(--gray-200)',borderRadius:14,boxShadow:'0 12px 40px rgba(0,0,0,.14)',zIndex:1000,minWidth:310,padding:18}}>
                  {/* Date range */}
                  <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Date Range</div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                    <span style={{fontSize:11,color:'#888',whiteSpace:'nowrap'}}>From</span>
                    <input type="date" value={exportFrom} onChange={e=>setExportFrom(e.target.value)}
                      style={{flex:1,border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'6px 9px',fontSize:12,outline:'none',background:'var(--gray-50)',fontFamily:'inherit'}}/>
                    <span style={{fontSize:11,color:'#888',whiteSpace:'nowrap'}}>To</span>
                    <input type="date" value={exportTo} onChange={e=>setExportTo(e.target.value)}
                      style={{flex:1,border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'6px 9px',fontSize:12,outline:'none',background:'var(--gray-50)',fontFamily:'inherit'}}/>
                    {(exportFrom||exportTo) && (
                      <button onClick={()=>{setExportFrom('');setExportTo('');}}
                        style={{padding:'6px 10px',borderRadius:7,border:'1px solid var(--gray-200)',background:'#fff',fontSize:11,color:'#888',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>
                        ✕
                      </button>
                    )}
                  </div>
                  {/* CSV buttons */}
                  <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Download CSV</div>
                  <div style={{display:'flex',flexDirection:'column',gap:7}}>
                    {['products','users','applications'].map(t => (
                      <button key={t} onClick={()=>doExport(t)} disabled={!!exporting}
                        style={{padding:'9px 14px',borderRadius:9,border:'1.5px solid var(--gray-200)',background:'#fff',fontSize:12,color:'#444',cursor:exporting?'not-allowed':'pointer',fontWeight:600,textAlign:'left',display:'flex',alignItems:'center',gap:8,opacity:exporting===t?.6:1,transition:'background .12s'}}
                        onMouseEnter={e=>{if(!exporting)e.currentTarget.style.background='var(--gray-50)'}}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                        <span style={{fontSize:14}}>{exporting===t ? '⏳' : '↓'}</span>
                        {exporting===t ? 'Downloading…' : `${t.charAt(0).toUpperCase()+t.slice(1)} CSV`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a href={`${getPublicBaseUrl()}/@techlaunchmena`} target="_blank" rel="noreferrer"
              style={{padding:'7px 14px',borderRadius:9,border:'1.5px solid var(--orange)',background:'var(--orange-light)',fontSize:12,fontWeight:600,color:'var(--orange)',textDecoration:'none',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
              🌐 View Public Profile
            </a>
            <a href={`${getPublicBaseUrl()}`} target="_blank" rel="noreferrer" className="topbar-view-site"
              style={{padding:'7px 14px',borderRadius:9,border:'1.5px solid var(--gray-200)',background:'var(--gray-50)',fontSize:12,fontWeight:600,color:'var(--ink)',textDecoration:'none',whiteSpace:'nowrap'}}>
              ↗ View Site
            </a>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-content">
          <Component onNavigate={handleNavChange}/>
        </div>
      </div>
    </div>
  );
}
