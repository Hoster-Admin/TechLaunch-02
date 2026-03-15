import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { statsAPI } from '../../utils/api';

const TEAM = [
  { name:'Adam Al-Rashidi',   role:'Co-Founder & CEO',    initials:'AA', color:'#E15033', bio:'Serial entrepreneur. Previously founded two B2B SaaS startups in the GCC. Passionate about MENA tech ecosystems.' },
  { name:'Leila Khouri',      role:'Co-Founder & CPO',    initials:'LK', color:'#7c3aed', bio:'Product leader with 10 years at top MENA consumer apps. Obsessed with user experience and community-driven growth.' },
  { name:'Hassan Mansouri',   role:'Head of Engineering', initials:'HM', color:'#2563eb', bio:'Full-stack engineer and open source contributor. Built infrastructure for 3M+ concurrent users at Careem.' },
  { name:'Nora Al-Farsi',     role:'Head of Community',   initials:'NF', color:'#16a34a', bio:'Startup ecosystem builder. Previously at Flat6Labs and Hub71. Connects founders with the right resources.' },
];

const VALUES = [
  { icon:'🌍', title:'MENA First',        desc:'We\'re built for the MENA region — Arabic-first, regionally aware, and deeply connected to the ecosystem\'s unique challenges and opportunities.' },
  { icon:'🤝', title:'Community Driven',  desc:'Every product listed, every upvote cast, every article shared is a contribution to the community we\'re building together.' },
  { icon:'⚡', title:'Builders Welcome',  desc:'We celebrate builders at every stage — from solo founders with an MVP to teams scaling Series B companies. Ship early, iterate often.' },
  { icon:'🔒', title:'Trust & Quality',   desc:'We verify companies, moderate listings, and ensure the platform stays high-quality. Spam and low-effort submissions are removed.' },
];

function formatNum(n) {
  if (n === null || n === undefined) return '…';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export default function AboutPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsAPI.summary().then(res => setStats(res.data?.data)).catch(() => {});
  }, []);

  const statItems = [
    [formatNum(stats?.products),     'Products Listed'],
    [formatNum(stats?.founders),     'Founders'],
    [formatNum(stats?.countries),    'Countries'],
    [formatNum(stats?.accelerators), 'Accelerators'],
  ];

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', background:'#fff', minHeight:'100vh' }}>

        {/* Hero */}
        <div className="dark-hero">
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--orange)', marginBottom:14 }}>About Tech Launch MENA</div>
          <h1 style={{ fontWeight:900, letterSpacing:'-.04em', color:'#fff', lineHeight:1.15, margin:'0 auto 20px', maxWidth:720 }}>
            The home for MENA's best<br/><span style={{ color:'var(--orange)' }}>products, startups & builders</span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,.55)', lineHeight:1.75, maxWidth:580, margin:'0 auto 32px' }}>
            Tech Launch MENA is the Middle East and North Africa's leading product discovery platform — connecting founders, investors, and builders across {stats?.countries ? `${stats.countries}+` : 'MENA'} countries.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:40, flexWrap:'wrap' }}>
            {statItems.map(([n,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:32, fontWeight:900, color:'var(--orange)', letterSpacing:'-.03em' }}>{n}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.06em', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:900, margin:'0 auto', padding:'clamp(40px,6vw,72px) clamp(16px,4vw,40px) 80px' }}>

          {/* Mission */}
          <div style={{ marginBottom:72, textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--orange)', marginBottom:14 }}>Our Mission</div>
            <h2 style={{ fontSize:30, fontWeight:900, letterSpacing:'-.03em', lineHeight:1.3, marginBottom:20 }}>Putting MENA innovation on the world map</h2>
            <p style={{ fontSize:16, color:'#555', lineHeight:1.8, maxWidth:680, margin:'0 auto 16px' }}>
              The Arab world has incredible talent, ambitious founders, and some of the world's most exciting emerging markets. We built Tech Launch MENA to give these builders the platform they deserve.
            </p>
            <p style={{ fontSize:15, color:'#777', lineHeight:1.8, maxWidth:680, margin:'0 auto' }}>
              From Cairo to Riyadh, Amman to Dubai — every startup that lists here becomes part of a growing story of MENA innovation that we're proud to help tell.
            </p>
          </div>

          {/* Values */}
          <div style={{ marginBottom:72 }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--orange)', marginBottom:14, textAlign:'center' }}>Our Values</div>
            <h2 style={{ fontSize:28, fontWeight:900, letterSpacing:'-.03em', textAlign:'center', marginBottom:40 }}>What we stand for</h2>
            <div className="about-values-grid">
              {VALUES.map(v => (
                <div key={v.title} style={{ background:'#fafafa', border:'1px solid #f0f0f0', borderRadius:18, padding:'28px 28px' }}>
                  <div style={{ fontSize:28, marginBottom:12 }}>{v.icon}</div>
                  <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-.02em', marginBottom:8 }}>{v.title}</div>
                  <p style={{ fontSize:14, color:'#666', lineHeight:1.7, margin:0 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div style={{ marginBottom:72 }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--orange)', marginBottom:14, textAlign:'center' }}>The Team</div>
            <h2 style={{ fontSize:28, fontWeight:900, letterSpacing:'-.03em', textAlign:'center', marginBottom:40 }}>Built by builders, for builders</h2>
            <div className="about-team-grid">
              {TEAM.map(m => (
                <div key={m.name} style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'24px 20px', textAlign:'center' }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:m.color, color:'#fff', display:'grid', placeItems:'center', fontSize:18, fontWeight:900, margin:'0 auto 14px' }}>{m.initials}</div>
                  <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-.01em', marginBottom:4 }}>{m.name}</div>
                  <div style={{ fontSize:12, color:'var(--orange)', fontWeight:700, marginBottom:10 }}>{m.role}</div>
                  <p style={{ fontSize:12, color:'#888', lineHeight:1.65, margin:0 }}>{m.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background:'#0a0a0a', borderRadius:24, padding:'clamp(28px,5vw,48px) clamp(20px,4vw,40px)', textAlign:'center' }}>
            <h2 style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-.03em', marginBottom:12 }}>Join the community</h2>
            <p style={{ fontSize:15, color:'rgba(255,255,255,.5)', marginBottom:24 }}>Submit your product, discover what MENA builders are launching, and connect with the ecosystem.</p>
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              <button onClick={() => navigate('/')} style={{ padding:'12px 26px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                🚀 Submit a Product
              </button>
              <button onClick={() => navigate('/products')} style={{ padding:'12px 26px', borderRadius:12, background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.15)', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Browse Products
              </button>
            </div>
          </div>

        </div>
      </div>
      <Footer/>
    </>
  );
}
