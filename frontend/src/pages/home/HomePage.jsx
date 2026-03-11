import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import ProductCard from '../../components/home/ProductCard';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';

const MOCK_PRODUCTS = [
  { id:1,  name:'Tabby',        tagline:'Buy now, pay later for MENA shoppers', logo_emoji:'💳', industry:'Fintech',     country:'UAE',          status:'live', badge:'top',  upvotes_count:342, tags:['BNPL','Fintech'] },
  { id:2,  name:'Noon Academy', tagline:'Social learning platform for students', logo_emoji:'📚', industry:'Edtech',      country:'Saudi Arabia',  status:'live', badge:'top',  upvotes_count:287, tags:['Edtech','Social'] },
  { id:3,  name:'Vezeeta',      tagline:'Book doctors and healthcare services',  logo_emoji:'🏥', industry:'Healthtech',  country:'Egypt',         status:'live', badge:null,   upvotes_count:256, tags:['Health','Booking'] },
  { id:4,  name:'Baraka',       tagline:'Invest in global stocks from the GCC',  logo_emoji:'📈', industry:'Fintech',     country:'UAE',           status:'live', badge:'new',  upvotes_count:231, tags:['Investing','Stocks'] },
  { id:5,  name:'Tamara',       tagline:'BNPL shopping for Saudi consumers',     logo_emoji:'🛒', industry:'Fintech',     country:'Saudi Arabia',  status:'live', badge:null,   upvotes_count:198, tags:['BNPL','Saudi'] },
  { id:6,  name:'Kader AI',     tagline:'AI-powered job matching for MENA',      logo_emoji:'🤖', industry:'AI & ML',     country:'Jordan',        status:'soon', badge:'soon', upvotes_count:0,   tags:['AI','Jobs'] },
  { id:7,  name:'Trella',       tagline:'Digital freight marketplace in MENA',   logo_emoji:'🚛', industry:'Logistics',   country:'Egypt',         status:'live', badge:null,   upvotes_count:154, tags:['Freight','Logistics'] },
  { id:8,  name:'Foodics',      tagline:'Restaurant management system for F&B',  logo_emoji:'🍽️', industry:'Foodtech',    country:'Saudi Arabia',  status:'live', badge:null,   upvotes_count:143, tags:['F&B','POS'] },
  { id:9,  name:'Waffarha',     tagline:'Discount coupons and deals platform',   logo_emoji:'🎟️', industry:'E-Commerce',  country:'Egypt',         status:'live', badge:null,   upvotes_count:128, tags:['Deals','Coupons'] },
  { id:10, name:'Cura',         tagline:'Arabic mental health therapy online',   logo_emoji:'🧠', industry:'Healthtech',  country:'Saudi Arabia',  status:'soon', badge:'soon', upvotes_count:0,   tags:['Mental Health','Arabic'] },
];

const INDUSTRIES = ['Fintech','Edtech','AI & ML','Healthtech','E-Commerce','Logistics','Foodtech','Proptech','Traveltech','Cleantech','Cybersecurity','HR & Work','Media','Dev Tools','Islamic Fintech','Web3'];
const COUNTRIES  = [['sa','🇸🇦 Saudi Arabia'],['ae','🇦🇪 UAE'],['eg','🇪🇬 Egypt'],['jo','🇯🇴 Jordan'],['ma','🇲🇦 Morocco'],['kw','🇰🇼 Kuwait'],['qa','🇶🇦 Qatar'],['lb','🇱🇧 Lebanon']];
const STATS = [
  { num: '248',    label: 'Products Listed' },
  { num: '1,840',  label: 'Founders' },
  { num: '15',     label: 'Countries' },
  { num: '42',     label: 'Accelerators' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSubmitOpen, setAuthModal } = useUI();
  const [products, setProducts]       = useState(MOCK_PRODUCTS);
  const [loading,  setLoading]        = useState(false);
  const [feedType, setFeedType]       = useState('all');
  const [countryDDOpen, setCountryDD] = useState(false);
  const [industryDDOpen, setIndDD]    = useState(false);
  const [selectedCountries, setCountries] = useState([]);
  const [selectedIndustries, setIndustries] = useState([]);

  useEffect(() => {
    productsAPI.list({ status: 'live', sort: 'top', limit: 20 })
      .then(({ data }) => { if (data.data?.length) setProducts(data.data); })
      .catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    if (feedType === 'new')  return p.badge === 'new' || p.status === 'live';
    if (feedType === 'soon') return p.status === 'soon';
    if (feedType === 'top')  return (p.upvotes_count || 0) > 100;
    return true;
  }).filter(p =>
    (!selectedCountries.length  || selectedCountries.some(c => p.country?.toLowerCase().includes(c))) &&
    (!selectedIndustries.length || selectedIndustries.includes(p.industry))
  );

  const feedTitles = { all: "Today's Top Products", new: 'Just Launched', soon: 'Coming Soon', top: 'Top Voted' };

  const handleSubmitProduct = () => {
    if (user) setSubmitOpen(true);
    else setAuthModal('signup');
  };

  return (
    <>
      <Navbar/>

      <div className="page active" style={{ paddingTop: 'var(--nav-h)' }}>

        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">🌍 MENA's #1 Product Discovery Platform</div>
          <h1>Discover the <span>Next Big Thing</span><br/>from the MENA Region</h1>
          <div className="hero-ar">اكتشف أفضل منتجات منطقة الشرق الأوسط</div>
          <p>The home for MENA startups, products, and innovation. Discover, upvote, and connect with the best of MENA tech.</p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={handleSubmitProduct}>🚀 Submit Your Product</button>
            <button className="btn-hero-ghost" onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Browse Products ↓
            </button>
          </div>
          <div className="hero-stats">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="hero-stat-num"><span>{s.num}</span></div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="filter-section">
          <div className="filter-inner">

            {/* Country dropdown */}
            <div className="country-dropdown-wrap">
              <button className={`filter-tab country-dd-trigger ${selectedCountries.length ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); setCountryDD(v => !v); setIndDD(false); }}>
                🌍 {selectedCountries.length ? `${selectedCountries.length} Countries` : 'All Countries'} <span style={{ fontSize: 10, marginLeft: 3 }}>▼</span>
              </button>
              {countryDDOpen && (
                <div className="country-dd-menu open" style={{ position: 'fixed', top: 'auto', left: 'auto', marginTop: 4 }}>
                  <div className="country-dd-top">
                    <input className="country-dd-search" type="text" placeholder="Search country…" autoComplete="off"/>
                    <button className="country-dd-clear" onClick={() => setCountries([])}>Clear</button>
                  </div>
                  <div className="country-dd-list">
                    {COUNTRIES.map(([v, label]) => (
                      <label key={v} className="country-dd-item">
                        <input type="checkbox" checked={selectedCountries.includes(v)}
                          onChange={e => setCountries(prev => e.target.checked ? [...prev, v] : prev.filter(c => c !== v))}
                          style={{ accentColor: 'var(--orange)', width: 15, height: 15 }}/>
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Industry dropdown */}
            <div className="country-dropdown-wrap">
              <button className={`filter-tab country-dd-trigger ${selectedIndustries.length ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); setIndDD(v => !v); setCountryDD(false); }}>
                🏭 {selectedIndustries.length ? `${selectedIndustries.length} Industries` : 'All Industries'} <span style={{ fontSize: 10, marginLeft: 3 }}>▼</span>
              </button>
              {industryDDOpen && (
                <div className="country-dd-menu open" style={{ position: 'fixed', top: 'auto', left: 'auto', marginTop: 4 }}>
                  <div className="country-dd-top">
                    <input className="country-dd-search" type="text" placeholder="Search industry…" autoComplete="off"/>
                    <button className="country-dd-clear" onClick={() => setIndustries([])}>Clear</button>
                  </div>
                  <div className="country-dd-list">
                    {INDUSTRIES.map(ind => (
                      <label key={ind} className="country-dd-item">
                        <input type="checkbox" checked={selectedIndustries.includes(ind)}
                          onChange={e => setIndustries(prev => e.target.checked ? [...prev, ind] : prev.filter(i => i !== ind))}
                          style={{ accentColor: 'var(--orange)', width: 15, height: 15 }}/>
                        {ind}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="filter-divider"/>
            {['all','new','soon','top'].map((type) => (
              <button key={type} className={`filter-tab ${feedType === type ? 'active' : ''}`}
                onClick={() => { setFeedType(type); setCountryDD(false); setIndDD(false); }}>
                {type === 'all' ? 'All Products' : type === 'new' ? '🆕 Just Launched' : type === 'soon' ? '⏳ Coming Soon' : '🎉 Top Voted'}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="main-layout" id="products-section">
          {/* Feed */}
          <div>
            <div className="list-header">
              <div className="list-title">{feedTitles[feedType]}</div>
              <div className="list-count">{filtered.length} products</div>
            </div>
            {loading
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg"/></div>
              : filtered.length
                ? filtered.map((p, i) => (
                    <div key={p.id} onClick={() => navigate(`/products/${p.id}`)}>
                      <ProductCard product={p} rank={i + 1}/>
                    </div>
                  ))
                : (
                  <div className="empty">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">No products found</div>
                    <div className="empty-desc">Try adjusting your filters</div>
                  </div>
                )
            }
          </div>

          {/* Sidebar */}
          <div className="sidebar" style={{ display: 'block' }}>
            {/* Search */}
            <div className="sidebar-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="sidebar-search-input" type="text" placeholder="Search products…"
                onKeyDown={e => e.key === 'Enter' && e.target.value && navigate(`/products?q=${encodeURIComponent(e.target.value)}`)}/>
            </div>

            {/* Top Upvoted Today */}
            <div className="sidebar-card">
              <div className="sidebar-title">🔥 Top Upvoted Today</div>
              {[...products].sort((a,b) => (b.upvotes_count||0)-(a.upvotes_count||0)).slice(0,5).map((p) => (
                <div key={p.id} className="sidebar-item" onClick={() => navigate(`/products/${p.id}`)}>
                  <div className="sidebar-item-icon" style={{ background: 'var(--gray-100)' }}>{p.logo_emoji}</div>
                  <div>
                    <div className="sidebar-item-name">{p.name}</div>
                    <div className="sidebar-item-meta">{p.industry}</div>
                  </div>
                  <div className="sidebar-item-right">🎉 {p.upvotes_count}</div>
                </div>
              ))}
            </div>

            {/* Top Industries */}
            <div className="sidebar-card">
              <div className="sidebar-title">🏭 Top Industries</div>
              {['Fintech','Edtech','AI & ML','Healthtech','E-Commerce'].map((ind) => {
                const count = products.filter(p => p.industry === ind).length;
                const icons = { 'Fintech':'💳','Edtech':'📚','AI & ML':'🤖','Healthtech':'🏥','E-Commerce':'🛒' };
                return (
                  <div key={ind} className="sidebar-item" onClick={() => navigate(`/products?industry=${encodeURIComponent(ind)}`)}>
                    <div className="sidebar-item-icon" style={{ background: 'var(--gray-100)' }}>{icons[ind]}</div>
                    <div>
                      <div className="sidebar-item-name">{ind}</div>
                      <div className="sidebar-item-meta">{count} products</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weekly Digest */}
            <div className="sidebar-card" style={{ background: 'var(--black)' }}>
              <div className="sidebar-title" style={{ color: 'var(--white)' }}>📬 Weekly Digest</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, marginBottom: 16 }}>
                Get the top MENA products and insights every Friday.
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="email" placeholder="your@email.com" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'Inter,sans-serif' }}/>
                <button style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--orange)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif' }}>
                  Subscribe
                </button>
              </div>
            </div>

            {/* Community CTAs */}
            <div className="sidebar-card">
              <div className="sidebar-title">🌍 Explore Ecosystem</div>
              {[
                { icon:'🏢', label:'Accelerators', path:'/accelerators' },
                { icon:'💰', label:'Investors', path:'/list/investor' },
                { icon:'🗺️', label:'Directory', path:'/directory' },
              ].map(item => (
                <div key={item.label} className="sidebar-item" onClick={() => navigate(item.path)}>
                  <div className="sidebar-item-icon" style={{ background:'var(--orange-light)', color:'var(--orange)' }}>{item.icon}</div>
                  <div className="sidebar-item-name">{item.label}</div>
                  <div className="sidebar-item-right">→</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(countryDDOpen || industryDDOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 8999 }} onClick={() => { setCountryDD(false); setIndDD(false); }}/>
      )}

      <Footer/>
    </>
  );
}
