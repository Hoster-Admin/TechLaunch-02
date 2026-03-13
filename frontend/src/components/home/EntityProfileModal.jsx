import React from 'react';
import { useUI } from '../../context/UIContext';

const TYPE_COLORS = {
  'Accelerator':    { bg:'#f5f3ff', color:'#7c3aed' },
  'Investor':       { bg:'#eff6ff', color:'#2563eb' },
  'Venture Studio': { bg:'#f0fdf4', color:'#059669' },
  'Startup':        { bg:'var(--orange-light)', color:'var(--orange)' },
};

export default function EntityProfileModal() {
  const { entityModal, setEntityModal, openDM } = useUI();
  if (!entityModal) return null;
  const e = entityModal;

  const handleOverlay = (ev) => { if (ev.target === ev.currentTarget) setEntityModal(null); };
  const tc = TYPE_COLORS[e.type] || { bg:'var(--orange-light)', color:'var(--orange)' };

  const stats = [
    e.portfolio  && { val: e.portfolio,  lbl: 'Portfolio Cos' },
    e.alumni     && { val: e.alumni,     lbl: 'Alumni' },
    e.companies  && { val: e.companies,  lbl: 'Companies' },
    e.employees  && { val: e.employees,  lbl: 'Team Size' },
    e.founded    && { val: e.founded,    lbl: 'Founded' },
    e.aum        && { val: e.aum,        lbl: 'AUM' },
    e.checkSize  && { val: e.checkSize,  lbl: 'Check Size' },
    e.portfolio_count && { val: e.portfolio_count, lbl: 'Portfolio Cos' },
    e.founded_year    && { val: e.founded_year,    lbl: 'Founded' },
  ].filter(Boolean);

  const industries = Array.isArray(e.industries) ? e.industries
    : (Array.isArray(e.focus) ? e.focus : null);

  return (
    <div onClick={handleOverlay} style={{
      position:'fixed', inset:0, zIndex:2200,
      background:'rgba(0,0,0,.55)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:560,
        maxHeight:'90vh', overflowY:'auto', position:'relative',
        boxShadow:'0 24px 80px rgba(0,0,0,.18)',
        animation:'modalIn .2s ease',
      }}>
        {/* Close button */}
        <button onClick={() => setEntityModal(null)} style={{
          position:'absolute', top:16, right:16, zIndex:10,
          width:30, height:30, borderRadius:8,
          border:'1.5px solid #e8e8e8', background:'#fff',
          cursor:'pointer', fontSize:14, color:'#555',
          display:'grid', placeItems:'center', lineHeight:1,
        }}>✕</button>

        {/* Header — white */}
        <div style={{ padding:'28px 28px 20px', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
            {/* Logo */}
            <div style={{
              width:64, height:64, borderRadius:16,
              background:'#f4f4f4', border:'1.5px solid #ebebeb',
              display:'grid', placeItems:'center',
              fontSize:32, flexShrink:0,
            }}>
              {e.logo_emoji || e.logo || e.icon || '🏢'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              {/* Name + verified */}
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                <span style={{ fontSize:22, fontWeight:900, letterSpacing:'-.02em', color:'#0A0A0A' }}>
                  {e.name}
                </span>
                {e.verified && (
                  <span style={{
                    fontSize:11, fontWeight:700,
                    color:'var(--orange)', background:'var(--orange-light)',
                    padding:'3px 9px', borderRadius:99,
                  }}>✓ Verified</span>
                )}
              </div>
              {/* Subtitle */}
              {(e.tagline || e.description) && (
                <div style={{ fontSize:13, color:'#888', marginTop:0 }}>
                  {e.tagline || e.description}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {e.type && (
              <span style={{ fontSize:12, fontWeight:700, padding:'4px 11px', borderRadius:99, background:tc.bg, color:tc.color }}>
                {e.type}
              </span>
            )}
            {e.country && (
              <span style={{ fontSize:12, fontWeight:600, padding:'4px 11px', borderRadius:99, background:'#f4f4f4', color:'#555' }}>
                {e.flag} {e.country}
              </span>
            )}
            {e.stage && (
              <span style={{ fontSize:12, fontWeight:600, padding:'4px 11px', borderRadius:99, background:'#f4f4f4', color:'#555' }}>
                {e.stage}
              </span>
            )}
            {e.industry && (
              <span style={{ fontSize:12, fontWeight:600, padding:'4px 11px', borderRadius:99, background:'#f4f4f4', color:'#555' }}>
                {e.industry}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:22 }}>

          {/* About */}
          {(e.about || e.description) && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>About</div>
              <p style={{ fontSize:14, color:'#444', lineHeight:1.75, margin:0 }}>{e.about || e.description}</p>
            </div>
          )}

          {/* Key Facts — stat boxes */}
          {stats.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Key Facts</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:10 }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ background:'#fafafa', borderRadius:12, padding:'14px 16px', border:'1px solid #f0f0f0' }}>
                    <div style={{ fontSize:19, fontWeight:900, letterSpacing:'-.02em', color:'#0A0A0A' }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'#aaa', fontWeight:600, marginTop:2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Industry Focus */}
          {industries && industries.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>🎯 Industry Focus</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {industries.map((ind, i) => (
                  <span key={i} style={{ fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:99, background:'var(--orange-light)', color:'var(--orange)' }}>{ind}</span>
                ))}
              </div>
            </div>
          )}

          {/* Programs */}
          {Array.isArray(e.programs) && e.programs.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>🎁 Programs</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {e.programs.map((p, i) => (
                  <div key={i} style={{ padding:'12px 14px', background:'#fafafa', borderRadius:12, border:'1px solid #f0f0f0' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0A0A0A' }}>{p.name}</div>
                    {p.duration && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{p.duration}{p.equity ? ` · ${p.equity}` : ''}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links & Actions */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {e.website && (
              <a href={e.website.startsWith('http') ? e.website : 'https://'+e.website}
                target="_blank" rel="noopener noreferrer"
                style={{ flex:1, minWidth:140, padding:'12px 16px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', textDecoration:'none', textAlign:'center', transition:'opacity .15s' }}
                onMouseOver={ev => ev.currentTarget.style.opacity='.88'}
                onMouseOut={ev => ev.currentTarget.style.opacity='1'}>
                🌐 Visit Website
              </a>
            )}
            {e.contact && (
              <button onClick={() => { setEntityModal(null); openDM(e.contact, e.name, e.logo_emoji || e.logo || '🏢'); }}
                style={{ flex:1, minWidth:140, padding:'12px 16px', borderRadius:12, background:'#f4f4f4', color:'#555', border:'1.5px solid #ebebeb', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                💬 Contact
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
