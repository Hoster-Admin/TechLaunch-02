import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PERSONA_ICONS = { Founder:'🚀', Investor:'💰', Builder:'⚡', 'Product Manager':'🧠', Accelerator:'🏢', Enthusiast:'⭐', 'Venture Studio':'🏗️' };
const PERSONA_MAP   = { founder:'Founder', investor:'Investor', builder:'Builder', pm:'Product Manager', accelerator:'Accelerator', enthusiast:'Enthusiast', venture:'Venture Studio', 'product manager':'Product Manager', 'venture studio':'Venture Studio' };

const DIAL_CODES = [
  { code:'sa', flag:'🇸🇦', name:'Saudi Arabia', dial:'+966' },
  { code:'ae', flag:'🇦🇪', name:'UAE',          dial:'+971' },
  { code:'eg', flag:'🇪🇬', name:'Egypt',        dial:'+20'  },
  { code:'jo', flag:'🇯🇴', name:'Jordan',       dial:'+962' },
  { code:'kw', flag:'🇰🇼', name:'Kuwait',       dial:'+965' },
  { code:'qa', flag:'🇶🇦', name:'Qatar',        dial:'+974' },
  { code:'bh', flag:'🇧🇭', name:'Bahrain',      dial:'+973' },
  { code:'om', flag:'🇴🇲', name:'Oman',         dial:'+968' },
  { code:'lb', flag:'🇱🇧', name:'Lebanon',      dial:'+961' },
  { code:'ma', flag:'🇲🇦', name:'Morocco',      dial:'+212' },
  { code:'iq', flag:'🇮🇶', name:'Iraq',         dial:'+964' },
  { code:'sy', flag:'🇸🇾', name:'Syria',        dial:'+963' },
  { code:'tn', flag:'🇹🇳', name:'Tunisia',      dial:'+216' },
  { code:'dz', flag:'🇩🇿', name:'Algeria',      dial:'+213' },
  { code:'ly', flag:'🇱🇾', name:'Libya',        dial:'+218' },
  { code:'ye', flag:'🇾🇪', name:'Yemen',        dial:'+967' },
];

const COUNTRIES = [
  { v:'sa', l:'🇸🇦 Saudi Arabia' }, { v:'ae', l:'🇦🇪 UAE'          }, { v:'eg', l:'🇪🇬 Egypt'        },
  { v:'kw', l:'🇰🇼 Kuwait'       }, { v:'qa', l:'🇶🇦 Qatar'        }, { v:'bh', l:'🇧🇭 Bahrain'      },
  { v:'om', l:'🇴🇲 Oman'         }, { v:'jo', l:'🇯🇴 Jordan'       }, { v:'lb', l:'🇱🇧 Lebanon'      },
  { v:'iq', l:'🇮🇶 Iraq'         }, { v:'ma', l:'🇲🇦 Morocco'      }, { v:'tn', l:'🇹🇳 Tunisia'      },
  { v:'dz', l:'🇩🇿 Algeria'      }, { v:'ly', l:'🇱🇾 Libya'        }, { v:'ye', l:'🇾🇪 Yemen'        },
  { v:'sy', l:'🇸🇾 Syria'        }, { v:'ps', l:'🇵🇸 Palestine'    }, { v:'other', l:'🌍 Other'       },
];

const NAV_ITEMS = [
  { key:'profile',   icon:'👤', label:'My Profile'  },
  { key:'products',  icon:'🚀', label:'My Products' },
  { key:'applied',   icon:'📋', label:'Applied'     },
  { key:'messages',  icon:'💬', label:'Messages'    },
  { key:'bookmarks', icon:'🔖', label:'Bookmarks'   },
];

const MOCK_THREADS = [];

const IconBox = ({ children }) => (
  <span style={{ width:44, minWidth:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', borderRight:'1px solid #f0f0f0', flexShrink:0 }}>
    {children}
  </span>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a0a0a">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.745-8.867L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const inputStyle = { flex:1, padding:'10px 14px', border:'none', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a' };
const labelStyle = { display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 };
const fieldWrap   = { border:'1.5px solid #e8e8e8', borderRadius:10, overflow:'hidden', background:'#fff', display:'flex', alignItems:'center' };

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab,   setActiveTab]   = useState('profile');
  const [copied,      setCopied]      = useState(false);
  const [saving,      setSaving]      = useState(false);

  const [name,        setName]        = useState(user?.name     || '');
  const [handle,      setHandle]      = useState((user?.handle || '').replace('@',''));
  const [headline,    setHeadline]    = useState(user?.headline || 'Building the future of MENA tech 🚀');
  const [phone,       setPhone]       = useState(user?.phone    || '');
  const [countryDial, setCountryDial] = useState('sa');
  const [country,     setCountry]     = useState(user?.country  || '');
  const [city,        setCity]        = useState(user?.city     || '');
  const [website,     setWebsite]     = useState(user?.website  || '');
  const [twitter,     setTwitter]     = useState(user?.twitter  || '');
  const [linkedin,    setLinkedin]    = useState(user?.linkedin || '');
  const [github,      setGithub]      = useState(user?.github   || '');
  const [activeThread, setActiveThread] = useState(null);
  const [msgInput,    setMsgInput]    = useState('');
  const [threads,     setThreads]     = useState(MOCK_THREADS);

  if (!user) { navigate('/login'); return null; }

  const initials     = user.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
  const rawPersona   = user.persona || 'Enthusiast';
  const personaLabel = PERSONA_MAP[rawPersona.toLowerCase()] || rawPersona;
  const personaIcon  = PERSONA_ICONS[personaLabel] || '⭐';
  const handleClean  = handle.replace('@','');

  const handleCopy = () => {
    navigator.clipboard?.writeText(`tlmena.com/${handleClean}`).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 1800);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r=>setTimeout(r,600));
      updateUser({ name, headline, website, twitter, linkedin, github, country, city });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const handleTabNav = (key) => {
    if (key === 'bookmarks') { navigate('/bookmarks'); return; }
    setActiveTab(key);
  };

  const sendMsg = () => {
    if (!msgInput.trim() || !activeThread) return;
    const text = msgInput.trim(); setMsgInput('');
    setThreads(prev => prev.map(t => t.handle === activeThread
      ? { ...t, msgs:[...t.msgs, { from:'me', text, ts:'now' }] } : t));
    setTimeout(() => {
      const replies = ['Got it! 👍','Sounds great!','Let me check and get back to you.','Interesting!'];
      setThreads(prev => prev.map(t => t.handle === activeThread
        ? { ...t, msgs:[...t.msgs, { from:activeThread, text:replies[Math.floor(Math.random()*replies.length)], ts:'now' }] } : t));
    }, 1200);
  };

  const currentThread = threads.find(t => t.handle === activeThread);

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 32px 80px', display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* Sidebar */}
          <div style={{ width:190, flexShrink:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', position:'sticky', top:'calc(var(--nav-h) + 20px)' }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={()=>handleTabNav(item.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'13px 16px', border:'none', borderBottom:'1px solid #f4f4f4', background:activeTab===item.key?'var(--orange-light)':'#fff', color:activeTab===item.key?'var(--orange)':'#444', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif' }}>
                <span style={{ fontSize:15 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* ── MY PROFILE ── */}
            {activeTab === 'profile' && (<>
              {/* Profile preview card */}
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, overflow:'hidden', marginBottom:20 }}>
                <div style={{ height:110, background:'linear-gradient(135deg,#0a0a0a 0%,#E15033 100%)', position:'relative' }}>
                  <button onClick={()=>navigate(`/u/${handleClean}`)}
                    style={{ position:'absolute', top:14, right:14, padding:'7px 14px', borderRadius:10, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Preview Profile
                  </button>
                </div>
                <div style={{ padding:'0 24px 24px', position:'relative' }}>
                  <div style={{ position:'relative', display:'inline-block', marginTop:-36, marginBottom:10 }}>
                    <div style={{ width:72, height:72, borderRadius:'50%', background:user.avatar_color||'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:22, fontWeight:900, border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>{initials}</div>
                    <button style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'#fff', border:'2px solid #e8e8e8', display:'grid', placeItems:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.1)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, marginBottom:3 }}>{user.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:13, color:'var(--orange)', fontWeight:600 }}>tlmena.com/{handleClean}</span>
                    <button onClick={handleCopy} style={{ padding:'2px 8px', borderRadius:6, background:'#f4f4f4', border:'none', cursor:'pointer', fontSize:11, fontWeight:700, color:'#555', display:'flex', alignItems:'center', gap:4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {headline && <div style={{ fontSize:13, color:'#666', marginBottom:10 }}>{headline}</div>}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--orange-light)', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:'var(--orange)' }}>
                    {personaIcon} {personaLabel.toLowerCase()}
                  </div>
                </div>
              </div>

              {/* Identity */}
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>
                  <span>🪪</span> Identity
                </div>

                {/* Row 1: Full Name + Handle */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={labelStyle}>FULL NAME</label>
                    <div style={fieldWrap} onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                      <input type="text" value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="Your full name"/>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>HANDLE</label>
                    <div style={fieldWrap} onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                      <span style={{ padding:'10px 10px 10px 14px', fontSize:13, color:'#aaa', background:'#fafafa', borderRight:'1px solid #f0f0f0', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif' }}>tlmena.com/</span>
                      <input type="text" value={handleClean} onChange={e=>setHandle(e.target.value.replace(/[^a-z0-9_]/gi,'').toLowerCase())} style={inputStyle} placeholder="yourhandle"/>
                    </div>
                  </div>
                </div>

                {/* Row 2: Phone + Email */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={labelStyle}>PHONE NUMBER</label>
                    <div style={fieldWrap}>
                      <select value={countryDial} onChange={e=>setCountryDial(e.target.value)}
                        style={{ padding:'10px 8px', border:'none', borderRight:'1px solid #f0f0f0', background:'#fafafa', fontSize:13, cursor:'pointer', outline:'none', fontFamily:'Inter,sans-serif', color:'#444' }}>
                        {DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>)}
                      </select>
                      <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="5X XXX XXXX" style={inputStyle}/>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL</label>
                    <div style={{ ...fieldWrap, background:'#fafafa' }}>
                      <input type="email" value={user.email||''} disabled style={{ ...inputStyle, color:'#aaa', cursor:'not-allowed', background:'transparent' }}/>
                    </div>
                  </div>
                </div>

                {/* Row 3: Country + City */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={labelStyle}>COUNTRY</label>
                    <div style={fieldWrap}>
                      <select value={country} onChange={e=>setCountry(e.target.value)}
                        style={{ width:'100%', padding:'10px 14px', border:'none', fontSize:14, fontFamily:'Inter,sans-serif', color:'#0a0a0a', background:'#fff', outline:'none', cursor:'pointer' }}>
                        <option value="">Select country…</option>
                        {COUNTRIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>CITY</label>
                    <div style={fieldWrap} onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                      <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Riyadh" style={inputStyle}/>
                    </div>
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <label style={labelStyle}>HEADLINE</label>
                  <div style={fieldWrap} onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                    <input type="text" value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="e.g. Founder @ Tabby · Fintech · UAE" style={inputStyle}/>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>
                  <span>🔗</span> Links
                </div>
                <div style={{ display:'grid', gap:14 }}>
                  {[
                    { label:'WEBSITE',    value:website,  setter:setWebsite,  placeholder:'https://yoursite.com', Icon:GlobeIcon },
                    { label:'TWITTER / X',value:twitter,  setter:setTwitter,  placeholder:'@handle',              Icon:XIcon },
                    { label:'LINKEDIN',   value:linkedin, setter:setLinkedin, placeholder:'linkedin.com/in/handle',Icon:LinkedInIcon },
                    { label:'GITHUB',     value:github,   setter:setGithub,   placeholder:'github.com/username',  Icon:GitHubIcon },
                  ].map(field => (
                    <div key={field.label}>
                      <label style={labelStyle}>{field.label}</label>
                      <div style={fieldWrap}
                        onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'}
                        onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'}
                        tabIndex={-1}>
                        <IconBox><field.Icon/></IconBox>
                        <input type="text" value={field.value} onChange={e=>field.setter(e.target.value)} placeholder={field.placeholder}
                          style={inputStyle} onFocus={e=>e.currentTarget.parentElement.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.parentElement.style.borderColor='#e8e8e8'}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
                <button onClick={()=>navigate(`/u/${handleClean}`)} style={{ padding:'11px 22px', borderRadius:12, background:'#fff', border:'1.5px solid #e8e8e8', color:'#555', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ padding:'11px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?.7:1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </>)}

            {/* ── MY PRODUCTS ── */}
            {activeTab === 'products' && (
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'40px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🚀</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No products yet</div>
                <p style={{ color:'#888', marginBottom:20 }}>Products you submit will appear here.</p>
                <button onClick={()=>navigate('/')} style={{ padding:'11px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Submit a Product 🚀
                </button>
              </div>
            )}

            {/* ── APPLIED ── */}
            {activeTab === 'applied' && (
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'40px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No applications yet</div>
                <p style={{ color:'#888' }}>Programs and opportunities you apply to will appear here.</p>
              </div>
            )}

            {/* ── MESSAGES ── */}
            {activeTab === 'messages' && (
              <div>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>💬 Messages</div>
                <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>Your conversations.</div>

                <div className="adm-msg-wrap">
                  {/* Thread list */}
                  <div className="adm-threads">
                    <div className="adm-threads-hd">Conversations</div>
                    {threads.length === 0
                      ? <div style={{ padding:'24px 16px', fontSize:13, color:'#ccc' }}>No conversations yet.</div>
                      : threads.map(t => (
                          <div key={t.handle} className={`adm-thread${activeThread===t.handle?' sel':''}`} onClick={()=>setActiveThread(t.handle)}>
                            <div className="adm-thread-av">{t.initials}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="adm-thread-name">{t.name}</div>
                              <div className="adm-thread-prev">{t.msgs[t.msgs.length-1]?.text || ''}</div>
                            </div>
                          </div>
                        ))
                    }
                  </div>

                  {/* Chat area */}
                  <div className="adm-chat-area">
                    {!activeThread ? (
                      <div className="adm-chat-empty">
                        <div>
                          <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#ccc' }}>Select a conversation</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="adm-chat-hd">{currentThread?.name}</div>
                        <div className="adm-bubbles" id="admBubbles">
                          {(currentThread?.msgs||[]).map((m, i) => (
                            <div key={i} className={`adm-bubble ${m.from==='me'?'mine':'theirs'}`}>{m.text}</div>
                          ))}
                        </div>
                        <div className="adm-composer">
                          <input className="adm-compose-input" value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                            placeholder="Type a message…" onKeyDown={e=>e.key==='Enter'&&sendMsg()}/>
                          <button className="adm-compose-send" onClick={sendMsg}>↑</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
