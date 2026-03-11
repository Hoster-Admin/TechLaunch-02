import React, { useEffect, useRef } from 'react';
import { useUI } from '../../context/UIContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPanel({ open, onClose }) {
  const { notifications, markAllRead, markOneRead } = useUI();
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleClick = (n, idx) => {
    markOneRead(idx);
    if (n.handle) navigate(`/u/${n.handle.replace('@', '')}`);
    if (n.type === 'product') navigate('/');
  };

  return (
    <div ref={panelRef} style={{
      position:'fixed', top:'calc(var(--nav-h) + 8px)', right:24, zIndex:9999,
      background:'#fff', border:'1px solid #e8e8e8', borderRadius:16,
      width:340, boxShadow:'0 12px 48px rgba(0,0,0,.15)', overflow:'hidden',
      animation:'modalIn .15s ease',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #f0f0f0' }}>
        <div style={{ fontSize:14, fontWeight:800 }}>Notifications</div>
        {notifications.some(n => n.unread) && (
          <button onClick={markAllRead} style={{ fontSize:11, fontWeight:700, color:'var(--orange)', background:'none', border:'none', cursor:'pointer' }}>
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight:400, overflowY:'auto' }}>
        {!notifications.length ? (
          <div style={{ padding:'40px 20px', textAlign:'center', fontSize:13, color:'#bbb' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🔔</div>
            You're all caught up! 🎉
          </div>
        ) : notifications.slice(0, 12).map((n, i) => (
          <div key={i} onClick={() => handleClick(n, i)}
            style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', borderBottom:'1px solid #f8f8f8', cursor:'pointer', background:n.unread ? '#fffaf9' : '#fff', transition:'background .1s' }}
            onMouseOver={e => e.currentTarget.style.background='#f8f8f8'}
            onMouseOut={e => e.currentTarget.style.background=n.unread ? '#fffaf9' : '#fff'}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--orange-light)', display:'grid', placeItems:'center', fontSize:16, flexShrink:0 }}>
              {n.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight: n.unread ? 700 : 500, color:'#1a1a1a', lineHeight:1.4 }}>{n.text}</div>
              <div style={{ fontSize:11, color:'#aaa', marginTop:3 }}>{n.time}</div>
            </div>
            {n.unread && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--orange)', flexShrink:0, marginTop:4 }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}
