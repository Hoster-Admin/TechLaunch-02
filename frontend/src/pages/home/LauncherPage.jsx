import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { ARTICLES } from './ArticlesPage';
import { PeopleContent } from './PeoplePage';
import { useAuth } from '../../context/AuthContext';
import { launcherAPI, uploadAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const TABS = ['All', 'Articles', 'Posts', 'People'];

const POST_TAGS = ['Discussion', 'Milestone', 'Tip', 'Question', 'Announcement', 'Ask'];

const TAG_COLORS = {
  Guide:        { bg: '#f0f7ff', color: '#2563eb' },
  'For Students':{ bg: '#f5f3ff', color: '#7c3aed' },
  'Founder Story':{ bg: '#fff7ed', color: '#ea580c' },
  Report:       { bg: '#f0fdf4', color: '#16a34a' },
  Milestone:    { bg: '#fdf4ff', color: '#9333ea' },
  Discussion:   { bg: '#eff6ff', color: '#2563eb' },
  Tip:          { bg: '#f0fdf4', color: '#15803d' },
  Question:     { bg: '#fff7ed', color: '#c2410c' },
  Announcement: { bg: '#fefce8', color: '#a16207' },
  Ask:          { bg: '#f0fdf4', color: '#0f766e' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function PostAvatar({ author, avatarColor, avatarUrl, size = 36 }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={author}
      style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>;
  }
  const initials = (author || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: avatarColor || '#0a0a0a',
      color: '#fff', display: 'grid', placeItems: 'center', fontSize: size * 0.33,
      fontWeight: 800, flexShrink: 0,
    }}>{initials}</div>
  );
}

function PostCard({ post, onDeleted, currentUser }) {
  const navigate = useNavigate();
  const [liked, setLiked]             = useState(post.liked);
  const [likesCount, setLikesCount]   = useState(Number(post.likes_count));
  const [liking, setLiking]           = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]       = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [reply, setReply]             = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const tagStyle = TAG_COLORS[post.tag] || { bg: '#f4f4f4', color: '#555' };
  const isOwner = currentUser && currentUser.id === post.user_id;

  const goToProfile = (e) => { e.stopPropagation(); navigate(`/u/${post.author_handle}`); };

  const handleLike = async () => {
    if (!currentUser) { toast.error('Sign in to react to posts'); return; }
    if (liking) return;
    setLiking(true);
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => prev ? c - 1 : c + 1);
    try {
      const res = await launcherAPI.like(post.id);
      setLiked(res.data.data.liked);
    } catch {
      setLiked(prev);
      setLikesCount(c => prev ? c + 1 : c - 1);
    }
    setLiking(false);
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      setLoadingComments(true);
      try {
        const res = await launcherAPI.comments(post.id);
        setComments(res.data.data || []);
        setCommentsLoaded(true);
      } catch { toast.error('Failed to load replies'); }
      finally { setLoadingComments(false); }
    }
  };

  const handleReply = async () => {
    if (!currentUser) { toast.error('Sign in to reply'); return; }
    if (!reply.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await launcherAPI.addComment(post.id, reply.trim());
      setComments(c => [...c, res.data.data]);
      setReply('');
      toast.success('Reply posted!');
    } catch { toast.error('Failed to post reply'); }
    finally { setSubmittingReply(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await launcherAPI.deletePost(post.id);
      toast.success('Post deleted');
      onDeleted?.(post.id);
    } catch { toast.error('Failed to delete post'); }
  };

  return (
    <div style={{
      background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div onClick={goToProfile} style={{ cursor: 'pointer', flexShrink: 0 }}>
          <PostAvatar author={post.author} avatarColor={post.avatar_color} avatarUrl={post.avatar_url}/>
        </div>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={goToProfile}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>
            {post.author}
            {post.verified && <span style={{ marginLeft: 4, fontSize: 12 }}>✅</span>}
          </div>
          <div style={{ fontSize: 11, color: '#bbb' }}>@{post.author_handle} · {timeAgo(post.created_at)}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
          padding: '3px 9px', borderRadius: 20, background: tagStyle.bg, color: tagStyle.color,
        }}>{post.tag}</span>
        {isOwner && (
          <button onClick={handleDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
            title="Delete post">✕</button>
        )}
      </div>

      <p
        style={{ fontSize: 14, color: '#333', lineHeight: 1.7, margin: `0 0 ${post.image_url ? '12px' : '16px'}`, cursor: 'pointer' }}
        onClick={() => navigate(`/launcher/posts/${post.id}`)}
        title="Open post"
      >{post.content}</p>

      {post.image_url && (
        <div
          style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', cursor: 'pointer' }}
          onClick={() => navigate(`/launcher/posts/${post.id}`)}
        >
          <img
            src={post.image_url}
            alt="Post image"
            style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 20 }}>
        <button onClick={handleLike}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            color: liked ? 'var(--orange)' : '#888', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontFamily: "'DM Sans',sans-serif", transition: 'color .15s',
          }}>
          <span style={{ fontSize: 15, lineHeight: 1, filter: liked ? 'none' : 'grayscale(1)', transition: 'filter .15s' }}>🎉</span>
          {likesCount}
        </button>
        <button onClick={handleToggleComments}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            color: showComments ? 'var(--orange)' : '#888', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontFamily: "'DM Sans',sans-serif", transition: 'color .15s',
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {post.comments_count || comments.length}
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: '12px 0', color: '#bbb', fontSize: 13 }}>Loading replies…</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#bbb' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa' }}>No replies yet</div>
              <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Be the first to reply</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                  <PostAvatar author={c.author} avatarColor={c.avatar_color} avatarUrl={c.avatar_url} size={28}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>
                      {c.author} <span style={{ fontWeight: 400, color: '#bbb' }}>· {timeAgo(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <input value={reply} onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
              placeholder="Write a reply…"
              style={{
                flex: 1, padding: '9px 14px', border: '1.5px solid #e8e8e8', borderRadius: 10,
                fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
            <button onClick={handleReply} disabled={submittingReply || !reply.trim()}
              style={{
                padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--orange)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif", opacity: submittingReply || !reply.trim() ? 0.6 : 1,
              }}>
              {submittingReply ? '…' : 'Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, onClick }) {
  const tagStyle = TAG_COLORS[article.tag] || { bg: '#f4f4f4', color: '#555' };
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '22px 24px',
      cursor: 'pointer', transition: 'box-shadow .15s, border-color .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,.06)'; e.currentTarget.style.borderColor='#e0e0e0'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#f0f0f0'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
          padding: '3px 9px', borderRadius: 20, background: tagStyle.bg, color: tagStyle.color }}>
          {article.tag}
        </span>
        <span style={{ fontSize: 11, color: '#ccc' }}>{article.readTime}</span>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a', margin: '0 0 8px', lineHeight: 1.4 }}>
        {article.title}
      </h3>
      <p style={{ fontSize: 13, color: '#777', lineHeight: 1.6, margin: '0 0 14px' }}>
        {article.excerpt}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#0a0a0a',
          color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 800 }}>
          {article.initials}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{article.author}</div>
        <div style={{ fontSize: 11, color: '#bbb' }}>{article.date}</div>
      </div>
    </div>
  );
}

function CreatePostModal({ onClose, onCreated }) {
  const [content, setContent]   = useState('');
  const [tag, setTag]           = useState('Discussion');
  const [loading, setLoading]   = useState(false);
  const [imgFile, setImgFile]   = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const textRef = useRef();
  const fileRef = useRef();

  useEffect(() => { textRef.current?.focus(); }, []);

  const handleImgSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8 MB'); return; }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const removeImg = () => {
    setImgFile(null);
    setImgPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    if (!content.trim()) { toast.error('Write something first'); return; }
    setLoading(true);
    try {
      let image_url = null;
      if (imgFile) {
        const upRes = await uploadAPI.postImage(imgFile);
        image_url = upRes.data.data.url;
      }
      const res = await launcherAPI.createPost({ content: content.trim(), tag, image_url });
      onCreated(res.data.data);
      toast.success('Post shared!');
      onClose();
    } catch { toast.error('Failed to post'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560,
        boxShadow: '0 8px 48px rgba(0,0,0,.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Share to Launcher</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#aaa', lineHeight: 1 }}>✕</button>
        </div>

        <textarea ref={textRef} value={content} onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind? Share a milestone, tip, question, or discussion with the MENA tech community…"
          maxLength={2000}
          rows={5}
          style={{
            width: '100%', padding: '12px 14px', border: '1.5px solid #e8e8e8', borderRadius: 12,
            fontSize: 14, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', outline: 'none',
            lineHeight: 1.6, boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = '#e8e8e8'}
        />
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 }}>
          {content.length}/2000
        </div>

        {/* Image preview */}
        {imgPreview && (
          <div style={{ position: 'relative', marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e8e8e8' }}>
            <img
              src={imgPreview}
              alt="Preview"
              style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={removeImg}
              style={{
                position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.55)',
                border: 'none', borderRadius: '50%', width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontSize: 14, lineHeight: 1,
              }}
            >✕</button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          {/* Tag selector */}
          <select value={tag} onChange={e => setTag(e.target.value)}
            style={{
              padding: '8px 12px', border: '1.5px solid #e8e8e8', borderRadius: 10,
              fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', cursor: 'pointer', background: '#fff',
            }}>
            {POST_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Image attach button */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImgSelect}
          />
          <button
            onClick={() => fileRef.current?.click()}
            title="Add image"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1.5px solid ${imgFile ? 'var(--orange)' : '#e8e8e8'}`,
              background: imgFile ? '#fff5f2' : '#fff',
              color: imgFile ? 'var(--orange)' : '#888',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 16 }}>📷</span>
            {imgFile ? 'Change' : 'Photo'}
          </button>

          {/* Submit */}
          <button onClick={submit} disabled={loading || !content.trim()}
            style={{
              marginLeft: 'auto', padding: '10px 24px', borderRadius: 12, border: 'none',
              background: 'var(--orange)', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading || !content.trim() ? 'default' : 'pointer',
              opacity: loading || !content.trim() ? 0.6 : 1,
              fontFamily: "'DM Sans',sans-serif",
            }}>
            {loading ? (imgFile ? 'Uploading…' : 'Posting…') : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LauncherPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [activeTab, setActiveTab] = useState('All');

  const [posts, setPosts]           = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await launcherAPI.posts();
      setPosts(res.data.data || []);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const allItems = [
    ...posts.map(p => ({ ...p, _type: 'post', _sort: p.created_at })),
    ...ARTICLES.map(a => ({ ...a, _type: 'article', _sort: a.date })),
  ].sort((a, b) => new Date(b._sort) - new Date(a._sort));

  const filtered = activeTab === 'All'
    ? allItems
    : activeTab === 'Articles'
      ? allItems.filter(i => i._type === 'article')
      : activeTab === 'Posts'
        ? allItems.filter(i => i._type === 'post')
        : [];

  return (
    <>
      <Navbar/>
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} onCreated={handlePostCreated}/>
      )}
      <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', background: '#fafafa' }}>

        <div className="page-header-section">
          <div className="page-header-inner">
            <div>
              <h2>🚀 Launcher</h2>
              <p>Community activity from founders, investors, and builders across MENA.</p>
            </div>
            {user && (
              <button className="page-header-cta" onClick={() => setShowCreatePost(true)}>
                + Write Post
              </button>
            )}
          </div>
        </div>

        <div style={{ maxWidth: activeTab === 'People' ? 1100 : 720, margin: '0 auto', padding: '32px 24px 80px', transition: 'max-width .2s' }}>

          <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1.5px solid #ebebeb', paddingBottom: 0 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 700, background: 'none', border: 'none',
                  cursor: 'pointer', color: activeTab === tab ? 'var(--orange)' : '#888',
                  borderBottom: activeTab === tab ? '2px solid var(--orange)' : '2px solid transparent',
                  marginBottom: -1.5, transition: 'color .15s', fontFamily: "'DM Sans',sans-serif",
                }}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'People' ? (
            <PeopleContent/>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeTab !== 'Articles' && user && (
                <button onClick={() => setShowCreatePost(true)} style={{
                  width: '100%', padding: '14px 20px', background: '#fff', border: '1.5px dashed #e0e0e0',
                  borderRadius: 16, fontSize: 14, color: '#aaa', cursor: 'pointer', textAlign: 'left',
                  fontFamily: "'DM Sans',sans-serif", transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#e0e0e0'; e.currentTarget.style.color='#aaa'; }}>
                  🚀 Share something with the community…
                </button>
              )}
              {postsLoading && activeTab !== 'Articles' ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 14 }}>
                  Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Nothing here yet</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>Community activity will show up here.</div>
                </div>
              ) : filtered.map(item =>
                item._type === 'article'
                  ? <ArticleCard key={item.slug} article={item} onClick={() => navigate(`/articles/${item.slug}`)}/>
                  : <PostCard key={item.id} post={item} currentUser={user}
                      onDeleted={handlePostDeleted}/>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
}
