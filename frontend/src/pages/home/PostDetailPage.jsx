import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { launcherAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import toast from 'react-hot-toast';
import RichText from '../../components/home/RichText';
import FormattingToolbar from '../../components/home/FormattingToolbar';

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
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Avatar({ name, avatarUrl, color, size = 36 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const base = {
    width: size, height: size, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: color || '#E15033', color: '#fff',
    fontSize: size * 0.37, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
  };
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={{ ...base, objectFit: 'cover' }} />;
  return <div style={base}>{initials}</div>;
}

function CommentBody({ body }) {
  if (!body.startsWith('@')) return <RichText text={body} />;
  const spaceIdx = body.indexOf(' ');
  const mention = spaceIdx > 0 ? body.slice(0, spaceIdx) : body;
  const rest = spaceIdx > 0 ? body.slice(spaceIdx + 1) : '';
  return (
    <>
      <span style={{
        display: 'inline-block', background: '#dbeafe', color: '#2563eb',
        borderRadius: 6, padding: '1px 7px', fontSize: 12, fontWeight: 600, marginRight: 6,
      }}>{mention}</span>
      <RichText text={rest} />
    </>
  );
}

const REPLY_LIMIT = 1000;

/* ─── single comment ───────────────────────────────────────────── */
function CommentBubble({ comment, user, postId, onUpdate, replies = [], isReply = false }) {
  const navigate = useNavigate();
  const { setAuthModal } = useUI();
  const [liked, setLiked]           = useState(comment.liked);
  const [likesCount, setLikesCount] = useState(parseInt(comment.likes_count) || 0);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies]   = useState(false);
  const [replyText, setReplyText]       = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [expanded, setExpanded]         = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editText, setEditText]         = useState(comment.body);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [commentBody, setCommentBody]   = useState(comment.body);
  const [showMenu, setShowMenu]         = useState(false);
  const [isEdited, setIsEdited]         = useState(comment.edited || false);
  const replyRef = useRef(null);
  const menuRef  = useRef(null);
  const isOwner = user && user.id === comment.user_id;
  const TRUNCATE_LIMIT = 280;
  const needsTruncation = commentBody.length > TRUNCATE_LIMIT;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDeleteComment = async () => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    try {
      await launcherAPI.deleteComment(comment.id);
      toast.success('Comment deleted');
      onUpdate();
    } catch { toast.error('Failed to delete comment'); }
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) return;
    if (editText.trim().length > 1000) { toast.error('Comment is too long (Max 1000 characters)'); return; }
    setEditSubmitting(true);
    try {
      const res = await launcherAPI.editComment(comment.id, editText.trim());
      setCommentBody(res.data.data.body);
      setIsEdited(true);
      setEditing(false);
    } catch { toast.error('Failed to edit comment'); }
    finally { setEditSubmitting(false); }
  };

  const handleLike = async () => {
    if (!user) { setAuthModal('login'); return; }
    setLiked(v => !v);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try { await launcherAPI.likeComment(comment.id); }
    catch { setLiked(v => !v); setLikesCount(c => liked ? c + 1 : c - 1); }
  };

  const openReply = () => {
    if (!user) { setAuthModal('login'); return; }
    setShowReplyBox(true);
    setTimeout(() => replyRef.current?.focus(), 60);
  };

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return;
    if (replyText.trim().length > REPLY_LIMIT) { toast.error(`Reply is too long (max ${REPLY_LIMIT} characters)`); return; }
    setSubmitting(true);
    try {
      await launcherAPI.addComment(postId, `@${comment.author_handle} ${replyText.trim()}`, comment.id);
      setReplyText('');
      setShowReplyBox(false);
      setShowReplies(true);
      await onUpdate();
      toast.success('Reply posted!');
    } catch { toast.error('Failed to reply'); }
    finally { setSubmitting(false); }
  };

  const replyCount = replies.length;

  return (
    <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
      {/* avatar column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${comment.author_handle}`)}>
          <Avatar name={comment.author} avatarUrl={comment.avatar_url} color={comment.avatar_color} size={isReply ? 28 : 36} />
        </div>
        {/* vertical thread line — shown when reply box is open OR replies exist and are shown */}
        {(showReplyBox || (showReplies && replyCount > 0)) && (
          <div style={{ width: 2, flex: 1, minHeight: 12, background: '#e2e8f0', borderRadius: 2, marginTop: 4 }} />
        )}
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
        {/* name + time */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
          <span
            style={{ fontWeight: 700, fontSize: isReply ? 12 : 13, color: '#0f172a', cursor: 'pointer' }}
            onClick={() => navigate(`/u/${comment.author_handle}`)}
          >{comment.author}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>@{comment.author_handle}</span>
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>·</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(comment.created_at)}</span>
        </div>

        {/* bubble */}
        <div style={{
          background: isReply ? '#f0f9ff' : '#f8fafc',
          border: `1px solid ${isReply ? '#bae6fd' : '#e8edf2'}`,
          borderRadius: isReply ? '4px 16px 16px 16px' : '4px 18px 18px 18px',
          padding: isReply ? '10px 14px' : '12px 16px',
          fontSize: isReply ? 13 : 14,
          color: '#1e293b', lineHeight: 1.65,
          position: 'relative',
        }}>
          {isOwner && !editing && (
            <div ref={menuRef} style={{ position: 'absolute', top: 8, right: 8 }}>
              <button onClick={() => setShowMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: '2px 6px', borderRadius: 6, lineHeight: 1 }}>⋯</button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,.1)', zIndex: 100, minWidth: 120, overflow: 'hidden' }}>
                  <button onClick={() => { setEditing(true); setEditText(commentBody); setShowMenu(false); }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#334155', fontWeight: 500 }}>✏️ Edit</button>
                  <button onClick={() => { setShowMenu(false); handleDeleteComment(); }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#e15033', fontWeight: 500 }}>🗑️ Delete</button>
                </div>
              )}
            </div>
          )}
          {editing ? (
            <div>
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: isReply ? 13 : 14, fontFamily: 'Inter,sans-serif', color: '#1e293b', lineHeight: 1.65, background: 'transparent', boxSizing: 'border-box' }}
                maxLength={1000} autoFocus/>
              <div style={{ fontSize: 11, color: editText.length > 900 ? '#e15033' : '#94a3b8', textAlign: 'right', marginBottom: 8 }}>{editText.length}/1000</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditing(false)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
                <button onClick={handleEditSubmit} disabled={editSubmitting || !editText.trim()} style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: '#e15033', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{editSubmitting ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                <CommentBody body={needsTruncation && !expanded ? commentBody.slice(0, TRUNCATE_LIMIT) + '…' : commentBody} />
              </div>
              {needsTruncation && (
                <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e15033', fontSize: 12, fontWeight: 600, padding: '4px 0 0', fontFamily: 'Inter,sans-serif' }}>
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
              {isEdited && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>(edited)</span>}
            </>
          )}
        </div>

        {/* action row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          {/* like */}
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 0', fontSize: 12,
            color: liked ? '#e15033' : '#94a3b8', fontWeight: liked ? 700 : 500,
            fontFamily: 'Inter,sans-serif', transition: 'color .15s',
          }}>
            <span style={{ fontSize: 14, filter: liked ? 'none' : 'grayscale(1)', transition: 'filter .2s' }}>🎉</span>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          {/* reply — only on top-level comments */}
          {!isReply && (
            <button onClick={showReplyBox ? () => { setShowReplyBox(false); setReplyText(''); } : openReply} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: showReplyBox ? '#e15033' : '#94a3b8',
              fontWeight: 600, padding: '2px 0', fontFamily: 'Inter,sans-serif', transition: 'color .15s',
            }}>
              {showReplyBox ? '✕ Cancel' : '↩ Reply'}
            </button>
          )}

          {/* show/hide replies toggle */}
          {!isReply && replyCount > 0 && (
            <button onClick={() => setShowReplies(v => !v)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#64748b', fontWeight: 600, padding: '2px 0',
              fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4,
              transition: 'color .15s',
            }}>
              <span style={{
                display: 'inline-block', transition: 'transform .18s',
                transform: showReplies ? 'rotate(90deg)' : 'rotate(0deg)',
                fontSize: 10,
              }}>▶</span>
              {showReplies ? `Hide ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>

        {/* inline reply box */}
        {showReplyBox && (
          <div style={{
            marginTop: 10,
            background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
            padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
            animation: 'slideDown .18s ease',
          }}>
            {user && <Avatar name={user.name} avatarUrl={user.avatar_url} color={user.avatar_color} size={26} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Replying to <span style={{ color: '#2563eb' }}>@{comment.author_handle}</span>
              </div>
              <textarea
                ref={replyRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                placeholder={`What do you think, ${user?.name?.split(' ')[0] || ''}?`}
                rows={2}
                style={{
                  width: '100%', border: 'none', outline: 'none', resize: 'none',
                  fontSize: 13, fontFamily: 'Inter,sans-serif', color: '#1e293b',
                  lineHeight: 1.6, background: 'transparent', boxSizing: 'border-box',
                }}
              />
              <FormattingToolbar textareaRef={replyRef} value={replyText} setValue={setReplyText} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 8, borderTop: '1px solid #f1f5f9', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: replyText.length > REPLY_LIMIT ? 700 : 400, color: replyText.length > REPLY_LIMIT ? '#ef4444' : replyText.length > REPLY_LIMIT * 0.9 ? '#f59e0b' : '#94a3b8', flexShrink: 0 }}>
                  {replyText.length} / {REPLY_LIMIT}
                  {replyText.length > REPLY_LIMIT && ' — too long'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowReplyBox(false); setReplyText(''); }} style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer',
                    fontFamily: 'Inter,sans-serif', fontWeight: 600,
                  }}>Cancel</button>
                  <button onClick={handleReply} disabled={submitting || !replyText.trim() || replyText.length > REPLY_LIMIT} style={{
                    padding: '6px 16px', borderRadius: 8, border: 'none',
                    background: (replyText.trim() && replyText.length <= REPLY_LIMIT) ? '#e15033' : '#f1f5f9',
                    color: (replyText.trim() && replyText.length <= REPLY_LIMIT) ? '#fff' : '#94a3b8',
                    fontSize: 12, fontWeight: 700, cursor: (replyText.trim() && replyText.length <= REPLY_LIMIT) ? 'pointer' : 'default',
                    fontFamily: 'Inter,sans-serif', transition: 'all .15s',
                  }}>
                    {submitting ? 'Posting…' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* nested replies (collapsed by default) */}
        {!isReply && showReplies && replyCount > 0 && (
          <div style={{
            marginTop: 10, paddingLeft: 2,
            borderLeft: '2px solid #e2e8f0',
            paddingTop: 6, paddingBottom: 2,
            display: 'flex', flexDirection: 'column', gap: 12,
            animation: 'slideDown .18s ease',
          }}>
            {replies.map(r => (
              <div key={r.id} style={{ paddingLeft: 12 }}>
                <CommentBubble
                  comment={r}
                  user={user}
                  postId={postId}
                  onUpdate={onUpdate}
                  isReply={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────── */
export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setAuthModal } = useUI();

  const [post, setPost]               = useState(null);
  const [topComments, setTopComments] = useState([]);
  const [repliesMap, setRepliesMap]   = useState({});
  const [loading, setLoading]         = useState(true);
  const [liked, setLiked]             = useState(false);
  const [likesCount, setLikesCount]   = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);
  const [totalComments, setTotalComments]   = useState(0);
  const commentAreaRef = useRef(null);
  const commentBoxRef  = useRef(null);

  const load = useCallback(async () => {
    try {
      const [pr, cr] = await Promise.all([
        launcherAPI.getPost(id),
        launcherAPI.comments(id),
      ]);
      setPost(pr.data.data);
      setLiked(pr.data.data.liked);
      setLikesCount(parseInt(pr.data.data.likes_count) || 0);

      const all = cr.data.data || [];
      setTotalComments(all.length);

      // Build threaded structure
      const top = [];
      const rMap = {};
      all.forEach(c => {
        if (!c.parent_id) {
          top.push(c);
          rMap[c.id] = rMap[c.id] || [];
        } else {
          if (!rMap[c.parent_id]) rMap[c.parent_id] = [];
          rMap[c.parent_id].push(c);
        }
      });
      setTopComments(top);
      setRepliesMap(rMap);
    } catch {
      toast.error('Could not load post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleLike = async () => {
    if (!user) { setAuthModal('login'); return; }
    setLiked(v => !v);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try { await launcherAPI.like(id); }
    catch { setLiked(v => !v); setLikesCount(c => liked ? c + 1 : c - 1); }
  };

  const focusCommentBox = () => {
    setCommentFocused(true);
    setTimeout(() => commentBoxRef.current?.focus(), 60);
    commentAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    if (commentText.trim().length > 1000) {
      toast.error('Comment is too long (Max 1000 characters)');
      return;
    }
    setSubmitting(true);
    try {
      await launcherAPI.addComment(id, commentText.trim());
      setCommentText('');
      setCommentFocused(false);
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post comment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
      Loading…
    </div>
  );

  if (!post) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <p style={{ color: '#94a3b8' }}>Post not found.</p>
      <button onClick={() => navigate('/launcher')} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Back</button>
    </div>
  );

  const tagStyle = TAG_COLORS[post.tag] || { bg: '#f1f5f9', color: '#475569' };

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div style={{ background: '#f4f6f8', minHeight: '100vh', paddingBottom: 80 }}>
        {/* sticky top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8edf2', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px', height: 54, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 14, color: '#334155', fontWeight: 700,
              fontFamily: 'Inter,sans-serif', padding: '6px 10px 6px 6px', borderRadius: 8,
            }}>← Back</button>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 20px 0' }}>

          {/* ── THE POST ── */}
          <div style={{
            background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0',
            padding: '22px 26px 18px', marginBottom: 3,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/u/${post.author_handle}`)}>
                <Avatar name={post.author} avatarUrl={post.avatar_url} color={post.avatar_color} size={46} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', cursor: 'pointer' }}
                    onClick={() => navigate(`/u/${post.author_handle}`)}>
                    {post.author}
                  </span>
                  {post.verified && <span style={{ fontSize: 12, color: '#3b82f6' }}>✓</span>}
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>@{post.author_handle}</span>
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>·</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(post.created_at)}</span>
                </div>
              </div>
              <span style={{
                padding: '4px 11px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                letterSpacing: '.07em', textTransform: 'uppercase',
                background: tagStyle.bg, color: tagStyle.color, flexShrink: 0,
              }}>{post.tag}</span>
            </div>

            {post.post_type === 'article' && post.title && (
              <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1.3, color: '#0a0a0a', margin: '0 0 14px' }}>
                {post.title}
              </h2>
            )}
            <div style={{
              margin: `0 0 ${post.image_url ? '14px' : '18px'}`, fontSize: 16, color: '#1e293b',
              lineHeight: 1.75, fontWeight: 400,
            }}>
              <RichText text={post.content} />
            </div>

            {post.image_url && (
              <div style={{ marginBottom: 18, borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={post.image_url} alt="Post image" style={{ width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block' }}
                  onError={e => { e.currentTarget.parentElement.style.display = 'none'; }} />
              </div>
            )}

            {/* post actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <button onClick={handleLike} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: liked ? '#fff5f2' : '#f8fafc',
                border: `1.5px solid ${liked ? '#fbc4b4' : '#e2e8f0'}`,
                color: liked ? '#e15033' : '#64748b',
                borderRadius: 999, padding: '6px 16px',
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
                transition: 'all .15s', fontFamily: 'Inter,sans-serif',
              }}>
                <span style={{ fontSize: 15, filter: liked ? 'none' : 'grayscale(1)', transition: 'filter .2s' }}>🎉</span>
                {likesCount}
              </button>

              <button onClick={user ? focusCommentBox : () => setAuthModal('login')} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                color: '#64748b', borderRadius: 999, padding: '6px 16px',
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
                transition: 'all .15s', fontFamily: 'Inter,sans-serif',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
              </button>
            </div>
          </div>

          {/* connector line */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 0 0 39px' }}>
            <div style={{ width: 2, height: 20, background: '#e2e8f0', borderRadius: 2 }} />
          </div>

          {/* ── COMMENTS SECTION ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              padding: '4px 0 14px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {topComments.length} {topComments.length === 1 ? 'Comment' : 'Comments'}
              </span>
              {!user && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  <span onClick={() => setAuthModal('login')} style={{ color: '#e15033', fontWeight: 600, cursor: 'pointer' }}>Sign in</span> to comment
                </span>
              )}
            </div>

            {topComments.length > 0 ? (
              <div style={{ paddingTop: 4 }}>
                {topComments.map((c, i) => (
                  <div key={c.id} style={{
                    paddingTop: 14,
                    paddingBottom: i < topComments.length - 1 ? 14 : 6,
                    borderBottom: i < topComments.length - 1 ? '1px solid #f4f6f8' : 'none',
                  }}>
                    <CommentBubble
                      comment={c}
                      user={user}
                      postId={id}
                      onUpdate={load}
                      replies={repliesMap[c.id] || []}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>No comments yet</div>
                <div style={{ fontSize: 12, color: '#c8d3de', marginTop: 4 }}>
                  {user ? 'Be the first to share your thoughts' : 'Sign in to start the conversation'}
                </div>
              </div>
            )}
          </div>

          {/* ── ADD COMMENT ── */}
          {user && (
            <div ref={commentAreaRef} style={{
              background: '#fff', borderRadius: 18,
              border: `1.5px solid ${commentFocused ? '#e15033' : '#e2e8f0'}`,
              padding: '14px 18px', transition: 'border-color .2s', animation: 'fadeIn .2s ease',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Avatar name={user.name} avatarUrl={user.avatar_url} color={user.avatar_color} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Comment as <span style={{ color: '#e15033' }}>{user.name}</span>
                  </div>
                  <textarea
                    ref={commentBoxRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onFocus={() => setCommentFocused(true)}
                    onBlur={() => !commentText && setCommentFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                    placeholder={`What do you think about this${post?.tag === 'Question' ? ' question' : ''}?`}
                    rows={commentFocused ? 3 : 1}
                    maxLength={1100}
                    style={{
                      width: '100%', border: 'none', outline: 'none', resize: 'none',
                      fontSize: 14, fontFamily: 'Inter,sans-serif', color: '#1e293b',
                      lineHeight: 1.6, background: 'transparent', boxSizing: 'border-box',
                      transition: 'height .2s',
                    }}
                  />
                  {(commentFocused || commentText) && (
                    <div style={{ marginTop: 6 }}>
                      <FormattingToolbar textareaRef={commentBoxRef} value={commentText} setValue={setCommentText} />
                    </div>
                  )}
                  {(commentFocused || commentText) && (
                    <div style={{ fontSize: 11, color: commentText.length > 900 ? '#e15033' : '#94a3b8', textAlign: 'right', marginTop: 2 }}>
                      {commentText.length}/1000
                    </div>
                  )}
                  {(commentFocused || commentText) && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => { setCommentText(''); setCommentFocused(false); }} style={{
                        padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#fff', fontSize: 13, color: '#64748b', cursor: 'pointer',
                        fontFamily: 'Inter,sans-serif', fontWeight: 600,
                      }}>Cancel</button>
                      <button onClick={handleComment} disabled={submitting || !commentText.trim()} style={{
                        padding: '7px 20px', borderRadius: 8, border: 'none',
                        background: commentText.trim() ? '#e15033' : '#f1f5f9',
                        color: commentText.trim() ? '#fff' : '#94a3b8',
                        fontSize: 13, fontWeight: 700,
                        cursor: commentText.trim() ? 'pointer' : 'default',
                        fontFamily: 'Inter,sans-serif', transition: 'all .15s',
                      }}>
                        {submitting ? 'Posting…' : 'Post Comment'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!user && (
            <div style={{
              background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
              padding: '20px 22px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 12px' }}>
                Join the conversation
              </p>
              <button onClick={() => setAuthModal('signup')} style={{
                padding: '9px 24px', borderRadius: 10, border: 'none',
                background: '#e15033', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              }}>Sign up free 🚀</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
