import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import NotificationsPanel from '../home/NotificationsPanel';
import SearchDropdown from '../home/SearchDropdown';
import toast from 'react-hot-toast';

const PERSONA_ICONS = {
  Founder:'🚀', Investor:'💰', Builder:'⚡', startup:'🚀',
  'Product Manager':'🧠', Accelerator:'🏢', investor:'💰',
  Enthusiast:'⭐', 'Venture Studio':'🏗️', pm:'🧠', enthusiast:'⭐',
  accelerator:'🏢',
};
const PERSONA_MAP = {
  founder:'Founder', investor:'Investor', builder:'Builder',
  pm:'Product Manager', accelerator:'Accelerator', startup:'Startup',
  enthusiast:'Enthusiast', venture:'Venture Studio',
  'product manager':'Product Manager', 'venture studio':'Venture Studio',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, setSubmitOpen, setInboxOpen, setAuthModal, searchQuery, setSearchQuery } = useUI();
  const navigate = useNavigate();
  const [listOpen,    setListOpen]    = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const listRef    = useRef(null);
  const userRef    = useRef(null);
  const avatarRef  = useRef(null);
  const searchRef  = useRef(null);
  const searchWrap = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (listRef.current && !listRef.current.contains(e.target)) setListOpen(false);
      if (userRef.current && !userRef.current.contains(e.target) &&
          avatarRef.current && !avatarRef.current.contains(e.target)) setUserOpen(false);
      if (searchWrap.current && !searchWrap.current.contains(e.target)) setSearchFocus(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setUserOpen(false);
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    const handle = (user?.handle || '').replace('@', '');
    navigator.clipboard?.writeText(`tlmena.com/${handle}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const rawPersona = user?.persona || 'enthusiast';
  const personaLabel = PERSONA_MAP[rawPersona.toLowerCase()] || (rawPersona.charAt(0).toUpperCase() + rawPersona.slice(1));
  const personaIcon  = PERSONA_ICONS[rawPersona.toLowerCase()] || PERSONA_ICONS[personaLabel] || '⭐';
  const handle = (user?.handle || '').replace('@', '');

  const handleBellClick = () => {
    if (!user) { setAuthModal('login'); return; }
    setNotifOpen(o => !o);
    setUserOpen(false);
  };

  const handleSubmit = () => {
    if (user) setSubmitOpen(true);
    else setAuthModal('signup');
  };

  return (
    <>
      <nav>
        <div className="nav-left">
          <Link to="/" className="logo">
            <span className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6"  y1="20" x2="6"  y2="14"/>
              </svg>
            </span>
            <span className="logo-en" style={{ fontSize:18, fontWeight:800, letterSpacing:'-.03em', color:'var(--black)' }}>Tech Launch</span>
          </Link>

          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>

            <div className="nav-dropdown" ref={listRef}>
              <button className="nav-link dropdown-trigger" onClick={() => setListOpen(v => !v)}>
                List <span style={{ fontSize: 10, marginLeft: 2 }}>▼</span>
              </button>
              <div className={`dropdown-menu ${listOpen ? 'open' : ''}`}>
                {[
                  { icon:'🔍', label:'All Products',            desc:'Search every product on the platform',   path:'/products' },
                  { icon:'🌍', label:'Directory',               desc:'Browse by industry or country',          path:'/directory' },
                  { icon:'🏢', label:'Accelerators',            desc:'Find accelerators and programs',         path:'/accelerators' },
                  null,
                  { icon:'🚀', label:'Startup',                 desc:'Submit and showcase your product',       path:'/list/startup' },
                  { icon:'🏢', label:'Accelerator / Incubator', desc:'List your program and find startups',    path:'/list/accelerator' },
                  { icon:'💰', label:'Investment Firm',         desc:'Discover MENA deals and founders',       path:'/list/investor' },
                  { icon:'🎯', label:'Venture Studio',          desc:'Build and co-found startups',            path:'/list/venture' },
                ].map((item, i) => item === null
                  ? <div key={i} style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>
                  : (
                    <div key={i} className="dropdown-item" onClick={() => { navigate(item.path); setListOpen(false); }}>
                      <span className="dropdown-icon">{item.icon}</span>
                      <div>
                        <div className="dropdown-label">{item.label}</div>
                        <div className="dropdown-desc">{item.desc}</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Centre search */}
        <div ref={searchWrap} style={{ flex:1, display:'flex', justifyContent:'center', padding:'0 16px', maxWidth:420, margin:'0 auto', position:'relative' }}>
          <div style={{ position:'relative', width:'100%' }}>
            <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', zIndex:1 }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products, people…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setSearchQuery(''); setSearchFocus(false); searchRef.current?.blur(); }
                if (e.key === 'Enter' && searchQuery.trim()) { navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`); setSearchFocus(false); }
              }}
              style={{ width:'100%', padding:'9px 36px', borderRadius:20, border:`1.5px solid ${searchFocus?'var(--orange)':'#ebebeb'}`, fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', background:searchFocus?'#fff':'#f8f8f8', color:'#0a0a0a', transition:'all .15s' }}
            />
            {searchQuery && (
              <span onClick={() => { setSearchQuery(''); setSearchFocus(false); }} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:14, color:'#aaa', zIndex:1 }}>✕</span>
            )}
            {searchFocus && searchQuery.trim().length > 0 && (
              <SearchDropdown query={searchQuery} onClose={() => { setSearchFocus(false); setSearchQuery(''); }}/>
            )}
          </div>
        </div>

        {/* Right nav */}
        <div className="nav-right">
          {user ? (
            <>
              <button className="btn-nav-primary" onClick={() => setSubmitOpen(true)}>+ Submit Product</button>

              {/* Bell */}
              <div className="nav-bell-wrap" onClick={handleBellClick} title="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>

              {/* Avatar */}
              <div ref={avatarRef} className="user-avatar"
                style={{ background:user.avatar_color||'var(--orange)', cursor:'pointer' }}
                onClick={() => setUserOpen(v => !v)}>
                {initials}
              </div>

              {userOpen && (
                <div ref={userRef} className="user-menu open" style={{ minWidth:260 }}>
                  <div style={{ padding:'14px 14px 12px', borderBottom:'1px solid #f0f0f0' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:10 }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:user.avatar_color||'var(--orange)', color:'#fff', fontSize:16, fontWeight:900, display:'grid', placeItems:'center', flexShrink:0 }}>
                        {initials}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:'#0a0a0a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {user.name || '—'}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'var(--orange)' }}>@{handle || '—'}</span>
                          <button onClick={handleCopy}
                            style={{ padding:'2px 7px', borderRadius:5, background:'#fceee9', border:'none', cursor:'pointer', fontSize:10, fontWeight:700, color:'var(--orange)', display:'flex', alignItems:'center', gap:3 }}>
                            {copied ? '✓ Copied!' : (
                              <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fceee9', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:'var(--orange)' }}>
                      {personaIcon} {personaLabel}
                    </div>
                  </div>
                  <div style={{ padding:'6px 6px 4px' }}>
                    {[
                      { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, label:'Public Profile', action:() => { navigate(`/u/${handle}`); setUserOpen(false); } },
                      { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>, label:'Bookmarks', action:() => { navigate('/bookmarks'); setUserOpen(false); } },
                      { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, label:'Settings', action:() => { navigate('/settings'); setUserOpen(false); } },
                    ].map(item => (
                      <div key={item.label} className="user-menu-item" onClick={item.action}
                        style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {item.icon} {item.label}
                      </div>
                    ))}
                    <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>
                    <div className="user-menu-item danger" onClick={handleLogout}
                      style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <button className="btn-nav-ghost" onClick={() => setAuthModal('login')}>Sign In</button>
              <button className="btn-nav-primary" onClick={handleSubmit}>Submit Product</button>
            </>
          )}
        </div>
      </nav>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)}/>
    </>
  );
}
