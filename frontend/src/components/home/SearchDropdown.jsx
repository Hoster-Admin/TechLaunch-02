import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserAvatar({ user, size = 36 }) {
  const initials = (user.name || user.handle || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  if (user.avatar_url && (user.avatar_url.startsWith('http') || user.avatar_url.startsWith('data:'))) {
    return (
      <img src={user.avatar_url} alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: user.avatar_color || 'var(--orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 900, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function SearchDropdown({ query, onClose }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setProducts([]); setUsers([]); return; }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [prodRes, userRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(q)}&status=all&limit=5`),
          fetch(`/api/users?search=${encodeURIComponent(q)}&limit=5`),
        ]);
        const [prodJson, userJson] = await Promise.all([prodRes.json(), userRes.json()]);
        setProducts(prodJson.success ? prodJson.data || [] : []);
        setUsers(userJson.success ? userJson.data || [] : []);
      } catch {
        setProducts([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  if (!query.trim()) return null;

  const dropStyle = {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
    background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16,
    boxShadow: '0 12px 48px rgba(0,0,0,.14)', zIndex: 9999,
    overflow: 'hidden', maxHeight: 440, overflowY: 'auto',
  };

  if (loading) {
    return (
      <div style={dropStyle}>
        <div style={{ padding: '18px 16px', textAlign: 'center', fontSize: 13, color: '#aaa' }}>Searching…</div>
      </div>
    );
  }

  if (!products.length && !users.length) {
    return (
      <div style={dropStyle}>
        <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: '#aaa' }}>
          No results for "<b>{query}</b>"
        </div>
      </div>
    );
  }

  return (
    <div style={dropStyle}>
      {users.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#aaa', padding: '12px 16px 6px' }}>People</div>
          {users.map(u => (
            <div key={u.id} onMouseDown={() => { navigate(`/u/${(u.handle || '').replace('@', '')}`); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background .1s' }}
              onMouseOver={e => e.currentTarget.style.background = '#f8f8f8'}
              onMouseOut={e => e.currentTarget.style.background = ''}>
              <div style={{ flexShrink: 0 }}>
                <UserAvatar user={u} size={36} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>
                  {u.name || u.handle}
                  {u.verified ? <span style={{ color: '#2563eb', marginLeft: 4 }}>✓</span> : null}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>@{(u.handle || '').replace('@', '')} · {u.persona}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#f4f4f4', color: '#888', flexShrink: 0 }}>{u.persona}</span>
            </div>
          ))}
          {products.length > 0 && <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />}
        </>
      )}

      {products.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#aaa', padding: '12px 16px 6px' }}>Products</div>
          {products.map(p => (
            <div key={p.id} onMouseDown={() => { navigate(`/products/${p.id}`); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background .1s' }}
              onMouseOver={e => e.currentTarget.style.background = '#f8f8f8'}
              onMouseOut={e => e.currentTarget.style.background = ''}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f4f4f4', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0, border: '1px solid #eee', overflow: 'hidden' }}>
                {p.logo_url && (p.logo_url.startsWith('http') || p.logo_url.startsWith('data:'))
                  ? <img src={p.logo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : (p.logo_emoji || '🚀')
                }
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{p.industry} · {Array.isArray(p.countries) ? p.countries[0] : p.country}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0, background: p.status === 'soon' ? '#fff8ed' : '#eefbf3', color: p.status === 'soon' ? '#d97706' : '#16a34a' }}>
                {p.status === 'soon' ? 'Soon' : 'Live'}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
