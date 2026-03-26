import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useUI } from '../../context/UIContext';

const STAGE_COLORS = {
  'Ideation Stage':{ bg:'#f0fdf4', color:'#15803d' },
  'Pre-Seed':    { bg:'#f5f3ff', color:'#7c3aed' },
  'Seed':        { bg:'#dcfce7', color:'#16a34a' },
  'MVP':         { bg:'#fef2f2', color:'#dc2626' },
  'Early Stage': { bg:'#fffbeb', color:'#d97706' },
  'Series A':    { bg:'#eff6ff', color:'#2563eb' },
  'Series A+':   { bg:'#eff6ff', color:'#2563eb' },
  'Series B':    { bg:'#fffbeb', color:'#d97706' },
  'Series B+':   { bg:'#fffbeb', color:'#d97706' },
  'Series C':    { bg:'#fef3c7', color:'#b45309' },
  'Seed–A':      { bg:'#dcfce7', color:'#16a34a' },
  'Seed–B':      { bg:'#dcfce7', color:'#16a34a' },
  'Growth':      { bg:'#fdf4ff', color:'#7c3aed' },
  'Pre-IPO':     { bg:'#fff1f2', color:'#be123c' },
  'Angel':       { bg:'#fdf4ff', color:'#9333ea' },
};

const STARTUPS = [
  { id:1,  icon:'💳', name:'Tabby',          country:'UAE',          flag:'🇦🇪', stage:'Growth',      industry:'Fintech',     tags:['BNPL','Payments','Consumer'],         employees:'200+', followers:1240, verified:true,  founded:2019, about:'Buy now, pay later platform serving millions of shoppers across UAE, Saudi Arabia, and the broader MENA region.' },
  { id:2,  icon:'📚', name:'Noon Academy',   country:'Saudi Arabia', flag:'🇸🇦', stage:'Growth',      industry:'Edtech',      tags:['Education','Social','Mobile'],         employees:'100+', followers:980,  verified:true,  founded:2017, about:'Social learning app connecting students and teachers across the Arab world with live and on-demand classes.' },
  { id:3,  icon:'🏥', name:'Vezeeta',        country:'Egypt',        flag:'🇪🇬', stage:'Series A+',   industry:'Healthtech',  tags:['Healthcare','Booking','SaaS'],         employees:'500+', followers:1560, verified:true,  founded:2012, about:'Leading digital health platform for booking doctors and managing patient records across Egypt and the MENA region.' },
  { id:4,  icon:'📈', name:'Baraka',         country:'UAE',          flag:'🇦🇪', stage:'Early Stage', industry:'Fintech',     tags:['Investing','Stocks','Mobile'],         employees:'50+',  followers:670,  verified:false, founded:2020, about:'Commission-free investing app making global stock markets accessible to Arab retail investors in the GCC.' },
  { id:5,  icon:'🛍️', name:'Tamara',         country:'Saudi Arabia', flag:'🇸🇦', stage:'Series A+',   industry:'Fintech',     tags:['BNPL','Islamic Finance','B2B'],        employees:'300+', followers:1100, verified:true,  founded:2020, about:'BNPL and embedded finance platform for Saudi consumers and merchants with Sharia-compliant products.' },
  { id:6,  icon:'🤖', name:'Kader AI',       country:'Jordan',       flag:'🇯🇴', stage:'Ideation Stage',industry:'AI & ML',     tags:['HR','AI','Arabic NLP'],                employees:'15',   followers:290,  verified:false, founded:2023, about:'AI-powered HR automation platform built specifically for MENA enterprise HR workflows and Arabic language.' },
  { id:7,  icon:'🚛', name:'Trella',         country:'Egypt',        flag:'🇪🇬', stage:'Series A',    industry:'Logistics',   tags:['Freight','B2B','Marketplace'],         employees:'150+', followers:520,  verified:true,  founded:2018, about:'Digital freight marketplace reducing empty miles and logistics costs across Egypt and the MENA region.' },
  { id:8,  icon:'🍽️', name:'Foodics',        country:'Saudi Arabia', flag:'🇸🇦', stage:'Series B',    industry:'Foodtech',    tags:['POS','Restaurant','SaaS'],             employees:'300+', followers:890,  verified:true,  founded:2014, about:'Restaurant POS and management system used by over 20,000 restaurants and food businesses across MENA.' },
  { id:9,  icon:'🏠', name:'Property Finder',country:'UAE',          flag:'🇦🇪', stage:'Series C',    industry:'Proptech',    tags:['Real Estate','Marketplace','Mobile'],  employees:'400+', followers:2100, verified:true,  founded:2007, about:"MENA's leading property portal connecting buyers, renters, and agents across the Gulf region." },
  { id:10, icon:'🎓', name:'Almentor',       country:'Egypt',        flag:'🇪🇬', stage:'Series A',    industry:'Edtech',      tags:['E-Learning','Arabic','Content'],       employees:'80+',  followers:460,  verified:false, founded:2016, about:'Arabic online learning platform with thousands of video courses for Arab professionals and students.' },
  { id:11, icon:'🏦', name:'Fawry',          country:'Egypt',        flag:'🇪🇬', stage:'Pre-IPO',     industry:'Fintech',     tags:['Payments','E-Commerce','B2B'],         employees:'2000+',followers:3200, verified:true,  founded:2008, about:"Egypt's largest fintech company powering digital payments for over 30 million users across Egypt." },
  { id:12, icon:'🔬', name:'Cura',           country:'Saudi Arabia', flag:'🇸🇦', stage:'Seed',        industry:'Healthtech',  tags:['Mental Health','Therapy','Online'],    employees:'30+',  followers:210,  verified:false, founded:2022, about:'Mental health therapy online for MENA — connecting patients with licensed therapists in Arabic and English.' },
];

const INVESTORS = [
  { id:1, icon:'💼', name:'STV',              country:'Saudi Arabia', flag:'🇸🇦', stage:'Series A', type:'VC Fund',  tags:['Series A','Tech','Saudi'],            portfolio:45, aum:'$500M+', verified:true,  founded:'2017', about:'Saudi Technology Ventures — the largest dedicated tech VC in MENA. Backed by Saudi Aramco and STC.' },
  { id:2, icon:'🌟', name:'Wamda Capital',    country:'UAE',          flag:'🇦🇪', stage:'Seed',     type:'VC Fund',  tags:['Seed','Early Stage','MENA'],          portfolio:60, aum:'$75M',   verified:true,  founded:'2012', about:'Pioneering MENA VC investing in early-stage tech startups with strong founder ecosystem focus.' },
  { id:3, icon:'🔢', name:'500 Global MENA', country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed', type:'Micro VC', tags:['Pre-Seed','Seed','Global'],           portfolio:120,aum:'$30M',   verified:true,  founded:'2015', about:'Regional arm of 500 Global investing in pre-seed and seed-stage MENA startups at high volume.' },
  { id:4, icon:'⚡', name:"Wa'ed Ventures",  country:'Saudi Arabia', flag:'🇸🇦', stage:'Seed',     type:'CVC',      tags:['Energy Tech','Deep Tech','Industrial'],portfolio:38, aum:'$200M',  verified:true,  founded:'2011', about:"Aramco's entrepreneurship arm investing in Saudi and MENA energy tech and deep tech startups." },
  { id:5, icon:'🔬', name:'Algebra Ventures', country:'Egypt',        flag:'🇪🇬', stage:'Seed',     type:'VC Fund',  tags:['Egypt','Seed','Series A'],            portfolio:30, aum:'$54M',   verified:true,  founded:'2016', about:'Egypt-focused VC fund backing ambitious tech founders from pre-seed to Series A.' },
  { id:6, icon:'🏔️', name:'BECO Capital',    country:'UAE',          flag:'🇦🇪', stage:'Series A', type:'VC Fund',  tags:['Series A','B2B','SaaS'],              portfolio:25, aum:'$120M',  verified:true,  founded:'2012', about:'Dubai-based VC investing in high-growth MENA tech companies at Series A and B with hands-on support.' },
];

const ACCELERATORS = [
  { id:1, icon:'🚀', name:'Flat6Labs',           country:'Egypt',        flag:'🇪🇬', stage:'Pre-Seed', type:'Accelerator', tags:['Fintech','Edtech','Healthtech'],   programs:6,  portfolio:400, followers:2100, verified:true,  founded:'2011', about:"MENA's largest startup accelerator with programs in Cairo, Tunis, Abu Dhabi, Riyadh, Jeddah, and Bahrain." },
  { id:2, icon:'⚡', name:'OQAL Angel Network',  country:'Saudi Arabia', flag:'🇸🇦', stage:'Angel',    type:'Angel Network',tags:['Fintech','Healthtech','Edtech'],   programs:1,  portfolio:130, followers:980,  verified:true,  founded:'2010', about:"Saudi Arabia's largest angel investment network connecting high-potential startups with accredited investors." },
  { id:3, icon:'🌍', name:'Wamda Accelerator',   country:'UAE',          flag:'🇦🇪', stage:'Pre-Seed', type:'Accelerator', tags:['Media','Fintech','Logistics'],     programs:3,  portfolio:80,  followers:1560, verified:true,  founded:'2012', about:'Pan-regional accelerator focused on building the MENA entrepreneurship ecosystem through programs and events.' },
  { id:4, icon:'🏛️', name:'Hub71',              country:'UAE',          flag:'🇦🇪', stage:'Seed',     type:'Tech Hub',    tags:['Fintech','AI & ML','Smart Cities'],programs:4,  portfolio:200, followers:3400, verified:true,  founded:'2019', about:"Abu Dhabi's global tech ecosystem built on world-class infrastructure, capital, and talent pipelines." },
  { id:5, icon:'💡', name:'MIT Enterprise Forum', country:'Saudi Arabia', flag:'🇸🇦', stage:'Pre-Seed', type:'Accelerator', tags:['Deeptech','AI & ML','Cleantech'],  programs:2,  portfolio:60,  followers:740,  verified:false, founded:'2014', about:'Global innovation programs bringing MIT expertise and networks to MENA\'s most ambitious entrepreneurs.' },
  { id:6, icon:'🔬', name:'AUC Venture Lab',     country:'Egypt',        flag:'🇪🇬', stage:'Pre-Seed', type:'University',  tags:['Edtech','Healthtech','Cleantech'], programs:3,  portfolio:90,  followers:620,  verified:false, founded:'2013', about:"Egypt's premier university-based accelerator at the American University in Cairo, backing deep-tech founders." },
];

const VENTURES = [
  { id:1, icon:'🏗️', name:'Beco Capital',  country:'UAE', flag:'🇦🇪', stage:'Seed–B',    type:'Venture Studio', tags:['Fintech','Edtech','SaaS'],          portfolio:40, aum:'–',    verified:true,  founded:'2018', about:'Regional VC and studio building next-generation digital platforms across MENA with hands-on operator support.' },
  { id:2, icon:'🏭', name:'Turn8',          country:'UAE', flag:'🇦🇪', stage:'Pre-Seed',  type:'Corp Studio',    tags:['Logistics','Proptech','Dev Tools'], portfolio:60, aum:'–',    verified:true,  founded:'2013', about:'Backed by DP World, Turn8 co-builds startups in trade and logistics infrastructure for the MENA region.' },
  { id:3, icon:'🛠️', name:'Creative Dock',  country:'UAE', flag:'🇦🇪', stage:'Pre-Seed',  type:'Global Studio',  tags:['Fintech','Insurtech','Proptech'],   portfolio:25, aum:'–',    verified:false, founded:'2013', about:'Global venture studio with MENA office, co-founding companies from idea to scale with corporate partners.' },
  { id:4, icon:'⚡', name:'DTEC Ventures',  country:'UAE', flag:'🇦🇪', stage:'Pre-Seed',  type:'Deep Tech',      tags:['AI & ML','Dev Tools','Cybersecurity'],portfolio:30, aum:'–',   verified:false, founded:'2015', about:"Dubai Silicon Oasis's venture studio incubating deep tech startups with access to global R&D networks." },
];

const STARTUP_CONFIG = { title:'Companies', emoji:'🚀', desc:'Browse MENA startups across all industries and countries.', data:STARTUPS, cta:'List Your Company', filters:['country','industry'], cardType:'startup' };
const PAGE_CONFIG = {
  startup:     STARTUP_CONFIG,
  company:     STARTUP_CONFIG,
  accelerator: { title:'Accelerators & Incubators',emoji:'🏢', desc:'Find the right program to launch and scale your startup across MENA.',       data:ACCELERATORS, cta:'List Your Program',  filters:['country','industry'], cardType:'entity' },
  investor:    { title:'Investment Firms',          emoji:'💰', desc:'Discover the VCs and investment firms actively backing MENA startups.',      data:INVESTORS,    cta:'List Your Firm',     filters:['stage','country'],   cardType:'entity' },
  venture:     { title:'Venture Studios',           emoji:'🎯', desc:'Studios building and co-founding the next generation of MENA startups.',     data:VENTURES,     cta:'List Your Studio',   filters:['stage','country'],   cardType:'entity' },
};

function FilterDropdown({ label, icon, options, selected, onToggle, onReset }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); }};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const active = selected.length > 0;
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:20, border:`1.5px solid ${active?'var(--orange)':'#e0e0e0'}`, background:active?'var(--orange-light)':'#fff', color:active?'var(--orange)':'#555', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
        {icon} {label} {active && `(${selected.length})`} <span style={{ fontSize:10, opacity:.7 }}>▼</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:500, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.14)', minWidth:220, overflow:'hidden' }}>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`}
            style={{ width:'100%', padding:'10px 14px', border:'none', borderBottom:'1px solid #f0f0f0', fontFamily:'Inter,sans-serif', fontSize:13, outline:'none', background:'#fafafa', boxSizing:'border-box' }}/>
          <div style={{ maxHeight:240, overflowY:'auto' }}>
            {filtered.map(opt => (
              <label key={opt} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', fontSize:13, fontWeight:500, color:'#333', background: selected.includes(opt)?'#fff5f3':'transparent' }}
                onMouseOver={e=>e.currentTarget.style.background='#fff5f3'} onMouseOut={e=>e.currentTarget.style.background=selected.includes(opt)?'#fff5f3':'transparent'}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} style={{ accentColor:'var(--orange)', width:15, height:15, cursor:'pointer', flexShrink:0 }}/>
                {opt}
              </label>
            ))}
            {!filtered.length && <div style={{ padding:'14px', fontSize:12, color:'#bbb' }}>No results</div>}
          </div>
          {selected.length > 0 && (
            <div style={{ borderTop:'1px solid #f0f0f0', padding:'8px 14px' }}>
              <button onClick={() => { onReset(); setOpen(false); setQ(''); }}
                style={{ fontSize:12, fontWeight:700, color:'var(--orange)', background:'none', border:'none', cursor:'pointer', padding:0 }}>Clear filter</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StartupCard({ item, onClick }) {
  const sc = STAGE_COLORS[item.stage] || { bg:'#f4f4f4', color:'#666' };
  return (
    <div className="startup-card" onClick={onClick}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'#f5f5f5', border:'1px solid #eee', display:'grid', placeItems:'center', fontSize:28, flexShrink:0 }}>
          {item.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:3 }}>
            <span style={{ fontSize:15, fontWeight:900, letterSpacing:'-.02em' }}>{item.name}</span>
          </div>
          <div style={{ fontSize:12, color:'#888', display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
            <span>{item.flag} {item.country}</span>
            <span style={{ color:'#ddd' }}>·</span>
            <span>{item.industry}</span>
            {item.founded && <><span style={{ color:'#ddd' }}>·</span><span>Est. {item.founded}</span></>}
          </div>
        </div>
      </div>

      <p style={{ fontSize:13, color:'#555', lineHeight:1.65, marginBottom:14, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.about}</p>

      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:16 }}>
        {item.tags.map(t => <span key={t} className="meta-tag">{t}</span>)}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:14, paddingTop:14, borderTop:'1px solid #f0f0f0', fontSize:12, color:'#999', marginTop:'auto' }}>
        <button className="btn-entity-more" style={{ marginLeft:'auto' }} onClick={e => { e.stopPropagation(); onClick(); }}>
          View Profile →
        </button>
      </div>
    </div>
  );
}

function EntityCard({ item, type, onClick }) {
  const meta = type === 'investor'
    ? `${item.flag} ${item.country} · ${item.type}`
    : type === 'venture'
    ? `${item.flag} ${item.country} · ${item.type}`
    : `${item.flag} ${item.country} · ${item.type}`;
  return (
    <div className="entity-card" onClick={onClick}>
      <div className="entity-card-top">
        <div className="entity-logo">{item.icon}</div>
        <div className="entity-name-row">
          <div className="entity-name">
            {item.name}
          </div>
          <div className="entity-meta">{meta}</div>
        </div>
      </div>

      <div className="entity-desc">{item.about}</div>

      <div className="entity-tags">
        {item.tags.map(t => <span key={t} className="meta-tag">{t}</span>)}
      </div>

      <div className="entity-card-footer">
        <div style={{ display:'flex', gap:16 }}>
          {item.portfolio && (
            <div className="entity-stat"><strong>{item.portfolio} cos</strong> Portfolio</div>
          )}
          {item.aum && item.aum !== '–' && (
            <div className="entity-stat"><strong>{item.aum}</strong></div>
          )}
          {item.programs && (
            <div className="entity-stat"><strong>{item.programs}</strong> Programs</div>
          )}
        </div>
        <button className="btn-entity-more" onClick={e => { e.stopPropagation(); onClick(); }}>More →</button>
      </div>
    </div>
  );
}

export default function ListingPage() {
  const { type } = useParams();
  const { setEntityModal, setAuthModal } = useUI();
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.startup;

  const [selCountries,  setSelCountries]  = useState([]);
  const [selIndustries, setSelIndustries] = useState([]);
  const [selStages,     setSelStages]     = useState([]);

  const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]);

  const data = config.data.filter(item => {
    const inds  = item.industries || (item.industry ? [item.industry] : []);
    const stage = item.stage || '';
    const matchC = !selCountries.length  || selCountries.includes(item.country);
    const matchI = !selIndustries.length || inds.some(i => selIndustries.includes(i));
    const matchS = !selStages.length     || selStages.includes(stage);
    return matchC && matchI && matchS;
  });

  const allCountries  = [...new Set(config.data.map(i => i.country))].sort();
  const allIndustries = [...new Set(config.data.flatMap(i => i.industries || (i.industry?[i.industry]:[])))].sort();
  const allStages     = [...new Set(config.data.map(i => i.stage))].filter(Boolean).sort();
  const hasFilters    = selCountries.length + selIndustries.length + selStages.length > 0;

  const openModal = (item) => setEntityModal({
    ...item,
    type: config.title.split(' ')[0],
    links: item.website ? [{ icon:'🌐', label:'Website', url:item.website }] : [],
  });

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#fff' }}>

        {/* Page header */}
        <div style={{ borderBottom:'1px solid #f0f0f0', background:'#fff', padding:'36px 40px 28px' }}>
          <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20 }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.03em', marginBottom:6, display:'flex', alignItems:'center', gap:10 }}>
                {config.emoji} {config.title}
              </h1>
              <p style={{ fontSize:14, color:'#777', margin:0 }}>{config.desc}</p>
            </div>
            <button onClick={() => setAuthModal('signup')}
              style={{ flexShrink:0, padding:'10px 20px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 12px rgba(232,98,26,.25)', whiteSpace:'nowrap' }}>
              + {config.cta}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ borderBottom:'1px solid #f0f0f0', background:'#fff', padding:'14px 40px' }}>
          <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {config.filters.includes('stage') && (
              <FilterDropdown label="Stage Focus" icon="📊" options={allStages}
                selected={selStages} onToggle={v => toggle(selStages, setSelStages, v)} onReset={() => setSelStages([])}/>
            )}
            <FilterDropdown label="Country" icon="🌍" options={allCountries}
              selected={selCountries} onToggle={v => toggle(selCountries, setSelCountries, v)} onReset={() => setSelCountries([])}/>
            {config.filters.includes('industry') && (
              <FilterDropdown label="Industry" icon="🏭" options={allIndustries}
                selected={selIndustries} onToggle={v => toggle(selIndustries, setSelIndustries, v)} onReset={() => setSelIndustries([])}/>
            )}
            {hasFilters && (
              <button onClick={() => { setSelCountries([]); setSelIndustries([]); setSelStages([]); }}
                style={{ padding:'8px 12px', borderRadius:20, border:'none', background:'none', color:'#aaa', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Reset all
              </button>
            )}
          </div>
        </div>

        {/* Cards grid */}
        <div style={{ maxWidth:1140, margin:'0 auto', padding:'32px 40px 80px' }}>
          {!data.length ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize:44, marginBottom:16 }}>📂</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Nothing here yet</div>
              <p style={{ color:'#888', marginBottom:24 }}>Be the first to list your {type || 'company'}!</p>
              <button onClick={() => setAuthModal('signup')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                + {config.cta}
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
              {data.map(item =>
                config.cardType === 'startup'
                  ? <StartupCard key={item.id} item={item} onClick={() => openModal(item)}/>
                  : <EntityCard  key={item.id} item={item} type={type} onClick={() => openModal(item)}/>
              )}
            </div>
          )}
        </div>

      </div>
      <Footer/>
    </>
  );
}
