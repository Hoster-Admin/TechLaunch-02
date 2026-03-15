import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { statsAPI } from '../../utils/api';

const INDUSTRY_META = {
  'Fintech':         { icon:'💳', desc:'Payments, banking, and financial services' },
  'Edtech':          { icon:'📚', desc:'Online education and learning tools' },
  'AI & ML':         { icon:'🤖', desc:'Artificial intelligence and machine learning' },
  'Healthtech':      { icon:'🏥', desc:'Digital health and medical innovation' },
  'E-Commerce':      { icon:'🛒', desc:'Online shopping and marketplace platforms' },
  'Logistics':       { icon:'🚛', desc:'Supply chain and freight solutions' },
  'Foodtech':        { icon:'🍽️', desc:'Food delivery and restaurant technology' },
  'Proptech':        { icon:'🏠', desc:'Real estate and property technology' },
  'Traveltech':      { icon:'✈️', desc:'Travel, tourism, and hospitality tech' },
  'Cleantech':       { icon:'🌱', desc:'Clean energy and sustainability' },
  'Cybersecurity':   { icon:'🔐', desc:'Data security and privacy solutions' },
  'HR & Work':       { icon:'👥', desc:'Human resources and workplace tools' },
  'Media':           { icon:'📡', desc:'Digital media and entertainment' },
  'Dev Tools':       { icon:'⚙️', desc:'Developer tools and infrastructure' },
  'Islamic Fintech': { icon:'🕌', desc:'Shariah-compliant financial products' },
  'Web3':            { icon:'🌐', desc:'Blockchain, crypto, and decentralized apps' },
  'SaaS':            { icon:'🚀', desc:'Software as a service businesses' },
  'Gaming':          { icon:'🎮', desc:'Gaming and interactive entertainment' },
  'Social Impact':   { icon:'🤝', desc:'Products driving social change' },
  'Other':           { icon:'📦', desc:'Other innovative technology products' },
};

const COUNTRY_META = {
  sa: { flag:'🇸🇦', name:'Saudi Arabia', desc:"Kingdom's leading tech hub — Riyadh & Jeddah" },
  ae: { flag:'🇦🇪', name:'UAE',          desc:"MENA's most connected startup ecosystem" },
  eg: { flag:'🇪🇬', name:'Egypt',        desc:"Africa's largest tech talent pool" },
  jo: { flag:'🇯🇴', name:'Jordan',       desc:'The Silicon Valley of the Middle East' },
  ma: { flag:'🇲🇦', name:'Morocco',      desc:'Rising Francophone tech scene' },
  kw: { flag:'🇰🇼', name:'Kuwait',       desc:'GCC innovation with strong VC support' },
  qa: { flag:'🇶🇦', name:'Qatar',        desc:"Backed by Qatar's Vision 2030" },
  bh: { flag:'🇧🇭', name:'Bahrain',      desc:'RegTech hub with fintech-friendly laws' },
  tn: { flag:'🇹🇳', name:'Tunisia',      desc:"Africa's first unicorn birthplace" },
  lb: { flag:'🇱🇧', name:'Lebanon',      desc:'Resilient founder community' },
  iq: { flag:'🇮🇶', name:'Iraq',         desc:'Emerging startup ecosystem' },
  ps: { flag:'🇵🇸', name:'Palestine',    desc:'Innovative tech community' },
  ly: { flag:'🇱🇾', name:'Libya',        desc:'Developing tech landscape' },
  dz: { flag:'🇩🇿', name:'Algeria',      desc:'Growing North African ecosystem' },
  sd: { flag:'🇸🇩', name:'Sudan',        desc:'Emerging fintech hub' },
  ye: { flag:'🇾🇪', name:'Yemen',        desc:'Resilient startup community' },
  sy: { flag:'🇸🇾', name:'Syria',        desc:'Talented diaspora founder network' },
  om: { flag:'🇴🇲', name:'Oman',         desc:'Vision 2040 driving diversification' },
};

export default function DirectoryPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('industries');
  const [searchQ, setSearchQ] = useState('');
  const [industries, setIndustries] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.directory().then(res => {
      const data = res.data?.data || {};
      const indCounts = Object.fromEntries((data.industries || []).map(r => [r.name, r.count]));
      const ctrCounts = Object.fromEntries((data.countries  || []).map(r => [r.code,  r.count]));

      setIndustries(Object.entries(INDUSTRY_META).map(([name, meta]) => ({
        name, icon: meta.icon, desc: meta.desc, count: indCounts[name] || 0,
      })));

      setCountries(Object.entries(COUNTRY_META).map(([code, meta]) => ({
        code, flag: meta.flag, name: meta.name, desc: meta.desc, count: ctrCounts[code] || 0,
      })));
    }).catch(() => {
      setIndustries(Object.entries(INDUSTRY_META).map(([name, meta]) => ({ name, ...meta, count: 0 })));
      setCountries(Object.entries(COUNTRY_META).map(([code, meta]) => ({ code, ...meta, count: 0 })));
    }).finally(() => setLoading(false));
  }, []);

  const filteredIndustries = industries.filter(i => !searchQ
    || i.name.toLowerCase().includes(searchQ.toLowerCase())
    || i.desc.toLowerCase().includes(searchQ.toLowerCase()));

  const filteredCountries = countries.filter(c => !searchQ
    || c.name.toLowerCase().includes(searchQ.toLowerCase())
    || c.desc.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <>
      <Helmet>
        <title>MENA Tech Directory — Browse by Industry &amp; Country | Tech Launch MENA</title>
        <meta name="description" content="Explore MENA startups, products, accelerators, and investors by industry and country." />
        <meta property="og:title" content="MENA Tech Directory — Tech Launch MENA" />
        <meta property="og:description" content="Explore MENA startups, products, accelerators, and investors by industry and country." />
        <meta property="og:url" content="https://tlmena.com/directory" />
      </Helmet>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        {/* Hero */}
        <div className="dir-hero">
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(232,98,26,.15)', border:'1px solid rgba(232,98,26,.3)', color:'var(--orange)', fontSize:12, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', padding:'5px 16px', borderRadius:100, marginBottom:24 }}>🌍 MENA Ecosystem Directory</div>
          <h1 style={{ fontSize:'clamp(30px,5vw,52px)', fontWeight:800, color:'#fff', letterSpacing:'-.03em', marginBottom:12, lineHeight:1.1 }}>
            Explore by <span style={{ color:'var(--orange)' }}>Industry</span> or <span style={{ color:'var(--orange)' }}>Country</span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,.5)', maxWidth:480, margin:'0 auto 32px', lineHeight:1.6 }}>Browse every product on the platform, filtered by vertical or geography.</p>
          <div style={{ position:'relative', maxWidth:480, margin:'0 auto' }}>
            <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search industries or countries…"
              style={{ width:'100%', padding:'13px 16px 13px 40px', borderRadius:12, border:'1.5px solid rgba(255,255,255,.15)', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', background:'rgba(255,255,255,.08)', color:'#fff', boxSizing:'border-box' }}/>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', position:'sticky', top:'var(--nav-h)', zIndex:100 }}>
          <div className="dir-tab-bar">
            {[['industries','🏭 Industries'],['countries','🌍 Countries']].map(([t,label]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding:'16px 20px', border:'none', background:'transparent', fontSize:14, fontWeight:700, cursor:'pointer', color:activeTab===t?'var(--orange)':'#666', borderBottom:`2px solid ${activeTab===t?'var(--orange)':'transparent'}`, transition:'all .15s', fontFamily:'Inter,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px clamp(16px,3vw,32px) 80px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Loading…</div>
          ) : (
            <>
              {activeTab === 'industries' && <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ fontSize:18, fontWeight:800 }}>
                    Industries <span style={{ fontSize:13, color:'#aaa', fontWeight:500, fontFamily:'Inter,sans-serif', marginLeft:8 }}>{filteredIndustries.length}</span>
                  </div>
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
                      <div style={{ fontSize:12, fontWeight:700, color: ind.count > 0 ? 'var(--orange)' : '#bbb', display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ fontFamily:'Inter,sans-serif' }}>{ind.count}</span> {ind.count === 1 ? 'product' : 'products'} {ind.count > 0 ? '→' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </>}

              {activeTab === 'countries' && <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ fontSize:18, fontWeight:800 }}>
                    Countries <span style={{ fontSize:13, color:'#aaa', fontWeight:500, fontFamily:'Inter,sans-serif', marginLeft:8 }}>{filteredCountries.length}</span>
                  </div>
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
                        <div style={{ fontSize:12, fontWeight:700, color: c.count > 0 ? 'var(--orange)' : '#bbb' }}>
                          {c.count} {c.count === 1 ? 'product' : 'products'} {c.count > 0 ? '→' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>}
            </>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}
