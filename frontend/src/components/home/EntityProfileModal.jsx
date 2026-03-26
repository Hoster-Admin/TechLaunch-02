import React from 'react';
import { useUI } from '../../context/UIContext';

function EntityLogo({ entity, size = 64 }) {
  const src = entity?.logo_url;
  const emoji = entity?.logo_emoji;
  const initials = (entity?.name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colors = ['#E15033','#2563eb','#7c3aed','#16a34a','#d97706'];
  const color = colors[(entity?.name?.charCodeAt(0) || 0) % colors.length];
  if (src && (src.startsWith('http') || src.startsWith('data:'))) {
    return <img src={src} alt={entity?.name} style={{ width:'100%', height:'100%', objectFit:'contain' }}
      onError={ev => { ev.target.style.display='none'; ev.target.nextSibling.style.display='flex'; }} />;
  }
  if (emoji && emoji !== '🏢') return <span style={{ fontSize: size * 0.44 }}>{emoji}</span>;
  return <span style={{ fontSize: size * 0.32, fontWeight:800, color, letterSpacing:'-0.5px' }}>{initials}</span>;
}

export default function EntityProfileModal() {
  const { entityModal, setEntityModal, openDM } = useUI();
  if (!entityModal) return null;
  const e = entityModal;

  const handleOverlay = (ev) => { if (ev.target === ev.currentTarget) setEntityModal(null); };

  const typeLabel = {
    startup: 'Startup', accelerator: 'Accelerator',
    investor: 'Investor', venture_studio: 'Venture Studio',
    Startup: 'Startup', Accelerator: 'Accelerator',
    Investor: 'Investor', 'Venture Studio': 'Venture Studio',
  }[e.type] || e.type;

  const badgeColor = {
    Accelerator:'#7c3aed', accelerator:'#7c3aed',
    Investor:'#2563eb', investor:'#2563eb',
    'Venture Studio':'#059669', venture_studio:'#059669',
    Startup:'var(--orange)', startup:'var(--orange)',
  }[e.type] || 'var(--orange)';
  const badgeBg = {
    Accelerator:'#f5f3ff', accelerator:'#f5f3ff',
    Investor:'#eff6ff', investor:'#eff6ff',
    'Venture Studio':'#f0fdf4', venture_studio:'#f0fdf4',
    Startup:'var(--orange-light)', startup:'var(--orange-light)',
  }[e.type] || 'var(--orange-light)';

  const logoDisplay = e.logo_url || e.logo || e.icon;
  const aboutText   = e.description || e.about || e.tagline;
  const foundedVal  = e.founded_year || e.founded;
  const portfolioVal= e.portfolio_count ?? e.portfolio ?? e.alumni ?? e.companies;
  const whyItems    = e.why_us
    ? e.why_us.split('|').map(s => s.trim()).filter(Boolean)
    : (Array.isArray(e.whyUs) ? e.whyUs : []);

  const statsItems = [
    portfolioVal != null && { num: portfolioVal, label: ['investor','Investor'].includes(e.type) ? 'Portfolio Cos' : ['accelerator','Accelerator'].includes(e.type) ? 'Alumni' : 'Portfolio' },
    e.aum         && { num: e.aum,        label: 'AUM' },
    foundedVal    && { num: foundedVal,   label: 'Founded' },
    e.checkSize   && { num: e.checkSize,  label: 'Check Size' },
    Array.isArray(e.industries) && e.industries.length && { num: e.industries.length, label: 'Industries' },
  ].filter(Boolean);

  const links = [];
  if (e.website)  links.push({ url: e.website.startsWith('http') ? e.website : 'https://'+e.website, icon:'🌐', label:'Website' });
  if (e.linkedin) links.push({ url: e.linkedin, icon:'💼', label:'LinkedIn' });
  if (e.twitter)  links.push({ url: e.twitter.startsWith('http') ? e.twitter : `https://twitter.com/${e.twitter.replace('@','')}`, icon:'𝕏', label: e.twitter.startsWith('@') ? e.twitter : 'Twitter' });
  if (e.links)    links.push(...e.links);

  return (
    <div onClick={handleOverlay} style={{ position:'fixed', inset:0, zIndex:2200, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>

        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%)', padding:'32px 32px 24px', position:'relative' }}>
          <button onClick={() => setEntityModal(null)} style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', cursor:'pointer', fontSize:15, color:'rgba(255,255,255,.7)', display:'grid', placeItems:'center' }}>✕</button>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:16, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', display:'grid', placeItems:'center', flexShrink:0, overflow:'hidden' }}>
              <EntityLogo entity={e} size={64} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{e.name}</div>
                {e.verified && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.7)' }}>✓ Verified</span>}
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.5, marginBottom:10 }}>{aboutText}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:badgeBg, color:badgeColor }}>{typeLabel}</span>
                {e.country && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)' }}>{e.flag} {e.country}</span>}
                {e.stage   && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)' }}>{e.stage}</span>}
                {e.industry && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)' }}>{e.industry}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {statsItems.length > 0 && (
          <div style={{ display:'flex', padding:'20px 32px', borderBottom:'1px solid #f0f0f0', gap:24, flexWrap:'wrap' }}>
            {statsItems.map((s, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, color:'#0a0a0a' }}>{s.num}</div>
                <div style={{ fontSize:11, color:'#aaa', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding:'24px 32px 28px' }}>

          {/* About */}
          {aboutText && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>About</div>
            <p style={{ fontSize:13, color:'#555', lineHeight:1.7, marginBottom:20 }}>{aboutText}</p>
          </>}

          {/* Focus */}
          {e.focus && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Focus Areas</div>
            <p style={{ fontSize:13, color:'#555', lineHeight:1.7, marginBottom:20 }}>{e.focus}</p>
          </>}

          {/* Industries (array) */}
          {Array.isArray(e.industries) && e.industries.length > 0 && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Industries</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
              {e.industries.map((ind, i) => <span key={i} style={{ fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20, background:'#f4f4f4', color:'#555' }}>{ind}</span>)}
            </div>
          </>}

          {/* Programs */}
          {Array.isArray(e.programs) && e.programs.length > 0 && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Programs</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {e.programs.map((p, i) => (
                <div key={i} style={{ padding:'12px 14px', background:'#f8f8f8', borderRadius:12, border:'1px solid #eee' }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{p.name}</div>
                  {p.duration && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{p.duration}{p.equity ? ` · ${p.equity}` : ''}</div>}
                </div>
              ))}
            </div>
          </>}

          {/* Why Us */}
          {whyItems.length > 0 && <>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'#bbb', marginBottom:10 }}>Why Us</div>
            <ul style={{ margin:'0 0 20px', paddingLeft:18 }}>
              {whyItems.map((item, i) => (
                <li key={i} style={{ fontSize:13, color:'#555', lineHeight:1.7, marginBottom:4 }}>{item}</li>
              ))}
            </ul>
          </>}

          {/* Links (website, linkedin, twitter) */}
          {links.length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
              {links.map((l, i) => (
                <a key={i} href={l.url || '#'} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:12, fontWeight:700, color:'#555', textDecoration:'none', transition:'all .15s' }}
                  onMouseOver={ev => { ev.currentTarget.style.borderColor='var(--orange)'; ev.currentTarget.style.color='var(--orange)'; }}
                  onMouseOut={ev => { ev.currentTarget.style.borderColor='#e8e8e8'; ev.currentTarget.style.color='#555'; }}>
                  {l.icon} {l.label}
                </a>
              ))}
            </div>
          )}

          {/* Contact */}
          {e.contact && (
            <button onClick={() => { setEntityModal(null); openDM(e.contact, e.name, e.logo || '🏢'); }}
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, background:'#f4f4f4', color:'#555', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              💬 Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
