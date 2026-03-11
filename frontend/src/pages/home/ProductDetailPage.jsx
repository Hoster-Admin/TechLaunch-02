import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import WaitlistModal from '../../components/home/WaitlistModal';

const MOCK_PRODUCTS = [
  { id:1,  name:'Tabby',        tagline:'Buy now, pay later for MENA shoppers', logo_emoji:'💳', industry:'Fintech',     country:'UAE',          status:'live', upvotes_count:342, website:'https://tabby.ai', description:'Tabby is MENA\'s leading Buy Now Pay Later platform. Split purchases into 4 interest-free payments or pay in 14 days — with zero fees, zero interest.', tags:['BNPL','Fintech','Payments'], founders:[{name:'Hosam Arab',role:'Co-Founder & CEO',avatar:'HA'}], reasons:['No interest, no hidden fees','Works at 3,000+ stores in UAE & Saudi','Arabic-first customer support'] },
  { id:2,  name:'Noon Academy', tagline:'Social learning platform for students', logo_emoji:'📚', industry:'Edtech',      country:'Saudi Arabia',  status:'live', upvotes_count:287, website:'https://noonacademy.com', description:'Noon Academy is a social learning app connecting millions of K-12 students with top tutors and peers across the Arab world for live interactive classes.', tags:['Edtech','Social','Learning'], founders:[{name:'Mohamed Barakat',role:'Co-Founder',avatar:'MB'}], reasons:['Live group classes with top tutors','Available in 8 Arab countries','Gamified learning experience'] },
  { id:3,  name:'Vezeeta',      tagline:'Book doctors and healthcare services',  logo_emoji:'🏥', industry:'Healthtech',  country:'Egypt',         status:'live', upvotes_count:256, website:'https://vezeeta.com', description:'Vezeeta is MENA\'s largest digital healthcare platform connecting patients with 30,000+ doctors and clinics for instant booking and telemedicine.', tags:['Health','Booking','Egypt'], founders:[{name:'Amir Barsoum',role:'CEO & Co-Founder',avatar:'AB'}], reasons:['30,000+ verified doctors','Instant online booking','Health insurance integration'] },
  { id:4,  name:'Baraka',       tagline:'Invest in global stocks from the GCC',  logo_emoji:'📈', industry:'Fintech',     country:'UAE',           status:'live', upvotes_count:231, website:'https://getbaraka.com', description:'Baraka is a zero-commission stock trading app built for GCC investors. Trade US stocks and ETFs with fractional shares starting from $1.', tags:['Investing','Stocks','Fintech'], founders:[{name:'Feras Jalbout',role:'Co-Founder & CEO',avatar:'FJ'}], reasons:['Zero commission trading','Fractional shares from $1','Arabic interface & support'] },
  { id:5,  name:'Tamara',       tagline:'BNPL shopping for Saudi consumers',     logo_emoji:'🛒', industry:'Fintech',     country:'Saudi Arabia',  status:'live', upvotes_count:198, website:'https://tamara.co', description:'Tamara is Saudi Arabia\'s leading Buy Now Pay Later solution, enabling shoppers to split purchases into 3 installments at 0% interest.', tags:['BNPL','Saudi','Shopping'], founders:[{name:'Turki Bin Zarah',role:'Co-Founder & CEO',avatar:'TZ'}], reasons:['Split into 3 payments','0% interest for on-time payments','Available at 5,000+ merchants'] },
  { id:6,  name:'Kader AI',     tagline:'AI-powered job matching for MENA',      logo_emoji:'🤖', industry:'AI & ML',     country:'Jordan',        status:'soon', upvotes_count:0, website:'', description:'Kader AI uses machine learning to match MENA job seekers with relevant opportunities in real time, supporting Arabic and English CVs.', tags:['AI','Jobs','Recruitment'], founders:[{name:'Nour Al-Hassan',role:'Founder',avatar:'NH'}], reasons:['Arabic-first job matching','CV analysis in seconds','Connecting MENA talent globally'] },
  { id:7,  name:'Trella',       tagline:'Digital freight marketplace in MENA',   logo_emoji:'🚛', industry:'Logistics',   country:'Egypt',         status:'live', upvotes_count:154, website:'https://trella.app', description:'Trella is a digital freight marketplace connecting shippers and carriers across MENA, reducing empty miles and improving logistics efficiency.', tags:['Freight','Logistics','Marketplace'], founders:[{name:'Omar Hagrass',role:'Co-Founder & CEO',avatar:'OH'}], reasons:['Real-time shipment tracking','Vetted carrier network','Serving 4 MENA countries'] },
  { id:8,  name:'Foodics',      tagline:'Restaurant management system for F&B',  logo_emoji:'🍽️', industry:'Foodtech',    country:'Saudi Arabia',  status:'live', upvotes_count:143, website:'https://foodics.com', description:'Foodics is a cloud-based restaurant management and POS system serving 20,000+ restaurants across MENA with ordering, inventory, and analytics.', tags:['F&B','POS','Restaurant'], founders:[{name:'Ahmad Al-Zaini',role:'CEO',avatar:'AZ'}], reasons:['Used by 20,000+ restaurants','Full Arabic + English support','Integrates with all delivery apps'] },
  { id:9,  name:'Waffarha',     tagline:'Discount coupons and deals platform',   logo_emoji:'🎟️', industry:'E-Commerce',  country:'Egypt',         status:'live', upvotes_count:128, website:'https://waffarha.com', description:'Waffarha is Egypt and MENA\'s leading coupon and cashback platform, helping shoppers save money at hundreds of top brands.', tags:['Deals','Coupons','Egypt'], founders:[{name:'Ramy El-Sheikh',role:'Founder',avatar:'RS'}], reasons:['Coupons for 500+ brands','Instant cashback on orders','Free to use, save up to 50%'] },
  { id:10, name:'Cura',         tagline:'Arabic mental health therapy online',   logo_emoji:'🧠', industry:'Healthtech',  country:'Saudi Arabia',  status:'soon', upvotes_count:0, website:'', description:'Cura connects Arabic speakers to licensed therapists for online mental health sessions — fully private, in Arabic, and accessible from anywhere.', tags:['Mental Health','Arabic','Therapy'], founders:[{name:'Lara Nasser',role:'Co-Founder',avatar:'LN'}], reasons:['100% Arabic-language sessions','Licensed therapists only','Completely confidential & secure'] },
];

export default function ProductDetailPage({ onSignIn, onSignUp }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, votes, toggleVote, addNotification, setWaitlistModal, openDM } = useUI();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const pid = parseInt(id);

  useEffect(() => {
    setLoading(true);
    productsAPI.get(pid).then(({ data }) => {
      setProduct(data.data);
      setLoading(false);
    }).catch(() => {
      const mock = MOCK_PRODUCTS.find(p => p.id === pid);
      setProduct(mock || null);
      setLoading(false);
    });
  }, [pid]);

  const p = product || MOCK_PRODUCTS.find(p => p.id === pid) || null;

  if (loading) return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ display:'flex', justifyContent:'center', padding:'120px 20px' }}><Spinner size="lg"/></div>
    </>
  );

  if (!p) return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ maxWidth:600, margin:'120px auto 80px', textAlign:'center', padding:'0 20px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>😕</div>
        <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Product not found</div>
        <p style={{ color:'#666', marginBottom:24 }}>This product doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>← Back to Home</button>
      </div>
    </>
  );

  const isVoted = votes.has(p.id);
  const isBookmarked = bookmarks.has(p.id);
  const voteCount = p.upvotes_count || p.upvotes || 0;

  const handleVote = () => {
    if (!user) { onSignIn?.(); return; }
    toggleVote(p.id);
    if (!isVoted) {
      addNotification('vote', `You upvoted ${p.name}`, '▲', null);
      toast.success(`Upvoted ${p.name}!`);
      try { productsAPI.upvote(p.id); } catch {}
    }
  };

  const handleBookmark = () => {
    if (!user) { onSignIn?.(); return; }
    toggleBookmark(p.id);
    toast(isBookmarked ? 'Bookmark removed' : `${p.name} saved to bookmarks!`);
    try { productsAPI.bookmark(p.id); } catch {}
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShareOpen(false);
    toast.success('Link copied!');
  };

  const reasons = p.reasons || ['Great MENA product','Solving a real problem','Innovative approach'];
  const founders = p.founders || [];
  const tags = p.tags || [p.industry].filter(Boolean);
  const isSoon = p.status === 'soon';

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>

      <div style={{ paddingTop:'var(--nav-h)', background:'#f8f8f8', minHeight:'100vh' }}>
        {/* Breadcrumb */}
        <div style={{ background:'#fff', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 32px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, height:44, fontSize:12, color:'#aaa' }}>
              <span onClick={() => navigate('/')} style={{ cursor:'pointer', color:'#666', fontWeight:600 }}
                onMouseOver={e => e.currentTarget.style.color='var(--orange)'}
                onMouseOut={e => e.currentTarget.style.color='#666'}>Home</span>
              <span>›</span>
              <span onClick={() => navigate('/products')} style={{ cursor:'pointer', color:'#666', fontWeight:600 }}
                onMouseOver={e => e.currentTarget.style.color='var(--orange)'}
                onMouseOut={e => e.currentTarget.style.color='#666'}>Products</span>
              <span>›</span>
              <span style={{ color:'#0a0a0a', fontWeight:700 }}>{p.name}</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 32px 80px', display:'grid', gridTemplateColumns:'1fr 320px', gap:32 }} className="detail-layout">
          {/* Left */}
          <div>
            {/* Header card */}
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8e8e8', padding:'28px 28px 24px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:20, marginBottom:20 }}>
                <div style={{ width:80, height:80, borderRadius:20, background:'#f4f4f4', display:'grid', placeItems:'center', fontSize:36, flexShrink:0, border:'1px solid #eee' }}>
                  {p.logo_emoji || p.logo || '🚀'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                    <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-.03em', margin:0 }}>{p.name}</h1>
                    {isSoon ? <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#eef2ff', color:'#4f46e5' }}>COMING SOON</span>
                      : <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#eefbf3', color:'#16a34a' }}>LIVE</span>}
                  </div>
                  <div style={{ fontSize:15, color:'#555', marginBottom:12, lineHeight:1.5 }}>{p.tagline}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#f4f4f4', color:'#555' }}>{p.industry}</span>
                    {p.country && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#f4f4f4', color:'#555' }}>{p.country}</span>}
                    {tags.slice(0,4).map(t => <span key={t} style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:5, background:'#f4f4f4', color:'#666' }}>{t}</span>)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {isSoon ? (
                  <button onClick={() => setWaitlistModal(p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:12, background:'#4f46e5', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                    ⏳ Join Waitlist
                  </button>
                ) : (
                  <button onClick={handleVote}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:12, background:isVoted?'var(--orange)':'#fff', color:isVoted?'#fff':'#0a0a0a', border:`1.5px solid ${isVoted?'var(--orange)':'#e8e8e8'}`, fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                    <span style={{ fontSize:14 }}>▲</span> Upvote · {isVoted ? voteCount + 1 : voteCount}
                  </button>
                )}
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:12, background:'#f4f4f4', color:'#555', fontSize:14, fontWeight:700, textDecoration:'none', transition:'all .15s' }}
                    onMouseOver={e => e.currentTarget.style.background='#e8e8e8'}
                    onMouseOut={e => e.currentTarget.style.background='#f4f4f4'}>
                    🌐 Visit Website
                  </a>
                )}
                <button onClick={handleBookmark}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 16px', borderRadius:12, background:'#fff', color:isBookmarked?'var(--orange)':'#888', border:`1.5px solid ${isBookmarked?'var(--orange)':'#e8e8e8'}`, fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                </button>
                <div style={{ position:'relative' }}>
                  <button onClick={() => setShareOpen(o => !o)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 16px', borderRadius:12, background:'#fff', color:'#888', border:'1.5px solid #e8e8e8', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </button>
                  {shareOpen && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:12, padding:6, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:100, minWidth:160 }}>
                      {[
                        { icon:'🔗', label:copied?'Copied!':'Copy link', action:handleShare },
                        { icon:'𝕏', label:'Share on X', action:() => { window.open(`https://twitter.com/intent/tweet?text=Check out ${p.name} on Tech Launch MENA&url=${window.location.href}`,'_blank'); setShareOpen(false); } },
                        { icon:'💼', label:'Share on LinkedIn', action:() => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`,'_blank'); setShareOpen(false); } },
                      ].map(item => (
                        <div key={item.label} onClick={item.action}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#333' }}
                          onMouseOver={e => e.currentTarget.style.background='#f8f8f8'}
                          onMouseOut={e => e.currentTarget.style.background=''}>
                          <span>{item.icon}</span> {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid #e8e8e8', background:'#fff', borderRadius:'16px 16px 0 0', border:'1px solid #e8e8e8', borderBottom:'none' }}>
              {['overview','media','founders'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding:'14px 20px', border:'none', background:'transparent', fontSize:13, fontWeight:700, cursor:'pointer', color:activeTab===tab?'var(--orange)':'#666', borderBottom:`2px solid ${activeTab===tab?'var(--orange)':'transparent'}`, transition:'all .15s', textTransform:'capitalize' }}>
                  {tab === 'founders' ? 'Team' : tab.charAt(0).toUpperCase()+tab.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderTop:'none', borderRadius:'0 0 16px 16px', padding:'24px 28px', marginBottom:16 }}>
              {activeTab === 'overview' && <>
                <div style={{ fontSize:15, color:'#444', lineHeight:1.8, marginBottom:20 }}>{p.description || p.tagline}</div>
                {reasons.length > 0 && <>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:12, color:'#0a0a0a' }}>✨ Why you'll love it</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {reasons.map((r,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:'#fafafa', borderRadius:12, border:'1px solid #f0f0f0' }}>
                        <span style={{ color:'var(--orange)', fontWeight:800, flexShrink:0 }}>▲</span>
                        <span style={{ fontSize:13, color:'#444' }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </>}
              </>}

              {activeTab === 'media' && (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'#bbb' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>🖼️</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#aaa' }}>No media uploaded yet</div>
                  <div style={{ fontSize:12, color:'#ccc', marginTop:4 }}>Screenshots and demos will appear here.</div>
                </div>
              )}

              {activeTab === 'founders' && (
                founders.length ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {founders.map((f,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'#fafafa', borderRadius:12, border:'1px solid #f0f0f0' }}>
                        <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:14, fontWeight:900, flexShrink:0 }}>{f.avatar || f.name.slice(0,2).toUpperCase()}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700 }}>{f.name}</div>
                          <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{f.role}</div>
                        </div>
                        {user && (
                          <button onClick={() => openDM('@'+f.name.toLowerCase().replace(/\s+/g,'_'), f.name, f.avatar)}
                            style={{ padding:'7px 14px', borderRadius:10, background:'#f4f4f4', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', color:'#555', display:'flex', alignItems:'center', gap:6 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                            Message
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'40px 20px', color:'#bbb' }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>👥</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#aaa' }}>No team info added</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            {/* Vote card */}
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:24, marginBottom:16, textAlign:'center' }}>
              {isSoon ? <>
                <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
                <div style={{ fontSize:15, fontWeight:800, marginBottom:6 }}>Coming Soon</div>
                <div style={{ fontSize:13, color:'#888', marginBottom:16, lineHeight:1.5 }}>Be the first to know when this launches</div>
                <button onClick={() => setWaitlistModal(p)}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, background:'#4f46e5', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  ⚡ Join Waitlist
                </button>
              </> : <>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'#aaa', marginBottom:12 }}>Upvote this product</div>
                <button onClick={handleVote}
                  style={{ width:72, height:72, borderRadius:16, border:`2px solid ${isVoted?'var(--orange)':'#e8e8e8'}`, background:isVoted?'var(--orange)':'#fff', color:isVoted?'#fff':'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', margin:'0 auto 12px', transition:'all .15s', fontSize:20 }}>
                  <span>▲</span>
                  <span style={{ fontSize:18, fontWeight:800, fontFamily:'DM Mono,monospace' }}>{isVoted ? voteCount+1 : voteCount}</span>
                </button>
                <div style={{ fontSize:12, color:'#aaa' }}>{isVoted ? 'Thanks for your vote!' : 'Click to upvote'}</div>
              </>}
            </div>

            {/* Info card */}
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:24, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:16, color:'#0a0a0a' }}>Product Info</div>
              {[
                ['🏭', 'Industry', p.industry],
                ['📍', 'Country', p.country],
                ['📊', 'Status', isSoon ? 'Coming Soon' : 'Live'],
              ].filter(r => r[2]).map(([icon,label,val]) => (
                <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f8f8f8' }}>
                  <span style={{ fontSize:12, color:'#888', display:'flex', alignItems:'center', gap:6 }}>{icon} {label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0a0a0a' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Tags card */}
            {tags.length > 0 && (
              <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:24, marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:800, marginBottom:12, color:'#0a0a0a' }}>Tags</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {tags.map(t => (
                    <span key={t} style={{ fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20, background:'#f4f4f4', color:'#555', cursor:'pointer' }}
                      onClick={() => navigate(`/products?industry=${encodeURIComponent(t)}`)}
                      onMouseOver={e => { e.currentTarget.style.background='var(--orange-light)'; e.currentTarget.style.color='var(--orange)'; }}
                      onMouseOut={e => { e.currentTarget.style.background='#f4f4f4'; e.currentTarget.style.color='#555'; }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share card */}
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:24 }}>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:12, color:'#0a0a0a' }}>Share</div>
              <div style={{ display:'flex', gap:8 }}>
                {[
                  { icon:'🔗', label:copied?'Copied!':'Copy', action:handleShare, bg:'#f4f4f4', col:'#555' },
                  { icon:'𝕏', label:'Twitter', action:() => window.open(`https://twitter.com/intent/tweet?text=Check out ${p.name}&url=${window.location.href}`,'_blank'), bg:'#000', col:'#fff' },
                  { icon:'💼', label:'LinkedIn', action:() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`,'_blank'), bg:'#0077b5', col:'#fff' },
                ].map(s => (
                  <button key={s.label} onClick={s.action}
                    style={{ flex:1, padding:'8px 4px', borderRadius:10, background:s.bg, color:s.col, border:'none', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:16 }}>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WaitlistModal product={null} onClose={() => setWaitlistModal(null)}/>
      <Footer/>

      <style>{`
        @media(max-width:900px){ .detail-layout{ grid-template-columns:1fr !important; } }
      `}</style>
    </>
  );
}
