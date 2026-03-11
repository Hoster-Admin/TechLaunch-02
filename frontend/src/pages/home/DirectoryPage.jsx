import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useUI } from '../../context/UIContext';

const INDUSTRIES = [
  { icon:'💳', name:'Fintech',      count:48, desc:'Payments, banking, and financial services' },
  { icon:'📚', name:'Edtech',       count:31, desc:'Online education and learning tools' },
  { icon:'🤖', name:'AI & ML',      count:27, desc:'Artificial intelligence and machine learning' },
  { icon:'🏥', name:'Healthtech',   count:22, desc:'Digital health and medical innovation' },
  { icon:'🛒', name:'E-Commerce',   count:35, desc:'Online shopping and marketplace platforms' },
  { icon:'🚛', name:'Logistics',    count:19, desc:'Supply chain and freight solutions' },
  { icon:'🍽️', name:'Foodtech',     count:14, desc:'Food delivery and restaurant technology' },
  { icon:'🏠', name:'Proptech',     count:18, desc:'Real estate and property technology' },
  { icon:'✈️', name:'Traveltech',   count:12, desc:'Travel, tourism, and hospitality tech' },
  { icon:'🌱', name:'Cleantech',    count:9,  desc:'Clean energy and sustainability' },
  { icon:'🔐', name:'Cybersecurity',count:11, desc:'Data security and privacy solutions' },
  { icon:'👥', name:'HR & Work',    count:16, desc:'Human resources and workplace tools' },
  { icon:'📡', name:'Media',        count:13, desc:'Digital media and entertainment' },
  { icon:'⚙️', name:'Dev Tools',    count:20, desc:'Developer tools and infrastructure' },
  { icon:'🕌', name:'Islamic Fintech',count:7, desc:'Shariah-compliant financial products' },
  { icon:'🌐', name:'Web3',         count:8,  desc:'Blockchain, crypto, and decentralized apps' },
  { icon:'🚚', name:'SaaS',         count:29, desc:'Software as a service businesses' },
  { icon:'🏗️', name:'Proptech',     count:10, desc:'Property and construction technology' },
  { icon:'🎮', name:'Gaming',       count:6,  desc:'Gaming and interactive entertainment' },
  { icon:'🤝', name:'Social Impact',count:7,  desc:'Products driving social change' },
];

const COUNTRIES = [
  { flag:'🇸🇦', name:'Saudi Arabia', code:'sa', count:68, desc:'Kingdom\'s leading tech hub — Riyadh & Jeddah' },
  { flag:'🇦🇪', name:'UAE',          code:'ae', count:84, desc:'MENA\'s most connected startup ecosystem' },
  { flag:'🇪🇬', name:'Egypt',        code:'eg', count:52, desc:'Africa\'s largest tech talent pool' },
  { flag:'🇯🇴', name:'Jordan',       code:'jo', count:29, desc:'The Silicon Valley of the Middle East' },
  { flag:'🇲🇦', name:'Morocco',      code:'ma', count:22, desc:'Rising Francophone tech scene' },
  { flag:'🇰🇼', name:'Kuwait',       code:'kw', count:18, desc:'GCC innovation with strong VC support' },
  { flag:'🇶🇦', name:'Qatar',        code:'qa', count:15, desc:'Backed by Qatar\'s Vision 2030' },
  { flag:'🇧🇭', name:'Bahrain',      code:'bh', count:12, desc:'RegTech hub with fintech-friendly laws' },
  { flag:'🇹🇳', name:'Tunisia',      code:'tn', count:14, desc:'Africa\'s first unicorn birthplace' },
  { flag:'🇱🇧', name:'Lebanon',      code:'lb', count:11, desc:'Resilient founder community' },
];

export default function DirectoryPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const { setEntityModal } = useUI();
  const [activeTab, setActiveTab] = useState('industries');
  const [searchQ, setSearchQ] = useState('');

  const filteredIndustries = INDUSTRIES.filter(i => !searchQ || i.name.toLowerCase().includes(searchQ.toLowerCase()) || i.desc.toLowerCase().includes(searchQ.toLowerCase()));
  const filteredCountries  = COUNTRIES.filter(c => !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.desc.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        {/* Hero */}
        <div style={{ background:'#0a0a0a', padding:'60px 32px 52px', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(232,98,26,.15)', border:'1px solid rgba(232,98,26,.3)', color:'var(--orange)', fontSize:12, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', padding:'5px 16px', borderRadius:100, marginBottom:24 }}>🌍 MENA Ecosystem Directory</div>
          <h1 style={{ fontSize:'clamp(30px,5vw,52px)', fontWeight:800, color:'#fff', letterSpacing:'-.03em', marginBottom:12, lineHeight:1.1 }}>
            Explore by <span style={{ color:'var(--orange)' }}>Industry</span> or <span style={{ color:'var(--orange)' }}>Country</span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,.5)', maxWidth:480, margin:'0 auto 32px', lineHeight:1.6 }}>Browse every product on the platform, filtered by vertical or geography.</p>
          {/* Search */}
          <div style={{ position:'relative', maxWidth:480, margin:'0 auto' }}>
            <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search industries or countries…"
              style={{ width:'100%', padding:'13px 16px 13px 40px', borderRadius:12, border:'1.5px solid rgba(255,255,255,.15)', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', background:'rgba(255,255,255,.08)', color:'#fff' }}/>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', position:'sticky', top:'var(--nav-h)', zIndex:100 }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 32px', display:'flex' }}>
            {[['industries','🏭 Industries'],['countries','🌍 Countries']].map(([t,label]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding:'16px 20px', border:'none', background:'transparent', fontSize:14, fontWeight:700, cursor:'pointer', color:activeTab===t?'var(--orange)':'#666', borderBottom:`2px solid ${activeTab===t?'var(--orange)':'transparent'}`, transition:'all .15s', fontFamily:'Inter,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 32px 80px' }}>
          {activeTab === 'industries' && <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:18, fontWeight:800 }}>Industries <span style={{ fontSize:13, color:'#aaa', fontWeight:500, fontFamily:'DM Mono,monospace', marginLeft:8 }}>{filteredIndustries.length}</span></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
              {filteredIndustries.map(ind => (
                <div key={ind.name} onClick={() => navigate(`/products?industry=${encodeURIComponent(ind.name)}`)}
                  style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:'20px 20px 18px', cursor:'pointer', transition:'all .15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(232,98,26,.1)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>{ind.icon}</div>
                  <div style={{ fontSize:14, fontWeight:800, marginBottom:4 }}>{ind.name}</div>
                  <div style={{ fontSize:12, color:'#888', marginBottom:10, lineHeight:1.4 }}>{ind.desc}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--orange)', display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ fontFamily:'DM Mono,monospace' }}>{ind.count}</span> products →
                  </div>
                </div>
              ))}
            </div>
          </>}

          {activeTab === 'countries' && <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:18, fontWeight:800 }}>Countries <span style={{ fontSize:13, color:'#aaa', fontWeight:500, fontFamily:'DM Mono,monospace', marginLeft:8 }}>{filteredCountries.length}</span></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
              {filteredCountries.map(c => (
                <div key={c.code} onClick={() => navigate(`/products?country=${c.code}`)}
                  style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:'20px 20px 18px', cursor:'pointer', transition:'all .15s', display:'flex', gap:16, alignItems:'flex-start' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(232,98,26,.1)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{ fontSize:40, lineHeight:1, flexShrink:0 }}>{c.flag}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>{c.name}</div>
                    <div style={{ fontSize:12, color:'#888', marginBottom:8, lineHeight:1.4 }}>{c.desc}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--orange)' }}>{c.count} products →</div>
                  </div>
                </div>
              ))}
            </div>
          </>}
        </div>
      </div>
      <Footer/>
    </>
  );
}
