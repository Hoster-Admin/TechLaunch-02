import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';

export default function Footer() {
  const navigate = useNavigate();
  const { setSubmitOpen } = useUI();

  return (
    <footer style={{ background:'#0a0a0a', color:'#fff', padding:'60px 32px 32px', marginTop:0 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'280px 1fr', gap:60, paddingBottom:48, borderBottom:'1px solid rgba(255,255,255,.08)' }}
        className="footer-top-grid">
        {/* Brand */}
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-.03em', color:'#fff' }}>Tech Launch</div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', lineHeight:1.7, fontWeight:400, marginTop:12, marginBottom:20 }}>
            The home for MENA startups, products,<br/>and innovation from the MENA region.
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <a href="https://x.com/tlmenacom" title="X / Twitter" target="_blank" rel="noopener noreferrer"
              style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)', display:'grid', placeItems:'center', color:'rgba(255,255,255,.5)', textDecoration:'none', transition:'all .15s' }}
              onMouseOver={e => { e.currentTarget.style.background='var(--orange)'; e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M11.9 8.5L18.5 1h-1.6L11.2 7.4 6.5 1H1l7 10.2L1 19h1.6l6.1-7.1L14 19h5.5L11.9 8.5zm-2.2 2.5-.7-1L3.2 2.2h2.4l4.5 6.5.7 1 5.9 8.5h-2.4l-4.6-6.7z"/></svg>
            </a>
          </div>
        </div>

        {/* Links */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32 }} className="footer-links-grid">
          {[
            { title:'Discover', links:[
              { label:'All Products',  action:() => navigate('/products') },
              { label:'Just Launched', action:() => navigate('/?feed=new') },
              { label:'Coming Soon',   action:() => navigate('/?feed=soon') },
              { label:'Top Voted',     action:() => navigate('/?feed=top') },
              { label:'Directory',     action:() => navigate('/directory') },
            ]},
            { title:'List', links:[
              { label:'Startup',                 action:() => navigate('/list/startup') },
              { label:'Accelerator / Incubator', action:() => navigate('/list/accelerator') },
              { label:'Investment Firm',         action:() => navigate('/list/investor') },
              { label:'Venture Studio',          action:() => navigate('/list/venture') },
            ]},
            { title:'Community', links:[
              { label:'Accelerators',  action:() => navigate('/accelerators') },
              { label:'Launcher',      action:() => navigate('/launcher') },
              { label:'Directory',     action:() => navigate('/directory') },
            ]},
            { title:'Company', links:[
              { label:'About',          action:() => navigate('/about') },
              { label:'Contact',        action:() => navigate('/contact') },
              { label:'Write for Us',   action:() => navigate('/write-for-us') },
              { label:'Privacy Policy', action:() => navigate('/privacy') },
              { label:'Terms of Use',   action:() => navigate('/terms') },
            ]},
          ].map(col => (
            <div key={col.title} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.35)', marginBottom:4 }}>{col.title}</div>
              {col.links.map(l => (
                <a key={l.label} onClick={l.action} style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,.55)', textDecoration:'none', cursor:'pointer', transition:'color .15s', width:'fit-content' }}
                  onMouseOver={e => e.currentTarget.style.color='#fff'}
                  onMouseOut={e => e.currentTarget.style.color='rgba(255,255,255,.55)'}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ maxWidth:1100, margin:'0 auto', paddingTop:28, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', fontWeight:400 }}>
          © {new Date().getFullYear()} Tech Launch. All rights reserved. Built for the MENA region. 🌍
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'rgba(255,255,255,.3)' }}>
          <span>Made with ❤️ in MENA</span>
          <span style={{ opacity:.4 }}>·</span>
          <a onClick={() => setSubmitOpen(true)} style={{ color:'var(--orange)', fontWeight:600, cursor:'pointer', textDecoration:'none', fontSize:12 }}>Join the community</a>
        </div>
      </div>

      <style>{`
        @media(max-width:800px){ .footer-top-grid{ grid-template-columns:1fr !important; gap:40px !important; } }
        @media(max-width:600px){ .footer-links-grid{ grid-template-columns:1fr 1fr !important; } }
      `}</style>
    </footer>
  );
}
