import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import LogoPlaceholder from '../../components/common/LogoPlaceholder';
import { useUI } from '../../context/UIContext';
import { usersAPI, productsAPI } from '../../utils/api';

export default function BookmarksPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useUI();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    usersAPI.bookmarks()
      .then(r => setItems(r.data?.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleRemove = (id) => {
    toggleBookmark(id);
    try { productsAPI.bookmark(id); } catch {}
    setItems(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px 80px' }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:20 }}>Bookmarks</div>

          {loading ? (
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'80px 40px', textAlign:'center', color:'#ccc', fontSize:14 }}>
              Loading…
            </div>
          ) : !user ? (
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'80px 40px', textAlign:'center' }}>
              <div style={{ fontSize:13, color:'#bbb', marginBottom:16 }}>Sign in to see your bookmarks</div>
              <button onClick={onSignIn} style={{ padding:'10px 24px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Sign In</button>
            </div>
          ) : items.length === 0 ? (
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'80px 40px', textAlign:'center', color:'#bbb', fontSize:14 }}>
              No bookmarks yet
            </div>
          ) : (
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden' }}>
              {items.map((p, i) => (
                <div key={p.id}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom: i < items.length - 1 ? '1px solid #f4f4f4' : 'none', cursor:'pointer' }}
                  onClick={() => navigate(`/products/${p.id}`)}>
                  {p.logo_url
                    ? <div style={{ width:40, height:40, borderRadius:10, overflow:'hidden', flexShrink:0, border:'1px solid #eee' }}><img src={p.logo_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /></div>
                    : <LogoPlaceholder name={p.name} size={40} radius={10} />
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{p.name}</div>
                    <div style={{ fontSize:12, color:'#888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.tagline}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleRemove(p.id); }}
                    title="Remove bookmark"
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--orange)', padding:6, flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}
