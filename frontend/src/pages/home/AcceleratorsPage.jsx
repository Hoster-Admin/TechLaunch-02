import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useUI } from '../../context/UIContext';

const ACCELERATORS = [
  { id:1, icon:'🏢', name:'500 Global (MENA)',  country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed → Seed', type:'Accelerator', portfolio:80,  industries:['Fintech','Edtech','Healthtech','SaaS','E-Commerce'], website:'https://500.co/mena', about:'500 Global MENA accelerates the best founders across the Arab world, offering capital, mentorship, and access to a global network of 2,500+ founders.', programs:[{name:'MENA Accelerator',duration:'4 months',equity:'6%'}], tags:['Funding','Global Network','Top Tier'] },
  { id:2, icon:'🌟', name:'Flat6Labs',          country:'Egypt',        flag:'🇪🇬', stage:'Seed',           type:'Accelerator', portfolio:300, industries:['Fintech','Edtech','AI & ML','Logistics','Healthtech'], website:'https://flat6labs.com', about:'Flat6Labs is MENA\'s largest accelerator by portfolio, backing early-stage startups in Egypt, Saudi Arabia, Jordan, and more.', programs:[{name:'Seed Program',duration:'6 months',equity:'8-12%'}], tags:['Seed Stage','Cairo','Regional'] },
  { id:3, icon:'🚀', name:'OQAL',               country:'Saudi Arabia', flag:'🇸🇦', stage:'Angel',          type:'Accelerator', portfolio:150, industries:['Fintech','Proptech','Healthtech','E-Commerce'], website:'https://oqal.org', about:'OQAL is Saudi Arabia\'s leading angel investment network, connecting entrepreneurs with accredited angel investors across the Kingdom.', programs:[{name:'Angel Network',duration:'Ongoing',equity:'Varies'}], tags:['Angel','Saudi','KSA'] },
  { id:4, icon:'💡', name:'Wamda',              country:'UAE',          flag:'🇦🇪', stage:'Seed',           type:'Accelerator', portfolio:200, industries:['Media','Edtech','Fintech','AI & ML','Logistics'], website:'https://wamda.com', about:'Wamda is MENA\'s entrepreneurship platform, offering capital, programs, and community for the region\'s startups.', programs:[{name:'Accelerate',duration:'3 months',equity:'5%'}], tags:['Regional','Dubai','Media'] },
  { id:5, icon:'🏗️', name:'Turn8',             country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',       type:'Accelerator', portfolio:60,  industries:['Logistics','Proptech','Dev Tools','SaaS'], website:'https://turn8.co', about:'Turn8 is Dubai\'s startup accelerator backed by DP World, focusing on trade, logistics, and supply chain innovation.', programs:[{name:'Turn8 Program',duration:'3 months',equity:'7%'}], tags:['Dubai','Logistics','DP World'] },
  { id:6, icon:'🌱', name:'MIT Enterprise Forum Arab Startup Competition', country:'Pan-Arab', flag:'🌍', stage:'Seed',   type:'Accelerator', portfolio:120, industries:['Cleantech','AI & ML','Healthtech','Edtech'], website:'https://mitarabcompetition.com', about:'The MIT Enterprise Forum\'s Arab Startup Competition supports transformative startups tackling the Arab world\'s biggest challenges.', programs:[{name:'Competition',duration:'6 months',equity:'0%'}], tags:['MIT','No Equity','Regional'] },
  { id:7, icon:'📊', name:'Brinc',              country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',       type:'Accelerator', portfolio:90,  industries:['Cleantech','IoT','Healthtech','Foodtech'], website:'https://brinc.io', about:'Brinc is a global hardware-focused accelerator with a major MENA presence, specializing in deep tech and IoT startups.', programs:[{name:'Hardware Program',duration:'4 months',equity:'7-10%'}], tags:['Hardware','IoT','Deep Tech'] },
  { id:8, icon:'🎯', name:'Techstars Dubai',    country:'UAE',          flag:'🇦🇪', stage:'Seed',           type:'Accelerator', portfolio:40,  industries:['Fintech','SaaS','AI & ML','Edtech','Proptech'], website:'https://techstars.com/dubai', about:'Techstars Dubai is part of the globally respected Techstars network, offering mentorship-driven acceleration for MENA founders.', programs:[{name:'Techstars Accelerator',duration:'3 months',equity:'6%'}], tags:['Global Brand','Dubai','Mentorship'] },
];

const FILTER_OPTIONS = ['All','UAE','Saudi Arabia','Egypt','Jordan','Pan-Arab'];
const TYPE_OPTIONS = ['All','Accelerator','Incubator','Investor','Venture Studio'];

export default function AcceleratorsPage({ onSignIn, onSignUp }) {
  const { setEntityModal } = useUI();
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQ, setSearchQ] = useState('');

  const filtered = ACCELERATORS.filter(a => {
    const matchCountry = filter === 'All' || a.country === filter || a.country === 'Pan-Arab';
    const matchType = typeFilter === 'All' || a.type === typeFilter;
    const matchQ = !searchQ || a.name.toLowerCase().includes(searchQ.toLowerCase()) || a.industries.some(i => i.toLowerCase().includes(searchQ.toLowerCase()));
    return matchCountry && matchType && matchQ;
  });

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        {/* Hero */}
        <div style={{ background:'#0a0a0a', padding:'60px 32px 52px', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(232,98,26,.15)', border:'1px solid rgba(232,98,26,.3)', color:'var(--orange)', fontSize:12, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', padding:'5px 16px', borderRadius:100, marginBottom:24 }}>🚀 MENA Ecosystem</div>
          <h1 style={{ fontSize:'clamp(28px,4.5vw,52px)', fontWeight:800, color:'#fff', letterSpacing:'-.03em', marginBottom:12, lineHeight:1.1 }}>
            MENA <span style={{ color:'var(--orange)' }}>Accelerators</span> & Programs
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,.5)', maxWidth:500, margin:'0 auto 32px', lineHeight:1.6 }}>Discover accelerators, incubators, and programs backing the next generation of MENA founders.</p>
          <div style={{ display:'flex', alignItems:'center', gap:24, justifyContent:'center', flexWrap:'wrap' }}>
            {[['42+','Programs'],['8,000+','Alumni'],['$2B+','Deployed'],['22','Countries']].map(([n,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, color:'#fff' }}>{n}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 32px 80px' }}>
          {/* Filters */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, maxWidth:300 }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search accelerators…"
                style={{ width:'100%', padding:'9px 12px 9px 34px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', background:'#fff' }}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {FILTER_OPTIONS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:'8px 14px', borderRadius:10, border:`1.5px solid ${filter===f?'var(--orange)':'#e8e8e8'}`, background:filter===f?'var(--orange-light)':'#fff', color:filter===f?'var(--orange)':'#555', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize:18, fontWeight:800, marginBottom:20 }}>
            {filter === 'All' ? 'All Programs' : filter} <span style={{ fontSize:13, color:'#aaa', fontWeight:500, fontFamily:'Inter,sans-serif', marginLeft:8 }}>{filtered.length}</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
            {filtered.map(acc => (
              <div key={acc.id} style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'all .15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(232,98,26,.1)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}
                onClick={() => setEntityModal({ ...acc, type:'Accelerator', flag:acc.flag, links:acc.website?[{icon:'🌐',label:'Website',url:acc.website}]:[] })}>
                {/* Card header */}
                <div style={{ background:'linear-gradient(135deg,#0a0a0a,#1a1a1a)', padding:'20px 20px 16px', position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <div style={{ width:56, height:56, borderRadius:14, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', display:'grid', placeItems:'center', fontSize:24, flexShrink:0 }}>{acc.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#fff', marginBottom:4 }}>{acc.name}</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,.12)', color:'rgba(255,255,255,.7)' }}>{acc.flag} {acc.country}</span>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(232,98,26,.25)', color:'var(--orange)' }}>{acc.stage}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding:'16px 20px 18px' }}>
                  <p style={{ fontSize:13, color:'#666', lineHeight:1.6, marginBottom:14, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{acc.about}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                    {acc.industries.slice(0,3).map(i => <span key={i} style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'#f4f4f4', color:'#555' }}>{i}</span>)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:12, color:'#aaa' }}>
                      <span style={{ fontWeight:700, color:'#0a0a0a', fontFamily:'Inter,sans-serif' }}>{acc.portfolio}</span>+ companies
                    </div>
                    <button style={{ padding:'7px 14px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
