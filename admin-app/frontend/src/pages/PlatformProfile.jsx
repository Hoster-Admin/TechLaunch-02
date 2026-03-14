import React, { useEffect, useState, useRef, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';

const POST_TYPES = [
  { value: 'update',    label: 'Update',    emoji: '📢' },
  { value: 'milestone', label: 'Milestone', emoji: '🏆' },
  { value: 'feature',   label: 'Feature',   emoji: '✨' },
  { value: 'news',      label: 'News',      emoji: '📰' },
];

const TAB_FILTERS = [
  { key: 'all',      label: 'All Activity' },
  { key: 'posts',    label: '📢 Updates' },
  { key: 'comments', label: '💬 Comments' },
  { key: 'upvotes',  label: '⬆️ Upvotes' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function postTypeIcon(t) {
  return POST_TYPES.find(p => p.value === t)?.emoji || '📢';
}

function AvatarDisplay({ src, size = 72, borderRadius = 20, fontSize = 24, fallback = 'TL' }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt="Platform avatar"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <span style={{ fontSize, fontWeight: 700, color: '#fff', userSelect: 'none' }}>{fallback}</span>
  );
}

export default function PlatformProfile() {
  const [profile,   setProfile]   = useState(null);
  const [activity,  setActivity]  = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading,   setLoading]   = useState(true);

  const [mode,        setMode]        = useState('post');
  const [postType,    setPostType]    = useState('update');
  const [composeText, setComposeText] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [posting,  setPosting]  = useState(false);
  const [postError, setPostError] = useState('');
  const [actLoading, setActLoading] = useState(false);

  const [editMode,   setEditMode]   = useState(false);
  const [editData,   setEditData]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const [saveSuccess,setSaveSuccess]= useState(false);

  const searchRef  = useRef(null);
  const searchTimer = useRef(null);

  const loadProfile = useCallback(() => {
    adminAPI.platformProfile().then(({ data: d }) => setProfile(d.data)).catch(() => {});
  }, []);

  const loadActivity = useCallback((tab = 'all') => {
    setActLoading(true);
    adminAPI.platformActivity(tab)
      .then(({ data: d }) => setActivity(d.data.activity || []))
      .catch(() => setActivity([]))
      .finally(() => setActLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      adminAPI.platformProfile(),
      adminAPI.platformActivity('all'),
    ]).then(([pd, ad]) => {
      setProfile(pd.data.data);
      setActivity(ad.data.data.activity || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); setSearchOpen(false); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      adminAPI.platformProductSearch(productSearch)
        .then(({ data: d }) => { setProductResults(d.data.products || []); setSearchOpen(true); })
        .catch(() => {});
    }, 280);
    return () => clearTimeout(searchTimer.current);
  }, [productSearch]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePost = async () => {
    if (!composeText.trim()) return;
    if (mode === 'comment' && !selectedProduct) { setPostError('Select a product to comment on.'); return; }
    setPosting(true); setPostError('');
    try {
      let newItem;
      if (mode === 'post') {
        const { data: d } = await adminAPI.platformPost({ type: postType, body: composeText.trim() });
        newItem = d.data.post;
      } else {
        const { data: d } = await adminAPI.platformComment({ product_id: selectedProduct.id, body: composeText.trim() });
        newItem = d.data.comment;
      }
      setActivity(prev => [newItem, ...prev]);
      setComposeText(''); setSelectedProduct(null); setProductSearch(''); setProductResults([]);
    } catch (e) { setPostError(e.message || 'Failed to post'); }
    finally { setPosting(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (item.kind === 'post')    await adminAPI.platformDeletePost(item.id);
      if (item.kind === 'comment') await adminAPI.platformDeleteComment(item.id);
      if (item.kind === 'upvote') {
        await adminAPI.platformUpvote(item.product_id);
      }
      setActivity(prev => prev.filter(a => a.id !== item.id));
    } catch (e) { alert(e.message || 'Failed to delete'); }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    loadActivity(tab);
  };

  const openEdit = () => {
    setEditData({
      name:       profile?.name       || '',
      headline:   profile?.headline   || '',
      bio:        profile?.bio        || '',
      avatar_url: profile?.avatar_url || '',
      website:    profile?.website    || '',
      twitter:    profile?.twitter    || '',
      linkedin:   profile?.linkedin   || '',
    });
    setSaveError('');
    setSaveSuccess(false);
    setEditMode(true);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(''); setSaveSuccess(false);
    try {
      const { data: d } = await adminAPI.savePlatformProfile(editData);
      setProfile(prev => ({ ...prev, ...d.data }));
      setSaveSuccess(true);
      setTimeout(() => { setEditMode(false); setSaveSuccess(false); }, 800);
    } catch (e) { setSaveError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: 'var(--gray-400)', fontSize: 14 }}>
      Loading platform profile…
    </div>
  );

  const avatarUrl = profile?.avatar_url;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>

      {/* ── Profile Header ──────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden', marginBottom: 20 }}>

        {/* Cover gradient */}
        <div style={{ height: 100, background: 'linear-gradient(135deg, #1a1a2e 0%, #E15033 70%, #ff8c69 100%)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: .5 }}>
            PLATFORM ACCOUNT
          </span>
        </div>

        <div style={{ padding: '0 24px 22px' }}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, border: '3px solid #fff', overflow: 'hidden', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              <AvatarDisplay src={avatarUrl} fallback="TL" />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
              <button onClick={openEdit}
                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--orange)', background: 'rgba(225,80,51,.07)', color: 'var(--orange)', fontWeight: 600, cursor: 'pointer' }}>
                ✏️ Edit Profile
              </button>
              <a href="https://tlmena.com/u/techlaunchmena" target="_blank" rel="noreferrer"
                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }}>
                ↗ View Public Profile
              </a>
            </div>
          </div>

          {/* Name / handle */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{profile?.name || 'TechLaunch MENA'}</span>
              {profile?.verified && (
                <span title="Verified" style={{ background: 'var(--orange)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</span>
              )}
              <span style={{ background: '#1a1a2e', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, letterSpacing: .6 }}>ADMIN</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>@{profile?.handle || 'techlaunchmena'}</div>
            {profile?.headline && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>{profile.headline}</div>}
            {profile?.bio && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 6, lineHeight: 1.55 }}>{profile.bio}</div>}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{profile?.followers_count ?? 244}</span>
              <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Followers</span>
            </div>
            {(profile?.website || profile?.twitter || profile?.linkedin) && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--orange)', textDecoration: 'none' }}>🌐 Website</a>}
                {profile?.twitter && <a href={`https://x.com/${profile.twitter.replace('@','')}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--orange)', textDecoration: 'none' }}>𝕏 Twitter</a>}
                {profile?.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--orange)', textDecoration: 'none' }}>in LinkedIn</a>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Profile Panel ──────────────────────────────────── */}
      {editMode && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--orange)', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>✏️ Edit Platform Profile</h3>
            <button onClick={() => setEditMode(false)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--gray-400)', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { key: 'name',       label: 'Display Name',  placeholder: 'TechLaunch MENA' },
              { key: 'headline',   label: 'Headline',      placeholder: 'Short tagline shown under your name' },
              { key: 'avatar_url', label: 'Avatar URL',    placeholder: 'https://…/photo.jpg' },
              { key: 'website',    label: 'Website',       placeholder: 'https://tlmena.com' },
              { key: 'twitter',    label: 'Twitter / X handle', placeholder: 'techlaunchmena' },
              { key: 'linkedin',   label: 'LinkedIn URL',  placeholder: 'https://linkedin.com/company/…' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .6 }}>{label}</label>
                <input
                  value={editData[key] || ''}
                  onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>
            ))}
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .6 }}>Bio</label>
            <textarea
              value={editData.bio || ''}
              onChange={e => setEditData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell the community about the platform…"
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.55, transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            />
          </div>

          {saveError && <div style={{ marginTop: 10, fontSize: 12, color: '#E15033' }}>{saveError}</div>}
          {saveSuccess && <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Saved!</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditMode(false)}
              style={{ padding: '8px 18px', borderRadius: 9, border: '1.5px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--gray-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 22px', borderRadius: 9, border: 'none', background: saving ? 'var(--gray-200)' : 'var(--orange)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Compose Box ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--gray-200)', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            <AvatarDisplay src={avatarUrl} fontSize={13} fallback="TL" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            <strong style={{ color: 'var(--ink)' }}>Posting as @techlaunchmena</strong>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Platform Admin Account</div>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[{ key:'post', label:'📢 Post Update' }, { key:'comment', label:'💬 Comment on Product' }].map(m => (
            <button key={m.key} onClick={() => { setMode(m.key); setPostError(''); }}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
                borderColor: mode === m.key ? 'var(--orange)' : 'var(--gray-200)',
                background: mode === m.key ? 'rgba(225,80,51,.08)' : 'var(--gray-50)',
                color: mode === m.key ? 'var(--orange)' : 'var(--gray-600)' }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Post type selector (post mode only) */}
        {mode === 'post' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {POST_TYPES.map(pt => (
              <button key={pt.value} onClick={() => setPostType(pt.value)}
                style={{ fontSize: 11, padding: '5px 11px', borderRadius: 7, border: '1.5px solid', cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
                  borderColor: postType === pt.value ? 'var(--orange)' : 'var(--gray-200)',
                  background: postType === pt.value ? 'rgba(225,80,51,.08)' : 'transparent',
                  color: postType === pt.value ? 'var(--orange)' : 'var(--gray-500)' }}>
                {pt.emoji} {pt.label}
              </button>
            ))}
          </div>
        )}

        {/* Product search (comment mode only) */}
        {mode === 'comment' && (
          <div ref={searchRef} style={{ position: 'relative', marginBottom: 12 }}>
            {selectedProduct ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--orange)', background: 'rgba(225,80,51,.04)' }}>
                <span style={{ fontSize: 18 }}>{selectedProduct.logo_emoji || '🚀'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{selectedProduct.name}</span>
                <button onClick={() => { setSelectedProduct(null); setProductSearch(''); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--gray-400)', lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search for a live product to comment on…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = 'var(--orange)'; if (productResults.length) setSearchOpen(true); }}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
            )}
            {searchOpen && productResults.length > 0 && !selectedProduct && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 200, overflow: 'hidden', marginTop: 4 }}>
                {productResults.map(p => (
                  <div key={p.id} onClick={() => { setSelectedProduct(p); setProductSearch(''); setSearchOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--gray-100)', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{p.logo_emoji || '🚀'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.industry}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text area */}
        <textarea
          value={composeText}
          onChange={e => setComposeText(e.target.value)}
          placeholder={mode === 'post' ? 'Share an update, milestone, or news with the community…' : 'Write your comment…'}
          rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.55, transition: 'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
        />

        {postError && <div style={{ fontSize: 12, color: '#E15033', marginTop: 6 }}>{postError}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={handlePost} disabled={posting || !composeText.trim()}
            style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: posting || !composeText.trim() ? 'var(--gray-200)' : 'var(--orange)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: posting || !composeText.trim() ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
            {posting ? 'Posting…' : mode === 'post' ? '📢 Post Update' : '💬 Post Comment'}
          </button>
        </div>
      </div>

      {/* ── Activity Feed ────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {TAB_FILTERS.map(tab => (
            <button key={tab.key} onClick={() => switchTab(tab.key)}
              style={{ padding: '13px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? 'var(--orange)' : 'var(--gray-500)', borderBottom: activeTab === tab.key ? '2.5px solid var(--orange)' : '2.5px solid transparent', whiteSpace: 'nowrap', transition: 'color .15s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div style={{ padding: '4px 0' }}>
          {actLoading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Loading…</div>
          ) : activity.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✍️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>No activity yet</div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Use the compose box above to post your first update or comment.</div>
            </div>
          ) : activity.map(item => (
            <ActivityItem key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ item, onDelete }) {
  const [hover, setHover] = useState(false);

  let icon, label, colorStyle;
  if (item.kind === 'post') {
    icon = postTypeIcon(item.post_type);
    label = <span>{icon} <strong>{item.post_type?.charAt(0).toUpperCase() + item.post_type?.slice(1)}</strong></span>;
    colorStyle = { background: 'rgba(225,80,51,.06)', borderLeft: '3px solid var(--orange)' };
  } else if (item.kind === 'comment') {
    icon = '💬';
    label = <span>💬 Commented on <strong>{item.product_name}</strong></span>;
    colorStyle = { background: 'rgba(37,99,235,.04)', borderLeft: '3px solid #2563eb' };
  } else {
    icon = '⬆️';
    label = <span>⬆️ Upvoted <strong>{item.product_name}</strong></span>;
    colorStyle = { background: 'rgba(22,163,74,.04)', borderLeft: '3px solid #16a34a' };
  }

  return (
    <div
      style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)', transition: 'background .12s', background: hover ? 'var(--gray-50)' : 'transparent' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, ...colorStyle }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
            {label}
            <span style={{ color: 'var(--gray-300)', margin: '0 6px' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{timeAgo(item.created_at)}</span>
          </div>
          {item.body && (
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, wordBreak: 'break-word' }}>
              {item.body}
            </div>
          )}
          {item.kind === 'comment' && item.product_name && (
            <a href={`https://tlmena.com/products/${item.product_slug}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-block', marginTop: 6, fontSize: 11, color: 'var(--orange)', textDecoration: 'none', fontWeight: 600 }}>
              ↗ View {item.product_name}
            </a>
          )}
          {item.kind === 'upvote' && item.product_name && (
            <a href={`https://tlmena.com/products/${item.product_slug}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-block', marginTop: 4, fontSize: 11, color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>
              ↗ {item.product_name}
            </a>
          )}
        </div>
        <button onClick={() => onDelete(item)}
          style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--gray-300)', transition: 'all .15s', flexShrink: 0, opacity: hover ? 1 : 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#E15033'; e.currentTarget.style.borderColor = '#fecaca'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--gray-300)'; e.currentTarget.style.borderColor = 'transparent'; }}
          title="Delete">
          🗑
        </button>
      </div>
    </div>
  );
}
