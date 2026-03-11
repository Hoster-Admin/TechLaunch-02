import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PERSONA_ICONS = { Founder:'🚀', Investor:'💰', Builder:'⚡', 'Product Manager':'🧠', Accelerator:'🏢', Enthusiast:'⭐', 'Venture Studio':'🏗️' };
const PERSONA_MAP = { founder:'Founder', investor:'Investor', builder:'Builder', pm:'Product Manager', accelerator:'Accelerator', enthusiast:'Enthusiast', venture:'Venture Studio', 'product manager':'Product Manager', 'venture studio':'Venture Studio' };

const COUNTRY_CODES = [
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
];

const NAV_ITEMS = [
  { key:'profile',    icon:'👤', label:'My Profile'  },
  { key:'products',   icon:'🚀', label:'My Products' },
  { key:'applied',    icon:'📋', label:'Applied'     },
  { key:'messages',   icon:'💬', label:'Messages'    },
  { key:'bookmarks',  icon:'🔖', label:'Bookmarks'   },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name,      setName]     = useState(user?.name     || '');
  const [handle,    setHandle]   = useState((user?.handle || '').replace('@',''));
  const [headline,  setHeadline] = useState(user?.headline || 'Building the future of MENA tech 🚀');
  const [phone,     setPhone]    = useState(user?.phone    || '');
  const [countryDial, setCountryDial] = useState('sa');
  const [website,   setWebsite]  = useState(user?.website  || '');
  const [twitter,   setTwitter]  = useState(user?.twitter  || '');
  const [linkedin,  setLinkedin] = useState(user?.linkedin || '');

  if (!user) {
    navigate('/login');
    return null;
  }

  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const rawPersona = user.persona || 'Enthusiast';
  const personaLabel = PERSONA_MAP[rawPersona.toLowerCase()] || rawPersona;
  const personaIcon  = PERSONA_ICONS[personaLabel] || '⭐';
  const handleClean  = handle.replace('@', '');
  const dialInfo     = COUNTRY_CODES.find(c => c.code === countryDial) || COUNTRY_CODES[0];

  const handleCopy = () => {
    navigator.clipboard?.writeText(`techlau.nch/${handleClean}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      updateUser({ name, headline, website, twitter, linkedin });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save changes');
    } finally { setSaving(false); }
  };

  const handleTabNav = (key) => {
    if (key === 'bookmarks')  { navigate('/bookmarks'); return; }
    if (key === 'messages')   { return; }
    setActiveTab(key);
  };

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 32px 80px', display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* Sidebar */}
          <div style={{ width:190, flexShrink:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', position:'sticky', top:'calc(var(--nav-h) + 20px)' }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={() => handleTabNav(item.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'13px 16px', border:'none', borderBottom:'1px solid #f4f4f4', background:activeTab===item.key?'var(--orange-light)':'#fff', color:activeTab===item.key?'var(--orange)':'#444', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'Inter,sans-serif' }}>
                <span style={{ fontSize:15 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex:1, minWidth:0 }}>

            {activeTab === 'profile' && (
              <>
                {/* Profile card */}
                <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, overflow:'hidden', marginBottom:20 }}>
                  {/* Banner */}
                  <div style={{ height:110, background:'linear-gradient(135deg,#1a0a00 0%,#3d1500 40%,#7a2e0e 70%,rgba(232,98,26,.3) 100%)', position:'relative' }}>
                    <button style={{ position:'absolute', top:14, right:14, padding:'7px 14px', borderRadius:10, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:6 }}
                      onClick={() => navigate(`/u/${handleClean}`)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Preview Profile
                    </button>
                  </div>

                  {/* Avatar + info */}
                  <div style={{ padding:'0 24px 24px', position:'relative' }}>
                    <div style={{ position:'relative', display:'inline-block', marginTop:-36, marginBottom:10 }}>
                      <div style={{ width:72, height:72, borderRadius:'50%', background:user.avatar_color||'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:22, fontWeight:900, border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
                        {initials}
                      </div>
                      <button style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'#fff', border:'2px solid #e8e8e8', display:'grid', placeItems:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.1)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                    </div>

                    <div style={{ fontSize:20, fontWeight:800, marginBottom:3 }}>{user.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:13, color:'var(--orange)', fontWeight:600 }}>techlau.nch/{handleClean}</span>
                      <button onClick={handleCopy}
                        style={{ padding:'2px 8px', borderRadius:6, background:'#f4f4f4', border:'none', cursor:'pointer', fontSize:11, fontWeight:700, color:'#555', display:'flex', alignItems:'center', gap:4 }}>
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

                {/* Identity form */}
                <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>
                    <span>🪪</span> Identity
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>FULL NAME</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a', boxSizing:'border-box' }}
                        onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>HANDLE</label>
                      <div style={{ display:'flex', border:'1.5px solid #e8e8e8', borderRadius:10, overflow:'hidden', background:'#fff' }}
                        onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
                        <span style={{ padding:'10px 10px 10px 14px', fontSize:13, color:'#aaa', background:'#fafafa', borderRight:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>techlau.nch/</span>
                        <input type="text" value={handleClean} onChange={e => setHandle(e.target.value.replace(/[^a-z0-9_]/gi,'').toLowerCase())}
                          style={{ flex:1, padding:'10px 14px', border:'none', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a', minWidth:0 }}/>
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>PHONE NUMBER</label>
                      <div style={{ display:'flex', border:'1.5px solid #e8e8e8', borderRadius:10, overflow:'hidden', background:'#fff' }}>
                        <select value={countryDial} onChange={e => setCountryDial(e.target.value)}
                          style={{ padding:'10px 8px', border:'none', borderRight:'1px solid #f0f0f0', background:'#fafafa', fontSize:13, cursor:'pointer', outline:'none', fontFamily:'Inter,sans-serif', color:'#444' }}>
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
                          ))}
                        </select>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="5X XXX XXXX"
                          style={{ flex:1, padding:'10px 14px', border:'none', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a' }}/>
                      </div>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>EMAIL</label>
                      <input type="email" value={user.email || ''} disabled
                        style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #f0f0f0', fontSize:14, fontFamily:'Inter,sans-serif', color:'#aaa', background:'#fafafa', boxSizing:'border-box', cursor:'not-allowed' }}/>
                    </div>
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>HEADLINE</label>
                    <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Building the future of MENA tech 🚀"
                      style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a', boxSizing:'border-box' }}
                      onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                  </div>
                </div>

                {/* Links form */}
                <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>
                    <span>🔗</span> Links
                  </div>
                  <div style={{ display:'grid', gap:14 }}>
                    {[
                      { label:'WEBSITE', value:website, setter:setWebsite, placeholder:'https://yoursite.com', icon:'🌐' },
                      { label:'TWITTER / X', value:twitter, setter:setTwitter, placeholder:'@handle', icon:'𝕏' },
                      { label:'LINKEDIN', value:linkedin, setter:setLinkedin, placeholder:'linkedin.com/in/handle', icon:'💼' },
                    ].map(field => (
                      <div key={field.label}>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>{field.label}</label>
                        <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e8e8e8', borderRadius:10, overflow:'hidden', background:'#fff' }}>
                          <span style={{ padding:'10px 12px', background:'#fafafa', borderRight:'1px solid #f0f0f0', fontSize:15 }}>{field.icon}</span>
                          <input type="text" value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder}
                            style={{ flex:1, padding:'10px 14px', border:'none', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a' }}
                            onFocus={e=>e.currentTarget.parentElement.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.parentElement.style.borderColor='#e8e8e8'}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
                  <button onClick={() => navigate(`/u/${handleClean}`)}
                    style={{ padding:'11px 22px', borderRadius:12, background:'#fff', border:'1.5px solid #e8e8e8', color:'#555', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    style={{ padding:'11px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?.7:1 }}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {activeTab === 'products' && (
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'40px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🚀</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No products yet</div>
                <p style={{ color:'#888', marginBottom:20 }}>Products you submit will appear here.</p>
                <button onClick={() => navigate('/')} style={{ padding:'11px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Submit a Product 🚀
                </button>
              </div>
            )}

            {activeTab === 'applied' && (
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'40px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No applications yet</div>
                <p style={{ color:'#888' }}>Programs and opportunities you apply to will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
