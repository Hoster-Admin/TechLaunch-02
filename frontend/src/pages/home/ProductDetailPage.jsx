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

const REASONS_MAP = {
  'Fintech':    ['💸 Zero-fee transactions for MENA users','🔐 Bank-grade security & compliance','⚡ Instant settlements in local currency','🌍 Works across 10+ MENA countries','📱 Best-in-class mobile experience'],
  'Edtech':     ['📚 Arabic-first content library','🎓 Structured learning paths for all ages','👥 Peer-to-peer study groups','📊 Live progress tracking for parents','🏆 Gamified achievements & rewards'],
  'Healthtech': ['🩺 Verified doctors in under 2 minutes','💊 Digital prescriptions & follow-ups','🌐 Available in 5+ MENA countries','🔒 Full patient data privacy','⭐ 4.8/5 average doctor rating'],
  'AI & ML':    ['🤖 Built natively in Arabic & English','⚡ Real-time AI processing at scale','🔗 Easy API integration in days','📈 Proven ROI for enterprise clients','🛡️ Responsible AI with bias audits'],
  'Logistics':  ['🚛 Real-time shipment tracking','🌍 Coverage across 15 MENA cities','💰 30% cheaper than traditional freight','📦 API-first for easy integrations','🤝 Vetted carrier network of 10K+'],
  'E-Commerce': ['🛒 Localised Arabic shopping experience','💳 BNPL & multiple payment options','🚚 Same-day delivery in major cities','🔄 Easy returns & refunds','⭐ Verified seller reviews'],
  'Foodtech':   ['🍽️ Used by 20K+ MENA restaurants','📊 Real-time sales & inventory analytics','💳 Integrated POS & online ordering','🧾 Multi-branch management made easy','🤝 Dedicated 24/7 local support'],
};

const MOCK_PRODUCTS = [
  { id:1,  name:'Tabby',         tagline:'Buy now, pay later for the MENA region',   logo_emoji:'💳', industry:'Fintech',    country:'UAE',          status:'live', upvotes_count:343, website:'https://tabby.ai',         description:"Tabby is MENA's leading Buy Now Pay Later platform. Split purchases into 4 interest-free payments or pay in 14 days — with zero fees, zero interest. The platform serves thousands of users across the MENA region with a focus on providing accessible, innovative technology solutions tailored to the Arab market.\n\nThe team is focused on expanding across the region while maintaining the highest standards of product quality and customer experience. With strong local market knowledge and a world-class engineering team, Tabby is poised to become a regional leader.", tags:['Fintech','BNPL','Payments'] },
  { id:2,  name:'Noon Academy',  tagline:'Social learning platform for Arab students',logo_emoji:'📚', industry:'Edtech',     country:'Saudi Arabia', status:'live', upvotes_count:287, website:'https://noonacademy.com',   description:"Noon Academy is a social learning app connecting millions of K-12 students with top tutors and peers across the Arab world for live interactive classes.\n\nThe team is focused on expanding across the region while maintaining the highest standards of content quality and student experience.", tags:['Edtech','Social','Learning'] },
  { id:3,  name:'Vezeeta',       tagline:'Book doctors and healthcare services',       logo_emoji:'🏥', industry:'Healthtech', country:'Egypt',        status:'live', upvotes_count:256, website:'https://vezeeta.com',       description:"Vezeeta is MENA's largest digital healthcare platform connecting patients with 30,000+ doctors and clinics for instant booking and telemedicine.\n\nWith operations across Egypt, Saudi Arabia, Jordan, and more, Vezeeta is building the digital health infrastructure for the entire region.", tags:['Health','Booking','Egypt'] },
  { id:4,  name:'Baraka',        tagline:'Invest in global stocks from the GCC',       logo_emoji:'📈', industry:'Fintech',    country:'UAE',          status:'live', upvotes_count:231, website:'https://getbaraka.com',     description:'Baraka is a zero-commission stock trading app built for GCC investors. Trade US stocks and ETFs with fractional shares starting from $1.', tags:['Investing','Stocks','Fintech'] },
  { id:5,  name:'Tamara',        tagline:'BNPL shopping for Saudi consumers',          logo_emoji:'🛒', industry:'Fintech',    country:'Saudi Arabia', status:'live', upvotes_count:198, website:'https://tamara.co',         description:"Tamara is Saudi Arabia's leading Buy Now Pay Later solution, enabling shoppers to split purchases into 3 installments at 0% interest.", tags:['BNPL','Saudi','Shopping'] },
  { id:6,  name:'Kader AI',      tagline:'AI-powered job matching for MENA',           logo_emoji:'🤖', industry:'AI & ML',   country:'Jordan',       status:'soon', upvotes_count:0,   website:'',                          description:'Kader AI uses machine learning to match MENA job seekers with relevant opportunities in real time, supporting Arabic and English CVs.', tags:['AI','Jobs','Recruitment'] },
  { id:7,  name:'Trella',        tagline:'Digital freight marketplace in MENA',        logo_emoji:'🚛', industry:'Logistics',  country:'Egypt',        status:'live', upvotes_count:154, website:'https://trella.app',        description:'Trella is a digital freight marketplace connecting shippers and carriers across MENA, reducing empty miles and improving logistics efficiency.', tags:['Freight','Logistics','Marketplace'] },
  { id:8,  name:'Foodics',       tagline:'Restaurant management system for F&B',       logo_emoji:'🍽️', industry:'Foodtech',  country:'Saudi Arabia', status:'live', upvotes_count:143, website:'https://foodics.com',       description:'Foodics is a cloud-based restaurant management and POS system serving 20,000+ restaurants across MENA with ordering, inventory, and analytics.', tags:['F&B','POS','Restaurant'] },
  { id:9,  name:'Waffarha',      tagline:'Discount coupons and deals platform',        logo_emoji:'🎟️', industry:'E-Commerce', country:'Egypt',        status:'live', upvotes_count:128, website:'https://waffarha.com',      description:"Waffarha is Egypt and MENA's leading coupon and cashback platform, helping shoppers save money at hundreds of top brands.", tags:['Deals','Coupons','Egypt'] },
  { id:10, name:'Cura',          tagline:'Arabic mental health therapy online',        logo_emoji:'🧠', industry:'Healthtech', country:'Saudi Arabia', status:'soon', upvotes_count:0,   website:'',                          description:'Cura connects Arabic speakers to licensed therapists for online mental health sessions — fully private, in Arabic, and accessible from anywhere.', tags:['Mental Health','Arabic','Therapy'] },
];

export default function ProductDetailPage({ onSignIn, onSignUp }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, votes, toggleVote, addNotification, setWaitlistModal, openDM } = useUI();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    setLoading(true);
    productsAPI.get(id).then(({ data }) => {
      setProduct(data.data); setLoading(false);
    }).catch(() => {
      const numId = parseInt(id);
      setProduct(MOCK_PRODUCTS.find(p => p.id === numId || String(p.id) === id) || null);
      setLoading(false);
    });
  }, [id]);

  const p = product || MOCK_PRODUCTS.find(p => p.id === parseInt(id) || String(p.id) === id) || null;

  if (loading) return (
    <><Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ display:'flex', justifyContent:'center', padding:'120px 20px' }}><Spinner size="lg"/></div></>
  );
  if (!p) return (
    <><Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ maxWidth:600, margin:'120px auto 80px', textAlign:'center', padding:'0 20px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>😕</div>
        <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Product not found</div>
        <button onClick={() => navigate('/')} style={{ padding:'12px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>← Back to Home</button>
      </div></>
  );

  const isVoted      = votes.has(p.id);
  const isBookmarked = bookmarks.has(p.id);
  const voteCount    = p.upvotes_count || p.upvotes || 0;
  const isSoon       = p.status === 'soon';
  const tags         = [...new Set([...(p.tags || []), p.industry].filter(Boolean))];
  const reasons      = REASONS_MAP[p.industry] || ['🚀 Purpose-built for the MENA market','⚡ Fast, reliable, and easy to use','🌍 Supports Arabic & English','🔒 Enterprise-grade security','💬 Responsive local support team'];

  const handleVote = () => {
    if (!user) { onSignIn?.(); return; }
    toggleVote(p.id);
    if (!isVoted) { addNotification('vote', `You upvoted ${p.name}`, '▲', null); toast.success(`Upvoted ${p.name}! 🎉`); }
    else toast('Vote removed');
    try { productsAPI.upvote(p.id); } catch {}
  };

  const handleBookmark = () => {
    if (!user) { onSignIn?.(); return; }
    toggleBookmark(p.id);
    toast(isBookmarked ? 'Bookmark removed' : `${p.name} saved!`);
    try { productsAPI.bookmark(p.id); } catch {}
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 1800);
    toast.success('Link copied!');
  };

  const bookmarkCount = Math.floor(voteCount * 0.28 + 5);

  return (
    <>
      <Navbar onSignIn={onSignIn} onSignUp={onSignUp}/>
      <div style={{ paddingTop:'var(--nav-h)', background:'#fff', minHeight:'100vh' }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:'40px 32px 80px' }}>

          {/* Back */}
          <button onClick={() => navigate(-1)}
            style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:14, fontWeight:700, color:'#666', cursor:'pointer', marginBottom:32, border:'none', background:'transparent', transition:'color .15s' }}
            onMouseOver={e=>e.currentTarget.style.color='var(--orange)'} onMouseOut={e=>e.currentTarget.style.color='#666'}>
            ← Back
          </button>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, marginBottom:16 }}>
            <div style={{ width:72, height:72, borderRadius:20, background:'#f5f5f5', border:'1px solid #e8e8e8', display:'grid', placeItems:'center', fontSize:34, flexShrink:0 }}>
              {p.logo_emoji || p.logo || '🚀'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-.03em', margin:'0 0 4px' }}>{p.name}</h1>
              <p style={{ fontSize:15, color:'#555', margin:0, lineHeight:1.5 }}>{p.tagline}</p>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
            {tags.map(t => <span key={t} style={{ fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:5, background:'#f4f4f4', color:'#555' }}>{t}</span>)}
            {p.country && <span key="country" style={{ fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:5, background:'#f4f4f4', color:'#555' }}>{p.country}</span>}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:36, paddingBottom:36, borderBottom:'1px solid #f0f0f0' }}>
            {p.website && !isSoon && (
              <a href={p.website} target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', transition:'opacity .15s' }}
                onMouseOver={e=>e.currentTarget.style.opacity='.88'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                Visit Website 🔗
              </a>
            )}
            {isSoon ? (
              <button onClick={() => setWaitlistModal(p)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, background:'#4f46e5', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                ⏳ Join Waitlist
              </button>
            ) : (
              <button onClick={handleVote}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:`1.5px solid ${isVoted?'var(--orange)':'#e8e8e8'}`, background:isVoted?'var(--orange-light)':'#fff', color:isVoted?'var(--orange)':'#0a0a0a', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                🎉 {isVoted ? voteCount+1 : voteCount} Upvotes
              </button>
            )}
            <button onClick={handleBookmark}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:`1.5px solid ${isBookmarked?'var(--orange)':'#e8e8e8'}`, background:isBookmarked?'var(--orange-light)':'#fff', color:isBookmarked?'var(--orange)':'#666', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
              🔖 {bookmarkCount} {isBookmarked ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleShare}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#fff', color:'#666', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {copied ? '✓ Copied!' : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share</>}
            </button>
          </div>

          {/* Screenshots carousel */}
          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:20, marginBottom:36, scrollbarWidth:'none' }}>
            <div style={{ minWidth:280, height:160, borderRadius:14, background:`linear-gradient(135deg,${(id||'').charCodeAt(0)%3===0?'#1a1a2e,#16213e':(id||'').charCodeAt(0)%3===1?'#0f3460,#533483':'#2d0036,#1a0a2e'})`, border:'1px solid #e8e8e8', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ fontSize:40 }}>{p.logo_emoji||'🚀'}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.6)', letterSpacing:'.06em' }}>DASHBOARD</div>
            </div>
            <div style={{ minWidth:280, height:160, borderRadius:14, background:'#f8f8f8', border:'1px solid #e8e8e8', flexShrink:0, padding:20, display:'flex', flexDirection:'column', gap:8, justifyContent:'center' }}>
              <div style={{ width:'100%', height:10, background:'#e8e8e8', borderRadius:5 }}/>
              <div style={{ width:'75%',  height:10, background:'#e8e8e8', borderRadius:5 }}/>
              <div style={{ width:'90%',  height:50, background:'linear-gradient(135deg,var(--orange-light),#fff)', borderRadius:10, border:'1px solid #f0d0c0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{p.logo_emoji||'🚀'}</div>
              <div style={{ width:'60%',  height:10, background:'#e8e8e8', borderRadius:5 }}/>
            </div>
            <div style={{ minWidth:280, height:160, borderRadius:14, background:'linear-gradient(180deg,#0a0a0a,#1a1a1a)', border:'1px solid #e8e8e8', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'var(--orange)', display:'grid', placeItems:'center', fontSize:24 }}>{p.logo_emoji||'🚀'}</div>
              <div style={{ fontSize:12, fontWeight:800, color:'#fff' }}>{p.name}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.4)' }}>{p.industry} · MENA</div>
            </div>
          </div>

          {/* About */}
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:14 }}>About</div>
            <div style={{ fontSize:15, color:'#333', lineHeight:1.8 }}>
              {(p.description || p.tagline).split('\n\n').map((para, i) => <p key={i} style={{ margin:'0 0 16px' }}>{para}</p>)}
            </div>
          </div>

          {/* Top 5 Reasons */}
          <div style={{ marginBottom:36 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:14 }}>🎯 Top 5 Reasons to Use {p.name}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {reasons.map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, background:'#f8f8f8', borderRadius:14, padding:'14px 18px' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--orange)', color:'#fff', fontSize:12, fontWeight:900, display:'grid', placeItems:'center', flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1a1a1a', lineHeight:1.5 }}>{r}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact button */}
          {user && (
            <div style={{ marginBottom:36 }}>
              <button onClick={() => openDM('@product_owner', `${p.name} Owner`, p.logo_emoji||'🚀')}
                style={{ width:'100%', padding:14, borderRadius:14, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity .15s' }}
                onMouseOver={e=>e.currentTarget.style.opacity='.88'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Share your thoughts with the product owner
              </button>
            </div>
          )}

        </div>
      </div>

      <WaitlistModal product={null} onClose={() => setWaitlistModal(null)}/>
      <Footer/>
    </>
  );
}
