import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, productsAPI } from '../../utils/api';
import { useUI } from '../../context/UIContext';

export default function BookmarksTab() {
  const navigate = useNavigate();
  const { toggleBookmark } = useUI();
  const [items, setItems]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.bookmarks()
      .then(r => setItems(r.data?.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = (id) => {
    toggleBookmark(id);
    try { productsAPI.bookmark(id); } catch {}
    setItems(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px', color:'#bbb', fontSize:14 }}>
        Loading…
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <div style={{ fontSize:44, marginBottom:14 }}>🔖</div>
        <div style={{ fontWeight:700, fontSize:15, color:'#222', marginBottom:8 }}>No bookmarks yet</div>
        <div style={{ fontSize:13, color:'#999' }}>
          Click the bookmark icon on any product or company to save it here.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:700, marginBottom:18, color:'#111' }}>Bookmarks</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {items.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/products/${p.slug || p.id}`)}
            style={{
              display:'flex', alignItems:'center', gap:14,
              background:'#fff', border:'1px solid #eee', borderRadius:12,
              padding:'12px 16px', cursor:'pointer', transition:'box-shadow .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{
              width:44, height:44, borderRadius:10, background:'#f5f5f5',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, flexShrink:0, overflow:'hidden',
            }}>
              {p.logo_url || p.icon_url
                ? <img src={p.logo_url || p.icon_url} alt={p.name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none'; }}/>
                : (p.logo_emoji || '🚀')
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#111', marginBottom:2 }}>{p.name}</div>
              <div style={{ fontSize:12, color:'#777', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {p.tagline || p.description}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleRemove(p.id); }}
              title="Remove bookmark"
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--orange)', padding:6, flexShrink:0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
