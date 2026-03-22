import React, { useEffect, useState, useRef, useCallback } from 'react';
import { adminAPI, uploadFile } from '../utils/api.js';

function getPublicBaseUrl() {
  const { hostname } = window.location;
  if (hostname === 'admin.tlmena.com') return 'https://tlmena.com';
  return 'https://tlmena.com';
}

const POST_TYPES = [
  { value: 'post',    label: 'Post',    emoji: '📢' },
  { value: 'article', label: 'Article', emoji: '📰' },
];

const TAB_FILTERS = [
  { key: 'all',     label: 'All Activity' },
  { key: 'posts',   label: '📢 Posts' },
  { key: 'upvotes', label: '⬆️ Upvotes' },
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
        <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
          <AvatarDisplay src={currentUrl} fontSize={20} fallback="TL" />
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
  const [aboutOpen,  setAboutOpen]  = useState(false);

  const [postType,    setPostType]    = useState('post');
  const [composeText, setComposeText] = useState('');
  const [posting,     setPosting]     = useState(false);
  const [postError,   setPostError]   = useState('');

  const [articleTags, setArticleTags] = useState([]);
  const [postTags,    setPostTags]    = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

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

  const loadTags = useCallback(() => {
    adminAPI.tags()
      .then(td => {
        const all = td.data?.data || [];
        setArticleTags(all.filter(t => t.category === 'article' && t.is_active !== false));
        setPostTags(all.filter(t => t.category === 'post'    && t.is_active !== false));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      adminAPI.platformProfile(),
      adminAPI.publicProfile(),
      adminAPI.platformActivity('all'),
    ]).then(([pd, pub, ad]) => {
      const panelData  = pd.data.data  || {};
      const publicData = pub.data.data || {};
      setProfile({ ...publicData, ...panelData });
      setActivity(ad.data.data.activity || []);
    }).catch(() => {}).finally(() => setLoading(false));
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    const onFocus = () => loadTags();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadTags]);

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #f0f0f0', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  );

  const avatarUrl = profile?.avatar_url;
  const initials  = (profile?.name || 'TL').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const hasAbout  = profile?.bio || profile?.website || profile?.twitter || profile?.linkedin;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>

      {/* ── Public Profile Card (matches public site design) ─────── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>

        {/* Banner */}
        <div style={{ height: 100, background: 'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,rgba(225,80,51,.18) 100%)' }}/>

        <div style={{ padding: '0 28px 24px', position: 'relative' }}>

          {/* Circular avatar overlapping banner */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #fff', position: 'absolute', top: -40, left: 28, boxShadow: '0 4px 16px rgba(0,0,0,.15)', overflow: 'hidden', flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={profile?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }}/>
              : <div style={{ width: '100%', height: '100%', background: 'var(--orange)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900 }}>{initials}</div>
            }
          </div>

          {/* Edit button top-right */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, marginBottom: 8 }}>
            <a href={`${getPublicBaseUrl()}/u/${(profile?.handle || 'techlaunchmena').replace('@','')}`}
              target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 16px', borderRadius: 10, background: '#f4f4f4', color: '#555', border: '1.5px solid #e8e8e8', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              🌐 View on Public Site
            </a>
            <button onClick={openEdit}
              style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(225,80,51,.07)', color: 'var(--orange)', border: '1.5px solid var(--orange)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ✏️ Edit Profile
            </button>
          </div>

          {/* Name + handle + verified */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{profile?.name || 'TechLaunch MENA'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>✓ Verified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>@{(profile?.handle || 'techlaunchmena').replace('@', '')}</span>
              <a href={`${getPublicBaseUrl()}/u/${(profile?.handle || 'techlaunchmena').replace('@','')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, textDecoration: 'none', opacity: 0.85 }}>
                tlmena.com/u/{(profile?.handle || 'techlaunchmena').replace('@','')} ↗
              </a>
            </div>

            {/* Persona badge */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(225,80,51,.1)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>
                🌐 Platform
              </div>
            </div>

            {/* Headline */}
            {profile?.headline && (
              <div style={{ fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 1.5 }}>{profile.headline}</div>
            )}

            {/* Collapsible About */}
            {hasAbout && (
              <div style={{ marginBottom: 12 }}>
                <button onClick={() => setAboutOpen(o => !o)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span style={{ fontSize: 12, color: '#777', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>About</span>
                  <span style={{ fontSize: 9, color: '#aaa', transition: 'transform .2s', display: 'inline-block', transform: aboutOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginTop: 1 }}>▼</span>
                </button>

                {aboutOpen && (
                  <div style={{ marginTop: 10, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: '16px 18px' }}>
                    {profile?.bio && (
                      <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 12 }}>{profile.bio}</div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {profile?.website && (
                        <a href={profile.website.startsWith('http') ? profile.website : 'https://' + profile.website}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, fontWeight: 600, color: '#555', textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: '#f0f0f0' }}>
                          🌐 Website
                        </a>
                      )}
                      {profile?.twitter && (
                        <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, fontWeight: 600, color: '#555', textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: '#f0f0f0' }}>
                          𝕏 @{profile.twitter.replace('@', '')}
                        </a>
                      )}
                      {profile?.linkedin && (
                        <a href={`https://linkedin.com/in/${profile.linkedin}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, fontWeight: 600, color: '#555', textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: '#f0f0f0' }}>
                          💼 LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{activity.filter(a => a.kind === 'post').length}</div>
                <div style={{ fontSize: 11, color: '#000', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 1 }}>Posts</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{(profile?.followers_count ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#000', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 1 }}>Followers</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{(profile?.following_count ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#000', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 1 }}>Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Public Profile ──────────────────────────────────── */}
      {editMode && (
        <div style={{ marginBottom: 20 }}>

          {/* Section: Identity */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 18, padding: '24px 28px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a' }}>🪪 Identity</div>
              <button onClick={() => setEditMode(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)', lineHeight: 1, padding: 4 }}>×</button>
            </div>

            {/* Avatar */}
            <div style={{ marginBottom: 20 }}>
              <AvatarUploader
                currentUrl={editData.avatar_url}
                onUploaded={url => setEditData(prev => ({ ...prev, avatar_url: url }))}
              />
            </div>

            {/* Full Name + Handle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>DISPLAY NAME</label>
                <div style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, background: '#fff', display: 'flex' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--orange)'}
                  onBlur={e  => e.currentTarget.style.borderColor = '#e8e8e8'}
                  tabIndex={-1}>
                  <input type="text"
                    value={editData.name || ''}
                    onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="TechLaunch MENA"
                    style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0a0a0a', background: 'transparent' }}
                    onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--orange)'}
                    onBlur={e  => e.currentTarget.parentElement.style.borderColor = '#e8e8e8'}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>HANDLE</label>
                <div style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
                  tabIndex={-1}>
                  <span style={{ padding: '10px 10px 10px 14px', fontSize: 13, color: '#aaa', background: '#fafafa', borderRight: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>tlmena.com/</span>
                  <input type="text"
                    value={(editData.handle || '').replace('@', '')}
                    onChange={e => setEditData(prev => ({ ...prev, handle: e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase() }))}
                    placeholder="techlaunchmena"
                    style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0a0a0a', background: 'transparent' }}
                    onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--orange)'}
                    onBlur={e  => e.currentTarget.parentElement.style.borderColor = '#e8e8e8'}
                  />
                </div>
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>HEADLINE</label>
              <div style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, background: '#fff', display: 'flex' }}>
                <input type="text"
                  value={editData.headline || ''}
                  onChange={e => setEditData(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="MENA's Product Discovery Platform"
                  style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0a0a0a', background: 'transparent' }}
                  onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--orange)'}
                  onBlur={e  => e.currentTarget.parentElement.style.borderColor = '#e8e8e8'}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>BIO</label>
              <textarea
                value={editData.bio || ''}
                onChange={e => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Passionate about connecting builders, investors and innovators across the Arab world."
                rows={4}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0a0a0a', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e  => e.target.style.borderColor = '#e8e8e8'}
              />
            </div>
          </div>

          {/* Section: Links */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 18, padding: '24px 28px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', marginBottom: 20 }}>🔗 Links</div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { key: 'website',  label: 'WEBSITE',      placeholder: 'https://tlmena.com',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg> },
                { key: 'twitter',  label: 'TWITTER / X',  placeholder: '@techlaunchmena',              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.745-8.867L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { key: 'linkedin', label: 'LINKEDIN',     placeholder: 'company/techlaunch-mena',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>{f.label}</label>
                  <div style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <span style={{ width: 44, minWidth: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
                      {f.icon}
                    </span>
                    <input type="text"
                      value={editData[f.key] || ''}
                      onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0a0a0a', background: 'transparent' }}
                      onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--orange)'}
                      onBlur={e  => e.currentTarget.parentElement.style.borderColor = '#e8e8e8'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {saveError   && <div style={{ marginBottom: 12, fontSize: 12, color: '#E15033' }}>{saveError}</div>}
          {saveSuccess && <div style={{ marginBottom: 12, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Saved!</div>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditMode(false)}
              style={{ padding: '11px 22px', borderRadius: 12, background: '#fff', border: '1.5px solid #e8e8e8', color: '#555', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: saving ? 'var(--gray-200)' : 'var(--orange)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'background .15s' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Compose Box ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--gray-200)', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            <AvatarDisplay src={avatarUrl} fontSize={13} fallback="TL" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            <strong style={{ color: 'var(--ink)' }}>Posting as @{(profile?.handle || 'techlaunchmena').replace('@', '')}</strong>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Platform Admin Account</div>
          </div>
        </div>

        {/* Post type */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {POST_TYPES.map(pt => (
            <button key={pt.value} onClick={() => { setPostType(pt.value); setSelectedTagIds([]); }}
              style={{ fontSize: 12, padding: '6px 16px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
                borderColor: postType === pt.value ? 'var(--orange)' : 'var(--gray-200)',
                background:  postType === pt.value ? 'rgba(225,80,51,.08)' : 'var(--gray-50)',
                color:       postType === pt.value ? 'var(--orange)' : 'var(--gray-600)' }}>
              {pt.emoji} {pt.label}
            </button>
          ))}
        </div>

        {/* Tag selector — shows post tags for Post type, article tags for Article type */}
        {(() => {
          const activeTags = postType === 'article' ? articleTags : postTags;
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .6 }}>
                Tag <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(optional)</span>
              </div>
              {activeTags.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                  No {postType === 'article' ? 'article' : 'post'} tags yet — add some in Tag Management → {postType === 'article' ? 'Article Tags' : 'Post Tags'}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeTags.map(tag => {
                    const sel = selectedTagIds.includes(tag.id);
                    return (
                      <button key={tag.id} onClick={() => toggleTag(tag.id)}
                        style={{ padding: '4px 11px', borderRadius: 20, border: `1.5px solid ${sel ? 'var(--orange)' : 'var(--gray-200)'}`, background: sel ? (tag.color || 'rgba(225,80,51,.1)') : 'transparent', color: sel ? (tag.text_color || 'var(--orange)') : 'var(--gray-500)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        <textarea
          value={composeText}
          onChange={e => setComposeText(e.target.value)}
          placeholder={postType === 'article' ? 'Write your article…' : 'Share an update or news with the community…'}
          rows={4}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.55, transition: 'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e  => e.target.style.borderColor = 'var(--gray-200)'}
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
