import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { usersAPI, productsAPI, launcherAPI } from '../../utils/api';
import ProductCard from '../../components/home/ProductCard';
import SubmitPostModal from '../../components/home/SubmitPostModal';
import { MENA_COUNTRIES } from '../../utils/menaCountries';

const PERSONA_ICONS = { Founder:'🚀', Investor:'💰', Builder:'⚡', 'Product Manager':'🧠', Accelerator:'🏢', Enthusiast:'⭐', 'Venture Studio':'🏗️' };
const PERSONA_MAP   = { founder:'Founder', investor:'Investor', builder:'Builder', pm:'Product Manager', accelerator:'Accelerator', enthusiast:'Enthusiast', venture:'Venture Studio', 'product manager':'Product Manager', 'venture studio':'Venture Studio' };
const COUNTRY_NAMES = Object.fromEntries(MENA_COUNTRIES.map(c => [c.code, c.name]));

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

export default function UserProfilePage({ onSignIn, onSignUp }) {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { following, toggleFollow, followingIds, toggleFollowId, openDM } = useUI();
  const [activeTab, setActiveTab] = useState('activity');
  const [profile, setProfile]       = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [followLoading, setFollowLoading]   = useState(false);
  const [apiIsFollowing, setApiIsFollowing] = useState(false);
  const [aboutOpen, setAboutOpen]           = useState(true);
  const [followModal, setFollowModal]       = useState(null);
  const [followList, setFollowList]         = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);
  const [deletingId, setDeletingId]         = useState(null);
  const [showWelcome, setShowWelcome]       = useState(searchParams.get('welcome') === '1');
  const [showPostModal, setShowPostModal]   = useState(false);

  // tab data
  const [profileProducts, setProfileProducts] = useState([]);
  const [upvotedProducts, setUpvotedProducts] = useState([]);
  const [activityItems, setActivityItems]     = useState([]);
  const [launcherPosts, setLauncherPosts]     = useState(null);
  const [deletingPostId, setDeletingPostId]   = useState(null);
  const [editingPost, setEditingPost]         = useState(null);
  const [loadingTab, setLoadingTab]           = useState(false);

  const isOwn = user && ((user.handle || '').replace('@','') === handle);

  // Load profile
  useEffect(() => {
    setLoadingProfile(true);
    setProfileProducts([]);
    setUpvotedProducts([]);
    setActivityItems([]);

    const loadProfile = async () => {
      try {
        let p;
        if (isOwn) {
          p = {
            id: user.id,
            handle: '@' + (user.handle || '').replace('@',''),
            name: user.name || 'Unknown',
            avatar_url: user.avatar_url || null,
            persona: PERSONA_MAP[(user.persona||'enthusiast').toLowerCase()] || 'Enthusiast',
            headline: user.headline || '',
            bio: user.bio || '',
            country: user.country || '',
            twitter: user.twitter || '',
            linkedin: user.linkedin || '',
            github: user.github || '',
            website: user.website || '',
            followers_count: user.followers_count ?? 0,
            following_count: user.following_count ?? 0,
            verified: user.role === 'admin',
            joinDate: user.created_at ? new Date(user.created_at).getFullYear() : 2024,
          };
        } else {
          const { data } = await usersAPI.profile(handle);
          const u = data.data || data;
          p = {
            id: u.id,
            handle: '@' + (u.handle || handle),
            name: u.name || u.full_name || handle,
            avatar_url: u.avatar_url || null,
            persona: PERSONA_MAP[(u.persona||'enthusiast').toLowerCase()] || u.persona || 'Enthusiast',
            headline: u.headline || '',
            bio: u.bio || '',
            country: u.country || '',
            twitter: u.twitter || '',
            linkedin: u.linkedin || '',
            github: u.github || '',
            website: u.website || '',
            followers_count: u.followers_count ?? 0,
            following_count: u.following_count ?? 0,
            verified: u.verified || u.role === 'admin',
            joinDate: u.created_at ? new Date(u.created_at).getFullYear() : null,
          };
          setApiIsFollowing(!!u.isFollowing);
        }
        setProfile(p);
        setLoadingProfile(false);

        // Load products submitted by this user
        // For other users' profiles, only show live/soon products (pending/rejected would 404 when clicked)
        if (p.id) {
          const userId = p.id;
          const localIsOwn = user && ((user.handle || '').replace('@','') === handle);
          productsAPI.list({ submitter: userId, status: 'all', limit: 30 })
            .then(({ data: pd }) => {
              const all = pd.data || [];
              const visible = localIsOwn ? all : all.filter(pr => pr.status === 'live' || pr.status === 'soon');
              setProfileProducts(visible);
            })
            .catch(() => {});
        }
      } catch {
        setProfile(null);
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [handle, user?.id]);

  // Load tab-specific data on tab switch
  useEffect(() => {
    if (!profile) return;
    if (activeTab === 'interests') {
      setLoadingTab(true);
      usersAPI.upvoted(profile.handle.replace('@',''))
        .then(({ data }) => setUpvotedProducts(data.data || []))
        .catch(() => setUpvotedProducts([]))
        .finally(() => setLoadingTab(false));
    }
    if (activeTab === 'activity') {
      setLoadingTab(true);
      usersAPI.activity(profile.handle.replace('@',''))
        .then(({ data }) => setActivityItems(data.data || []))
        .catch(() => setActivityItems([]))
        .finally(() => setLoadingTab(false));
    }
    if ((activeTab === 'posts' || activeTab === 'articles') && launcherPosts === null) {
      setLoadingTab(true);
      launcherAPI.userPosts(profile.id)
        .then(({ data }) => setLauncherPosts(data.data || []))
        .catch(() => setLauncherPosts([]))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, profile?.handle, profile?.id]);

  const BackButton = () => (
    <button
      onClick={() => navigate(-1)}
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        background:'none', border:'none', cursor:'pointer', padding:'6px 0',
        fontSize:13, fontWeight:700, color:'#666', fontFamily:'inherit', transition:'color .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--orange)'}
      onMouseLeave={e => e.currentTarget.style.color = '#666'}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Back
    </button>
  );

  if (loadingProfile) return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div className="profile-page-inner" style={{ maxWidth:900, margin:'0 auto', paddingTop:24, paddingLeft:32, paddingRight:32, paddingBottom:80 }}>
          <BackButton/>
          <div style={{ display:'flex', justifyContent:'center', padding:'80px 20px' }}>
            <div style={{ width:32, height:32, border:'3px solid #f0f0f0', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
          </div>
        </div>
      </div>
    </>
  );

  if (!profile) return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div className="profile-page-inner" style={{ maxWidth:900, margin:'0 auto', paddingTop:24, paddingLeft:32, paddingRight:32, paddingBottom:80 }}>
          <BackButton/>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>👤</div>
            <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>User not found</h2>
            <p style={{ color:'#888', marginBottom:24 }}>This profile doesn't exist or hasn't been set up yet.</p>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );

  const personaLabel = PERSONA_MAP[profile.persona?.toLowerCase()] || profile.persona || 'Enthusiast';
  const personaIcon  = PERSONA_ICONS[personaLabel] || '⭐';
  const initials     = (profile.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const isFollowingHandle = following.has(profile.handle);
  const isFollowingId     = profile.id && followingIds.has(profile.id);
  const isFollowing       = isFollowingHandle || isFollowingId || apiIsFollowing;
  const displayFollowers  = profile.followers_count ?? 0;
  const followingCount    = isOwn ? following.size : (profile.following_count ?? 0);

  const hasAbout = profile.bio || profile.country || profile.website || profile.twitter || profile.linkedin || profile.github || profile.joinDate;

  const handleFollowClick = async () => {
    if (!user) { onSignIn?.(); return; }
    setFollowLoading(true);
    try {
      if (profile.id) {
        const res = await usersAPI.follow(profile.id);
        toggleFollowId(profile.id);
        const newFollowing = res.data?.data?.following;
        if (newFollowing !== undefined) setApiIsFollowing(newFollowing);
        const newCount = res.data?.data?.followers_count;
        if (newCount !== undefined) setProfile(prev => prev ? { ...prev, followers_count: newCount } : prev);
      }
      toggleFollow(profile.handle, profile.name);
    } catch { toggleFollow(profile.handle, profile.name); }
    finally { setFollowLoading(false); }
  };

  const openFollowModal = async (type) => {
    setFollowModal(type);
    setLoadingFollowList(true);
    setFollowList([]);
    try {
      const h = (profile.handle||'').replace('@','');
      const res = type === 'followers' ? await usersAPI.followers(h) : await usersAPI.following(h);
      setFollowList(res.data?.data || []);
    } catch {}
    finally { setLoadingFollowList(false); }
  };

  const handleDeleteProduct = async (e, productId, productName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    setDeletingId(productId);
    try {
      await usersAPI.deleteProduct(productId);
      setProfileProducts(prev => prev.filter(p => p.id !== productId));
      const { default: toast } = await import('react-hot-toast');
      toast.success(`"${productName}" deleted`);
    } catch (err) {
      const { default: toast } = await import('react-hot-toast');
      toast.error(err?.response?.data?.message || 'Failed to delete');
    } finally { setDeletingId(null); }
  };

  return (
    <>
      <Helmet>
        <title>{profile.name} (@{profile.handle}) — Tech Launch MENA</title>
        <meta name="description" content={profile.headline || `${personaLabel} on Tech Launch MENA`} />
        <meta property="og:title" content={`${profile.name} on Tech Launch MENA`} />
        <meta property="og:description" content={profile.headline || `${personaLabel} on Tech Launch MENA`} />
        <meta property="og:image" content={profile.avatar_url || 'https://tlmena.com/og-default.png'} />
        <meta property="og:url" content={`https://tlmena.com/u/${profile.handle}`} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>

      {/* ── First-time welcome popup ── */}
      {showWelcome && isOwn && (
        <div style={{ position:'fixed', inset:0, zIndex:3500, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:24, padding:'36px 32px', width:'100%', maxWidth:440, textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,.25)', animation:'modalIn .25s ease' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#0a0a0a', marginBottom:10 }}>Welcome to Tech Launch!</h2>
            <p style={{ fontSize:14, color:'#888', lineHeight:1.7, marginBottom:28 }}>
              You're in. Set up your profile to let the MENA community know who you are and what you're building.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={() => { setShowWelcome(false); navigate('/settings'); }}
                style={{ padding:'13px', borderRadius:14, border:'none', background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>
                Let's do it →
              </button>
              <button onClick={() => setShowWelcome(false)}
                style={{ padding:'11px', borderRadius:14, border:'1.5px solid #e8e8e8', background:'#fff', color:'#aaa', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div className="profile-page-inner" style={{ maxWidth:900, margin:'0 auto', padding:'24px 32px 80px' }}>

          {/* ── Back button ── */}
          <div style={{ marginBottom:16 }}><BackButton/></div>

          {/* ── Profile card ── */}
          <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, overflow:'hidden', marginBottom:20 }}>
            <div style={{ height:100, background:'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,rgba(232,98,26,.15) 100%)' }}/>
            <div style={{ padding:'0 28px 24px', position:'relative' }}>

              {/* Avatar */}
              <div style={{ width:80, height:80, borderRadius:'50%', border:'4px solid #fff', position:'absolute', top:-40, left:28, boxShadow:'0 4px 16px rgba(0,0,0,.15)', overflow:'hidden', flexShrink:0 }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                  : <div style={{ width:'100%', height:'100%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:24, fontWeight:900 }}>{initials}</div>
                }
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12, marginBottom:8, gap:10 }}>
                {isOwn ? (
                  <>
                    <button onClick={() => setShowPostModal(true)}
                      style={{ padding:'8px 18px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                      ✏️ Write
                    </button>
                    <button onClick={() => navigate('/settings')}
                      style={{ padding:'8px 16px', borderRadius:10, background:'#f4f4f4', color:'#444', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                      ⚙️ Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleFollowClick} disabled={followLoading}
                      style={{ padding:'8px 18px', borderRadius:10, background:isFollowing?'#f0f0f0':'var(--orange)', color:isFollowing?'#444':'#fff', border:`1.5px solid ${isFollowing?'#e8e8e8':'var(--orange)'}`, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s', opacity:followLoading?.7:1 }}>
                      {followLoading ? '…' : isFollowing ? 'Following ✓' : '+ Follow'}
                    </button>
                    <button onClick={() => { if (!user) { onSignIn?.(); return; } openDM(profile.handle, profile.name, initials); }}
                      style={{ padding:'8px 16px', borderRadius:10, background:'#fff', color:'#555', border:'1.5px solid #e8e8e8', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      Message
                    </button>
                  </>
                )}
              </div>

              {/* Name + handle + persona */}
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                  <span style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em' }}>{profile.name}</span>
                  {profile.verified && <span title="Verified by Tech Launch — identity and product ownership confirmed" style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#eff6ff', color:'#2563eb', cursor:'help' }}>✓ Verified</span>}
                </div>
                <div style={{ fontSize:13, color:'#aaa', fontWeight:600, marginBottom:8 }}>{profile.handle}</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--orange-light)', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:'var(--orange)', marginBottom:8 }}>
                  {personaIcon} {personaLabel}
                </div>

                {/* Headline — always visible under username */}
                {profile.headline && (
                  <div style={{ fontSize:13, color:'#555', marginBottom:8, lineHeight:1.5 }}>{profile.headline}</div>
                )}

                {/* Collapsible About */}
                {hasAbout && (
                  <div style={{ marginBottom:12 }}>
                    <button
                      onClick={() => setAboutOpen(o => !o)}
                      style={{ display:'inline-flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      <span style={{ fontSize:12, color:'#777', fontWeight:600, textDecoration:'underline', textUnderlineOffset:3 }}>About</span>
                      <span style={{ fontSize:9, color:'#aaa', transition:'transform .2s', display:'inline-block', transform:aboutOpen?'rotate(180deg)':'rotate(0deg)', marginTop:1 }}>▼</span>
                    </button>

                    {/* Dropdown bio panel */}
                    {aboutOpen && (
                      <div style={{ marginTop:10, background:'#fafafa', border:'1px solid #f0f0f0', borderRadius:12, padding:'16px 18px', animation:'fadeIn .15s ease' }}>
                        {profile.bio && (
                          <div style={{ fontSize:13, color:'#444', lineHeight:1.7, marginBottom:12 }}>{profile.bio}</div>
                        )}
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {profile.country && (
                            <span style={{ fontSize:12, color:'#777', fontWeight:600, padding:'4px 10px', borderRadius:8, background:'#f0f0f0' }}>
                              📍 {COUNTRY_NAMES[profile.country] || profile.country}
                            </span>
                          )}
                          {profile.joinDate && (
                            <span style={{ fontSize:12, color:'#777', fontWeight:600, padding:'4px 10px', borderRadius:8, background:'#f0f0f0' }}>
                              📅 Since {profile.joinDate}
                            </span>
                          )}
                          {profile.website && <a href={profile.website.startsWith('http')?profile.website:'https://'+profile.website} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f0f0f0' }}>🌐 Website</a>}
                          {profile.twitter && <a href={`https://twitter.com/${profile.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f0f0f0' }}>𝕏 @{profile.twitter.replace('@','')}</a>}
                          {profile.linkedin && <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f0f0f0' }}>💼 LinkedIn</a>}
                          {profile.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f0f0f0' }}>⌥ GitHub</a>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:20, fontWeight:800, fontFamily:'Inter,sans-serif' }}>{profileProducts.length}</div>
                    <div style={{ fontSize:11, color:'#000', fontWeight:400, textTransform:'uppercase', letterSpacing:'.04em', marginTop:1, fontFamily:'Inter,sans-serif' }}>Products</div>
                  </div>
                  <div style={{ textAlign:'left', cursor:'pointer' }} onClick={() => openFollowModal('followers')}>
                    <div style={{ fontSize:20, fontWeight:800, fontFamily:'Inter,sans-serif' }}>{displayFollowers}</div>
                    <div style={{ fontSize:11, color:'#000', fontWeight:400, textTransform:'uppercase', letterSpacing:'.04em', marginTop:1, fontFamily:'Inter,sans-serif' }}>Followers</div>
                  </div>
                  <div style={{ textAlign:'left', cursor:'pointer' }} onClick={() => openFollowModal('following')}>
                    <div style={{ fontSize:20, fontWeight:800, fontFamily:'Inter,sans-serif' }}>{followingCount}</div>
                    <div style={{ fontSize:11, color:'#000', fontWeight:400, textTransform:'uppercase', letterSpacing:'.04em', marginTop:1, fontFamily:'Inter,sans-serif' }}>Following</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display:'flex', marginBottom:16, background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', overflow:'hidden', flexWrap:'wrap' }}>
            {[['activity','📝 Activity'],['products','🚀 Products'],['posts','💬 Posts'],['articles','📖 Articles'],['interests','✨ Interests']].map(([t,label]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex:1, minWidth:'max-content', padding:'13px 12px', border:'none', background:activeTab===t?'var(--orange-light)':'transparent', fontSize:12, fontWeight:700, cursor:'pointer', color:activeTab===t?'var(--orange)':'#666', borderBottom:`2px solid ${activeTab===t?'var(--orange)':'transparent'}`, transition:'all .15s', fontFamily:'Inter,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div>

            {/* PRODUCTS — submitted by this user */}
            {activeTab === 'products' && (
              !profileProducts.length ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🚀</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#bbb', marginBottom:6 }}>No products yet</div>
                  <div style={{ fontSize:12, color:'#ccc' }}>Products submitted by this user will appear here.</div>
                  {isOwn && <button onClick={() => navigate('/submit')} style={{ marginTop:16, padding:'10px 20px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Submit a Product 🚀</button>}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {profileProducts.map((pr, i) => (
                    <div key={pr.id} style={{ position:'relative' }}>
                      <div onClick={() => navigate(`/products/${pr.id}`)}>
                        <ProductCard product={pr} rank={i + 1}/>
                      </div>
                      {isOwn && pr.status === 'pending' && (
                        <button
                          onClick={(e) => handleDeleteProduct(e, pr.id, pr.name)}
                          disabled={deletingId === pr.id}
                          style={{ position:'absolute', top:12, right:12, padding:'4px 12px', borderRadius:8, border:'1.5px solid #fdd', background:'#fff5f5', color:'#e63946', fontSize:12, fontWeight:700, cursor:'pointer', zIndex:10 }}>
                          {deletingId === pr.id ? '…' : '🗑 Delete'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* POSTS — launcher posts by this user */}
            {activeTab === 'posts' && (
              loadingTab || launcherPosts === null ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'60px 20px' }}>
                  <div style={{ width:28, height:28, border:'3px solid #f0f0f0', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                </div>
              ) : (() => {
                const userPosts = (launcherPosts || []).filter(p => !p.post_type || p.post_type === 'post');
                return userPosts.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>💬</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#bbb', marginBottom:6 }}>No posts yet</div>
                    <div style={{ fontSize:12, color:'#ccc' }}>{isOwn ? 'Your Launcher posts will appear here.' : 'This user hasn\'t posted anything yet.'}</div>
                    {isOwn && <button onClick={() => setShowPostModal(true)} style={{ marginTop:16, padding:'10px 20px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Write a Post 💬</button>}
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {userPosts.map(post => (
                      <div key={post.id} style={{ position:'relative', background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:'18px 20px', cursor:'pointer', transition:'all .15s' }}
                        onClick={() => navigate(`/launcher/posts/${post.id}`)}
                        onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 2px 12px rgba(232,98,26,.08)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            {post.tag && <span style={{ display:'inline-block', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#fff3ee', color:'var(--orange)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>{post.tag}</span>}
                            <div style={{ fontSize:14, color:'#1e293b', lineHeight:1.65, wordBreak:'break-word', WebkitLineClamp:3, display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                              {post.content}
                            </div>
                            <div style={{ fontSize:11, color:'#bbb', marginTop:8, display:'flex', gap:12 }}>
                              <span>{timeAgo(post.created_at)}</span>
                              {parseInt(post.likes_count) > 0 && <span>❤️ {post.likes_count}</span>}
                              {parseInt(post.comments_count) > 0 && <span>💬 {post.comments_count}</span>}
                            </div>
                          </div>
                          {isOwn && (
                            <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                              <button onClick={e => { e.stopPropagation(); setEditingPost(post); }}
                                style={{ padding:'4px 12px', borderRadius:8, border:'1.5px solid #e8e8e8', background:'#f8f8f8', color:'#444', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                ✏️ Edit
                              </button>
                              <button onClick={async e => {
                                e.stopPropagation();
                                if (!window.confirm('Delete this post?')) return;
                                setDeletingPostId(post.id);
                                try {
                                  await launcherAPI.deletePost(post.id);
                                  setLauncherPosts(prev => (prev || []).filter(p => p.id !== post.id));
                                  toast.success('Post deleted');
                                } catch { toast.error('Failed to delete'); }
                                finally { setDeletingPostId(null); }
                              }} disabled={deletingPostId === post.id}
                                style={{ padding:'4px 12px', borderRadius:8, border:'1.5px solid #fdd', background:'#fff5f5', color:'#e63946', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                {deletingPostId === post.id ? '…' : '🗑 Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}

            {/* ARTICLES — launcher articles by this user */}
            {activeTab === 'articles' && (
              loadingTab || launcherPosts === null ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'60px 20px' }}>
                  <div style={{ width:28, height:28, border:'3px solid #f0f0f0', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                </div>
              ) : (() => {
                const userArticles = (launcherPosts || []).filter(p => p.post_type === 'article');
                return userArticles.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>📖</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#bbb', marginBottom:6 }}>No articles yet</div>
                    <div style={{ fontSize:12, color:'#ccc' }}>{isOwn ? 'Your Launcher articles will appear here.' : 'This user hasn\'t published any articles yet.'}</div>
                    {isOwn && <button onClick={() => setShowPostModal(true)} style={{ marginTop:16, padding:'10px 20px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Write an Article 📖</button>}
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {userArticles.map(article => (
                      <div key={article.id} style={{ position:'relative', background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:'18px 20px', cursor:'pointer', transition:'all .15s' }}
                        onClick={() => navigate(`/launcher/posts/${article.id}`)}
                        onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 2px 12px rgba(232,98,26,.08)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            {article.title && <div style={{ fontSize:15, fontWeight:800, color:'#0a0a0a', marginBottom:6, letterSpacing:'-.02em', WebkitLineClamp:2, display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden' }}>{article.title}</div>}
                            {article.tag && <span style={{ display:'inline-block', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#fff3ee', color:'var(--orange)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>{article.tag}</span>}
                            <div style={{ fontSize:13, color:'#666', lineHeight:1.65, wordBreak:'break-word', WebkitLineClamp:2, display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                              {article.content}
                            </div>
                            <div style={{ fontSize:11, color:'#bbb', marginTop:8, display:'flex', gap:12 }}>
                              <span>{timeAgo(article.created_at)}</span>
                              {parseInt(article.likes_count) > 0 && <span>❤️ {article.likes_count}</span>}
                              {parseInt(article.comments_count) > 0 && <span>💬 {article.comments_count}</span>}
                            </div>
                          </div>
                          {isOwn && (
                            <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                              <button onClick={e => { e.stopPropagation(); setEditingPost(article); }}
                                style={{ padding:'4px 12px', borderRadius:8, border:'1.5px solid #e8e8e8', background:'#f8f8f8', color:'#444', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                ✏️ Edit
                              </button>
                              <button onClick={async e => {
                                e.stopPropagation();
                                if (!window.confirm('Delete this article?')) return;
                                setDeletingPostId(article.id);
                                try {
                                  await launcherAPI.deletePost(article.id);
                                  setLauncherPosts(prev => (prev || []).filter(p => p.id !== article.id));
                                  toast.success('Article deleted');
                                } catch { toast.error('Failed to delete'); }
                                finally { setDeletingPostId(null); }
                              }} disabled={deletingPostId === article.id}
                                style={{ padding:'4px 12px', borderRadius:8, border:'1.5px solid #fdd', background:'#fff5f5', color:'#e63946', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                {deletingPostId === article.id ? '…' : '🗑 Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}

            {/* INTERESTS — products this user has upvoted */}
            {activeTab === 'interests' && (
              loadingTab ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'60px 20px' }}>
                  <div style={{ width:28, height:28, border:'3px solid #f0f0f0', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                </div>
              ) : !upvotedProducts.length ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#bbb', marginBottom:6 }}>No upvotes yet</div>
                  <div style={{ fontSize:12, color:'#ccc' }}>{isOwn ? 'Products you upvote will appear here.' : 'This user hasn\'t upvoted anything yet.'}</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {upvotedProducts.map((pr, i) => (
                    <div key={pr.id} onClick={() => navigate(`/products/${pr.id}`)}>
                      <ProductCard product={pr} rank={i + 1}/>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ACTIVITY — comments + interactions */}
            {activeTab === 'activity' && (
              loadingTab ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'60px 20px' }}>
                  <div style={{ width:28, height:28, border:'3px solid #f0f0f0', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                </div>
              ) : !activityItems.length ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>📝</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#bbb', marginBottom:6 }}>No activity yet</div>
                  <div style={{ fontSize:12, color:'#ccc' }}>{isOwn ? 'Your comments on products will show here.' : 'No public activity yet.'}</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {activityItems.map(item => (
                    <div key={item.id}
                      onClick={() => navigate(`/products/${item.product_id}`)}
                      style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:'16px 20px', cursor:'pointer', transition:'all .15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 2px 12px rgba(232,98,26,.08)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}>
                      {/* Header row */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ width:36, height:36, borderRadius:9, border:'1px solid #f0f0f0', display:'grid', placeItems:'center', fontSize:18, flexShrink:0 }}>
                          {item.product_emoji || '📦'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'#222', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            💬 Commented on <span style={{ color:'var(--orange)' }}>{item.product_name}</span>
                          </div>
                          <div style={{ fontSize:11, color:'#bbb', marginTop:1 }}>{timeAgo(item.created_at)}</div>
                        </div>
                      </div>
                      {/* Comment body */}
                      <div style={{ fontSize:13, color:'#444', lineHeight:1.65, padding:'10px 14px', background:'#fafafa', borderRadius:10, borderLeft:'3px solid var(--orange)', fontStyle:'italic' }}>
                        "{item.body}"
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

          </div>
        </div>
      </div>
      <Footer/>

      {/* ── Write Post / Article modal ── */}
      {showPostModal && (
        <SubmitPostModal
          onClose={() => setShowPostModal(false)}
          onPublished={async (published) => {
            setShowPostModal(false);
            const postType = published?.post_type || 'post';
            setActiveTab(postType === 'article' ? 'articles' : 'posts');
            setLoadingTab(true);
            try {
              const { data } = await launcherAPI.userPosts(profile.id);
              setLauncherPosts(data.data || []);
            } catch { setLauncherPosts([]); }
            finally { setLoadingTab(false); }
          }}
        />
      )}

      {editingPost && (
        <SubmitPostModal
          editDraft={{ ...editingPost, body: editingPost.content, post_type: editingPost.post_type || 'post', type: editingPost.post_type || 'post' }}
          onClose={() => setEditingPost(null)}
          onPublished={(updated) => {
            setEditingPost(null);
            setLauncherPosts(prev => (prev || []).map(p => p.id === editingPost.id ? { ...p, ...(updated || {}), content: updated?.content || p.content } : p));
          }}
        />
      )}

      {/* ── Followers / Following modal ── */}
      {followModal && (
        <div onClick={() => setFollowModal(null)} style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:440, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}>
            <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:16, fontWeight:800 }}>{followModal === 'followers' ? 'Followers' : 'Following'}</span>
              <button onClick={() => setFollowModal(null)} style={{ width:30, height:30, borderRadius:8, border:'1px solid #e8e8e8', background:'transparent', cursor:'pointer', fontSize:16, color:'#aaa' }}>✕</button>
            </div>
            <div style={{ overflowY:'auto', flex:1, padding:'12px 0' }}>
              {loadingFollowList ? (
                <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>Loading…</div>
              ) : followList.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>No {followModal} yet</div>
                </div>
              ) : followList.map(u => {
                const isMe = user && (user.id === u.id || (user.handle||'').replace('@','') === u.handle);
                const isFol = followingIds.has(u.id);
                return (
                <div key={u.id}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 24px', cursor:'pointer', transition:'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  onClick={() => { setFollowModal(null); navigate(`/u/${u.handle}`); }}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.name} style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
                    : <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:14, fontWeight:800, flexShrink:0 }}>
                        {(u.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{u.name}</div>
                    <div style={{ fontSize:12, color:'#aaa' }}>@{u.handle}{u.headline ? ` · ${u.headline.slice(0,40)}` : ''}</div>
                  </div>
                  {u.verified && <span title="Verified by Tech Launch — identity and product ownership confirmed" style={{ fontSize:14, cursor:'help' }}>✅</span>}
                  {!isMe && user && (
                    <button onClick={async e => {
                      e.stopPropagation();
                      try {
                        await usersAPI.follow(u.id);
                        toggleFollowId(u.id);
                        toggleFollow(('@'+u.handle), u.name);
                      } catch {}
                    }}
                      style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:`1.5px solid ${isFol ? '#e8e8e8' : 'var(--orange)'}`, background: isFol ? '#f0f0f0' : 'var(--orange)', color: isFol ? '#444' : '#fff', transition:'all .15s' }}>
                      {isFol ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
