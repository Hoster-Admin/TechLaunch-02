import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { usersAPI, productsAPI } from '../../utils/api';

const DEMO_PROFILES = {
  'sara_builds': { id:null, handle:'@sara_builds', name:'Sara Al-Mahmoud', avatar:'SA', persona:'Founder', headline:'Founder @ Noon Academy · Edtech · 🇸🇦', bio:'Building the future of education in the Arab world. Ex-McKinsey. Mom of 3.', country:'sa', twitter:'sara_builds', linkedin:'sara-mahmoud', verified:true, followers_count:840, following_count:210 },
  'khalid_vc':   { id:null, handle:'@khalid_vc',   name:'Khalid Bin Tariq', avatar:'KT', persona:'Investor', headline:'Partner @ STV · Early Stage · 🇸🇦', bio:'Investing in MENA founders building category-defining companies.', country:'sa', twitter:'khalidvc', linkedin:'khalid-bin-tariq', verified:true, followers_count:1200, following_count:340 },
  'mona_codes':  { id:null, handle:'@mona_codes',  name:'Mona Hassan', avatar:'MH', persona:'Builder', headline:'Solo founder · AI tools · 🇪🇬', bio:'Vibe coder. Building AI micro-tools for Arab creators. 3 products shipped.', country:'eg', twitter:'mona_codes', linkedin:'mona-hassan-dev', verified:false, followers_count:290, following_count:180 },
  'ahmed_ux':    { id:null, handle:'@ahmed_ux',    name:'Ahmed Al-Rashidi', avatar:'AR', persona:'Product Manager', headline:'PM @ Tabby · Fintech · 🇦🇪', bio:'Product thinker. UXMENA community lead. Writing about Arab product culture.', country:'ae', twitter:'ahmed_ux', linkedin:'ahmed-rashidi-pm', verified:false, followers_count:560, following_count:220 },
};

const PERSONA_ICONS = { Founder:'🚀', Investor:'💰', Builder:'⚡', 'Product Manager':'🧠', Accelerator:'🏢', Enthusiast:'⭐', 'Venture Studio':'🏗️' };
const PERSONA_MAP   = { founder:'Founder', investor:'Investor', builder:'Builder', pm:'Product Manager', accelerator:'Accelerator', enthusiast:'Enthusiast', venture:'Venture Studio', 'product manager':'Product Manager', 'venture studio':'Venture Studio' };
const COUNTRY_NAMES = { sa:'Saudi Arabia',ae:'UAE',eg:'Egypt',jo:'Jordan',ma:'Morocco',kw:'Kuwait',qa:'Qatar',bh:'Bahrain',om:'Oman',lb:'Lebanon',iq:'Iraq',tn:'Tunisia',dz:'Algeria',ly:'Libya' };

export default function UserProfilePage({ onSignIn, onSignUp }) {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { following, toggleFollow, followingIds, toggleFollowId, openDM, bookmarks, votes } = useUI();
  const [activeTab, setActiveTab] = useState('products');
  const [profile, setProfile]     = useState(null);
  const [profileProducts, setProfileProducts] = useState([]);
  const [loadingProfile, setLoadingProfile]   = useState(true);
  const [followLoading, setFollowLoading]     = useState(false);

  const isOwn = user && ((user.handle || '').replace('@','') === handle);

  useEffect(() => {
    setLoadingProfile(true);
    if (isOwn) {
      const p = {
        id: user.id,
        handle: '@' + (user.handle || '').replace('@',''),
        name: user.name || 'Unknown',
        avatar: (user.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2),
        persona: PERSONA_MAP[(user.persona||'enthusiast').toLowerCase()] || 'Enthusiast',
        headline: user.headline || '',
        bio: user.bio || '',
        country: user.country || '',
        twitter: user.twitter || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        website: user.website || '',
        followers_count: user.followers_count ?? user.followers ?? 0,
        following_count: user.following_count ?? user.following ?? 0,
        verified: user.role === 'admin',
        joinDate: user.created_at ? new Date(user.created_at).getFullYear() : 2024,
      };
      setProfile(p);
      setLoadingProfile(false);
      productsAPI.list({ submitter: user.id, status: 'all', limit: 20 })
        .then(({ data }) => { if (data.data?.length) setProfileProducts(data.data); })
        .catch(() => {});
    } else {
      usersAPI.profile(handle)
        .then(({ data }) => {
          const u = data.data || data;
          setProfile({
            id: u.id,
            handle: '@' + (u.handle || handle),
            name: u.name || u.full_name || handle,
            avatar: (u.name || handle).split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2),
            persona: PERSONA_MAP[(u.persona||'enthusiast').toLowerCase()] || u.persona || 'Enthusiast',
            headline: u.headline || '',
            bio: u.bio || '',
            country: u.country || '',
            twitter: u.twitter || '',
            linkedin: u.linkedin || '',
            github: u.github || '',
            website: u.website || '',
            followers_count: u.followers_count ?? u.followers ?? 0,
            following_count: u.following_count ?? u.following ?? 0,
            verified: u.verified || u.role === 'admin',
            joinDate: u.created_at ? new Date(u.created_at).getFullYear() : null,
          });
          setLoadingProfile(false);
          if (u.id) {
            productsAPI.list({ submitter: u.id, status: 'all', limit: 20 })
              .then(({ data: pd }) => { if (pd.data?.length) setProfileProducts(pd.data); })
              .catch(() => {});
          }
        })
        .catch(() => {
          const demo = DEMO_PROFILES[handle];
          if (demo) setProfile(demo);
          else setProfile(null);
          setLoadingProfile(false);
        });
    }
  }, [handle, user?.id]);

  if (loadingProfile) return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', display:'flex', justifyContent:'center', padding:'120px 20px' }}>
        <div style={{ width:32, height:32, border:'3px solid #f0f0f0', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      </div>
    </>
  );

  if (!profile) return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:'40px 20px', textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:16 }}>👤</div>
        <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>User not found</h2>
        <p style={{ color:'#888', marginBottom:24 }}>This profile doesn't exist or hasn't been set up yet.</p>
        <button onClick={() => navigate('/')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>← Back to Home</button>
      </div>
      <Footer/>
    </>
  );

  const rawPersona = profile.persona || 'Enthusiast';
  const personaLabel = PERSONA_MAP[rawPersona.toLowerCase()] || rawPersona;
  const personaIcon  = PERSONA_ICONS[personaLabel] || '⭐';
  const initials     = profile.avatar || (profile.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const isFollowingHandle = following.has(profile.handle);
  const isFollowingId     = profile.id && followingIds.has(profile.id);
  const isFollowing       = isFollowingHandle || isFollowingId;

  const followers     = (profile.followers_count ?? 0) + (isFollowing && !isFollowingHandle && !isFollowingId ? 0 : 0);
  const displayFollowers = isFollowing ? followers + 1 : followers;
  const followingCount   = isOwn ? following.size : (profile.following_count ?? 0);

  const interestedProducts = isOwn
    ? profileProducts.filter(p => votes.has(p.id) || bookmarks.has(p.id))
    : [];

  const handleFollowClick = async () => {
    if (!user) { onSignIn?.(); return; }
    setFollowLoading(true);
    try {
      if (profile.id) {
        await usersAPI.follow(profile.id);
        toggleFollowId(profile.id);
      }
      toggleFollow(profile.handle, profile.name);
    } catch {
      toggleFollow(profile.handle, profile.name);
    } finally { setFollowLoading(false); }
  };

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 32px 80px' }}>

          {/* Profile card */}
          <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, overflow:'hidden', marginBottom:20 }}>
            <div style={{ height:100, background:'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,rgba(232,98,26,.15) 100%)' }}/>
            <div style={{ padding:'0 28px 24px', position:'relative' }}>
              <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:24, fontWeight:900, border:'4px solid #fff', position:'absolute', top:-40, left:28, boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
                {initials}
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12, marginBottom:8, gap:10 }}>
                {isOwn ? (
                  <button onClick={() => navigate('/settings')}
                    style={{ padding:'8px 16px', borderRadius:10, background:'#f4f4f4', color:'#444', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    ⚙️ Edit Profile
                  </button>
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

              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                  <span style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em' }}>{profile.name}</span>
                  {profile.verified && <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#eff6ff', color:'#2563eb' }}>✓ Verified</span>}
                </div>
                <div style={{ fontSize:13, color:'#aaa', fontWeight:600, marginBottom:8 }}>{profile.handle}</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--orange-light)', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:'var(--orange)', marginBottom:10 }}>
                  {personaIcon} {personaLabel}
                </div>
                {profile.headline && <div style={{ fontSize:13, color:'#555', marginBottom:10 }}>{profile.headline}</div>}
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                  {profile.website && <a href={profile.website.startsWith('http')?profile.website:'https://'+profile.website} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4' }}>🌐 Website</a>}
                  {profile.twitter && <a href={`https://twitter.com/${profile.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4' }}>𝕏 @{profile.twitter.replace('@','')}</a>}
                  {profile.linkedin && <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4' }}>💼 LinkedIn</a>}
                  {profile.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4' }}>⌥ GitHub</a>}
                </div>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                  {[
                    [profileProducts.length, 'Products'],
                    [displayFollowers, 'Followers'],
                    [followingCount, 'Following'],
                  ].map(([num, label]) => (
                    <div key={label} style={{ textAlign:'left' }}>
                      <div style={{ fontSize:20, fontWeight:800, fontFamily:'DM Mono,monospace' }}>{num}</div>
                      <div style={{ fontSize:11, color:'#aaa', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', marginTop:1 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', marginBottom:16, background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', overflow:'hidden' }}>
            {[['products','🚀 Products'],['about','📋 About'],['interests','✨ Interests']].map(([t,label]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex:1, padding:'13px 16px', border:'none', background:activeTab===t?'var(--orange-light)':'transparent', fontSize:13, fontWeight:700, cursor:'pointer', color:activeTab===t?'var(--orange)':'#666', borderBottom:`2px solid ${activeTab===t?'var(--orange)':'transparent'}`, transition:'all .15s', fontFamily:'Inter,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'products' && (
              !profileProducts.length ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🚀</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#bbb', marginBottom:6 }}>No products yet</div>
                  <div style={{ fontSize:12, color:'#ccc' }}>Products linked to this profile will appear here.</div>
                  {isOwn && <button onClick={() => navigate('/submit')} style={{ marginTop:16, padding:'10px 20px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Submit a Product 🚀</button>}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {profileProducts.map((pr, i) => (
                    <div key={pr.id} className="product-card" onClick={() => navigate(`/products/${pr.id}`)}>
                      <div className="product-rank">#{i+1}</div>
                      <div className="product-logo">{pr.logo_emoji || '🚀'}</div>
                      <div className="product-body">
                        <div className="product-top">
                          <span className="product-name">{pr.name}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:pr.status==='soon'?'#f5f5f5':'#eefbf3', color:pr.status==='soon'?'#aaa':'#22c55e', marginLeft:6 }}>{pr.status==='soon'?'Soon':'Live'}</span>
                        </div>
                        <div className="product-tagline">{pr.tagline}</div>
                        <div className="product-meta">
                          {pr.industry && <span className="meta-tag">{pr.industry}</span>}
                          {pr.country && <span className="meta-tag">{pr.country}</span>}
                        </div>
                      </div>
                      <div className="product-actions" onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'6px 10px', borderRadius:10, border:'1.5px solid #e8e8e8', minWidth:44 }}>
                          <span style={{ fontSize:11 }}>▲</span>
                          <span style={{ fontSize:12, fontWeight:800 }}>{pr.upvotes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'about' && (
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'24px 28px' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#bbb', marginBottom:12 }}>BIO</div>
                <div style={{ fontSize:14, color:profile.bio?'#333':'#bbb', lineHeight:1.7, marginBottom:20 }}>{profile.bio || 'No bio added yet.'}</div>
                <div style={{ display:'flex', gap:20, paddingTop:16, borderTop:'1px solid #f0f0f0' }}>
                  {profile.country && <div style={{ fontSize:12, color:'#aaa', fontWeight:600 }}>📍 {COUNTRY_NAMES[profile.country] || profile.country}</div>}
                  {profile.joinDate && <div style={{ fontSize:12, color:'#aaa', fontWeight:600 }}>📅 Member since {profile.joinDate}</div>}
                </div>
              </div>
            )}

            {activeTab === 'interests' && (
              !interestedProducts.length ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #e8e8e8' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>✨</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#bbb', marginBottom:6 }}>No interests yet</div>
                  <div style={{ fontSize:12, color:'#ccc' }}>{isOwn ? 'Products you upvote or bookmark will appear here.' : 'This user hasn\'t shared any interests yet.'}</div>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
                  {interestedProducts.map(pr => (
                    <div key={pr.id} onClick={() => navigate(`/products/${pr.id}`)}
                      style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:'16px', cursor:'pointer', transition:'all .15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(232,98,26,.1)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}>
                      <div style={{ width:42, height:42, borderRadius:10, border:'1px solid #f0f0f0', display:'grid', placeItems:'center', fontSize:20, marginBottom:8 }}>{pr.logo_emoji}</div>
                      <div style={{ fontSize:14, fontWeight:800, marginBottom:3 }}>{pr.name}</div>
                      <div style={{ fontSize:11, color:'#bbb', marginBottom:6 }}>{pr.industry}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--orange)' }}>▲ {pr.upvotes_count || 0}</div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

        </div>
      </div>
      <Footer/>
    </>
  );
}
