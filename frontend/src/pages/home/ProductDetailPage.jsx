import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI } from '../../utils/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import WaitlistModal from '../../components/home/WaitlistModal';

function DiscountSignupBox({ product }) {
  const { user } = useAuth();
  const [name,    setName]    = useState(user?.name  || '');
  const [email,   setEmail]   = useState(user?.email || '');
  const [done,    setDone]    = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim())        { toast.error('Please enter your name'); return; }
    if (!email.includes('@')){ toast.error('Enter a valid email');    return; }
    setLoading(true);
    try {
      await productsAPI.discountSignup(product.id, email.trim(), name.trim());
      setDone(true);
      toast.success('You\'re in! Discount details will be sent to your email.');
    } catch {
      toast.error('Could not submit — please try again');
    } finally { setLoading(false); }
  };

  const inp = { display:'block', width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0c8b0', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box', background:'#fffaf7' };

  if (done) return (
    <div style={{ marginBottom:36, background:'linear-gradient(135deg,#fff7ed,#fff3e0)', borderRadius:16, padding:'24px 24px', border:'1.5px solid #f59e0b', textAlign:'center' }}>
      <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
      <div style={{ fontSize:16, fontWeight:800, color:'#92400e', marginBottom:4 }}>You're locked in!</div>
      <div style={{ fontSize:13, color:'#78350f', lineHeight:1.6 }}>
        We'll email your exclusive discount to <strong>{email}</strong>. Keep an eye on your inbox!
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom:36, background:'linear-gradient(135deg,#fff7ed,#fffbf5)', borderRadius:16, padding:'24px 24px', border:'1.5px solid #fed7aa' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <span style={{ fontSize:20 }}>🏷️</span>
        <div style={{ fontSize:13, fontWeight:900, textTransform:'uppercase', letterSpacing:'.07em', color:'#c2410c' }}>Launch Discount — 40% off</div>
      </div>
      <div style={{ fontSize:13, color:'#78350f', marginBottom:18, lineHeight:1.6 }}>
        Get <strong>40% off for the first 3 months</strong> — exclusive to the first 200 Tech Launch community members. Sign up below and we'll send the discount directly to your email.
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
          style={inp}
          onFocus={e => e.target.style.borderColor='#f97316'} onBlur={e => e.target.style.borderColor='#e0c8b0'}/>
        <div style={{ display:'flex', gap:10 }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ ...inp, flex:1 }}
            onFocus={e => e.target.style.borderColor='#f97316'} onBlur={e => e.target.style.borderColor='#e0c8b0'}/>
          <button onClick={submit} disabled={loading}
            style={{ padding:'11px 22px', borderRadius:10, background:'#ea580c', color:'#fff', border:'none', fontSize:13, fontWeight:800, cursor:loading?'default':'pointer', opacity:loading?0.7:1, whiteSpace:'nowrap', flexShrink:0 }}>
            {loading ? 'Sending…' : 'Claim Discount'}
          </button>
        </div>
      </div>
      <div style={{ fontSize:11, color:'#b45309', marginTop:10 }}>Limited spots · No spam · Unsubscribe anytime</div>
    </div>
  );
}

const REASONS_MAP = {
  'Fintech':    ['💸 Zero-fee transactions for MENA users','🔐 Bank-grade security & compliance','⚡ Instant settlements in local currency','🌍 Works across 10+ MENA countries','📱 Best-in-class mobile experience'],
  'Edtech':     ['📚 Arabic-first content library','🎓 Structured learning paths for all ages','👥 Peer-to-peer study groups','📊 Live progress tracking for parents','🏆 Gamified achievements & rewards'],
  'Healthtech': ['🩺 Verified doctors in under 2 minutes','💊 Digital prescriptions & follow-ups','🌐 Available in 5+ MENA countries','🔒 Full patient data privacy','⭐ 4.8/5 average doctor rating'],
  'AI & ML':    ['🤖 Built natively in Arabic & English','⚡ Real-time AI processing at scale','🔗 Easy API integration in days','📈 Proven ROI for enterprise clients','🛡️ Responsible AI with bias audits'],
  'Logistics':  ['🚛 Real-time shipment tracking','🌍 Coverage across 15 MENA cities','💰 30% cheaper than traditional freight','📦 API-first for easy integrations','🤝 Vetted carrier network of 10K+'],
  'E-Commerce': ['🛒 Localised Arabic shopping experience','💳 BNPL & multiple payment options','🚚 Same-day delivery in major cities','🔄 Easy returns & refunds','⭐ Verified seller reviews'],
  'Foodtech':   ['🍽️ Used by 20K+ MENA restaurants','📊 Real-time sales & inventory analytics','💳 Integrated POS & online ordering','🧾 Multi-branch management made easy','🤝 Dedicated 24/7 local support'],
};


function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function CommentsSection({ productId, onSignIn, product }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [body, setBody]         = useState('');
  const [posting, setPosting]   = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (!productId) return;
    productsAPI.comments(productId)
      .then(({ data }) => { setComments(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  const handlePost = async () => {
    if (!user) { onSignIn?.(); return; }
    if (!body.trim()) return;
    setPosting(true);
    try {
      const { data } = await productsAPI.addComment(productId, body.trim());
      const newComment = data.data || {
        id: Date.now(), body: body.trim(),
        user: { name: user.name, handle: user.handle, avatar_url: null },
        created_at: new Date().toISOString(),
      };
      setComments(prev => [newComment, ...prev]);
      setBody('');
      toast.success('Comment posted!');
    } catch {
      toast.error('Could not post comment');
    } finally { setPosting(false); }
  };

  const initials = (name) => (name || '?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:18 }}>
        💬 Discussion ({loading ? '…' : comments.length})
      </div>

      {/* Comment box */}
      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'flex-start' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background: user ? 'var(--orange)' : '#e8e8e8', color: user ? '#fff' : '#aaa', display:'grid', placeItems:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>
          {user ? initials(user.name) : '?'}
        </div>
        <div style={{ flex:1 }}>
          <textarea
            ref={textRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }}
            placeholder={user ? `What do you think about ${product?.name || 'this product'}?` : 'Sign in to leave a comment…'}
            rows={3}
            style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:'1.5px solid #e8e8e8', fontSize:13, fontFamily:'Inter,sans-serif', resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.6, color:'#1a1a1a', background: user ? '#fff' : '#fafafa' }}
            onFocus={e => { if (user) e.target.style.borderColor='var(--orange)'; }}
            onBlur={e => e.target.style.borderColor='#e8e8e8'}
            readOnly={!user}
            onClick={() => { if (!user) onSignIn?.(); }}
          />
          {user && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
              <span style={{ fontSize:11, color:'#bbb' }}>⌘+Enter to post</span>
              <button onClick={handlePost} disabled={posting || !body.trim()}
                style={{ padding:'8px 18px', borderRadius:9, background: body.trim() ? 'var(--orange)' : '#f0f0f0', color: body.trim() ? '#fff' : '#bbb', border:'none', fontSize:13, fontWeight:700, cursor: body.trim() ? 'pointer' : 'default', transition:'all .15s', fontFamily:'Inter,sans-serif' }}>
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner/></div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', background:'#f9f9f9', borderRadius:16, border:'1px solid #f0f0f0' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>💬</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#bbb' }}>No comments yet</div>
          <div style={{ fontSize:12, color:'#ccc', marginTop:4 }}>Be the first to share your thoughts!</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {comments.map((c, i) => {
            const name   = c.author_name  || c.user?.name   || c.author?.name   || 'Unknown';
            const handle = c.author_handle || c.user?.handle || c.author?.handle || '';
            const avatarColor = c.avatar_color || 'var(--orange)';
            return (
              <div key={c.id || i} style={{ display:'flex', gap:12, alignItems:'flex-start', background:'#fafafa', borderRadius:14, padding:'14px 16px', border:'1px solid #f0f0f0' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:avatarColor, color:'#fff', display:'grid', placeItems:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>
                  {initials(name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:800 }}>{name}</span>
                    {handle && <span style={{ fontSize:11, color:'#aaa', fontWeight:600 }}>@{handle.replace('@','')}</span>}
                    <span style={{ fontSize:11, color:'#ccc' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#333', lineHeight:1.6, wordBreak:'break-word' }}>{c.body || c.content || c.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      setProduct(data.data || null); setLoading(false);
    }).catch(() => {
      setProduct(null);
      setLoading(false);
    });
  }, [id]);

  const p = product || null;

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

  const ownerHandle = p.submitter_handle || p.user?.handle || p.owner_handle || 'product_owner';
  const ownerName   = p.submitter_name  || p.user?.name  || p.owner_name  || `${p.name} Team`;
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

          {/* Makers */}
          {p.makers && p.makers.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', marginBottom:14 }}>
                {p.makers.length === 1 ? 'Maker' : 'Makers'}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {p.makers.map(m => (
                  <a key={m.id} href={`/u/${m.handle}`} style={{ textDecoration:'none', color:'inherit' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background:'#f9f9f9', borderRadius:14, border:'1px solid #f0f0f0', transition:'all .15s', cursor:'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background='var(--orange-light)'; e.currentTarget.style.borderColor='var(--orange)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#f9f9f9'; e.currentTarget.style.borderColor='#f0f0f0'; }}>
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={m.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
                        : <div style={{ width:44, height:44, borderRadius:'50%', background:m.avatar_color||'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:15, fontWeight:800, flexShrink:0, fontFamily:'DM Sans,sans-serif' }}>
                            {(m.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                      }
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:'#0a0a0a' }}>{m.name}</div>
                        <div style={{ fontSize:12, color:'#888' }}>@{m.handle} · <span style={{ color:'var(--orange)' }}>{m.role}</span></div>
                        {m.headline && <div style={{ fontSize:12, color:'#999', marginTop:2 }}>{m.headline}</div>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Message owner */}
          {user && (
            <div style={{ marginBottom:36 }}>
              <button onClick={() => openDM(ownerHandle.startsWith('@') ? ownerHandle : '@'+ownerHandle, ownerName, p.logo_emoji||'🚀')}
                style={{ width:'100%', padding:14, borderRadius:14, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity .15s' }}
                onMouseOver={e=>e.currentTarget.style.opacity='.88'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Message {ownerName}
              </button>
            </div>
          )}

          {/* Discount Signup — live products only */}
          {!isSoon && <DiscountSignupBox product={p}/>}

          {/* Comments */}
          <CommentsSection productId={p.id} onSignIn={onSignIn} product={p}/>

        </div>
      </div>

      <WaitlistModal product={null} onClose={() => setWaitlistModal(null)}/>
      <Footer/>
    </>
  );
}
