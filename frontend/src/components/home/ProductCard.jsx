import React, { useState } from 'react';
import { productsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product, rank, onVote }) {
  const { user } = useAuth();
  const { setAuthModal } = useUI();
  const [voted,     setVoted]     = useState(product.user_voted || false);
  const [votes,     setVotes]     = useState(product.upvotes_count || 0);
  const [bookmarked, setBookmarked] = useState(product.user_bookmarked || false);
  const [loading,   setLoading]   = useState(false);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!user) { setAuthModal('gate'); return; }
    if (loading) return;
    setLoading(true);
    try {
      const newVoted = !voted;
      setVoted(newVoted);
      setVotes(v => v + (newVoted ? 1 : -1));
      if (newVoted) await productsAPI.upvote(product.id);
      else await productsAPI.removeUpvote?.(product.id);
      onVote?.();
    } catch { setVoted(!voted); setVotes(v => v + (voted ? 1 : -1)); }
    finally { setLoading(false); }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) { setAuthModal('gate'); return; }
    const next = !bookmarked;
    setBookmarked(next);
    try {
      if (next) await productsAPI.bookmark?.(product.id);
      else await productsAPI.removeBookmark?.(product.id);
    } catch { setBookmarked(!next); }
  };

  let badgeEl = null;
  if (product.badge === 'top')  badgeEl = <span className="badge badge-top">🔥 Top</span>;
  else if (product.badge === 'soon') badgeEl = <span className="badge badge-soon">⏳ Soon</span>;
  else if (product.badge === 'new')  badgeEl = <span className="badge badge-new">🆕 New</span>;
  else if (product.status === 'soon') badgeEl = <span className="badge badge-soon">⏳ Soon</span>;

  return (
    <div className="product-card">
      {rank && <div className="product-rank">#{rank}</div>}

      <div className="product-logo">
        {product.logo_emoji || product.logo_url
          ? (product.logo_emoji || '🚀')
          : <span style={{ fontSize: 26 }}>🚀</span>
        }
      </div>

      <div className="product-body">
        <div className="product-top">
          <span className="product-name">{product.name}</span>
          {badgeEl}
        </div>
        <div className="product-tagline">{product.tagline}</div>
        <div className="product-meta">
          {product.industry && <span className="meta-tag">{product.industry}</span>}
          {product.country  && <span className="meta-tag">{product.country}</span>}
          {(product.tags || []).map(t => <span key={t} className="meta-tag">{t}</span>)}
        </div>
        {product.status === 'soon' && (
          <div className="product-waitlist-inline" onClick={e => e.stopPropagation()}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8, padding:'8px 12px', background:'var(--orange-light)', border:'1px solid rgba(225,80,51,.18)', borderRadius:8, cursor:'pointer', gap:8 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--gray-800)', flex:1, lineHeight:1.4 }}>Get early access →</span>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--orange)', whiteSpace:'nowrap' }}>Join Waitlist ↗</span>
          </div>
        )}
      </div>

      <div className="product-actions" onClick={e => e.stopPropagation()}>
        <button className={`upvote-btn ${voted ? 'voted' : ''}`} onClick={handleUpvote} disabled={loading}>
          <span className="upvote-arrow">🎉</span>
          <span className="upvote-count">{votes}</span>
        </button>

        <button className={`bookmark-btn ${bookmarked ? 'saved' : ''}`} onClick={handleBookmark} title="Bookmark">
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={bookmarked ? 'var(--orange)' : 'none'}
            stroke={bookmarked ? 'var(--orange)' : '#bbb'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
