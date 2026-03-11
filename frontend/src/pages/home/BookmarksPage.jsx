import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import toast from 'react-hot-toast';

const MOCK_PRODUCTS = [
  { id:1,  name:'Tabby',        tagline:'Buy now, pay later for MENA shoppers', logo_emoji:'💳', industry:'Fintech',     country:'UAE',          status:'live', upvotes_count:342, badge:'top' },
  { id:2,  name:'Noon Academy', tagline:'Social learning platform for students', logo_emoji:'📚', industry:'Edtech',      country:'Saudi Arabia',  status:'live', upvotes_count:287, badge:'top' },
  { id:3,  name:'Vezeeta',      tagline:'Book doctors and healthcare services',  logo_emoji:'🏥', industry:'Healthtech',  country:'Egypt',         status:'live', upvotes_count:256, badge:null  },
  { id:4,  name:'Baraka',       tagline:'Invest in global stocks from the GCC',  logo_emoji:'📈', industry:'Fintech',     country:'UAE',           status:'live', upvotes_count:231, badge:'new' },
  { id:5,  name:'Tamara',       tagline:'BNPL shopping for Saudi consumers',     logo_emoji:'🛒', industry:'Fintech',     country:'Saudi Arabia',  status:'live', upvotes_count:198, badge:null  },
  { id:6,  name:'Kader AI',     tagline:'AI-powered job matching for MENA',      logo_emoji:'🤖', industry:'AI & ML',     country:'Jordan',        status:'soon', upvotes_count:0,   badge:'soon'},
  { id:7,  name:'Trella',       tagline:'Digital freight marketplace in MENA',   logo_emoji:'🚛', industry:'Logistics',   country:'Egypt',         status:'live', upvotes_count:154, badge:null  },
  { id:8,  name:'Foodics',      tagline:'Restaurant management system for F&B',  logo_emoji:'🍽️', industry:'Foodtech',    country:'Saudi Arabia',  status:'live', upvotes_count:143, badge:null  },
  { id:9,  name:'Waffarha',     tagline:'Discount coupons and deals platform',   logo_emoji:'🎟️', industry:'E-Commerce',  country:'Egypt',         status:'live', upvotes_count:128, badge:null  },
  { id:10, name:'Cura',         tagline:'Mental health therapy online for MENA', logo_emoji:'🧠', industry:'Healthtech',  country:'Saudi Arabia',  status:'soon', upvotes_count:0,   badge:'soon'},
];

export default function BookmarksPage({ onSignIn, onSignUp }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, votes, toggleVote } = useUI();

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

  const bookmarkedProducts = MOCK_PRODUCTS.filter(p => bookmarks.has(p.id));

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>

        {/* Header */}
        <div className="page-header-section">
          <div className="page-header-inner">
            <h2>🔖 Your Bookmarks</h2>
            <p>Products you've saved for later.</p>
          </div>
        </div>

        {/* Content */}
        <div className="main-layout">
          <div>
            {!bookmarkedProducts.length ? (
              <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔖</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No bookmarks yet</div>
                <p style={{ color:'#888', marginBottom:24 }}>Browse products and click the bookmark icon to save them here.</p>
                <button onClick={() => navigate('/products')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Browse Products →</button>
              </div>
            ) : bookmarkedProducts.map((p, i) => {
              const isVoted = votes.has(p.id);
              return (
                <div key={p.id} className="product-card" onClick={() => navigate(`/products/${p.id}`)}>
                  <div className="product-rank">#{i+1}</div>
                  <div className="product-logo">{p.logo_emoji}</div>
                  <div className="product-body">
                    <div className="product-top">
                      <span className="product-name">{p.name}</span>
                      {p.badge && <span className={`badge badge-${p.badge}`}>{p.badge.toUpperCase()}</span>}
                    </div>
                    <div className="product-tagline">{p.tagline}</div>
                    <div className="product-meta">
                      <span className="meta-tag">{p.industry}</span>
                      <span className="meta-tag">{p.country}</span>
                    </div>
                  </div>
                  <div className="product-actions" onClick={e => e.stopPropagation()}>
                    <button className={`upvote-btn${isVoted?' voted':''}`} onClick={() => { toggleVote(p.id); toast(isVoted?'Removed vote':`Upvoted ${p.name}!`); }}>
                      <span className="upvote-arrow">▲</span>
                      <span className="upvote-count">{isVoted ? (p.upvotes_count||0)+1 : (p.upvotes_count||0)}</span>
                    </button>
                    <button className="bookmark-btn saved" onClick={() => { toggleBookmark(p.id); toast('Bookmark removed'); }} title="Remove bookmark">
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
