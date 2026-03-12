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
            {[
              { title:'X / Twitter', svg:<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M11.9 8.5L18.5 1h-1.6L11.2 7.4 6.5 1H1l7 10.2L1 19h1.6l6.1-7.1L14 19h5.5L11.9 8.5zm-2.2 2.5-.7-1L3.2 2.2h2.4l4.5 6.5.7 1 5.9 8.5h-2.4l-4.6-6.7z"/></svg> },
              { title:'LinkedIn',    svg:<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M17.5 1h-15A1.5 1.5 0 001 2.5v15A1.5 1.5 0 002.5 19h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0017.5 1zM6.5 16H4V8h2.5v8zM5.25 6.9a1.45 1.45 0 110-2.9 1.45 1.45 0 010 2.9zM16 16h-2.5v-4c0-.93-.02-2.13-1.3-2.13-1.3 0-1.5 1.01-1.5 2.06V16H8V8h2.4v1.1h.03c.33-.63 1.15-1.3 2.37-1.3 2.54 0 3.2 1.67 3.2 3.84V16z"/></svg> },
              { title:'Instagram',   svg:<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 1.8c2.67 0 2.99.01 4.04.06 2.75.13 4.03 1.42 4.16 4.16.05 1.04.06 1.36.06 4.04s-.01 2.99-.06 4.04c-.13 2.73-1.4 4.03-4.16 4.16-1.05.05-1.36.06-4.04.06s-2.99-.01-4.04-.06C3.22 18.12 1.93 16.83 1.8 14.1 1.75 13.05 1.74 12.73 1.74 10s.01-3 .06-4.04C1.93 3.22 3.22 1.93 5.96 1.8 7 1.75 7.32 1.74 10 1.8zM10 .25C7.28.25 6.94.26 5.88.31 2.25.48.48 2.25.31 5.88.26 6.94.25 7.28.25 10s.01 3.06.06 4.12c.17 3.62 1.94 5.4 5.57 5.57C6.94 19.74 7.28 19.75 10 19.75s3.06-.01 4.12-.06c3.62-.17 5.4-1.94 5.57-5.57.05-1.06.06-1.4.06-4.12s-.01-3.06-.06-4.12C19.52 2.26 17.75.48 14.12.31 13.06.26 12.72.25 10 .25zM10 5a5 5 0 100 10A5 5 0 0010 5zm0 8.25a3.25 3.25 0 110-6.5 3.25 3.25 0 010 6.5zM15.25 3.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"/></svg> },
            ].map(s => (
              <a key={s.title} href="#" title={s.title} style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)', display:'grid', placeItems:'center', color:'rgba(255,255,255,.5)', textDecoration:'none', transition:'all .15s' }}
                onMouseOver={e => { e.currentTarget.style.background='var(--orange)'; e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
                {s.svg}
              </a>
            ))}
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
              { label:'Articles',      action:() => navigate('/articles') },
              { label:'Weekly Digest', action:() => navigate('/articles') },
              { label:'Accelerators',  action:() => navigate('/accelerators') },
              { label:'Events',        action:() => navigate('/accelerators') },
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
          © 2026 Tech Launch. All rights reserved. Built for the MENA region. 🌍
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
