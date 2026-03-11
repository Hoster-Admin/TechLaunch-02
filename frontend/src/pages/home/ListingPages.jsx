import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useUI } from '../../context/UIContext';

const STARTUPS = [
  { id:1,  icon:'💳', name:'Tabby',         country:'UAE',          flag:'🇦🇪', stage:'Growth',      industry:'Fintech',     tags:['BNPL','Payments','Consumer'],          employees:'200+', followers:'1,240', verified:true,  founded:2019, about:'Buy now, pay later platform serving millions of shoppers across UAE, Saudi Arabia, and the broader MENA region.' },
  { id:2,  icon:'📚', name:'Noon Academy',  country:'Saudi Arabia', flag:'🇸🇦', stage:'Growth',      industry:'Edtech',      tags:['Education','Social','Mobile'],          employees:'100+', followers:'980',   verified:true,  founded:2017, about:'Social learning app connecting students and teachers across the Arab world with live and on-demand classes.' },
  { id:3,  icon:'🏥', name:'Vezeeta',       country:'Egypt',        flag:'🇪🇬', stage:'Series A+',   industry:'Healthtech',  tags:['Healthcare','Booking','SaaS'],          employees:'500+', followers:'1,560', verified:true,  founded:2012, about:'Leading digital health platform for booking doctors and managing patient records across Egypt and the MENA region.' },
  { id:4,  icon:'📈', name:'Baraka',        country:'UAE',          flag:'🇦🇪', stage:'Early Stage', industry:'Fintech',     tags:['Investing','Stocks','Mobile'],          employees:'50+',  followers:'670',   verified:false, founded:2020, about:'Commission-free investing app making global stock markets accessible to Arab retail investors in the GCC.' },
  { id:5,  icon:'🛍️', name:'Tamara',        country:'Saudi Arabia', flag:'🇸🇦', stage:'Series A+',   industry:'Fintech',     tags:['BNPL','Islamic Finance','B2B'],         employees:'300+', followers:'1,100', verified:true,  founded:2020, about:'BNPL and embedded finance platform for Saudi consumers and merchants with Sharia-compliant products.' },
  { id:6,  icon:'🤖', name:'Kader AI',      country:'Jordan',       flag:'🇯🇴', stage:'MVP',         industry:'AI & ML',     tags:['HR','AI','Arabic NLP'],                 employees:'15',   followers:'290',   verified:false, founded:2023, about:'AI-powered HR automation platform built specifically for MENA enterprise HR workflows and Arabic language.' },
  { id:7,  icon:'🚛', name:'Trella',        country:'Egypt',        flag:'🇪🇬', stage:'Series A',    industry:'Logistics',   tags:['Freight','B2B','Marketplace'],          employees:'150+', followers:'520',   verified:true,  founded:2018, about:'Digital freight marketplace reducing empty miles and logistics costs across Egypt and the MENA region.' },
  { id:8,  icon:'🍽️', name:'Foodics',       country:'Saudi Arabia', flag:'🇸🇦', stage:'Series B',    industry:'Foodtech',    tags:['POS','Restaurant','SaaS'],              employees:'300+', followers:'890',   verified:true,  founded:2014, about:'Restaurant POS and management system used by over 20,000 restaurants and food businesses across MENA.' },
  { id:9,  icon:'🏠', name:'Property Finder',country:'UAE',         flag:'🇦🇪', stage:'Growth',      industry:'Proptech',    tags:['Real Estate','Marketplace','Mobile'],   employees:'400+', followers:'2,100', verified:true,  founded:2007, about:'MENA\'s leading property portal connecting buyers, renters, and agents across the Gulf region.' },
];

const INVESTORS = [
  { id:1,  icon:'💰', name:'STV',               country:'Saudi Arabia', flag:'🇸🇦', stage:'Series A+',  industries:['Fintech','Edtech','Logistics','SaaS'],          checkSize:'$5M–$50M',  portfolio:45, followers:'3,200', verified:true,  founded:2018, about:'Saudi Telecom\'s CVC backing top-tier MENA tech companies with patient capital and deep regional networks.' },
  { id:2,  icon:'🦁', name:'Wamda Capital',      country:'UAE',          flag:'🇦🇪', stage:'Seed–A',    industries:['Media','Fintech','Edtech','AI & ML'],           checkSize:'$500K–$5M', portfolio:60, followers:'1,800', verified:true,  founded:2010, about:'MENA\'s entrepreneur-first investment platform with deep operator networks and access to global co-investors.' },
  { id:3,  icon:'🌊', name:'Global Ventures',    country:'UAE',          flag:'🇦🇪', stage:'Series A+',  industries:['Fintech','Healthtech','AI & ML','Logistics'],   checkSize:'$3M–$30M',  portfolio:30, followers:'1,400', verified:true,  founded:2018, about:'Dubai-based VC investing in transformative technology companies globally with a strong MENA lens and network.' },
  { id:4,  icon:'🦅', name:'Vision Ventures',    country:'Saudi Arabia', flag:'🇸🇦', stage:'Seed–B',    industries:['Fintech','SaaS','HR & Work','Dev Tools'],       checkSize:'$1M–$10M',  portfolio:38, followers:'960',   verified:true,  founded:2017, about:'Early-stage Saudi VC focused on deep tech and B2B software innovations targeting the regional enterprise market.' },
  { id:5,  icon:'🔷', name:'Algebra Ventures',   country:'Egypt',        flag:'🇪🇬', stage:'Seed–A',    industries:['Fintech','Edtech','Logistics','E-Commerce'],    checkSize:'$500K–$5M', portfolio:25, followers:'720',   verified:true,  founded:2016, about:'Egypt\'s top VC fund investing in the country\'s fastest-growing tech companies across multiple verticals.' },
  { id:6,  icon:'🐉', name:'Nuwa Capital',        country:'UAE',          flag:'🇦🇪', stage:'Seed–B',    industries:['Fintech','AI & ML','Healthtech','SaaS'],        checkSize:'$1M–$15M',  portfolio:20, followers:'840',   verified:true,  founded:2019, about:'Female-founded VC backing the most ambitious MENA founders across stages with global networks and support.' },
];

const ACCELERATORS = [
  { id:1,  icon:'🚀', name:'Flat6Labs',          country:'Egypt',        flag:'🇪🇬', stage:'Pre-Seed',  industries:['Fintech','Edtech','Healthtech','E-Commerce'],   programs:6,  portfolio:400, followers:'2,100', verified:true,  founded:2011, about:'MENA\'s largest startup accelerator with programs in Cairo, Tunis, Abu Dhabi, Riyadh, Jeddah, and Bahrain.' },
  { id:2,  icon:'⚡', name:'OQAL Angel Network', country:'Saudi Arabia', flag:'🇸🇦', stage:'Angel',     industries:['Fintech','Healthtech','Edtech','SaaS'],          programs:1,  portfolio:130, followers:'980',   verified:true,  founded:2010, about:'Saudi Arabia\'s largest angel investment network connecting high-potential startups with accredited investors.' },
  { id:3,  icon:'🌍', name:'Wamda Accelerator',  country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',  industries:['Media','Fintech','AI & ML','Logistics'],         programs:3,  portfolio:80,  followers:'1,560', verified:true,  founded:2012, about:'Pan-regional accelerator focused on building the MENA entrepreneurship ecosystem through programs and events.' },
  { id:4,  icon:'🏛️', name:'Hub71',              country:'UAE',          flag:'🇦🇪', stage:'Seed',      industries:['Fintech','AI & ML','Smart Cities','Healthtech'], programs:4,  portfolio:200, followers:'3,400', verified:true,  founded:2019, about:'Abu Dhabi\'s global tech ecosystem built on world-class infrastructure, capital, and talent pipelines.' },
  { id:5,  icon:'💡', name:'MIT Enterprise Forum',country:'Saudi Arabia', flag:'🇸🇦', stage:'Pre-Seed',  industries:['Deeptech','AI & ML','Cleantech','Biotech'],      programs:2,  portfolio:60,  followers:'740',   verified:false, founded:2014, about:'Global innovation programs bringing MIT expertise and networks to MENA\'s most ambitious entrepreneurs.' },
  { id:6,  icon:'🔬', name:'AUC Venture Lab',    country:'Egypt',        flag:'🇪🇬', stage:'Pre-Seed',  industries:['Edtech','Healthtech','AI & ML','Cleantech'],     programs:3,  portfolio:90,  followers:'620',   verified:false, founded:2013, about:'Egypt\'s premier university-based accelerator at the American University in Cairo, backing deep-tech founders.' },
];

const VENTURES = [
  { id:1,  icon:'🏗️', name:'Beco Capital',       country:'UAE',          flag:'🇦🇪', stage:'Seed–B',    industries:['Fintech','Edtech','E-Commerce','SaaS'],         portfolio:40, followers:'1,100', verified:true,  founded:2018, about:'Regional VC and studio building next-generation digital platforms across MENA with hands-on operator support.' },
  { id:2,  icon:'🏭', name:'Turn8',               country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',  industries:['Logistics','Proptech','Dev Tools'],             portfolio:60, followers:'680',   verified:true,  founded:2013, about:'Backed by DP World, Turn8 co-builds startups in trade and logistics infrastructure for the MENA region.' },
  { id:3,  icon:'🛠️', name:'Creative Dock',       country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',  industries:['Fintech','Insurtech','Proptech','SaaS'],        portfolio:25, followers:'520',   verified:false, founded:2013, about:'Global venture studio with MENA office, co-founding companies from idea to scale with corporate partners.' },
  { id:4,  icon:'⚡', name:'DTEC Ventures',        country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed',  industries:['AI & ML','Dev Tools','Cybersecurity','SaaS'],  portfolio:30, followers:'440',   verified:false, founded:2015, about:'Dubai Silicon Oasis\'s venture studio incubating deep tech startups with access to global R&D networks.' },
];

const PAGE_CONFIG = {
  startup:     { title:'Startups',                emoji:'🚀', desc:'Browse MENA startups across all industries and countries.',                              data:STARTUPS,     cta:'List Your Startup',   filterStage:false },
  accelerator: { title:'Accelerators & Incubators',emoji:'🏢', desc:'Find the right program to launch and scale your startup across MENA.',                data:ACCELERATORS, cta:'List Your Program',   filterStage:false },
  investor:    { title:'Investment Firms',          emoji:'💰', desc:'Discover the VCs and investment firms actively backing MENA startups.',                data:INVESTORS,    cta:'List Your Firm',      filterStage:true  },
  venture:     { title:'Venture Studios',           emoji:'🎯', desc:'Studios building and co-founding the next generation of MENA startups.',              data:VENTURES,     cta:'List Your Studio',    filterStage:true  },
};

const STAGE_PILL = {
  'Growth':      { bg:'#dcfce7', color:'#16a34a' },
  'Series A':    { bg:'#eff6ff', color:'#2563eb' },
  'Series A+':   { bg:'#eff6ff', color:'#2563eb' },
  'Series B':    { bg:'#fffbeb', color:'#d97706' },
  'Series B+':   { bg:'#fffbeb', color:'#d97706' },
  'Series C':    { bg:'#fef3c7', color:'#b45309' },
  'Seed–A':      { bg:'#dcfce7', color:'#16a34a' },
  'Seed–B':      { bg:'#dcfce7', color:'#16a34a' },
  'Early Stage': { bg:'#f0fdf4', color:'#15803d' },
  'MVP':         { bg:'#fef2f2', color:'#dc2626' },
  'Pre-Seed':    { bg:'#f5f3ff', color:'#7c3aed' },
  'Seed':        { bg:'#dcfce7', color:'#16a34a' },
  'Angel':       { bg:'#fdf4ff', color:'#9333ea' },
};

function FilterDropdown({ label, icon, options, selected, onSelect, onReset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const active = selected.length > 0;
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:20, border:`1.5px solid ${active?'var(--orange)':'#e0e0e0'}`, background:active?'var(--orange-light)':'#fff', color:active?'var(--orange)':'#555', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
        {icon} {label} <span style={{ fontSize:10, opacity:.7 }}>▼</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:200, background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.12)', minWidth:200, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px 6px', fontSize:10, fontWeight:800, letterSpacing:'.08em', color:'#bbb', textTransform:'uppercase' }}>FILTER</div>
          <div style={{ maxHeight:240, overflowY:'auto' }}>
            {options.map(opt => (
              <label key={opt} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', cursor:'pointer', fontSize:13, fontWeight:500, color:'#333' }}
                onMouseOver={e=>e.currentTarget.style.background='#f8f8f8'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => onSelect(opt)}
                  style={{ accentColor:'var(--orange)', width:15, height:15, cursor:'pointer', flexShrink:0 }}/>
                {opt}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div style={{ borderTop:'1px solid #f0f0f0', padding:'8px 14px' }}>
              <button onClick={() => { onReset(); setOpen(false); }}
                style={{ fontSize:12, fontWeight:700, color:'var(--orange)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ListingPage({ onSignIn, onSignUp }) {
  const { type } = useParams();
  const { setEntityModal, setSubmitOpen, setAuthModal } = useUI();
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.startup;

  const [selCountries, setSelCountries] = useState([]);
  const [selIndustries, setSelIndustries] = useState([]);
  const [selStages, setSelStages] = useState([]);

  const toggleFilter = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]);

  const data = config.data.filter(item => {
    const inds = item.industries || (item.industry ? [item.industry] : []);
    const matchC = !selCountries.length  || selCountries.includes(item.country);
    const matchI = !selIndustries.length || inds.some(i => selIndustries.includes(i));
    const matchS = !selStages.length     || selStages.includes(item.stage);
    return matchC && matchI && matchS;
  });

  const allCountries  = [...new Set(config.data.map(i => i.country))].sort();
  const allIndustries = [...new Set(config.data.flatMap(i => i.industries || (i.industry ? [i.industry] : [])))].sort();
  const allStages     = [...new Set(config.data.map(i => i.stage))].sort();

  const hasFilters = selCountries.length + selIndustries.length + selStages.length > 0;

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#fff' }}>

        {/* Page header */}
        <div style={{ borderBottom:'1px solid #f0f0f0', background:'#fff', padding:'36px 40px 28px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20 }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.03em', marginBottom:6, display:'flex', alignItems:'center', gap:10 }}>
                {config.emoji} {config.title}
              </h1>
              <p style={{ fontSize:14, color:'#777', margin:0 }}>{config.desc}</p>
            </div>
            <button onClick={() => { if (onSignUp) onSignUp(); else setAuthModal('signup'); }}
              style={{ flexShrink:0, padding:'10px 20px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 12px rgba(232,98,26,.25)', whiteSpace:'nowrap' }}>
              + {config.cta}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ borderBottom:'1px solid #f0f0f0', background:'#fff', padding:'14px 40px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <FilterDropdown label="Country" icon="🌍" options={allCountries}
              selected={selCountries} onSelect={v => toggleFilter(selCountries, setSelCountries, v)} onReset={() => setSelCountries([])}/>
            <FilterDropdown label="Industry" icon="🏢" options={allIndustries}
              selected={selIndustries} onSelect={v => toggleFilter(selIndustries, setSelIndustries, v)} onReset={() => setSelIndustries([])}/>
            {config.filterStage && (
              <FilterDropdown label="Stage Focus" icon="📊" options={allStages}
                selected={selStages} onSelect={v => toggleFilter(selStages, setSelStages, v)} onReset={() => setSelStages([])}/>
            )}
            {hasFilters && (
              <button onClick={() => { setSelCountries([]); setSelIndustries([]); setSelStages([]); }}
                style={{ padding:'8px 12px', borderRadius:20, border:'none', background:'none', color:'#aaa', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Reset all
              </button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 40px 80px' }}>
          {!data.length ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize:44, marginBottom:16 }}>📂</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Nothing here yet</div>
              <p style={{ color:'#888', marginBottom:24 }}>Be the first to list your {type || 'company'}!</p>
              <button onClick={() => setSubmitOpen(true)} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                + {config.cta}
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
              {data.map(item => {
                const stageStyle = STAGE_PILL[item.stage] || { bg:'#f4f4f4', color:'#555' };
                const industries = item.industries || (item.industry ? [item.industry] : []);
                return (
                  <div key={item.id}
                    style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'all .18s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(232,98,26,.1)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}
                    onClick={() => setEntityModal({ ...item, type:config.title.split(' ')[0], links:item.website?[{icon:'🌐',label:'Website',url:item.website}]:[] })}>
                    <div style={{ padding:'20px 20px 16px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:52, height:52, borderRadius:14, background:'#f4f4f4', border:'1px solid #ebebeb', display:'grid', placeItems:'center', fontSize:24, flexShrink:0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                              <span style={{ fontSize:15, fontWeight:800, color:'#0a0a0a' }}>{item.name}</span>
                              {item.verified && (
                                <span style={{ fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:20, background:'#eff6ff', color:'#2563eb' }}>✓ VERIFIED</span>
                              )}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:11, color:'#888' }}>{item.flag} {item.country}</span>
                              {industries[0] && <><span style={{ color:'#ddd', fontSize:11 }}>•</span><span style={{ fontSize:11, color:'#888' }}>{industries[0]}</span></>}
                            </div>
                          </div>
                        </div>
                        <span style={{ flexShrink:0, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background:stageStyle.bg, color:stageStyle.color }}>
                          {item.stage}
                        </span>
                      </div>

                      {item.founded && <div style={{ fontSize:11, color:'#aaa', marginBottom:8 }}>Est. {item.founded}</div>}

                      <p style={{ fontSize:13, color:'#555', lineHeight:1.6, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', margin:'0 0 12px' }}>
                        {item.about}
                      </p>

                      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                        {(item.tags || industries).slice(0,4).map(tag => (
                          <span key={tag} style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:'#f4f4f4', color:'#666' }}>{tag}</span>
                        ))}
                      </div>

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'1px solid #f5f5f5' }}>
                        <div style={{ display:'flex', gap:14 }}>
                          {(item.employees || item.portfolio) && (
                            <div style={{ fontSize:12, color:'#aaa' }}>
                              <span style={{ fontWeight:700, color:'#333', fontFamily:'DM Mono,monospace' }}>
                                {item.employees ? `👥 ${item.employees}` : `📂 ${item.portfolio}+`}
                              </span>
                              {item.employees ? ' employees' : ' portfolio'}
                            </div>
                          )}
                          {item.followers && (
                            <div style={{ fontSize:12, color:'#aaa' }}>
                              <span style={{ fontWeight:700, color:'#333', fontFamily:'DM Mono,monospace' }}>👤 {item.followers}</span>
                              {' followers'}
                            </div>
                          )}
                        </div>
                        <button style={{ padding:'7px 14px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}
                          onClick={e => { e.stopPropagation(); setEntityModal({ ...item, type:config.title.split(' ')[0], links:item.website?[{icon:'🌐',label:'Website',url:item.website}]:[] }); }}>
                          View Profile →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}
