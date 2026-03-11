import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';

const MOCK_PRODUCTS = [
  { id:1,  name:'Tabby',        tagline:'Buy now, pay later for MENA shoppers', logo_emoji:'💳', industry:'Fintech',    country:'UAE',           status:'live' },
  { id:2,  name:'Noon Academy', tagline:'Social learning platform for students', logo_emoji:'📚', industry:'Edtech',     country:'Saudi Arabia',  status:'live' },
  { id:3,  name:'Vezeeta',      tagline:'Book doctors and healthcare services',  logo_emoji:'🏥', industry:'Healthtech', country:'Egypt',         status:'live' },
  { id:4,  name:'Baraka',       tagline:'Invest in global stocks from the GCC',  logo_emoji:'📈', industry:'Fintech',    country:'UAE',           status:'live' },
  { id:5,  name:'Tamara',       tagline:'BNPL shopping for Saudi consumers',     logo_emoji:'🛒', industry:'Fintech',    country:'Saudi Arabia',  status:'live' },
  { id:6,  name:'Kader AI',     tagline:'AI-powered job matching for MENA',      logo_emoji:'🤖', industry:'AI & ML',    country:'Jordan',        status:'soon' },
  { id:7,  name:'Trella',       tagline:'Digital freight marketplace in MENA',   logo_emoji:'🚛', industry:'Logistics',  country:'Egypt',         status:'live' },
  { id:8,  name:'Foodics',      tagline:'Restaurant management system for F&B',  logo_emoji:'🍽️', industry:'Foodtech',   country:'Saudi Arabia',  status:'live' },
  { id:9,  name:'Waffarha',     tagline:'Discount coupons and deals platform',   logo_emoji:'🎟️', industry:'E-Commerce', country:'Egypt',         status:'live' },
  { id:10, name:'Cura',         tagline:'Arabic mental health therapy online',   logo_emoji:'🧠', industry:'Healthtech', country:'Saudi Arabia',  status:'soon' },
];

export default function SearchDropdown({ query, onClose }) {
  const { profiles } = useUI();
  const navigate = useNavigate();

  if (!query.trim()) return null;

  const ql = query.toLowerCase();

  const prodMatches = MOCK_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(ql) ||
    p.tagline.toLowerCase().includes(ql) ||
    p.industry.toLowerCase().includes(ql)
  ).slice(0, 5);

  const profileMatches = Object.values(profiles).filter(p =>
    (p.name || '').toLowerCase().includes(ql) ||
    (p.handle || '').toLowerCase().includes(ql) ||
    (p.persona || '').toLowerCase().includes(ql)
  ).slice(0, 3);

  const totalProds = MOCK_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(ql) || p.tagline.toLowerCase().includes(ql) || p.industry.toLowerCase().includes(ql)
  ).length;

  if (!prodMatches.length && !profileMatches.length) {
    return (
      <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, boxShadow:'0 12px 48px rgba(0,0,0,.14)', zIndex:9999, overflow:'hidden' }}>
        <div style={{ padding:'20px 16px', textAlign:'center', fontSize:13, color:'#aaa' }}>No results for "<b>{query}</b>"</div>
      </div>
    );
  }

  return (
    <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, boxShadow:'0 12px 48px rgba(0,0,0,.14)', zIndex:9999, overflow:'hidden', maxHeight:440, overflowY:'auto' }}>
      {profileMatches.length > 0 && <>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', padding:'12px 16px 6px' }}>People</div>
        {profileMatches.map(p => (
          <div key={p.handle} onMouseDown={() => { navigate(`/u/${p.handle.replace('@','')}`); onClose(); }}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', transition:'background .1s' }}
            onMouseOver={e => e.currentTarget.style.background='#f8f8f8'}
            onMouseOut={e => e.currentTarget.style.background=''}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:13, fontWeight:900, flexShrink:0 }}>{p.avatar}</div>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a' }}>{p.name}{p.verified ? ' ✓' : ''}</div>
              <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{p.handle} · {p.persona}</div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'#f4f4f4', color:'#888', flexShrink:0 }}>{p.persona}</span>
          </div>
        ))}
        {prodMatches.length > 0 && <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>}
      </>}

      {prodMatches.length > 0 && <>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', padding:'12px 16px 6px' }}>Products</div>
        {prodMatches.map(p => (
          <div key={p.id} onMouseDown={() => { navigate(`/products/${p.id}`); onClose(); }}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', transition:'background .1s' }}
            onMouseOver={e => e.currentTarget.style.background='#f8f8f8'}
            onMouseOut={e => e.currentTarget.style.background=''}>
            <div style={{ width:36, height:36, borderRadius:10, background:'#f4f4f4', display:'grid', placeItems:'center', fontSize:18, flexShrink:0, border:'1px solid #eee' }}>{p.logo_emoji}</div>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a' }}>{p.name}</div>
              <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{p.industry} · {p.country}</div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, flexShrink:0, background:p.status==='soon'?'#fff8ed':'#eefbf3', color:p.status==='soon'?'#d97706':'#16a34a' }}>
              {p.status === 'soon' ? 'Soon' : 'Live'}
            </span>
          </div>
        ))}
        {totalProds > 5 && (
          <div onMouseDown={() => { navigate(`/products?q=${encodeURIComponent(query)}`); onClose(); }}
            style={{ padding:'10px 16px', fontSize:12, fontWeight:700, color:'var(--orange)', cursor:'pointer', textAlign:'center', borderTop:'1px solid #f0f0f0' }}
            onMouseOver={e => e.currentTarget.style.background='#fef5f3'}
            onMouseOut={e => e.currentTarget.style.background=''}>
            See all {totalProds} results for "{query}" →
          </div>
        )}
      </>}
    </div>
  );
}
