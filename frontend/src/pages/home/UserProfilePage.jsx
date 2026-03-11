import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';

const MOCK_PRODUCTS = [
  { id:1,  name:'Tabby',        tagline:'Buy now, pay later for MENA shoppers', logo_emoji:'💳', industry:'Fintech',    upvotes_count:342, status:'live' },
  { id:2,  name:'Noon Academy', tagline:'Social learning platform for students', logo_emoji:'📚', industry:'Edtech',     upvotes_count:287, status:'live' },
  { id:3,  name:'Vezeeta',      tagline:'Book doctors and healthcare services',  logo_emoji:'🏥', industry:'Healthtech', upvotes_count:256, status:'live' },
  { id:6,  name:'Kader AI',     tagline:'AI-powered job matching for MENA',      logo_emoji:'🤖', industry:'AI & ML',    upvotes_count:0,   status:'soon' },
  { id:9,  name:'Waffarha',     tagline:'Discount coupons and deals platform',   logo_emoji:'🎟️', industry:'E-Commerce', upvotes_count:128, status:'live' },
  { id:10, name:'Cura',         tagline:'Arabic mental health therapy online',   logo_emoji:'🧠', industry:'Healthtech', upvotes_count:0,   status:'soon' },
];

const PERSONA_ICONS = { Founder:'🚀', Investor:'💰', Builder:'⚡', 'Product Manager':'🧠', Accelerator:'🏢', Enthusiast:'⭐', 'Venture Studio':'🏗️' };
const PERSONA_MAP = { founder:'Founder', investor:'Investor', builder:'Builder', pm:'Product Manager', accelerator:'Accelerator', enthusiast:'Enthusiast', venture:'Venture Studio', 'product manager':'Product Manager', 'venture studio':'Venture Studio' };

const COUNTRY_NAMES = { sa:'Saudi Arabia',ae:'UAE',eg:'Egypt',jo:'Jordan',ma:'Morocco',kw:'Kuwait',qa:'Qatar',bh:'Bahrain',om:'Oman',lb:'Lebanon',iq:'Iraq',sy:'Syria',ps:'Palestine',ye:'Yemen',tn:'Tunisia',dz:'Algeria',ly:'Libya',sd:'Sudan' };

export default function UserProfilePage({ onSignIn, onSignUp }) {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profiles, following, toggleFollow, openDM, bookmarks, votes } = useUI();
  const [activeTab, setActiveTab] = useState('products');

  const profileKey = '@' + handle;
  const demoProfile = profiles[profileKey];

  const isOwn = user && ((user.handle || '').replace('@','') === handle);

  const profile = isOwn ? {
    handle: '@' + (user.handle || '').replace('@',''),
    name: user.name || 'Unknown',
    avatar: user.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '??',
    persona: PERSONA_MAP[(user.persona||'enthusiast').toLowerCase()] || 'Enthusiast',
    headline: user.headline || '',
    bio: user.bio || '',
    country: user.country || '',
    twitter: user.twitter || '',
    linkedin: user.linkedin || '',
    github: user.github || '',
    website: user.website || '',
    followers: user.followers || 0,
    following: user.following || 0,
    products: [],
    verified: user.role === 'admin',
    joinDate: user.created_at ? new Date(user.created_at).getFullYear() : 2024,
  } : demoProfile || null;

  if (!profile) {
    return (
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
  }

  const rawPersona = profile.persona || 'Enthusiast';
  const personaLabel = PERSONA_MAP[rawPersona.toLowerCase()] || rawPersona;
  const personaIcon = PERSONA_ICONS[personaLabel] || '⭐';
  const isFollowing = following.has(profile.handle);
  const initials = profile.avatar || profile.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  const profileProducts = profile.products ? profile.products.map(id => MOCK_PRODUCTS.find(p => p.id === id)).filter(Boolean) : [];
  const interestedProducts = isOwn ? MOCK_PRODUCTS.filter(p => votes.has(p.id) || bookmarks.has(p.id)) : (profile.interestedProducts || []).map(id => MOCK_PRODUCTS.find(p=>p.id===id)).filter(Boolean);

  const followers = typeof profile.followers === 'number' ? profile.followers : (profile.followers||[]).length;
  const followingCount = isOwn ? following.size : (typeof profile.following === 'number' ? profile.following : (profile.following||[]).length);

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 32px 80px' }}>
          {/* Profile card */}
          <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, overflow:'hidden', marginBottom:20 }}>
            {/* Top banner */}
            <div style={{ height:100, background:'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,rgba(232,98,26,.15) 100%)' }}/>
            {/* Avatar + info */}
            <div style={{ padding:'0 28px 24px', position:'relative' }}>
              {/* Avatar */}
              <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:24, fontWeight:900, border:'4px solid #fff', position:'absolute', top:-40, left:28, boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
                {initials}
              </div>
              {/* Actions row */}
              <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12, marginBottom:8, gap:10 }}>
                {isOwn ? (
                  <button onClick={() => navigate('/settings')}
                    style={{ padding:'8px 16px', borderRadius:10, background:'#f4f4f4', color:'#444', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    ⚙️ Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={() => { if (!user) { onSignIn?.(); return; } toggleFollow(profile.handle, profile.name); }}
                      style={{ padding:'8px 18px', borderRadius:10, background:isFollowing?'#f0f0f0':'var(--orange)', color:isFollowing?'#444':'#fff', border:`1.5px solid ${isFollowing?'#e8e8e8':'var(--orange)'}`, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                      {isFollowing ? 'Following ✓' : '+ Follow'}
                    </button>
                    <button onClick={() => { if (!user) { onSignIn?.(); return; } openDM(profile.handle, profile.name, initials); }}
                      style={{ padding:'8px 16px', borderRadius:10, background:'#fff', color:'#555', border:'1.5px solid #e8e8e8', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      Message
                    </button>
                  </>
                )}
              </div>
              {/* Name + handle */}
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
                {/* Links */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                  {profile.website && <a href={profile.website.startsWith('http')?profile.website:'https://'+profile.website} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4', transition:'all .15s' }} onMouseOver={e=>{e.currentTarget.style.color='var(--orange)'}} onMouseOut={e=>{e.currentTarget.style.color='#555'}}>🌐 Website</a>}
                  {profile.twitter && <a href={`https://twitter.com/${profile.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4' }}>𝕏 @{profile.twitter.replace('@','')}</a>}
                  {profile.linkedin && <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4' }}>💼 LinkedIn</a>}
                  {profile.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#555', textDecoration:'none', padding:'4px 10px', borderRadius:8, background:'#f4f4f4' }}>⌥ GitHub</a>}
                </div>
                {/* Stats */}
                <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                  {[
                    [profileProducts.length, 'Products'],
                    [isFollowing ? followers + 1 : followers, 'Followers'],
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
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
                  {profileProducts.map(pr => (
                    <div key={pr.id} onClick={() => navigate(`/products/${pr.id}`)}
                      style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:14, padding:'18px 16px', cursor:'pointer', transition:'all .15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(232,98,26,.1)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.boxShadow='none'; }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:'#f8f8f8', display:'grid', placeItems:'center', fontSize:22, marginBottom:10 }}>{pr.logo_emoji}</div>
                      <div style={{ fontSize:14, fontWeight:800, marginBottom:4 }}>{pr.name}</div>
                      <div style={{ fontSize:12, color:'#aaa', marginBottom:8, lineHeight:1.4 }}>{pr.tagline}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--orange)' }}>▲ {pr.upvotes_count || 0}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:pr.status==='soon'?'#f5f5f5':'#eefbf3', color:pr.status==='soon'?'#aaa':'#22c55e' }}>{pr.status==='soon'?'Soon':'Live'}</span>
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
