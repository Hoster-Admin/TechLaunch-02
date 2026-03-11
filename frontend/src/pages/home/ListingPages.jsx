import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useUI } from '../../context/UIContext';

const STARTUPS = [
  { id:1, icon:'💳', name:'Tabby',        country:'UAE',          flag:'🇦🇪', stage:'Series C',  industry:'Fintech',    about:'MENA\'s leading Buy Now Pay Later platform serving 3,000+ merchants.',   team:120, founded:2019, website:'https://tabby.ai' },
  { id:2, icon:'📚', name:'Noon Academy', country:'Saudi Arabia', flag:'🇸🇦', stage:'Series B',  industry:'Edtech',     about:'Social learning app connecting K-12 students with top tutors in Arabic.',   team:80,  founded:2017, website:'https://noonacademy.com' },
  { id:3, icon:'🏥', name:'Vezeeta',      country:'Egypt',        flag:'🇪🇬', stage:'Series B',  industry:'Healthtech', about:'MENA\'s largest digital healthcare platform with 30,000+ doctors.',          team:200, founded:2012, website:'https://vezeeta.com' },
  { id:4, icon:'📈', name:'Baraka',       country:'UAE',          flag:'🇦🇪', stage:'Series A',  industry:'Fintech',    about:'Zero-commission stock trading app for GCC investors.',                       team:45,  founded:2020, website:'https://getbaraka.com' },
  { id:5, icon:'🚛', name:'Trella',       country:'Egypt',        flag:'🇪🇬', stage:'Series A',  industry:'Logistics',  about:'Digital freight marketplace reducing empty miles across MENA.',             team:150, founded:2018, website:'https://trella.app' },
  { id:6, icon:'🍽️', name:'Foodics',      country:'Saudi Arabia', flag:'🇸🇦', stage:'Series B',  industry:'Foodtech',   about:'Restaurant POS and management system used by 20,000+ restaurants.',       team:300, founded:2014, website:'https://foodics.com' },
];

const INVESTORS = [
  { id:1, icon:'💰', name:'STV',                  country:'Saudi Arabia', flag:'🇸🇦', stage:'Series A+',  industries:['Fintech','Edtech','Logistics','SaaS'], checkSize:'$5M–$50M',  portfolio:45, about:'Saudi Telecom\'s CVC backing top-tier MENA tech companies with patient capital.',       website:'https://stv.vc' },
  { id:2, icon:'🦁', name:'Wamda Capital',         country:'UAE',          flag:'🇦🇪', stage:'Seed–A',    industries:['Media','Fintech','Edtech','AI & ML'], checkSize:'$500K–$5M', portfolio:60, about:'MENA\'s entrepreneur-first investment platform with deep operator networks.',           website:'https://wamda.com' },
  { id:3, icon:'🌊', name:'Global Ventures',       country:'UAE',          flag:'🇦🇪', stage:'Series A+',  industries:['Fintech','Healthtech','AI & ML','Logistics'], checkSize:'$3M–$30M', portfolio:30, about:'Dubai-based VC investing in transformative technology companies globally with MENA lens.',  website:'https://globalventures.vc' },
  { id:4, icon:'🦅', name:'Vision Ventures',       country:'Saudi Arabia', flag:'🇸🇦', stage:'Seed–B',    industries:['Fintech','SaaS','HR & Work','Dev Tools'], checkSize:'$1M–$10M', portfolio:38, about:'Early-stage Saudi VC focused on deep tech and B2B software innovations.',               website:'https://visionvc.com' },
  { id:5, icon:'🔷', name:'Algebra Ventures',      country:'Egypt',        flag:'🇪🇬', stage:'Seed–A',    industries:['Fintech','Edtech','Logistics','E-Commerce'], checkSize:'$500K–$5M', portfolio:25, about:'Egypt\'s top VC fund investing in the country\'s fastest-growing tech companies.',     website:'https://algebraventures.com' },
  { id:6, icon:'🐉', name:'Nuwa Capital',          country:'UAE',          flag:'🇦🇪', stage:'Seed–B',    industries:['Fintech','AI & ML','Healthtech','SaaS'], checkSize:'$1M–$15M', portfolio:20, about:'Female-founded VC backing the most ambitious MENA founders across stages.',             website:'https://nuwacapital.com' },
];

const VENTURES = [
  { id:1, icon:'🏗️', name:'Beco Capital',       country:'UAE',          flag:'🇦🇪', stage:'Seed–B',    industries:['Fintech','Edtech','E-Commerce','SaaS'], portfolio:40, about:'Regional VC and studio building next-generation digital platforms across MENA.',  website:'https://becocapital.com' },
  { id:2, icon:'🏭', name:'Turn8',               country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',  industries:['Logistics','Proptech','Dev Tools'], portfolio:60, about:'Backed by DP World, Turn8 co-builds startups in trade and logistics infrastructure.', website:'https://turn8.co' },
  { id:3, icon:'🛠️', name:'Creative Dock',       country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',  industries:['Fintech','Insurtech','Proptech','SaaS'], portfolio:25, about:'Global venture studio with MENA office, co-founding companies from idea to scale.',  website:'https://creativedock.com' },
  { id:4, icon:'⚡', name:'DTEC Ventures',        country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',  industries:['AI & ML','Dev Tools','Cybersecurity','SaaS'], portfolio:30, about:'Dubai Silicon Oasis\'s venture studio, incubating deep tech startups.',            website:'https://dtec.ae' },
];

const PAGE_CONFIG = {
  startup:     { title:'Startups', emoji:'🚀', desc:'Discover innovative startups from across the MENA region.', data:STARTUPS, cta:'List Your Startup' },
  accelerator: { title:'Accelerators & Incubators', emoji:'🏢', desc:'Find the best accelerator programs for MENA founders.', data:[], cta:'List Your Program' },
  investor:    { title:'Investment Firms', emoji:'💰', desc:'Connect with investors actively backing MENA startups.', data:INVESTORS, cta:'List Your Fund' },
  venture:     { title:'Venture Studios', emoji:'🎯', desc:'Discover venture studios co-building startups in MENA.', data:VENTURES, cta:'List Your Studio' },
};

const STAGE_COLORS = {
  'Pre-Seed':'#7c3aed', 'Seed':'#16a34a', 'Series A':'#2563eb', 'Series A+':'#2563eb',
  'Seed–A':'#16a34a', 'Seed–B':'#16a34a', 'Series B':'#d97706', 'Series C':'var(--orange)', 'Angel':'#ec4899',
};
const STAGE_BG = {
  'Pre-Seed':'#f5f3ff', 'Seed':'#f0fdf4', 'Series A':'#eff6ff', 'Series A+':'#eff6ff',
  'Seed–A':'#f0fdf4', 'Seed–B':'#f0fdf4', 'Series B':'#fffbeb', 'Series C':'var(--orange-light)', 'Angel':'#fdf2f8',
};

export default function ListingPage({ onSignIn, onSignUp }) {
  const { type } = useParams();
  const { setEntityModal, setSubmitOpen } = useUI();
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.startup;
  const [searchQ, setSearchQ] = useState('');
  const [selIndustry, setSelIndustry] = useState('');
  const [selCountry, setSelCountry] = useState('');

  const data = config.data.filter(item => {
    const matchQ = !searchQ || item.name.toLowerCase().includes(searchQ.toLowerCase()) || (item.about||'').toLowerCase().includes(searchQ.toLowerCase());
    const matchI = !selIndustry || (item.industry === selIndustry || (item.industries||[]).includes(selIndustry));
    const matchC = !selCountry || item.country === selCountry;
    return matchQ && matchI && matchC;
  });

  const allIndustries = [...new Set(config.data.flatMap(i => i.industry ? [i.industry] : (i.industries||[])))].slice(0,12);
  const allCountries = [...new Set(config.data.map(i => i.country))];

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        {/* Hero */}
        <div style={{ background:'#0a0a0a', padding:'56px 32px 48px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>{config.emoji}</div>
          <h1 style={{ fontSize:'clamp(26px,4.5vw,48px)', fontWeight:800, color:'#fff', letterSpacing:'-.03em', marginBottom:12 }}>{config.title}</h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.5)', maxWidth:480, margin:'0 auto 28px', lineHeight:1.6 }}>{config.desc}</p>
          <button onClick={() => setSubmitOpen(true)}
            style={{ padding:'12px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 20px rgba(232,98,26,.4)' }}>
            + {config.cta}
          </button>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 32px 80px' }}>
          {/* Search + Filters */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, maxWidth:280 }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`}
                style={{ width:'100%', padding:'9px 12px 9px 34px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', background:'#fff' }}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
            </div>
            {allCountries.map(c => (
              <button key={c} onClick={() => setSelCountry(selCountry===c?'':c)}
                style={{ padding:'8px 14px', borderRadius:10, border:`1.5px solid ${selCountry===c?'var(--orange)':'#e8e8e8'}`, background:selCountry===c?'var(--orange-light)':'#fff', color:selCountry===c?'var(--orange)':'#555', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {c}
              </button>
            ))}
            {selCountry && <button onClick={() => setSelCountry('')} style={{ padding:'8px 12px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', color:'#888', fontSize:12, fontWeight:700, cursor:'pointer' }}>✕ Clear</button>}
          </div>

          {/* Grid */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:18, fontWeight:800 }}>{config.title} <span style={{ fontSize:13, color:'#aaa', fontWeight:500, fontFamily:'DM Mono,monospace', marginLeft:6 }}>{data.length}</span></div>
          </div>

          {!data.length ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize:40, marginBottom:16 }}>📂</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Nothing here yet</div>
              <p style={{ color:'#888', marginBottom:24 }}>Be the first to list your {type}!</p>
              <button onClick={() => setSubmitOpen(true)} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>+ {config.cta}</button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {data.map(item => {
                const stage = item.stage || 'Seed';
                return (
                  <div key={item.id}
                    style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'all .15s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(232,98,26,.1)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}
                    onClick={() => setEntityModal({ ...item, type:config.title.split(' ')[0], links:item.website?[{icon:'🌐',label:'Website',url:item.website}]:[] })}>
                    <div style={{ background:'linear-gradient(135deg,#0a0a0a,#1a1a1a)', padding:'20px 20px 16px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                        <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', display:'grid', placeItems:'center', fontSize:22, flexShrink:0 }}>{item.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:6 }}>{item.name}</div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)' }}>{item.flag} {item.country}</span>
                            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:STAGE_BG[stage]||'rgba(255,255,255,.1)', color:STAGE_COLORS[stage]||'var(--orange)' }}>{stage}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding:'16px 20px 18px' }}>
                      <p style={{ fontSize:13, color:'#666', lineHeight:1.6, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.about}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                        {(item.industries || [item.industry]).filter(Boolean).slice(0,3).map(i => (
                          <span key={i} style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:'#f4f4f4', color:'#555' }}>{i}</span>
                        ))}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', gap:16 }}>
                          {item.portfolio && <div style={{ fontSize:11, color:'#aaa' }}><span style={{ fontWeight:700, color:'#0a0a0a', fontFamily:'DM Mono,monospace' }}>{item.portfolio}</span>+ portfolio</div>}
                          {item.team && <div style={{ fontSize:11, color:'#aaa' }}><span style={{ fontWeight:700, color:'#0a0a0a', fontFamily:'DM Mono,monospace' }}>{item.team}</span> team</div>}
                          {item.founded && <div style={{ fontSize:11, color:'#aaa' }}>Est. <span style={{ fontWeight:700, color:'#0a0a0a' }}>{item.founded}</span></div>}
                        </div>
                        <button style={{ padding:'7px 14px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>View →</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Banner */}
          <div style={{ marginTop:48, background:'linear-gradient(135deg,#0a0a0a,#1a1a1a)', borderRadius:20, padding:'40px 40px 36px', textAlign:'center', border:'1px solid rgba(255,255,255,.05)' }}>
            <div style={{ fontSize:36, marginBottom:16 }}>{config.emoji}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:8 }}>Ready to get listed?</div>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', marginBottom:24, maxWidth:400, margin:'0 auto 24px', lineHeight:1.6 }}>Join the growing list of {config.title.toLowerCase()} making an impact in the MENA tech ecosystem.</p>
            <button onClick={() => setSubmitOpen(true)}
              style={{ padding:'13px 32px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 20px rgba(232,98,26,.4)' }}>
              + {config.cta} Free →
            </button>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
