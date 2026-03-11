import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

const MOCK_PRODUCTS = [
  { id:1,  name:'Tabby',        tagline:'Buy now, pay later for MENA shoppers', logo_emoji:'💳', industry:'Fintech',     country:'UAE',          status:'live', upvotes_count:342, badge:'top',  tags:['BNPL','Fintech'] },
  { id:2,  name:'Noon Academy', tagline:'Social learning platform for students', logo_emoji:'📚', industry:'Edtech',      country:'Saudi Arabia',  status:'live', upvotes_count:287, badge:'top',  tags:['Edtech','Social'] },
  { id:3,  name:'Vezeeta',      tagline:'Book doctors and healthcare services',  logo_emoji:'🏥', industry:'Healthtech',  country:'Egypt',         status:'live', upvotes_count:256, badge:null,   tags:['Health','Booking'] },
  { id:4,  name:'Baraka',       tagline:'Invest in global stocks from the GCC',  logo_emoji:'📈', industry:'Fintech',     country:'UAE',           status:'live', upvotes_count:231, badge:'new',  tags:['Investing','Stocks'] },
  { id:5,  name:'Tamara',       tagline:'BNPL shopping for Saudi consumers',     logo_emoji:'🛒', industry:'Fintech',     country:'Saudi Arabia',  status:'live', upvotes_count:198, badge:null,   tags:['BNPL','Saudi'] },
  { id:6,  name:'Kader AI',     tagline:'AI-powered job matching for MENA',      logo_emoji:'🤖', industry:'AI & ML',     country:'Jordan',        status:'soon', upvotes_count:0,   badge:'soon', tags:['AI','Jobs'] },
  { id:7,  name:'Trella',       tagline:'Digital freight marketplace in MENA',   logo_emoji:'🚛', industry:'Logistics',   country:'Egypt',         status:'live', upvotes_count:154, badge:null,   tags:['Freight','Logistics'] },
  { id:8,  name:'Foodics',      tagline:'Restaurant management system for F&B',  logo_emoji:'🍽️', industry:'Foodtech',    country:'Saudi Arabia',  status:'live', upvotes_count:143, badge:null,   tags:['F&B','POS'] },
  { id:9,  name:'Waffarha',     tagline:'Discount coupons and deals platform',   logo_emoji:'🎟️', industry:'E-Commerce',  country:'Egypt',         status:'live', upvotes_count:128, badge:null,   tags:['Deals','Coupons'] },
  { id:10, name:'Cura',         tagline:'Arabic mental health therapy online',   logo_emoji:'🧠', industry:'Healthtech',  country:'Saudi Arabia',  status:'soon', upvotes_count:0,   badge:'soon', tags:['Mental Health','Arabic'] },
  { id:11, name:'Nowlun',       tagline:'Smart home solutions for MENA',         logo_emoji:'🏠', industry:'Proptech',    country:'UAE',           status:'live', upvotes_count:89,  badge:'new',  tags:['Smart Home','IoT'] },
  { id:12, name:'Lean',         tagline:'Open banking API platform for MENA',    logo_emoji:'🔗', industry:'Fintech',     country:'Saudi Arabia',  status:'live', upvotes_count:176, badge:null,   tags:['Open Banking','API'] },
];

const INDUSTRIES = ['Fintech','Edtech','AI & ML','Healthtech','E-Commerce','Logistics','Foodtech','Proptech','Traveltech','Cleantech','Cybersecurity','HR & Work','Media','Dev Tools','Web3'];
const COUNTRIES = [['sa','🇸🇦 Saudi Arabia'],['ae','🇦🇪 UAE'],['eg','🇪🇬 Egypt'],['jo','🇯🇴 Jordan'],['ma','🇲🇦 Morocco'],['kw','🇰🇼 Kuwait'],['qa','🇶🇦 Qatar'],['bh','🇧🇭 Bahrain'],['tn','🇹🇳 Tunisia'],['lb','🇱🇧 Lebanon']];

export default function AllProductsPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, votes, toggleVote, setWaitlistModal } = useUI();
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState(searchParams.get('q') || '');
  const [selIndustry, setSelIndustry] = useState(searchParams.get('industry') || '');
  const [selCountry, setSelCountry] = useState('');
  const [sortBy, setSortBy] = useState('top');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryOpen, setIndustryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  useEffect(() => {
    productsAPI.list({ sort:'top', limit:50 }).then(({ data }) => {
      if (data.data?.length > 0) setProducts(data.data);
    }).catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.tagline||'').toLowerCase().includes(q) || (p.industry||'').toLowerCase().includes(q);
    const matchI = !selIndustry || p.industry === selIndustry;
    const matchC = !selCountry || (p.country||'').toLowerCase().includes(selCountry);
    const matchS = statusFilter === 'all' || p.status === statusFilter || (statusFilter === 'soon' && p.status === 'soon');
    return matchQ && matchI && matchC && matchS;
  }).sort((a,b) => sortBy === 'top' ? (b.upvotes_count||0) - (a.upvotes_count||0) : sortBy === 'new' ? b.id - a.id : 0);

  const badgeCls = { new:'badge-new', soon:'badge-soon', top:'badge-top' };

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        {/* Page header */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', padding:'32px 32px 28px' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.03em', marginBottom:6 }}>All Products</h1>
            <p style={{ fontSize:14, color:'#666', marginBottom:24 }}>Discover every product on Tech Launch MENA — search, filter, and explore.</p>
            {/* Search */}
            <div style={{ position:'relative', maxWidth:520 }}>
              <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search products, industries, tags…"
                style={{ width:'100%', padding:'12px 16px 12px 40px', borderRadius:12, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', background:'#fff' }}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
              {searchQ && <span onClick={() => setSearchQ('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:14, color:'#aaa' }}>✕</span>}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 32px 80px' }}>
          {/* Filters */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, flexWrap:'wrap' }}>
            {/* Industry */}
            <div style={{ position:'relative' }}>
              <button onClick={() => { setIndustryOpen(o=>!o); setCountryOpen(false); }}
                style={{ padding:'8px 14px', borderRadius:10, border:`1.5px solid ${selIndustry?'var(--orange)':'#e8e8e8'}`, background:selIndustry?'var(--orange-light)':'#fff', color:selIndustry?'var(--orange)':'#555', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                🏭 {selIndustry || 'Industry'} <span style={{ fontSize:10 }}>▼</span>
              </button>
              {industryOpen && (
                <div style={{ position:'absolute', top:'calc(100%+6px)', left:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:12, padding:'6px 0', minWidth:180, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:200, maxHeight:240, overflowY:'auto' }}>
                  <div onClick={() => { setSelIndustry(''); setIndustryOpen(false); }}
                    style={{ padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#888' }}
                    onMouseOver={e => e.currentTarget.style.background='#f8f8f8'} onMouseOut={e => e.currentTarget.style.background=''}>All Industries</div>
                  {INDUSTRIES.map(ind => (
                    <div key={ind} onClick={() => { setSelIndustry(ind); setIndustryOpen(false); }}
                      style={{ padding:'9px 14px', fontSize:13, fontWeight: selIndustry===ind?700:500, cursor:'pointer', color: selIndustry===ind?'var(--orange)':'#333', background: selIndustry===ind?'var(--orange-light)':'' }}
                      onMouseOver={e => e.currentTarget.style.background='#f8f8f8'} onMouseOut={e => e.currentTarget.style.background=selIndustry===ind?'var(--orange-light)':''}>
                      {ind}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Country */}
            <div style={{ position:'relative' }}>
              <button onClick={() => { setCountryOpen(o=>!o); setIndustryOpen(false); }}
                style={{ padding:'8px 14px', borderRadius:10, border:`1.5px solid ${selCountry?'var(--orange)':'#e8e8e8'}`, background:selCountry?'var(--orange-light)':'#fff', color:selCountry?'var(--orange)':'#555', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                🌍 {selCountry ? COUNTRIES.find(c=>c[0]===selCountry)?.[1]||selCountry : 'Country'} <span style={{ fontSize:10 }}>▼</span>
              </button>
              {countryOpen && (
                <div style={{ position:'absolute', top:'calc(100%+6px)', left:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:12, padding:'6px 0', minWidth:180, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:200, maxHeight:240, overflowY:'auto' }}>
                  <div onClick={() => { setSelCountry(''); setCountryOpen(false); }}
                    style={{ padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#888' }}
                    onMouseOver={e => e.currentTarget.style.background='#f8f8f8'} onMouseOut={e => e.currentTarget.style.background=''}>All Countries</div>
                  {COUNTRIES.map(([code,label]) => (
                    <div key={code} onClick={() => { setSelCountry(code); setCountryOpen(false); }}
                      style={{ padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer', color:selCountry===code?'var(--orange)':'#333', background:selCountry===code?'var(--orange-light)':'' }}
                      onMouseOver={e => e.currentTarget.style.background='#f8f8f8'} onMouseOut={e => e.currentTarget.style.background=selCountry===code?'var(--orange-light)':''}>
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            {['all','live','soon'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding:'8px 14px', borderRadius:10, border:`1.5px solid ${statusFilter===s?'var(--orange)':'#e8e8e8'}`, background:statusFilter===s?'var(--orange-light)':'#fff', color:statusFilter===s?'var(--orange)':'#555', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                {s === 'all' ? 'All' : s === 'live' ? '🟢 Live' : '⏳ Coming Soon'}
              </button>
            ))}

            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:12, color:'#aaa', fontWeight:600 }}>Sort:</span>
              {[['top','Top Voted'],['new','Newest']].map(([k,label]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  style={{ padding:'7px 12px', borderRadius:8, border:'none', background:sortBy===k?'#0a0a0a':'#f4f4f4', color:sortBy===k?'#fff':'#555', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  {label}
                </button>
              ))}
            </div>

            {(selIndustry || selCountry || searchQ) && (
              <button onClick={() => { setSelIndustry(''); setSelCountry(''); setSearchQ(''); }}
                style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', color:'#888', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Results */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.02em' }}>
              {searchQ ? `Results for "${searchQ}"` : selIndustry || selCountry ? 'Filtered Products' : 'All Products'}
            </div>
            <div style={{ fontSize:12, color:'#aaa', fontFamily:'DM Mono,monospace' }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</div>
          </div>

          {loading ? <div style={{ textAlign:'center', padding:'80px 20px' }}><Spinner size="lg"/></div>
          : !filtered.length ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No products found</div>
              <p style={{ color:'#888' }}>Try adjusting your filters or search term.</p>
            </div>
          ) : filtered.map((p, i) => {
            const isVoted = votes.has(p.id);
            const isBookmarked = bookmarks.has(p.id);
            const voteCount = p.upvotes_count || 0;
            return (
              <div key={p.id} className="product-card" onClick={() => navigate(`/products/${p.id}`)}>
                <div className="product-rank" style={{ minWidth:24 }}>#{i+1}</div>
                <div className="product-logo">{p.logo_emoji || p.logo || '🚀'}</div>
                <div className="product-body">
                  <div className="product-top">
                    <span className="product-name">{p.name}</span>
                    {p.badge && <span className={`badge badge-${p.badge}`}>{p.badge.toUpperCase()}</span>}
                    {p.status === 'soon' && !p.badge && <span className="badge badge-soon">SOON</span>}
                  </div>
                  <div className="product-tagline">{p.tagline}</div>
                  <div className="product-meta">
                    <span className="meta-tag">{p.industry}</span>
                    <span className="meta-tag">{p.country}</span>
                    {(p.tags||[]).slice(0,2).map(t => <span key={t} className="meta-tag">{t}</span>)}
                  </div>
                </div>
                <div className="product-actions" onClick={e => e.stopPropagation()}>
                  {p.status === 'soon' ? (
                    <button className="upvote-btn" style={{ background:'#4f46e5', borderColor:'#4f46e5', color:'#fff', fontSize:11 }} onClick={() => setWaitlistModal(p)}>⚡ Join</button>
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
            );
          })}
        </div>
      </div>
      <Footer/>
    </>
  );
}
