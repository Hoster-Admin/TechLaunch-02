import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';


const INDUSTRIES = ['Fintech','Edtech','AI & ML','Healthtech','E-Commerce','Logistics','Foodtech','Proptech','Traveltech','Cleantech','Cybersecurity','HR & Work','Media','Dev Tools','Web3'];
const INDUSTRY_ICONS = {
  'Fintech':'💳','Edtech':'📚','AI & ML':'🤖','Healthtech':'🏥',
  'E-Commerce':'🛒','Logistics':'🚚','Foodtech':'🍔','Proptech':'🏠',
  'Traveltech':'✈️','Cleantech':'♻️','Cybersecurity':'🔒','HR & Work':'👔',
  'Media':'📱','Dev Tools':'⚙️','Web3':'⛓️',
};
const STAGES = ['Idea Stage','Pre-Seed','Seed','Series A','Series B+','Bootstrapped'];

const COUNTRIES = [
  ['sa','🇸🇦 Saudi Arabia'],['ae','🇦🇪 UAE'],       ['eg','🇪🇬 Egypt'],
  ['jo','🇯🇴 Jordan'],     ['ma','🇲🇦 Morocco'],   ['kw','🇰🇼 Kuwait'],
  ['qa','🇶🇦 Qatar'],      ['bh','🇧🇭 Bahrain'],   ['tn','🇹🇳 Tunisia'],
  ['lb','🇱🇧 Lebanon'],    ['iq','🇮🇶 Iraq'],       ['om','🇴🇲 Oman'],
  ['ly','🇱🇾 Libya'],      ['dz','🇩🇿 Algeria'],    ['sy','🇸🇾 Syria'],
  ['ye','🇾🇪 Yemen'],      ['ps','🇵🇸 Palestine'],  ['sd','🇸🇩 Sudan'],
];

const COUNTRY_MATCH = {
  sa:'saudi arabia', ae:'uae', eg:'egypt', jo:'jordan', ma:'morocco',
  kw:'kuwait', qa:'qatar', bh:'bahrain', tn:'tunisia', lb:'lebanon',
  iq:'iraq', om:'oman', ly:'libya', dz:'algeria', sy:'syria',
  ye:'yemen', ps:'palestine', sd:'sudan',
};

export default function AllProductsPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, votes, toggleVote, setWaitlistModal } = useUI();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState(searchParams.get('q') || '');

  const [selIndustries, setSelIndustries] = useState(searchParams.get('industry') ? [searchParams.get('industry')] : []);
  const [selCountries, setSelCountries]   = useState([]);
  const [selStage,     setSelStage]       = useState(searchParams.get('stage') || '');
  const [sortBy, setSortBy] = useState('top');

  const [industryOpen, setIndustryOpen] = useState(false);
  const [countryOpen,  setCountryOpen]  = useState(false);

  const indRef  = useRef(null);
  const ctryRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    productsAPI.list({ sort:'top', limit:100, status:'live,soon' })
      .then(({ data }) => { setProducts(data.data || []); })
      .catch(() => { setProducts([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchQ(q);
  }, [searchParams]);

  useEffect(() => {
    const handler = (e) => {
      if (indRef.current  && !indRef.current.contains(e.target))  setIndustryOpen(false);
      if (ctryRef.current && !ctryRef.current.contains(e.target)) setCountryOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleIndustry = (ind) => setSelIndustries(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  const toggleCountry  = (code) => setSelCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const handleStageChange = (val) => {
    setSelStage(val);
    setSearchParams(prev => {
      if (val) { prev.set('stage', val); } else { prev.delete('stage'); }
      return prev;
    }, { replace: true });
  };

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'top')   return (b.upvotes_count||0) - (a.upvotes_count||0);
    if (sortBy === 'new')   return b.id - a.id;
    if (sortBy === 'soon')  return (a.status === 'soon' ? -1 : 1);
    if (sortBy === 'alpha') return a.name.localeCompare(b.name);
    return 0;
  });

  const filtered = sorted.filter(p => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.tagline||'').toLowerCase().includes(q) || (p.industry||'').toLowerCase().includes(q);
    const matchI = !selIndustries.length || selIndustries.includes(p.industry);
    const matchC = !selCountries.length  || selCountries.some(c => (p.country||'').toLowerCase().includes(COUNTRY_MATCH[c] || c));
    const matchS = !selStage || (p.stage || '').toLowerCase() === selStage.toLowerCase();
    return matchQ && matchI && matchC && matchS;
  });

  const hasFilters = selIndustries.length || selCountries.length || searchQ || selStage;

  const clearAll = () => { setSelIndustries([]); setSelCountries([]); setSearchQ(''); setSelStage(''); setSearchParams({}, { replace: true }); };

  const btnBase = { padding:'8px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" };
  const dropMenuStyle = { position:'absolute', top:'calc(100% + 6px)', left:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:10, width:220, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:500 };

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#fafafa', fontFamily:"'DM Sans',sans-serif" }}>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px clamp(16px,3vw,32px) 80px' }}>

          {/* Header */}
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:'clamp(20px,4vw,28px)', fontWeight:900, letterSpacing:'-.03em', marginBottom:6, lineHeight:1.2 }}>
              All Products <span style={{ color:'var(--orange)' }}>on Tech Launch</span>
            </h1>
            <p style={{ fontSize:14, color:'#aaa', fontWeight:500 }}>
              Discover every product built for the MENA region. Search, filter, and explore.
            </p>
          </div>

          {/* Search */}
          <div style={{ position:'relative', marginBottom:20 }}>
            <svg style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchQ} onChange={e => {
                const val = e.target.value;
                setSearchQ(val);
                setSearchParams(prev => {
                  if (val) { prev.set('q', val); } else { prev.delete('q'); }
                  return prev;
                }, { replace: true });
              }}
              placeholder="Search by name, tagline, or category…" autoComplete="off"
              style={{ width:'100%', padding:'14px 16px 14px 46px', borderRadius:14, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', background:'#fff', color:'#0a0a0a', boxSizing:'border-box', boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
          </div>

          {/* Filters row */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24, alignItems:'center' }}>

            {/* Industry multi-select */}
            <div style={{ position:'relative' }} ref={indRef}>
              <button onClick={() => { setIndustryOpen(o=>!o); setCountryOpen(false); }}
                style={{ ...btnBase, borderColor: selIndustries.length ? 'var(--orange)' : '#e8e8e8', color: selIndustries.length ? 'var(--orange)' : '#555', background: selIndustries.length ? 'var(--orange-light)' : '#fff' }}>
                🏭 {selIndustries.length === 1 ? selIndustries[0] : selIndustries.length > 1 ? `${selIndustries.length} Industries` : 'All Industries'} <span style={{ fontSize:10 }}>▼</span>
              </button>
              {industryOpen && (
                <div style={dropMenuStyle}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#aaa', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Industry</span>
                    {selIndustries.length > 0 && <span onClick={() => setSelIndustries([])} style={{ cursor:'pointer', color:'var(--orange)', fontWeight:700, fontSize:10 }}>Clear</span>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:1, maxHeight:260, overflowY:'auto' }}>
                    {INDUSTRIES.map(ind => (
                      <label key={ind} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}
                        onMouseOver={e=>e.currentTarget.style.background='#f8f8f8'} onMouseOut={e=>e.currentTarget.style.background=''}>
                        <input type="checkbox" checked={selIndustries.includes(ind)} onChange={() => toggleIndustry(ind)} style={{ accentColor:'var(--orange)', width:14, height:14 }}/>
                        <span style={{ fontSize:15 }}>{INDUSTRY_ICONS[ind] || '🏭'}</span>
                        {ind}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Country multi-select */}
            <div style={{ position:'relative' }} ref={ctryRef}>
              <button onClick={() => { setCountryOpen(o=>!o); setIndustryOpen(false); }}
                style={{ ...btnBase, borderColor: selCountries.length ? 'var(--orange)' : '#e8e8e8', color: selCountries.length ? 'var(--orange)' : '#555', background: selCountries.length ? 'var(--orange-light)' : '#fff' }}>
                🌍 {selCountries.length ? `${selCountries.length} Countries` : 'All Countries'} <span style={{ fontSize:10 }}>▼</span>
              </button>
              {countryOpen && (
                <div style={{ ...dropMenuStyle, width:240 }}>
                  <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#aaa', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Country</span>
                    {selCountries.length > 0 && <span onClick={() => setSelCountries([])} style={{ cursor:'pointer', color:'var(--orange)', fontWeight:700, fontSize:10 }}>Clear</span>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:1, maxHeight:260, overflowY:'auto' }}>
                    {COUNTRIES.map(([code, label]) => (
                      <label key={code} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 8px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}
                        onMouseOver={e=>e.currentTarget.style.background='#f8f8f8'} onMouseOut={e=>e.currentTarget.style.background=''}>
                        <input type="checkbox" checked={selCountries.includes(code)} onChange={() => toggleCountry(code)} style={{ accentColor:'var(--orange)', width:13, height:13 }}/>
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stage select */}
            <select value={selStage} onChange={e => handleStageChange(e.target.value)}
              style={{ ...btnBase, appearance:'none', paddingRight:28, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23aaa'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', cursor:'pointer', outline:'none',
                borderColor: selStage ? 'var(--orange)' : '#e8e8e8', color: selStage ? 'var(--orange)' : '#555', background: selStage ? 'var(--orange-light)' : '#fff' }}>
              <option value="">📊 All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Sort select */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ ...btnBase, appearance:'none', paddingRight:28, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23aaa'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', cursor:'pointer', outline:'none' }}>
              <option value="top">🎉 Most Upvoted</option>
              <option value="new">🆕 Newest</option>
              <option value="soon">⏳ Coming Soon</option>
              <option value="alpha">🔤 A–Z</option>
            </select>

            {hasFilters && (
              <button onClick={clearAll}
                style={{ ...btnBase, borderColor:'var(--orange)', background:'var(--orange-light)', color:'var(--orange)' }}>
                Clear filters ✕
              </button>
            )}

            <div style={{ marginLeft:'auto', fontSize:13, fontWeight:600, color:'#aaa', whiteSpace:'nowrap', fontFamily:"'Inter',sans-serif" }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}><Spinner size="lg"/></div>
          ) : !filtered.length ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>{hasFilters ? '🔍' : '📦'}</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>
                {hasFilters ? 'No products found' : 'No products yet'}
              </div>
              <p style={{ color:'#888' }}>
                {hasFilters ? 'Try adjusting your filters or search term.' : 'Products submitted by the community will appear here.'}
              </p>
            </div>
          ) : (
            <div id="allProductsGrid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:14 }}>
              {filtered.map((p) => {
                const isVoted      = votes.has(p.id);
                const isBookmarked = bookmarks.has(p.id);
                const voteCount    = p.upvotes_count || 0;
                return (
                  <div key={p.id} onClick={() => navigate(`/products/${p.id}`)}
                    style={{ background:'#fff', border:'1px solid #ebebeb', borderRadius:16, padding:20, cursor:'pointer', transition:'border-color .15s, box-shadow .15s', display:'flex', flexDirection:'column', gap:12 }}
                    onMouseOver={e=>{ e.currentTarget.style.borderColor='#ccc'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.06)'; }}
                    onMouseOut={e=>{  e.currentTarget.style.borderColor='#ebebeb'; e.currentTarget.style.boxShadow=''; }}>

                    {/* Top row: logo + name + upvote */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                      <div style={{ width:52, height:52, borderRadius:14, background:'var(--gray-100)', display:'grid', placeItems:'center', fontSize:24, flexShrink:0 }}>
                        {p.logo_emoji || '🚀'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                          <span style={{ fontSize:15, fontWeight:800, color:'#0a0a0a', letterSpacing:'-.01em' }}>{p.name}</span>
                          {p.badge === 'soon' || p.status === 'soon' ? <span className="badge badge-soon">SOON</span>
                            : p.badge === 'top' ? <span className="badge badge-top">TOP</span>
                            : p.badge === 'new' ? <span className="badge badge-new">NEW</span> : null}
                        </div>
                        <div style={{ fontSize:13, color:'#666', lineHeight:1.5, marginBottom:8 }}>{p.tagline}</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {p.industry && <span className="meta-tag">{p.industry}</span>}
                          {p.country  && <span className="meta-tag">{p.country}</span>}
                          {(p.tags||[]).slice(0,2).map(t => <span key={t} className="meta-tag">{t}</span>)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                        {p.status === 'soon' ? (
                          <button className="upvote-btn" style={{ background:'#4f46e5', borderColor:'#4f46e5', color:'#fff', fontSize:11, minWidth:52 }} onClick={() => setWaitlistModal(p)}>⚡ Join</button>
                        ) : (
                          <button className={`upvote-btn${isVoted?' voted':''}`}
                            onClick={() => { if (!user) { onSignIn?.(); return; } toggleVote(p.id); toast(isVoted?`Removed vote`:`Upvoted ${p.name}!`); }}>
                            <span className="upvote-arrow">▲</span>
                            <span className="upvote-count">{isVoted ? voteCount+1 : voteCount}</span>
                          </button>
                        )}
                        <button className={`bookmark-btn${isBookmarked?' saved':''}`}
                          onClick={() => { if (!user) { onSignIn?.(); return; } toggleBookmark(p.id); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
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
