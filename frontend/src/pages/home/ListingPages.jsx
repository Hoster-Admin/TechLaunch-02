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

const COUNTRY_FLAGS = {
  'Saudi Arabia':'🇸🇦','UAE':'🇦🇪','Egypt':'🇪🇬','Jordan':'🇯🇴',
  'Kuwait':'🇰🇼','Qatar':'🇶🇦','Bahrain':'🇧🇭','Oman':'🇴🇲',
  'Morocco':'🇲🇦','Tunisia':'🇹🇳','Lebanon':'🇱🇧','Iraq':'🇮🇶',
  'Palestine':'🇵🇸','Libya':'🇱🇾','Algeria':'🇩🇿','Sudan':'🇸🇩',
  'Yemen':'🇾🇪','Syria':'🇸🇾','Turkey':'🇹🇷','Pakistan':'🇵🇰',
  'Pan-Arab':'🌍', 'MENA':'🌍',
};

const INDUSTRY_ICONS = {
  'Fintech':'💳','Edtech':'📚','AI & ML':'🤖','Healthtech':'🏥',
  'E-Commerce':'🛒','Logistics':'🚚','Foodtech':'🍔','Proptech':'🏠',
  'Traveltech':'✈️','Cleantech':'♻️','Cybersecurity':'🔒','HR & Work':'👔',
  'Media':'📱','Dev Tools':'⚙️','Web3':'⛓️',
};

const STAGE_OPTIONS = ['Ideation Stage', 'Pre-Seed', 'Seed'];

const TYPE_LABELS = {
  accelerator:    'Accelerator',
  investor:       'Investor',
  venture_studio: 'Venture Studio',
  startup:        'Company',
  company:        'Company',
};

function normalizeEntity(e) {
  const flag = COUNTRY_FLAGS[e.country] || '🌍';
  const tags = [e.industry, e.focus, e.stage].filter(Boolean).slice(0, 3);
  return {
    ...e,
    icon:       e.logo_emoji || '🏢',
    flag,
    about:      e.description || '',
    portfolio:  e.portfolio_count || null,
    founded:    e.founded_year || null,
    industries: e.industry ? [e.industry] : [],
    tags,
    type:       TYPE_LABELS[e.type] || e.type,
  };
}

const PAGE_CONFIG = {
  startup:     { title:'Companies',               emoji:'🚀', desc:'Browse MENA companies and products.',                                      cta:'List Your Company', filters:['country','industry'], cardType:'startup',  apiType:'startup'        },
  company:     { title:'Companies',               emoji:'🚀', desc:'Browse MENA companies and products.',                                      cta:'List Your Company', filters:['country','industry'], cardType:'startup',  apiType:'startup'        },
  accelerator: { title:'Accelerators & Incubators',emoji:'🏢', desc:'Find the right program to launch and scale your company across MENA.',  cta:'List Your Program', filters:['country','industry'], cardType:'entity',   apiType:'accelerator'    },
  investor:    { title:'Investment Firms',         emoji:'💰', desc:'Discover the VCs and investment firms actively backing MENA companies.',  cta:'List Your Firm',    filters:['stage','country'],   cardType:'entity',   apiType:'investor'       },
  venture:     { title:'Venture Studios',          emoji:'🎯', desc:'Studios building and co-founding the next generation of MENA companies.', cta:'List Your Studio',  filters:['stage','country'],   cardType:'entity',   apiType:'venture_studio' },
};

function FilterDropdown({ label, icon, options, selected, onToggle, onReset, getOptionIcon }) {
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
          <div style={{ maxHeight:240, overflowY:'auto', display:'flex', flexDirection:'column' }}>
            {filtered.map(opt => (
              <label key={opt} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', fontSize:13, fontWeight:500, color:'#333', background: selected.includes(opt)?'#fff5f3':'transparent' }}
                onMouseOver={e=>e.currentTarget.style.background='#fff5f3'} onMouseOut={e=>e.currentTarget.style.background=selected.includes(opt)?'#fff5f3':'transparent'}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} style={{ accentColor:'var(--orange)', width:15, height:15, cursor:'pointer', flexShrink:0 }}/>
                {getOptionIcon && <span style={{ fontSize:15, flexShrink:0 }}>{getOptionIcon(opt)}</span>}
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
        {item.employees && (
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:14 }}>👥</span>
            <span><b style={{ color:'#0a0a0a', fontWeight:800 }}>{item.employees}</b> employees</span>
          </div>
        )}
        <button className="btn-entity-more" style={{ marginLeft:'auto' }} onClick={e => { e.stopPropagation(); onClick(); }}>
          View Profile →
        </button>
      </div>
    </div>
  );
}

function MemberAvatar({ u }) {
  const colors = { sky:'#0ea5e9', violet:'#7c3aed', emerald:'#059669', orange:'#E15033', pink:'#ec4899', amber:'#d97706' };
  const bg = colors[u.avatar_color] || '#E15033';
  const initials = (u.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div title={`${u.name} (@${u.handle})`} style={{ width:26, height:26, borderRadius:'50%', background:bg, color:'#fff', fontSize:11, fontWeight:800, display:'grid', placeItems:'center', border:'2px solid #fff', flexShrink:0 }}>
      {initials}
    </div>
  );
}

function EntityCard({ item, type, teamMembers, onClick }) {
  const meta = `${item.flag} ${item.country} · ${item.type}`;
  return (
    <div className="entity-card" onClick={onClick}>
      <div className="entity-card-top">
        <div className="entity-logo">{item.icon}</div>
        <div className="entity-name-row">
          <div className="entity-name">{item.name}</div>
          <div className="entity-meta">{meta}</div>
        </div>
      </div>

      <div className="entity-desc">{item.about}</div>

      <div className="entity-tags">
        {item.tags.map(t => <span key={t} className="meta-tag">{t}</span>)}
      </div>

      {teamMembers && teamMembers.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 0 0', borderTop:'1px solid #f5f5f5', marginTop:8 }}>
          <div style={{ display:'flex' }}>
            {teamMembers.slice(0,4).map((u,i) => (
              <div key={u.id} style={{ marginLeft: i>0 ? -8 : 0 }}>
                <MemberAvatar u={u}/>
              </div>
            ))}
          </div>
          <span style={{ fontSize:11, fontWeight:600, color:'#888' }}>
            {teamMembers[0].name}{teamMembers.length > 1 ? ` +${teamMembers.length-1} more` : ''} · Associated Account{teamMembers.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

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

  const [rawData,       setRawData]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selCountries,  setSelCountries]  = useState([]);
  const [selIndustries, setSelIndustries] = useState([]);
  const [selStages,     setSelStages]     = useState([]);
  const [members,       setMembers]       = useState({});

  useEffect(() => {
    setLoading(true);
    setRawData([]);
    fetch(`/api/entities?type=${config.apiType}&limit=200`)
      .then(r => r.json())
      .then(d => { if (d.success) setRawData(d.data.map(normalizeEntity)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [config.apiType]);

  useEffect(() => {
    fetch('/api/users/entity-members/all')
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        const map = {};
        d.data.forEach(u => {
          const key = (u.entity_name || '').toLowerCase();
          if (!map[key]) map[key] = [];
          map[key].push(u);
        });
        setMembers(map);
      })
      .catch(() => {});
  }, []);

  const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val]);

  const data = rawData.filter(item => {
    const inds  = item.industries || (item.industry ? [item.industry] : []);
    const stage = item.stage || '';
    const matchC = !selCountries.length  || selCountries.includes(item.country);
    const matchI = !selIndustries.length || inds.some(i => selIndustries.includes(i));
    const matchS = !selStages.length     || selStages.includes(stage);
    return matchC && matchI && matchS;
  });

  const allCountries  = [...new Set(rawData.map(i => i.country))].sort();
  const allIndustries = [...new Set(rawData.flatMap(i => i.industries || (i.industry?[i.industry]:[])))].sort();
  const allStages     = [...new Set(rawData.map(i => i.stage))].filter(Boolean).sort();
  const hasFilters    = selCountries.length + selIndustries.length + selStages.length > 0;

  const openModal = (item) => setEntityModal({
    ...item,
    links: item.website ? [{ icon:'🌐', label:'Website', url:item.website }] : [],
    teamMembers: members[(item.name||'').toLowerCase()] || [],
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
              <FilterDropdown label="Stage Focus" icon="📊" options={STAGE_OPTIONS}
                selected={selStages} onToggle={v => toggle(selStages, setSelStages, v)} onReset={() => setSelStages([])}/>
            )}
            <FilterDropdown label="Country" icon="🌍" options={allCountries}
              selected={selCountries} onToggle={v => toggle(selCountries, setSelCountries, v)} onReset={() => setSelCountries([])}
              getOptionIcon={c => COUNTRY_FLAGS[c] || '🌍'}/>
            {config.filters.includes('industry') && (
              <FilterDropdown label="Industry" icon="🏭" options={allIndustries}
                selected={selIndustries} onToggle={v => toggle(selIndustries, setSelIndustries, v)} onReset={() => setSelIndustries([])}
                getOptionIcon={ind => INDUSTRY_ICONS[ind] || '🏭'}/>
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
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background:'#f5f5f5', borderRadius:16, height:220, animation:'pulse 1.5s ease-in-out infinite' }}/>
              ))}
            </div>
          ) : !data.length ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize:44, marginBottom:16 }}>📂</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Nothing here yet</div>
              <p style={{ color:'#888', marginBottom:24 }}>Check back soon — new listings are added regularly.</p>
              <button onClick={() => setAuthModal('signup')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                + {config.cta}
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
              {data.map(item =>
                config.cardType === 'startup'
                  ? <StartupCard key={item.id} item={item} onClick={() => openModal(item)}/>
                  : <EntityCard  key={item.id} item={item} type={type} teamMembers={members[(item.name||'').toLowerCase()]||[]} onClick={() => openModal(item)}/>
              )}
            </div>
          )}
        </div>

      </div>
      <Footer/>
    </>
  );
}
