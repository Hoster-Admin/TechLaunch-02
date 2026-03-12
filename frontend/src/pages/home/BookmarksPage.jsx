import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { usersAPI, productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

export default function BookmarksPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, votes, toggleVote } = useUI();
  const [apiProducts, setApiProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    usersAPI.bookmarks()
      .then(({ data }) => {
        const items = data.data || data || [];
        setApiProducts(Array.isArray(items) ? items : []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [user?.id]);

  if (!user) {
    return (
      <>
        <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
        <div style={{ paddingTop:'var(--nav-h)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:20 }}>🔖</div>
          <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Sign in to see bookmarks</h2>
          <p style={{ fontSize:14, color:'#666', marginBottom:24, maxWidth:360, lineHeight:1.6 }}>Save products you love and come back to them anytime.</p>
          <button onClick={onSignIn} style={{ padding:'12px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Sign In</button>
        </div>
        <Footer/>
      </>
    );
  }

  const bookmarkedProducts = apiProducts !== null
    ? apiProducts
    : [];

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>

        <div className="page-header-section">
          <div className="page-header-inner">
            <h2>🔖 Your Bookmarks</h2>
            <p>Products you've saved for later.</p>
          </div>
        </div>

        <div className="main-layout">
          <div>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg"/></div>
            ) : !bookmarkedProducts.length ? (
              <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔖</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No bookmarks yet</div>
                <p style={{ color:'#888', marginBottom:24 }}>Browse products and click the bookmark icon to save them here.</p>
                <button onClick={() => navigate('/products')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Browse Products →</button>
              </div>
            ) : bookmarkedProducts.map((p, i) => {
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
                      {p.country && <span className="meta-tag">{p.country}</span>}
                    </div>
                  </div>
                  <div className="product-actions" onClick={e => e.stopPropagation()}>
                    <button className={`upvote-btn${isVoted?' voted':''}`}
                      onClick={() => {
                        toggleVote(p.id);
                        toast(isVoted ? 'Removed vote' : `Upvoted ${p.name}!`);
                        try { productsAPI.upvote(p.id); } catch {}
                      }}>
                      <span className="upvote-arrow">▲</span>
                      <span className="upvote-count">{isVoted ? (p.upvotes_count||0)+1 : (p.upvotes_count||0)}</span>
                    </button>
                    <button className="bookmark-btn saved"
                      onClick={() => {
                        toggleBookmark(p.id);
                        toast('Bookmark removed');
                        try { productsAPI.bookmark(p.id); } catch {}
                      }}
                      title="Remove bookmark">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div></div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
