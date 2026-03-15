import React, { useState, useRef, useEffect } from 'react';

export function SearchDD({ value, onChange, items, placeholder, renderItem, renderTrigger, matchFn }) {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); }};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = items.filter(i => matchFn ? matchFn(i, q) : JSON.stringify(i).toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', cursor:'pointer', fontSize:14, fontFamily:'Inter,sans-serif', color: value ? '#0a0a0a' : '#aaa', textAlign:'left', gap:8 }}>
        {renderTrigger(value)}
        <span style={{ fontSize:10, color:'#bbb', flexShrink:0 }}>▼</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
            style={{ width:'100%', padding:'10px 14px', border:'none', borderBottom:'1px solid #f0f0f0', fontFamily:'Inter,sans-serif', fontSize:13, outline:'none', background:'#fafafa', boxSizing:'border-box' }}/>
          <div style={{ maxHeight:230, overflowY:'auto' }}>
            {filtered.slice(0,80).map((item, i) => (
              <div key={i} onClick={() => { onChange(item); setOpen(false); setQ(''); }}
                style={{ padding:'9px 14px', fontSize:13, fontWeight:500, color:'#333', cursor:'pointer', background: item===value||item?.v===value?'#fff5f3':'transparent', transition:'background .1s' }}
                onMouseOver={e=>e.currentTarget.style.background='#fff5f3'}
                onMouseOut={e=>e.currentTarget.style.background=(item===value||item?.v===value)?'#fff5f3':'transparent'}>
                {renderItem(item)}
              </div>
            ))}
            {!filtered.length && <div style={{ padding:'14px', fontSize:12, color:'#bbb' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export const GlobeIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>;
export const XIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.745-8.867L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
export const LinkedInIcon= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
export const GitHubIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;

export const IconBox = ({ children }) => (
  <span style={{ width:44, minWidth:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', borderRight:'1px solid #f0f0f0', flexShrink:0 }}>
    {children}
  </span>
);

export function SectionHead({ icon, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 0 12px', borderBottom:'2px solid #f4f4f4', marginBottom:20 }}>
      <div style={{ width:32, height:32, borderRadius:10, background:'var(--orange-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:'.07em', color:'#0a0a0a' }}>{title}</div>
    </div>
  );
}

export function AvatarCircleS({ u, size=30 }) {
  const colors = ['#FF6B35','#E63946','#457B9D','#2A9D8F','#E9C46A','#7B2D8B'];
  const bg = u.avatar_color || colors[(u.handle||'').charCodeAt(0) % colors.length] || '#FF6B35';
  const initials = (u.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if (u.avatar_url) return <img src={u.avatar_url} style={{ width:size,height:size,borderRadius:'50%',objectFit:'cover' }} alt={u.name}/>;
  return <div style={{ width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:800,color:'#fff',flexShrink:0 }}>{initials}</div>;
}
