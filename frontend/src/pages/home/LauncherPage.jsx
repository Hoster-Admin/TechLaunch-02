import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { ARTICLES } from './ArticlesPage';
import { PeopleContent } from './PeoplePage';

const TABS = ['All', 'Articles', 'Posts', 'People'];

const COMMUNITY_POSTS = [
  {
    id: 'post-1',
    type: 'post',
    author: 'Sara Al-Mahmoud',
    authorHandle: 'sara_builds',
    initials: 'SA',
    date: 'March 12, 2026',
    content: 'Just crossed 500 users on EduMENA without spending a single dirham on ads. Organic growth through product communities like this one is real — keep building in public.',
    likes: 42,
    replies: 11,
    tag: 'Milestone',
  },
  {
    id: 'post-2',
    type: 'post',
    author: 'Yousef Al-Otaibi',
    authorHandle: 'yousef_vc',
    initials: 'YA',
    date: 'March 10, 2026',
    content: 'What sectors are MENA founders building in right now? Seeing a lot of fintech and edtech but feels like climate tech is underrepresented compared to global trends.',
    likes: 28,
    replies: 19,
    tag: 'Discussion',
  },
  {
    id: 'post-3',
    type: 'post',
    author: 'Reem Al-Zahrani',
    authorHandle: 'reem_founder',
    initials: 'RA',
    date: 'March 9, 2026',
    content: 'Tip for MENA founders: localise your onboarding copy in Arabic, even a basic version. We saw a 2x increase in activation rate from Saudi users after doing this.',
    likes: 63,
    replies: 8,
    tag: 'Tip',
  },
];

const TAG_COLORS = {
  Guide: { bg: '#f0f7ff', color: '#2563eb' },
  'Founder Story': { bg: '#fff7ed', color: '#ea580c' },
  Report: { bg: '#f0fdf4', color: '#16a34a' },
  Milestone: { bg: '#fdf4ff', color: '#9333ea' },
  Discussion: { bg: '#eff6ff', color: '#2563eb' },
  Tip: { bg: '#f0fdf4', color: '#15803d' },
};

function ArticleCard({ article, onClick }) {
  const tagStyle = TAG_COLORS[article.tag] || { bg: '#f4f4f4', color: '#555' };
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1.5px solid #f0f0f0',
        borderRadius: 16,
        padding: '22px 24px',
        cursor: 'pointer',
        transition: 'border-color .15s, box-shadow .15s',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(225,80,51,.08)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
          padding: '3px 9px', borderRadius: 20, background: tagStyle.bg, color: tagStyle.color,
        }}>{article.tag}</span>
        <span style={{ fontSize: 12, color: '#bbb' }}>Article</span>
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.35, marginBottom: 8, color: '#0a0a0a' }}>
        {article.title}
      </div>
      <div style={{ fontSize: 13, color: '#777', lineHeight: 1.6, marginBottom: 16 }}>
        {article.excerpt}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: 'var(--orange)',
          color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>{article.initials}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{article.author}</div>
          <div style={{ fontSize: 11, color: '#bbb' }}>{article.date} · {article.readTime}</div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const tagStyle = TAG_COLORS[post.tag] || { bg: '#f4f4f4', color: '#555' };

  const goToProfile = (e) => {
    e.stopPropagation();
    navigate(`/u/${post.authorHandle}`);
  };

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #f0f0f0',
      borderRadius: 16,
      padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div
          onClick={goToProfile}
          style={{
            width: 36, height: 36, borderRadius: 10, background: '#0a0a0a',
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800,
            flexShrink: 0, cursor: 'pointer',
          }}>{post.initials}</div>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={goToProfile}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{post.author}</div>
          <div style={{ fontSize: 11, color: '#bbb' }}>@{post.authorHandle} · {post.date}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
          padding: '3px 9px', borderRadius: 20, background: tagStyle.bg, color: tagStyle.color,
        }}>{post.tag}</span>
      </div>

      <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7, margin: '0 0 16px' }}>{post.content}</p>

      <div style={{ display: 'flex', gap: 20 }}>
        <button
          onClick={() => setLiked(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            color: liked ? 'var(--orange)' : '#888', background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontFamily: "'DM Sans',sans-serif", transition: 'color .15s',
          }}
        >
          <span style={{ fontSize: 15, lineHeight: 1, filter: liked ? 'none' : 'grayscale(1)', transition: 'filter .15s' }}>🎉</span>
          {post.likes + (liked ? 1 : 0)}
        </button>
        <button
          onClick={() => setShowComments(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            color: showComments ? 'var(--orange)' : '#888', background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontFamily: "'DM Sans',sans-serif", transition: 'color .15s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {post.replies}
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#bbb' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa' }}>No replies yet</div>
            <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Be the first to reply</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <input
              placeholder="Write a reply…"
              style={{
                flex: 1, padding: '9px 14px', border: '1.5px solid #e8e8e8', borderRadius: 10,
                fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
            <button style={{
              padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--orange)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>Reply</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LauncherPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');

  const allItems = [
    ...COMMUNITY_POSTS.map(p => ({ ...p, _sort: p.date })),
    ...ARTICLES.map(a => ({ ...a, type: 'article', _sort: a.date })),
  ].sort((a, b) => new Date(b._sort) - new Date(a._sort));

  const filtered = activeTab === 'All'
    ? allItems
    : activeTab === 'Articles'
      ? allItems.filter(i => i.type === 'article')
      : activeTab === 'Posts'
        ? allItems.filter(i => i.type === 'post')
        : [];

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: '#fafafa' }}>

        <div className="page-header-section">
          <div className="page-header-inner">
            <div>
              <h2>🚀 Launcher</h2>
              <p>Community activity from founders, investors, and builders across MENA.</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: activeTab === 'People' ? 1100 : 720, margin: '0 auto', padding: '32px 24px 80px', transition: 'max-width .2s' }}>

          <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1.5px solid #ebebeb', paddingBottom: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 700,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: activeTab === tab ? 'var(--orange)' : '#888',
                  borderBottom: activeTab === tab ? '2px solid var(--orange)' : '2px solid transparent',
                  marginBottom: -1.5, transition: 'color .15s',
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >{tab}</button>
            ))}
          </div>

          {activeTab === 'People' ? (
            <PeopleContent/>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Nothing here yet</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>Community activity will show up here.</div>
                </div>
              ) : filtered.map(item =>
                item.type === 'article'
                  ? <ArticleCard key={item.slug} article={item} onClick={() => navigate(`/articles/${item.slug}`)}/>
                  : <PostCard key={item.id} post={item}/>
              )}
            </div>
          )}

        </div>
      </div>
      <Footer/>
    </>
  );
}
