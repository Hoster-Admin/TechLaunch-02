import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import ProductCard from '../../components/home/ProductCard';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';


const INDUSTRIES = ['Fintech','Edtech','AI & ML','Healthtech','E-Commerce','Logistics','Foodtech','Proptech','Traveltech','Cleantech','Cybersecurity','HR & Work','Media','Dev Tools','Web3'];
const INDUSTRY_ICONS = {
  'Fintech':'💳','Edtech':'📚','AI & ML':'🤖','Healthtech':'🏥',
  'E-Commerce':'🛒','Logistics':'🚚','Foodtech':'🍔','Proptech':'🏠',
  'Traveltech':'✈️','Cleantech':'♻️','Cybersecurity':'🔒','HR & Work':'👔',
  'Media':'📱','Dev Tools':'⚙️','Web3':'⛓️',
};
const COUNTRIES  = [
  ['sa','🇸🇦 Saudi Arabia'],['ae','🇦🇪 UAE'],['eg','🇪🇬 Egypt'],['jo','🇯🇴 Jordan'],
  ['ma','🇲🇦 Morocco'],['kw','🇰🇼 Kuwait'],['qa','🇶🇦 Qatar'],['bh','🇧🇭 Bahrain'],
  ['tn','🇹🇳 Tunisia'],['lb','🇱🇧 Lebanon'],['iq','🇮🇶 Iraq'],['om','🇴🇲 Oman'],
  ['ly','🇱🇾 Libya'],['dz','🇩🇿 Algeria'],['sy','🇸🇾 Syria'],['ye','🇾🇪 Yemen'],
  ['ps','🇵🇸 Palestine'],['sd','🇸🇩 Sudan'],
];
const COUNTRY_NAMES = Object.fromEntries(COUNTRIES.map(([code, label]) => [code, label.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu,'').trim()]));

const ARTICLES = [
  { tag:'Guide',        title:'How to Get the Best Out of Tech Launch as a Founder',            author:'Rania Al-Masri', initials:'RA', readTime:'4 min read', date:'Mar 6', slug:'how-to-get-best-out-of-tech-launch'  },
  { tag:'For Students', title:'Where to Start Learning Vibe Coding as a Complete Beginner',     author:'Khalid Nasser',  initials:'KN', readTime:'6 min read', date:'Mar 4', slug:'vibe-coding-beginner' },
  { tag:'Business',     title:"Why MENA Founders Should Launch Publicly Before They're Ready",  author:'Sara Hadid',     initials:'SH', readTime:'5 min read', date:'Mar 2', slug:'mena-founders-launch-publicly' },
  { tag:'Business',     title:'The Investor Signals That Actually Matter in a MENA Pitch Deck', author:'Omar Fares',     initials:'OF', readTime:'7 min read', date:'Feb 28', slug:'investor-signals-mena-pitch-deck' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSubmitOpen, setAuthModal } = useUI();
  const [products, setProducts]       = useState([]);
  const [loading,  setLoading]        = useState(true);
  const [feedType, setFeedType]       = useState('all');
  const [countryDDOpen, setCountryDD] = useState(false);
  const [industryDDOpen, setIndDD]    = useState(false);
  const [selectedCountries, setCountries] = useState([]);
  const [selectedIndustries, setIndustries] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params =
      feedType === 'soon' ? { status: 'soon', sort: 'newest', limit: 20 } :
      feedType === 'new'  ? { status: 'live', sort: 'newest', limit: 20 } :
                            { status: 'live', sort: 'top',    limit: 20 };
    productsAPI.list(params)
      .then(({ data }) => { setProducts(data.data || []); })
      .catch(() => { setProducts([]); })
      .finally(() => setLoading(false));
  }, [feedType]);

  const filtered = products.filter(p =>
    (!selectedCountries.length  || selectedCountries.some(c => p.countries?.includes(COUNTRY_NAMES[c]))) &&
    (!selectedIndustries.length || selectedIndustries.includes(p.industry))
  );

  const feedTitles = {
    all:  "Today's Top Products",
    new:  'Just Launched',
    soon: 'Coming Soon',
    top:  'Top Voted',
  };

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
          <p>The home for MENA companies, products, and innovation. Discover, upvote, and connect with the best of MENA tech.</p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={handleSubmitProduct}>🚀 Join Launcher</button>
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
                        <span style={{ fontSize: 15 }}>{INDUSTRY_ICONS[ind] || '🏭'}</span>
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
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg"/></div>
            ) : filtered.length ? (
              filtered.map((p, i) => (
                <div key={p.id} onClick={() => navigate(`/products/${p.id}`)}>
                  <ProductCard product={p} rank={i + 1}/>
                </div>
              ))
            ) : (
              <div className="empty">
                <div className="empty-icon">{(selectedCountries.length || selectedIndustries.length) ? '🔍' : '📦'}</div>
                <div className="empty-title">{(selectedCountries.length || selectedIndustries.length) ? 'No products found' : 'No products yet'}</div>
                <div className="empty-desc">{(selectedCountries.length || selectedIndustries.length) ? 'Try adjusting your filters' : 'Products submitted by the community will appear here.'}</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar" style={{ display: 'block' }}>
            {/* From the Community */}
            <div className="sidebar-card">
              <div className="sidebar-title">✍️ From the Community</div>
              {ARTICLES.map((a, i) => (
                <div key={i} className="article-card" onClick={() => navigate(`/articles/${a.slug}`)} style={{ cursor:'pointer' }}>
                  <div className="article-tag">{a.tag}</div>
                  <div className="article-title">{a.title}</div>
                  <div className="article-meta">
                    <span className="article-author-dot">{a.initials}</span>
                    {a.author}
                    <span>·</span>
                    {a.readTime}
                    <span>·</span>
                    {a.date}
                  </div>
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
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, marginBottom: 14 }}>
                Get the top MENA launches every week.
              </p>
              <input type="email" placeholder="your@email.com" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box', marginBottom: 8 }}/>
              <button style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'var(--orange)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                Subscribe
              </button>
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
