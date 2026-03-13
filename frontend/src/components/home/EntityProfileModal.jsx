import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

const TYPE_COLOR = {
  'Accelerator':    { bg:'#f5f3ff', color:'#7c3aed' },
  'Investor':       { bg:'#eff6ff', color:'#2563eb' },
  'Venture Studio': { bg:'#f0fdf4', color:'#059669' },
  'Startup':        { bg:'var(--orange-light)', color:'var(--orange)' },
};

const TYPE_HIGHLIGHTS = {
  'Accelerator': [
    '🚀 Hands-on mentorship from top MENA founders',
    '💰 Seed funding & non-dilutive grants available',
    '🌍 Regional network spanning 15+ MENA countries',
    '📈 Proven track record of scaling startups',
    '🤝 Access to 500+ investor connections',
  ],
  'Investor': [
    '💼 Active portfolio across key MENA verticals',
    '🌍 Deep regional expertise and local market access',
    '⚡ Fast deal cycles — decision in under 4 weeks',
    '🔗 Strategic connections to corporates & LPs',
    '🧭 Hands-on support beyond the cheque',
  ],
  'Venture Studio': [
    '🏗️ Build-to-scale model from day zero',
    '👥 Dedicated operational & engineering team',
    '💡 Proprietary deal flow & thesis-driven ideas',
    '🌍 MENA-first with global expansion playbook',
    '📊 Data-driven iteration and product validation',
  ],
  'Startup': [
    '🚀 Purpose-built for the MENA market',
    '⚡ Fast, reliable, and easy to use',
    '🌍 Supports Arabic & English',
    '🔒 Enterprise-grade security',
    '💬 Responsive local support team',
  ],
};

export default function EntityProfileModal() {
  const { entityModal, setEntityModal, openDM } = useUI();
  const { user } = useAuth();
  const [followed, setFollowed] = useState(false);
  const [copied,   setCopied]   = useState(false);

  if (!entityModal) return null;
  const e = entityModal;

  const handleOverlay = ev => { if (ev.target === ev.currentTarget) setEntityModal(null); };
  const tc = TYPE_COLOR[e.type] || { bg:'var(--orange-light)', color:'var(--orange)' };
  const highlights = TYPE_HIGHLIGHTS[e.type] || TYPE_HIGHLIGHTS['Startup'];

  const tags = [
    e.country && `${e.flag||''} ${e.country}`.trim(),
    e.stage   && e.stage,
    e.industry && e.industry,
  ].filter(Boolean);

  const handleFollow = () => setFollowed(f => !f);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href + '#entity-' + (e.id||'')).catch(()=>{});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const stats = [
    { val: e.portfolio_count || e.portfolio || e.alumni || e.companies, lbl: e.type==='Accelerator' ? 'Cohort Alumni' : 'Portfolio Cos', emoji:'📦', bg:'#f0fdf4', color:'#059669' },
    { val: e.founded_year    || e.founded,  lbl: 'Founded',      emoji:'📅', bg:'#eff6ff', color:'#2563eb' },
    { val: e.aum,                            lbl: 'AUM',          emoji:'💰', bg:'var(--orange-light)', color:'var(--orange)' },
    { val: e.employees,                      lbl: 'Team Size',    emoji:'👥', bg:'#f5f3ff', color:'#7c3aed' },
  ].filter(s => s.val);

  const industries = Array.isArray(e.industries) ? e.industries
    : Array.isArray(e.focus) ? e.focus : null;

  const logo = e.logo_emoji || e.logo || e.icon || '🏢';

  return (
    <div onClick={handleOverlay} style={{
      position:'fixed', inset:0, zIndex:2200,
      background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px', overflowY:'auto',
    }}>
      <div style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:860,
        maxHeight:'90vh', overflowY:'auto', position:'relative',
        boxShadow:'0 24px 80px rgba(0,0,0,.2)',
        animation:'modalIn .2s ease',
      }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:'40px 32px 60px' }}>

          {/* Close / Back */}
          <button onClick={() => setEntityModal(null)}
            style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:14, fontWeight:700, color:'#666', cursor:'pointer', marginBottom:32, border:'none', background:'transparent', transition:'color .15s' }}
            onMouseOver={e=>e.currentTarget.style.color='var(--orange)'} onMouseOut={e=>e.currentTarget.style.color='#666'}>
            ← Back
          </button>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, marginBottom:16 }}>
            <div style={{ width:72, height:72, borderRadius:20, background:'#f5f5f5', border:'1px solid #e8e8e8', display:'grid', placeItems:'center', fontSize:34, flexShrink:0 }}>
              {logo}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-.03em', margin:0 }}>{e.name}</h1>
                {e.verified && (
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:99, background:'var(--orange-light)', color:'var(--orange)' }}>✓ Verified</span>
                )}
              </div>
              <p style={{ fontSize:15, color:'#555', margin:0, lineHeight:1.5 }}>
                {e.tagline || e.description || `${e.type} based in ${e.country||'MENA'}`}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
            {e.type && (
              <span style={{ fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:5, background:tc.bg, color:tc.color }}>{e.type}</span>
            )}
            {tags.map((t,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:5, background:'#f4f4f4', color:'#555' }}>{t}</span>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:36, paddingBottom:36, borderBottom:'1px solid #f0f0f0' }}>
            {e.website && (
              <a href={e.website.startsWith('http') ? e.website : 'https://'+e.website}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', transition:'opacity .15s' }}
                onMouseOver={ev=>ev.currentTarget.style.opacity='.88'} onMouseOut={ev=>ev.currentTarget.style.opacity='1'}>
                Visit Website 🔗
              </a>
            )}
            <button onClick={handleFollow}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:`1.5px solid ${followed?'var(--orange)':'#e8e8e8'}`, background:followed?'var(--orange-light)':'#fff', color:followed?'var(--orange)':'#0a0a0a', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
              {followed ? '✓ Following' : '＋ Follow'}
            </button>
            {e.contact && (
              <button onClick={() => { setEntityModal(null); openDM(e.contact, e.name, logo); }}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#fff', color:'#0a0a0a', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                💬 Contact
              </button>
            )}
            <button onClick={handleShare}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#fff', color:'#666', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {copied ? '✓ Copied!' : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share</>}
            </button>
          </div>

          {/* Visual stats carousel — same 3-card layout as product screenshots */}
          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:20, marginBottom:36, scrollbarWidth:'none' }}>
            {/* Card 1 — dark branded */}
            <div style={{ minWidth:240, height:150, borderRadius:14, background:'linear-gradient(135deg,#0a0a0a,#1a1a1a)', border:'1px solid #e8e8e8', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:tc.color, display:'grid', placeItems:'center', fontSize:26 }}>{logo}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{e.name}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.45)' }}>{e.type} · {e.country||'MENA'}</div>
            </div>
            {/* Card 2 — stats grid */}
            {stats.length > 0 ? (
              <div style={{ minWidth:240, height:150, borderRadius:14, background:'#f8f8f8', border:'1px solid #e8e8e8', flexShrink:0, padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, alignContent:'center' }}>
                {stats.slice(0,4).map((s,i) => (
                  <div key={i} style={{ background:'#fff', borderRadius:10, padding:'10px 12px', border:'1px solid #f0f0f0' }}>
                    <div style={{ fontSize:15, fontWeight:900, color:'#0a0a0a' }}>{s.val}</div>
                    <div style={{ fontSize:10, color:'#aaa', fontWeight:600, marginTop:1 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ minWidth:240, height:150, borderRadius:14, background:'#f8f8f8', border:'1px solid #e8e8e8', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
                <div style={{ fontSize:32 }}>{logo}</div>
                <div style={{ fontSize:11, color:'#aaa', fontWeight:600 }}>{e.type}</div>
              </div>
            )}
            {/* Card 3 — industry focus / highlight */}
            <div style={{ minWidth:240, height:150, borderRadius:14, background:`linear-gradient(135deg,${tc.bg},#fff)`, border:`1.5px solid ${tc.color}22`, flexShrink:0, padding:16, display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
              <div style={{ fontSize:11, fontWeight:800, color:tc.color, letterSpacing:'.06em', textTransform:'uppercase' }}>{e.type}</div>
              {e.verified && <div style={{ fontSize:12, fontWeight:700, color:'#0a0a0a' }}>✓ Verified Entity</div>}
              {industries?.slice(0,3).map((ind,i) => (
                <div key={i} style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#fff', color:tc.color, display:'inline-block', width:'fit-content', border:`1px solid ${tc.color}33` }}>{ind}</div>
              ))}
              {!industries && e.stage && (
                <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a' }}>Stage: {e.stage}</div>
              )}
            </div>
          </div>

          {/* About */}
          {(e.about || e.description) && (
            <div style={{ marginBottom:36 }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:14 }}>About</div>
              <div style={{ fontSize:15, color:'#333', lineHeight:1.8 }}>
                {(e.about || e.description).split('\n\n').map((para, i) => (
                  <p key={i} style={{ margin:'0 0 16px' }}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 highlights (same format as product "Top 5 Reasons") */}
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:14 }}>
              🎯 Why {e.name}?
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {highlights.map((h, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, background:'#f8f8f8', borderRadius:14, padding:'14px 18px' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:tc.color, color:'#fff', fontSize:12, fontWeight:900, display:'grid', placeItems:'center', flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1a1a1a', lineHeight:1.5 }}>{h}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Focus */}
          {industries && industries.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:14 }}>Industry Focus</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {industries.map((ind, i) => (
                  <span key={i} style={{ fontSize:13, fontWeight:700, padding:'7px 14px', borderRadius:99, background:tc.bg, color:tc.color }}>{ind}</span>
                ))}
              </div>
            </div>
          )}

          {/* Programs */}
          {Array.isArray(e.programs) && e.programs.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:14 }}>🎁 Programs</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {e.programs.map((pr, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14, background:'#f8f8f8', borderRadius:14, padding:'14px 18px', border:'1px solid #f0f0f0' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'#f0f0f0', display:'grid', placeItems:'center', flexShrink:0, fontSize:14 }}>🎓</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#0a0a0a' }}>{pr.name}</div>
                      {pr.duration && <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{pr.duration}{pr.equity ? ` · ${pr.equity}` : ''}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
