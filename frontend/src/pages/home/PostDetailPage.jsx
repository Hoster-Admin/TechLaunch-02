import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { launcherAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TAG_COLORS = {
  Milestone: { bg: '#f3e8ff', color: '#7c3aed' },
  Tip:       { bg: '#dcfce7', color: '#16a34a' },
  Question:  { bg: '#dbeafe', color: '#2563eb' },
  Update:    { bg: '#fef9c3', color: '#b45309' },
  Intro:     { bg: '#ffe4e6', color: '#e11d48' },
  Guide:     { bg: '#ffedd5', color: '#c2410c' },
};

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function Avatar({ name, avatarUrl, color, size = 38 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?';
  const style = {
    width: size, height: size, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: color || '#E15033', color: '#fff',
    fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    overflow: 'hidden',
  };
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={{ ...style, objectFit: 'cover' }} />;
  return <div style={style}>{initials}</div>;
}

function CommentRow({ comment, user, postId, onUpdate }) {
  const [liked, setLiked] = useState(comment.liked);
  const [likesCount, setLikesCount] = useState(parseInt(comment.likes_count) || 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user) { toast.error('Sign in to like'); return; }
    const prev = { liked, likesCount };
    setLiked(!liked);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try {
      await launcherAPI.likeComment(comment.id);
    } catch {
      setLiked(prev.liked);
      setLikesCount(prev.likesCount);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await launcherAPI.addComment(postId, `↩ @${comment.author_handle}: ${replyText.trim()}`);
      setReplyText('');
      setShowReply(false);
      onUpdate();
    } catch {
      toast.error('Failed to reply');
    } finally {
      setSubmitting(false);
    }
  };

  const tag = comment.tag;

  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px 0', borderBottom: '1px solid #f1f1f1' }}>
      <div
        style={{ cursor: 'pointer', flexShrink: 0 }}
        onClick={() => navigate(`/u/${comment.author_handle}`)}
      >
        <Avatar name={comment.author} avatarUrl={comment.avatar_url} color={comment.avatar_color} size={36} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span
            style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', cursor: 'pointer' }}
            onClick={() => navigate(`/u/${comment.author_handle}`)}
          >
            {comment.author}
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>@{comment.author_handle}</span>
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>·</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>{comment.body}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, fontSize: 13,
              color: liked ? '#e15033' : '#94a3b8', fontWeight: liked ? 700 : 400,
              transition: 'color .15s',
            }}
          >
            <span style={{ fontSize: 15 }}>🎉</span> {likesCount > 0 ? likesCount : ''}
          </button>
          {user && (
            <button
              onClick={() => setShowReply(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 12, color: '#94a3b8', fontWeight: 500,
              }}
            >
              {showReply ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>
        {showReply && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <input
              autoFocus
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
              placeholder={`Reply to @${comment.author_handle}…`}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none',
              }}
            />
            <button
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: '#e15033', color: '#fff', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', opacity: submitting ? .6 : 1,
                fontFamily: 'Inter,sans-serif',
              }}
            >
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentRef = useRef(null);

  const load = async () => {
    try {
      const [pr, cr] = await Promise.all([
        launcherAPI.getPost(id),
        launcherAPI.comments(id),
      ]);
      setPost(pr.data.data);
      setLiked(pr.data.data.liked);
      setLikesCount(parseInt(pr.data.data.likes_count) || 0);
      setComments(cr.data.data || []);
    } catch {
      toast.error('Could not load post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleLike = async () => {
    if (!user) { toast.error('Sign in to like'); return; }
    const prev = { liked, likesCount };
    setLiked(!liked);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try {
      await launcherAPI.like(id);
    } catch {
      setLiked(prev.liked);
      setLikesCount(prev.likesCount);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await launcherAPI.addComment(id, commentText.trim());
      setCommentText('');
      await load();
      setTimeout(() => commentRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#94a3b8' }}>
      Loading…
    </div>
  );

  if (!post) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: '#94a3b8' }}>Post not found.</p>
      <button onClick={() => navigate('/launcher')} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Back to Launcher</button>
    </div>
  );

  const tagStyle = TAG_COLORS[post.tag] || { bg: '#f1f5f9', color: '#475569' };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14, color: '#475569', fontWeight: 600,
              fontFamily: 'Inter,sans-serif', padding: '6px 10px', borderRadius: 8,
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 14, color: '#cbd5e1' }}>Post</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        {/* Post card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px 28px', marginBottom: 24 }}>
          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${post.author_handle}`)}>
              <Avatar name={post.author} avatarUrl={post.avatar_url} color={post.avatar_color} size={44} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', cursor: 'pointer' }}
                  onClick={() => navigate(`/u/${post.author_handle}`)}
                >
                  {post.author}
                </span>
                {post.verified && <span style={{ fontSize: 13, color: '#3b82f6' }}>✓</span>}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>@{post.author_handle} · {timeAgo(post.created_at)}</div>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: tagStyle.bg, color: tagStyle.color,
            }}>
              {post.tag}
            </div>
          </div>

          {/* Content */}
          <p style={{ margin: '0 0 20px', fontSize: 16, color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: liked ? '#fff5f2' : '#f8fafc',
                border: `1.5px solid ${liked ? '#fbc4b4' : '#e2e8f0'}`,
                color: liked ? '#e15033' : '#64748b', borderRadius: 999,
                padding: '7px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                transition: 'all .15s', fontFamily: 'Inter,sans-serif',
              }}
            >
              🎉 {likesCount}
            </button>
            <span style={{ fontSize: 14, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
              💬 {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>

        {/* Add comment */}
        {user && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Avatar name={user.name} avatarUrl={user.avatar_url} color={user.avatar_color} size={36} />
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical',
                    fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box',
                    lineHeight: 1.6,
                  }}
                  onFocus={e => e.target.style.borderColor = '#e15033'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={handleComment}
                    disabled={submitting || !commentText.trim()}
                    style={{
                      padding: '9px 20px', borderRadius: 8, border: 'none',
                      background: '#e15033', color: '#fff', fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', opacity: submitting || !commentText.trim() ? .5 : 1,
                      fontFamily: 'Inter,sans-serif', transition: 'opacity .15s',
                    }}
                  >
                    {submitting ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '8px 24px' }} ref={commentRef}>
          {comments.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: 14 }}>
              No comments yet. {user ? 'Be the first!' : 'Sign in to comment.'}
            </p>
          ) : (
            comments.map(c => (
              <CommentRow key={c.id} comment={c} user={user} postId={id} onUpdate={load} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
