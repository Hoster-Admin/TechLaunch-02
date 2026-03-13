import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';

const ARTICLES = [
  {
    slug:'how-to-get-best-out-of-tech-launch',
    tag:'Guide',
    title:'How to Get the Best Out of Tech Launch as a Founder',
    author:'Rania Al-Masri',
    authorHandle:'rania_almasri',
    authorBio:'Co-Founder & CEO at Launchpad MENA. Previously at Wamda.',
    initials:'RA',
    readTime:'4 min read',
    date:'March 6, 2026',
    excerpt:'Whether you just submitted your product or you\'ve been on the platform for a while, here\'s how to maximize your visibility and community engagement on Tech Launch MENA.',
    content:[
      { type:'p', text:'Tech Launch MENA is MENA\'s fastest-growing product discovery platform. With over 248 products listed and 1,840 founders, the community is growing rapidly. But many founders don\'t use the platform to its full potential.' },
      { type:'h2', text:'1. Complete Your Product Profile' },
      { type:'p', text:'Before anything else, make sure your product listing is 100% complete. Add a clear tagline, upload screenshots, fill out the "About" section, and add all relevant tags. Products with complete profiles get 3x more visits than incomplete ones.' },
      { type:'h2', text:'2. Engage with Upvotes Actively' },
      { type:'p', text:'On launch day, rally your community to upvote your product. Share it on your social channels, WhatsApp groups, and with your email list. The first 48 hours are critical for momentum.' },
      { type:'h2', text:'3. Respond to Comments and Messages' },
      { type:'p', text:'When someone leaves a comment or sends you a message, respond quickly. Founders who engage with their audience build stronger reputations and get more organic traffic over time.' },
      { type:'h2', text:'4. List Your Company and Team' },
      { type:'p', text:'If you\'re a startup, also list your company in the Companies section. This gives you a separate profile page that investors and accelerators browse. Add your team members so they appear on the platform too.' },
      { type:'h2', text:'5. Use the Weekly Digest' },
      { type:'p', text:'Subscribe to the Tech Launch Weekly Digest to stay on top of what\'s trending in MENA tech. It\'s also a great way to benchmark your product against others in your category.' },
    ]
  },
  {
    slug:'vibe-coding-beginner',
    tag:'For Students',
    title:'Where to Start Learning Vibe Coding as a Complete Beginner',
    author:'Khalid Nasser',
    authorHandle:'khalid_nasser',
    authorBio:'Software Engineer at Foodics. Teacher and mentor at AUC Venture Lab.',
    initials:'KN',
    readTime:'6 min read',
    date:'March 4, 2026',
    excerpt:'Vibe coding is taking the developer world by storm. Here\'s everything a complete beginner needs to know to get started — from the right mindset to the best tools.',
    content:[
      { type:'p', text:'Vibe coding is the practice of building software by describing what you want in plain language, using AI tools that convert your words into working code. It\'s changing how people enter tech.' },
      { type:'h2', text:'What Is Vibe Coding?' },
      { type:'p', text:'The term was coined by Andrej Karpathy in 2024. It describes a style of programming where developers "vibe" with AI assistants — describing intent rather than writing every line manually. Tools like Cursor, Replit, and GitHub Copilot have made this possible.' },
      { type:'h2', text:'The Best Tools to Start With' },
      { type:'p', text:'Start with Replit — it\'s browser-based, requires no setup, and has excellent AI integration. Once you\'re comfortable, try Cursor for a more professional desktop environment. Both tools are beginner-friendly and extremely powerful.' },
      { type:'h2', text:'Your First Project' },
      { type:'p', text:'The best first project is something small but meaningful to you. A personal budget tracker, a simple quiz app, or a product landing page for an idea you have. The goal is to ship something real, not perfect.' },
      { type:'h2', text:'Learning Resources' },
      { type:'p', text:'Watch the Fireship "100 Seconds" series on YouTube for quick concept overviews. The Odin Project is free and comprehensive. For Arabic-language content, check Elzero Web School on YouTube — it\'s the best Arabic programming channel in MENA.' },
    ]
  },
  {
    slug:'mena-founders-launch-publicly',
    tag:'Business',
    title:"Why MENA Founders Should Launch Publicly Before They're Ready",
    author:'Sara Hadid',
    authorHandle:'sara_hadid',
    authorBio:'Founder @ Maktaba. Angel investor. Previously at Flat6Labs Cairo.',
    initials:'SH',
    readTime:'5 min read',
    date:'March 2, 2026',
    excerpt:'Too many MENA founders wait until everything is "perfect" before sharing their work. This is a mistake that costs months of valuable feedback and momentum.',
    content:[
      { type:'p', text:"There's a pattern I see constantly in the MENA startup ecosystem: founders who have a working product, a clear problem they're solving, and a passionate early team — but who are waiting to launch publicly." },
      { type:'h2', text:"The Perfectionism Trap" },
      { type:'p', text:"In many Arab cultures, there's a strong value placed on doing things properly and fully. This is a strength in many areas of life, but it can be a startup killer. The market doesn't care about perfection — it cares about solutions." },
      { type:'h2', text:'What "Launch" Really Means' },
      { type:'p', text:"Launching publicly doesn't mean you've shipped a finished product. It means you've made your idea visible to the world and are inviting feedback. A landing page, a product listing on Tech Launch MENA, a tweet — these are all forms of launching." },
      { type:'h2', text:'The Real Cost of Waiting' },
      { type:'p', text:"Every month you wait, a competitor might be shipping. Your potential early adopters are finding alternative solutions. Investors are backing other founders. The opportunity window for your specific problem might be closing." },
      { type:'h2', text:'How to Launch Imperfectly and Win' },
      { type:'p', text:"Submit your product to Tech Launch MENA even if it's in beta. Share it in founder WhatsApp groups. Post about it on LinkedIn. Get 10 real users before you add a single new feature. Their feedback will be worth more than months of solo building." },
    ]
  },
  {
    slug:'investor-signals-mena-pitch-deck',
    tag:'Business',
    title:'The Investor Signals That Actually Matter in a MENA Pitch Deck',
    author:'Omar Fares',
    authorHandle:'omar_fares',
    authorBio:'Principal at STV. Previously at McKinsey Riyadh. Author of "Raising in MENA".',
    initials:'OF',
    readTime:'7 min read',
    date:'February 28, 2026',
    excerpt:'After reviewing hundreds of MENA startup pitch decks, these are the signals that separate fundable founders from the rest — and most of them aren\'t what you think.',
    content:[
      { type:'p', text:"I've reviewed over 400 pitch decks in the past two years as a VC in MENA. The quality of decks has improved dramatically, but the signals that actually move me from interested to committed haven't changed." },
      { type:'h2', text:'Signal 1: Market Size with Regional Specificity' },
      { type:'p', text:"Don't tell me the global market is $100B. Tell me the SAM in Saudi Arabia is $2.3B and show me why you can capture 5% of it in 3 years with your current GTM. Investors want to see that you understand your specific geography." },
      { type:'h2', text:'Signal 2: Customer Evidence, Not Just Testimonials' },
      { type:'p', text:"Testimonials are easy to get. What impresses investors is customer evidence — usage data, cohort retention, NPS scores, customer interviews, churn rates. Even with 50 users, show me the quality of their engagement." },
      { type:'h2', text:'Signal 3: Unit Economics You Can Defend' },
      { type:'p', text:"Many MENA founders overestimate revenue projections and underestimate CAC. Show me a simple unit economics model you actually believe in. I'd rather see conservative but defensible numbers than aggressive numbers you can't explain." },
      { type:'h2', text:"Signal 4: Team Slides That Show 'Why You'" },
      { type:'p', text:"Your team slide should answer one question: why is this specific team uniquely positioned to solve this specific problem? Domain expertise, founder-market fit, prior exits, deep customer knowledge — these matter far more than brand name universities." },
    ]
  },
];

/* ─── Article Listing Page ─── */
function ArticlesList() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', background:'#fff', minHeight:'100vh' }}>
        {/* Header */}
        <div style={{ borderBottom:'1px solid #f0f0f0', padding:'48px 40px 36px' }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--orange)', marginBottom:10 }}>✍️ Community</div>
            <h1 style={{ fontSize:36, fontWeight:900, letterSpacing:'-.03em', marginBottom:12 }}>From the Community</h1>
            <p style={{ fontSize:15, color:'#666', lineHeight:1.7, margin:0 }}>Insights, guides, and perspectives from founders, investors, and builders across the MENA region.</p>
          </div>
        </div>

        {/* Articles grid */}
        <div style={{ maxWidth:800, margin:'0 auto', padding:'40px 40px 80px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {ARTICLES.map((a, i) => (
              <div key={a.slug} onClick={() => navigate(`/articles/${a.slug}`)}
                style={{ padding:'32px 0', borderBottom:i < ARTICLES.length-1 ? '1px solid #f0f0f0' : 'none', cursor:'pointer' }}
                onMouseOver={e=>e.currentTarget.querySelector('.article-list-title').style.color='var(--orange)'}
                onMouseOut={e=>e.currentTarget.querySelector('.article-list-title').style.color='#0a0a0a'}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--orange)', marginBottom:8 }}>{a.tag}</div>
                <h2 className="article-list-title" style={{ fontSize:21, fontWeight:800, letterSpacing:'-.02em', lineHeight:1.35, marginBottom:10, color:'#0a0a0a', transition:'color .15s' }}>{a.title}</h2>
                <p style={{ fontSize:14, color:'#666', lineHeight:1.7, marginBottom:14 }}>{a.excerpt}</p>
                <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#aaa' }}>
                  <div style={{ width:28, height:28, borderRadius:7, background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:10, fontWeight:900, flexShrink:0 }}>{a.initials}</div>
                  <span onClick={e => { e.stopPropagation(); navigate(`/u/${a.authorHandle}`); }}
                    style={{ fontWeight:600, color:'#555', cursor:'pointer', transition:'color .15s' }}
                    onMouseOver={e=>e.currentTarget.style.color='var(--orange)'} onMouseOut={e=>e.currentTarget.style.color='#555'}>{a.author}</span>
                  <span>·</span>
                  <span>{a.readTime}</span>
                  <span>·</span>
                  <span>{a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}

/* ─── Article Detail Page ─── */
function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article  = ARTICLES.find(a => a.slug === slug);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!article) return (
    <>
      <Navbar/>
      <div style={{ maxWidth:600, margin:'120px auto 80px', textAlign:'center', padding:'0 20px', paddingTop:'calc(var(--nav-h) + 60px)' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📄</div>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Article not found</div>
        <button onClick={() => navigate('/articles')} style={{ padding:'11px 22px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>← Back to Articles</button>
      </div>
      <Footer/>
    </>
  );

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', background:'#fff', minHeight:'100vh' }}>
        <div style={{ maxWidth:720, margin:'0 auto', padding:'48px 32px 80px' }}>

          {/* Back */}
          <button onClick={() => navigate('/articles')}
            style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:14, fontWeight:700, color:'#666', border:'none', background:'transparent', cursor:'pointer', marginBottom:36, transition:'color .15s' }}
            onMouseOver={e=>e.currentTarget.style.color='var(--orange)'} onMouseOut={e=>e.currentTarget.style.color='#666'}>
            ← Back to Articles
          </button>

          {/* Tag */}
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--orange)', marginBottom:14 }}>{article.tag}</div>

          {/* Title */}
          <h1 style={{ fontSize:32, fontWeight:900, letterSpacing:'-.03em', lineHeight:1.25, marginBottom:18 }}>{article.title}</h1>

          {/* Author row */}
          <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:28, borderBottom:'1px solid #f0f0f0', marginBottom:36 }}>
            <div style={{ width:44, height:44, borderRadius:11, background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:14, fontWeight:900, cursor:'pointer', flexShrink:0 }}
              onClick={() => navigate(`/u/${article.authorHandle}`)}>{article.initials}</div>
            <div>
              <div onClick={() => navigate(`/u/${article.authorHandle}`)}
                style={{ fontSize:14, fontWeight:700, color:'#0a0a0a', cursor:'pointer', transition:'color .15s', display:'inline-block' }}
                onMouseOver={e=>e.currentTarget.style.color='var(--orange)'} onMouseOut={e=>e.currentTarget.style.color='#0a0a0a'}>{article.author}</div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{article.authorBio}</div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:12, color:'#aaa', textAlign:'right' }}>
              <div>{article.date}</div>
              <div>{article.readTime}</div>
            </div>
          </div>

          {/* Content */}
          <div style={{ fontSize:15, lineHeight:1.85, color:'#333' }}>
            {article.content.map((block, i) => {
              if (block.type === 'h2') return (
                <h2 key={i} style={{ fontSize:20, fontWeight:800, letterSpacing:'-.02em', marginTop:36, marginBottom:12, color:'#0a0a0a' }}>{block.text}</h2>
              );
              return <p key={i} style={{ marginBottom:18, color:'#444' }}>{block.text}</p>;
            })}
          </div>

          {/* Bottom CTA */}
          <div style={{ marginTop:48, padding:'28px 32px', background:'#0a0a0a', borderRadius:20, textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff', marginBottom:8 }}>Want to write for the community?</div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:18 }}>Share your insights with thousands of MENA founders, investors, and builders.</p>
            <button onClick={() => navigate('/write-for-us')} style={{ padding:'11px 22px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Submit Your Article →
            </button>
          </div>

        </div>
      </div>
      <Footer/>
    </>
  );
}

/* ─── Exports ─── */
export { ArticlesList, ArticleDetail, ARTICLES };
