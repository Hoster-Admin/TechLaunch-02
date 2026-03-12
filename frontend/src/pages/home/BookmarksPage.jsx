import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { usersAPI, productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

const TABS = [
  { key:'saved',      icon:'🔖', label:'Products Saved' },
  { key:'applied',    icon:'📋', label:'Applied'        },
  { key:'myproducts', icon:'🚀', label:'My Products'    },
];

export default function BookmarksPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, votes, toggleVote } = useUI();

  const [activeTab, setActiveTab]       = useState('saved');
  const [savedProds, setSavedProds]     = useState(null);
  const [myProds, setMyProds]           = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      usersAPI.bookmarks().then(r => setSavedProds(r.data?.data || r.data || [])),
      usersAPI.myProducts().then(r => setMyProds(r.data?.data || r.data || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  if (!user) {
    return (
      <>
        <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
        <div style={{ paddingTop:'var(--nav-h)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:20 }}>🔖</div>
          <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Sign in to view your library</h2>
          <p style={{ fontSize:14, color:'#666', marginBottom:24, maxWidth:360, lineHeight:1.6 }}>Save products, track applications, and manage your launches.</p>
          <button onClick={onSignIn} style={{ padding:'12px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Sign In</button>
        </div>
        <Footer/>
      </>
    );
  }

  const ProductRow = ({ p, i, showRemove }) => {
    const isVoted = votes.has(p.id);
    const isBookmarked = bookmarks.has(p.id);
    return (
      <div key={p.id} className="product-card" onClick={() => navigate(`/products/${p.id}`)}>
        <div className="product-rank">#{i+1}</div>
        <div className="product-logo">{p.logo_emoji || '🚀'}</div>
        <div className="product-body">
          <div className="product-top">
            <span className="product-name">{p.name}</span>
          </div>
          <div className="product-tagline">{p.tagline}</div>
          <div className="product-meta">
            {p.industry && <span className="meta-tag">{p.industry}</span>}
            {(p.country || p.countries) && <span className="meta-tag">{p.country || (Array.isArray(p.countries) ? p.countries[0] : p.countries)}</span>}
          </div>
        </div>
        <div className="product-actions" onClick={e => e.stopPropagation()}>
          <button className={`upvote-btn${isVoted?' voted':''}`}
            onClick={() => { toggleVote(p.id); toast(isVoted ? 'Removed vote' : `Upvoted ${p.name}!`); try { productsAPI.upvote(p.id); } catch {} }}>
            <span className="upvote-arrow">▲</span>
            <span className="upvote-count">{isVoted ? (p.upvotes_count||0)+1 : (p.upvotes_count||0)}</span>
          </button>
          {showRemove && (
            <button className="bookmark-btn saved"
              onClick={() => { toggleBookmark(p.id); toast('Bookmark removed'); try { productsAPI.bookmark(p.id); } catch {}; setSavedProds(prev => prev.filter(x => x.id !== p.id)); }}
              title="Remove bookmark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 32px 80px', display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* Sidebar nav */}
          <div style={{ width:200, flexShrink:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', position:'sticky', top:'calc(var(--nav-h) + 20px)' }}>
            <div style={{ padding:'16px 16px 10px', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#bbb' }}>My Library</div>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'13px 16px', border:'none', borderBottom:'1px solid #f4f4f4', background:activeTab===tab.key?'var(--orange-light)':'#fff', color:activeTab===tab.key?'var(--orange)':'#444', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif' }}>
                <span style={{ fontSize:15 }}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* ── SAVED PRODUCTS ── */}
            {activeTab === 'saved' && (
              <>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>🔖 Products Saved</div>
                <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>Products you've bookmarked.</div>
                {loading ? (
                  <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg"/></div>
                ) : !savedProds?.length ? (
                  <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>🔖</div>
                    <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No saved products yet</div>
                    <p style={{ color:'#888', marginBottom:24 }}>Browse products and click the bookmark icon to save them here.</p>
                    <button onClick={() => navigate('/products')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Browse Products →</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {savedProds.map((p, i) => <ProductRow key={p.id} p={p} i={i} showRemove={true}/>)}
                  </div>
                )}
              </>
            )}

            {/* ── APPLIED ── */}
            {activeTab === 'applied' && (
              <>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>📋 Applications</div>
                <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>Accelerators and investors you've applied to.</div>
                <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
                  <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No applications yet</div>
                  <p style={{ color:'#888', marginBottom:24, maxWidth:360, margin:'0 auto 24px' }}>Apply to accelerators and investors to track your applications here.</p>
                  <button onClick={() => navigate('/accelerators')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Browse Accelerators →</button>
                </div>
              </>
            )}

            {/* ── MY PRODUCTS ── */}
            {activeTab === 'myproducts' && (
              <>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>🚀 My Products</div>
                <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>Products you've submitted to Tech Launch MENA.</div>
                {loading ? (
                  <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg"/></div>
                ) : !myProds?.length ? (
                  <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>🚀</div>
                    <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No products submitted yet</div>
                    <p style={{ color:'#888', marginBottom:24 }}>Submit your first product to get discovered by the MENA tech community.</p>
                    <button onClick={() => navigate('/submit')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>+ Submit a Product</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {myProds.map((p, i) => <ProductRow key={p.id} p={p} i={i} showRemove={false}/>)}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
