import React from 'react';
import { useUI } from '../../context/UIContext';

export default function EntityProfileModal() {
  const { entityModal, setEntityModal, openDM } = useUI();
  if (!entityModal) return null;
  const e = entityModal;

  const handleOverlay = (ev) => { if (ev.target === ev.currentTarget) setEntityModal(null); };

  const badgeColor = {
    'Accelerator':'#7c3aed', 'Investor':'#2563eb', 'Venture Studio':'#059669', 'Startup':'var(--orange)'
  }[e.type] || 'var(--orange)';
  const badgeBg = {
    'Accelerator':'#f5f3ff', 'Investor':'#eff6ff', 'Venture Studio':'#f0fdf4', 'Startup':'var(--orange-light)'
  }[e.type] || 'var(--orange-light)';

  return (
    <div onClick={handleOverlay} style={{ position:'fixed', inset:0, zIndex:2200, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%)', padding:'32px 32px 24px', position:'relative' }}>
          <button onClick={() => setEntityModal(null)} style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', cursor:'pointer', fontSize:15, color:'rgba(255,255,255,.7)', display:'grid', placeItems:'center' }}>✕</button>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:16, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', display:'grid', placeItems:'center', fontSize:28, flexShrink:0 }}>{e.logo || e.icon || '🏢'}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{e.name}</div>
                {e.verified && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.7)' }}>✓ Verified</span>}
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.5, marginBottom:10 }}>{e.tagline || e.description}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:badgeBg, color:badgeColor }}>{e.type}</span>
                {e.country && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)' }}>{e.flag} {e.country}</span>}
                {e.stage && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)' }}>{e.stage}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {(e.portfolio || e.alumni || e.companies || e.founded) && (
          <div style={{ display:'flex', padding:'20px 32px', borderBottom:'1px solid #f0f0f0', gap:24, flexWrap:'wrap' }}>
            {[
              e.portfolio && { num: e.portfolio, label:'Portfolio' },
              e.alumni && { num: e.alumni, label:'Alumni' },
              e.companies && { num: e.companies, label:'Companies' },
              e.checkSize && { num: e.checkSize, label:'Check Size' },
              e.founded && { num: e.founded, label:'Founded' },
              e.industries && { num: e.industries.length || e.industries, label:'Industries' },
            ].filter(Boolean).map((s,i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, color:'#0a0a0a' }}>{s.num}</div>
                <div style={{ fontSize:11, color:'#aaa', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding:'24px 32px 28px' }}>
          {e.about && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>About</div>
            <p style={{ fontSize:13, color:'#555', lineHeight:1.7, marginBottom:20 }}>{e.about}</p>
          </>}

          {e.industries && Array.isArray(e.industries) && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Industries</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
              {e.industries.map((ind,i) => <span key={i} style={{ fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20, background:'#f4f4f4', color:'#555' }}>{ind}</span>)}
            </div>
          </>}

          {Array.isArray(e.entity_tags) && e.entity_tags.length > 0 && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Tags</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
              {e.entity_tags.map(t => (
                <span key={t.id} style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20, background:t.color||'#f4f4f4', color:t.text_color||'#555' }}>{t.name}</span>
              ))}
            </div>
          </>}

          {Array.isArray(e.programs) && e.programs.length > 0 && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Programs</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {e.programs.map((p,i) => (
                <div key={i} style={{ padding:'12px 14px', background:'#f8f8f8', borderRadius:12, border:'1px solid #eee' }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{p.name}</div>
                  {p.duration && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{p.duration}{p.equity ? ` · ${p.equity}` : ''}</div>}
                </div>
              ))}
            </div>
          </>}

          {e.links && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
              {e.links.map((l,i) => (
                <a key={i} href={l.url || '#'} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:12, fontWeight:700, color:'#555', textDecoration:'none', transition:'all .15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.color='#555'; }}>
                  {l.icon || '🔗'} {l.label}
                </a>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            {e.website && (
              <a href={e.website.startsWith('http')?e.website:'https://'+e.website} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, padding:'12px 16px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', textDecoration:'none', textAlign:'center', transition:'opacity .15s' }}
                onMouseOver={ev => ev.currentTarget.style.opacity='.88'} onMouseOut={ev => ev.currentTarget.style.opacity='1'}>
                🌐 Visit Website
              </a>
            )}
            {e.contact && (
              <button onClick={() => { setEntityModal(null); openDM(e.contact, e.name, e.logo || '🏢'); }}
                style={{ flex:1, padding:'12px 16px', borderRadius:12, background:'#f4f4f4', color:'#555', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                💬 Contact
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
