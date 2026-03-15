import React, { useEffect, useState, useRef, useCallback } from 'react';
import { adminAPI, uploadFile } from '../utils/api.js';

const POST_TYPES = [
  { value: 'post',    label: 'Post',    emoji: '📢' },
  { value: 'article', label: 'Article', emoji: '📰' },
];

const TAB_FILTERS = [
  { key: 'all',    label: 'All Activity' },
  { key: 'posts',  label: '📢 Posts' },
  { key: 'upvotes',label: '⬆️ Upvotes' },
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

function AvatarDisplay({ src, fontSize = 24, fallback = 'TL' }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [src]);
  if (src && !imgError) {
    return (
      <img src={src} alt="Platform avatar"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setImgError(true)} />
    );
  }
  return <span style={{ fontSize, fontWeight: 700, color: '#fff', userSelect: 'none' }}>{fallback}</span>;
}

function AvatarUploader({ currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const result = await uploadFile(file);
      onUploaded(result.url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .6 }}>
        Avatar Photo
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid var(--gray-200)' }}>
          <AvatarDisplay src={currentUrl} fontSize={18} fallback="TL" />
        </div>
        <div style={{ flex: 1 }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: 'var(--gray-50)', fontSize: 12, fontWeight: 600, color: 'var(--ink)', cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading…' : '📁 Choose Image'}
          </button>
          {currentUrl && !uploading && (
            <span style={{ marginLeft: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Image set</span>
          )}
          {error && <div style={{ marginTop: 4, fontSize: 11, color: '#E15033' }}>{error}</div>}
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--gray-400)' }}>JPG, PNG, WebP — max 5 MB</div>
        </div>
      </div>
    </div>
  );
}

export default function PlatformProfile() {
  const [profile,    setProfile]    = useState(null);
  const [activity,   setActivity]   = useState([]);
  const [activeTab,  setActiveTab]  = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [actLoading, setActLoading] = useState(false);

  const [postType,    setPostType]    = useState('post');
  const [composeText, setComposeText] = useState('');
  const [posting,     setPosting]     = useState(false);
  const [postError,   setPostError]   = useState('');

  const [articleTags,     setArticleTags]     = useState([]);
  const [selectedTagIds,  setSelectedTagIds]  = useState([]);

  const [editMode,    setEditMode]    = useState(false);
  const [editData,    setEditData]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      adminAPI.publicProfile(),
      adminAPI.platformActivity('all'),
      adminAPI.tags(),
    ]).then(([pd, pub, ad, td]) => {
      const panelData  = pd.data.data  || {};
      const publicData = pub.data.data || {};
      // Merge: panel identity supplies avatar/name overrides; public profile has handle, bio, links
      setProfile({ ...publicData, ...panelData });
      setActivity(ad.data.data.activity || []);
      const all = td.data.data || [];
      setArticleTags(all.filter(t => t.category === 'article'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePost = async () => {
    if (!composeText.trim()) return;
    setPosting(true); setPostError('');
    try {
      const { data: d } = await adminAPI.platformPost({
        type: postType,
        body: composeText.trim(),
        tag_ids: selectedTagIds,
      });
      setActivity(prev => [d.data.post, ...prev]);
      setComposeText('');
      setSelectedTagIds([]);
    } catch (e) { setPostError(e.message || 'Failed to post'); }
    finally { setPosting(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (item.kind === 'post')   await adminAPI.platformDeletePost(item.id);
      if (item.kind === 'upvote') await adminAPI.platformUpvote(item.product_id);
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
      handle:     profile?.handle     || '',
      headline:   profile?.headline   || '',
      bio:        profile?.bio        || '',
      website:    profile?.website    || '',
      twitter:    profile?.twitter    || '',
      linkedin:   profile?.linkedin   || '',
      avatar_url: profile?.avatar_url || '',
    });
    setSaveError(''); setSaveSuccess(false);
    setEditMode(true);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(''); setSaveSuccess(false);
    try {
      const { data: d } = await adminAPI.savePublicProfile(editData);
      setProfile(prev => ({ ...prev, ...d.data }));
      setSaveSuccess(true);
      setTimeout(() => { setEditMode(false); setSaveSuccess(false); }, 800);
    } catch (e) { setSaveError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleTag = (id) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: 'var(--gray-400)', fontSize: 14 }}>
      Loading platform profile…
    </div>
  );

  const avatarUrl = profile?.avatar_url;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>

      {/* ── Panel Identity Header ────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--gray-200)', padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          <AvatarDisplay src={avatarUrl} fallback="TL" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{profile?.name || 'TechLaunch MENA'}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Admin panel posting identity</div>
        </div>
        <button onClick={openEdit}
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--orange)', background: 'rgba(225,80,51,.07)', color: 'var(--orange)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ✏️ Edit
        </button>
      </div>

      {/* ── Edit Public Profile ──────────────────────────────────── */}
      {editMode && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--orange)', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>✏️ Edit Public Profile</h3>
            <button onClick={() => setEditMode(false)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--gray-400)', lineHeight: 1, marginLeft: 12 }}>×</button>
          </div>

          <AvatarUploader
            currentUrl={editData.avatar_url}
            onUploaded={url => setEditData(prev => ({ ...prev, avatar_url: url }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            {[
              { key: 'name',     label: 'Display Name',     placeholder: 'TechLaunch MENA' },
              { key: 'handle',   label: 'Handle',           placeholder: 'techlaunchmena' },
              { key: 'headline', label: 'Tagline / Headline', placeholder: "MENA's Product Discovery Platform" },
              { key: 'website',  label: 'Website',          placeholder: 'https://tlmena.com' },
              { key: 'twitter',  label: 'Twitter Handle',   placeholder: '@techlaunchmena' },
              { key: 'linkedin', label: 'LinkedIn URL',     placeholder: 'company/techlaunch-mena' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .6 }}>{f.label}</label>
                <input
                  value={editData[f.key] || ''}
                  onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .6 }}>Bio</label>
            <textarea
              value={editData.bio || ''}
              onChange={e => setEditData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Short description shown on the public profile…"
              rows={3}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            />
          </div>

          {saveError   && <div style={{ marginTop: 12, fontSize: 12, color: '#E15033' }}>{saveError}</div>}
          {saveSuccess && <div style={{ marginTop: 12, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Saved!</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
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
            <strong style={{ color: 'var(--ink)' }}>Posting as @{profile?.handle || 'techlaunchmena'}</strong>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Platform Admin Account</div>
          </div>
        </div>

        {/* Post type: Post / Article */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {POST_TYPES.map(pt => (
            <button key={pt.value} onClick={() => setPostType(pt.value)}
              style={{ fontSize: 12, padding: '6px 16px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
                borderColor: postType === pt.value ? 'var(--orange)' : 'var(--gray-200)',
                background:  postType === pt.value ? 'rgba(225,80,51,.08)' : 'var(--gray-50)',
                color:       postType === pt.value ? 'var(--orange)' : 'var(--gray-600)' }}>
              {pt.emoji} {pt.label}
            </button>
          ))}
        </div>

        {/* Tag selector — article tags from tag management */}
        {articleTags.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .6 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {articleTags.map(tag => {
                const sel = selectedTagIds.includes(tag.id);
                return (
                  <button key={tag.id} onClick={() => toggleTag(tag.id)}
                    style={{ padding: '4px 11px', borderRadius: 20, border: `1.5px solid ${sel ? 'var(--orange)' : 'var(--gray-200)'}`, background: sel ? (tag.color || 'rgba(225,80,51,.1)') : 'transparent', color: sel ? (tag.text_color || 'var(--orange)') : 'var(--gray-500)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Text area */}
        <textarea
          value={composeText}
          onChange={e => setComposeText(e.target.value)}
          placeholder={postType === 'article' ? 'Write your article…' : 'Share an update or news with the community…'}
          rows={4}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.55, transition: 'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
        />

        {postError && <div style={{ fontSize: 12, color: '#E15033', marginTop: 6 }}>{postError}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={handlePost} disabled={posting || !composeText.trim()}
            style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: posting || !composeText.trim() ? 'var(--gray-200)' : 'var(--orange)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: posting || !composeText.trim() ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
            {posting ? 'Posting…' : postType === 'article' ? '📰 Publish Article' : '📢 Publish Post'}
          </button>
        </div>
      </div>

      {/* ── Activity Feed ────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {TAB_FILTERS.map(tab => (
            <button key={tab.key} onClick={() => switchTab(tab.key)}
              style={{ padding: '13px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? 'var(--orange)' : 'var(--gray-500)', borderBottom: activeTab === tab.key ? '2.5px solid var(--orange)' : '2.5px solid transparent', whiteSpace: 'nowrap', transition: 'color .15s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '4px 0' }}>
          {actLoading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Loading…</div>
          ) : activity.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✍️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>No activity yet</div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Use the compose box above to publish your first post.</div>
            </div>
          ) : activity.map(item => (
            <ActivityItem key={item.id} item={item} allTags={articleTags} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ item, allTags, onDelete }) {
  const [hover, setHover] = useState(false);

  let icon, label, colorStyle;
  if (item.kind === 'post') {
    icon  = postTypeIcon(item.post_type);
    const typeLabel = item.post_type === 'article' ? 'Article' : 'Post';
    label = <span>{icon} <strong>{typeLabel}</strong></span>;
    colorStyle = { background: 'rgba(225,80,51,.06)', borderLeft: '3px solid var(--orange)' };
  } else {
    icon  = '⬆️';
    label = <span>⬆️ Upvoted <strong>{item.product_name}</strong></span>;
    colorStyle = { background: 'rgba(22,163,74,.04)', borderLeft: '3px solid #16a34a' };
  }

  const itemTagIds = Array.isArray(item.tag_ids) ? item.tag_ids : [];
  const itemTags   = allTags.filter(t => itemTagIds.includes(t.id));

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
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, wordBreak: 'break-word' }}>{item.body}</div>
          )}
          {itemTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {itemTags.map(t => (
                <span key={t.id} style={{ padding: '2px 9px', borderRadius: 20, background: t.color || '#E8E8E8', color: t.text_color || '#374151', fontSize: 11, fontWeight: 600 }}>
                  {t.name}
                </span>
              ))}
            </div>
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
