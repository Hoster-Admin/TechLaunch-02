import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import toast from 'react-hot-toast';

const inputStyle = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  border:'1.5px solid #e8e8e8', fontSize:14,
  fontFamily:"'DM Sans',sans-serif", outline:'none',
  background:'#fff', color:'#0a0a0a', boxSizing:'border-box',
};

export default function ContactPage({ writeForUs }) {
  const [form, setForm] = useState({ name:'', email:'', subject: writeForUs ? 'Write for Us' : '', message:'' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields'); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  const isWFU = writeForUs;

  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#fafafa' }}>

        <div className="page-header-section">
          <div className="page-header-inner">
            <h2>{isWFU ? '✍️ Write for Us' : '📬 Contact Us'}</h2>
            <p>{isWFU
              ? 'Share your expertise with the MENA tech community. We welcome articles on startups, product, investing, and innovation.'
              : 'Have a question, partnership idea, or feedback? We\'d love to hear from you.'
            }</p>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'48px 32px 80px', display:'grid', gridTemplateColumns:'1fr 360px', gap:48, alignItems:'start' }} className="contact-grid">

          {/* Form */}
          <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, padding:'36px 32px' }}>
            {sent ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:56, marginBottom:20 }}>🎉</div>
                <h2 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>
                  {isWFU ? 'Pitch received!' : 'Message sent!'}
                </h2>
                <p style={{ color:'#888', lineHeight:1.7, marginBottom:24 }}>
                  {isWFU
                    ? "Thanks for reaching out! Our editorial team reviews all pitches and will get back to you within 3–5 business days if it's a good fit."
                    : "We've received your message and will get back to you within 1–2 business days."
                  }
                </p>
                <button onClick={() => setSent(false)} style={{ padding:'10px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize:18, fontWeight:800, marginBottom:24, letterSpacing:'-.02em' }}>
                  {isWFU ? 'Submit your article pitch' : 'Send us a message'}
                </h3>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>Full Name *</label>
                    <input value={form.name} onChange={set('name')} placeholder="Sara Al-Mahmoud"
                      style={inputStyle}
                      onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>Email *</label>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
                      style={inputStyle}
                      onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>
                    {isWFU ? 'Article Title / Topic *' : 'Subject'}
                  </label>
                  <input value={form.subject} onChange={set('subject')}
                    placeholder={isWFU ? 'e.g. Why MENA Founders Should Launch Early' : 'How can we help?'}
                    style={inputStyle}
                    onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                </div>

                {isWFU && (
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>Your Background</label>
                    <input value={form.background || ''} onChange={e => setForm(p=>({...p,background:e.target.value}))}
                      placeholder="Founder, investor, PM, writer…"
                      style={inputStyle}
                      onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                  </div>
                )}

                <div style={{ marginBottom:24 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>
                    {isWFU ? 'Article Summary *' : 'Message *'}
                  </label>
                  <textarea value={form.message} onChange={set('message')} rows={6}
                    placeholder={isWFU
                      ? 'Briefly describe your article — main argument, target audience, and key takeaways (200–400 words preferred).'
                      : 'Tell us what\'s on your mind…'
                    }
                    style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
                    onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width:'100%', padding:'13px 0', borderRadius:12, background:'var(--orange)', border:'none', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', opacity:loading?.75:1, transition:'opacity .15s', fontFamily:"'DM Sans',sans-serif" }}>
                  {loading ? 'Sending…' : isWFU ? 'Submit Pitch 🚀' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {isWFU ? (
              <>
                <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'24px 20px' }}>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:14, color:'#1a1a1a' }}>✍️ What we publish</div>
                  {[
                    ['🚀','Startup stories and case studies'],
                    ['💡','Product and design insights'],
                    ['💰','Fundraising and investor perspectives'],
                    ['🎓','Guides for MENA founders'],
                    ['🌍','Regional ecosystem analysis'],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                      <span style={{ fontSize:16 }}>{icon}</span>
                      <span style={{ fontSize:13, color:'#555', lineHeight:1.5 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'var(--orange-light)', border:'1px solid rgba(232,98,26,.15)', borderRadius:16, padding:'20px' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--orange)', marginBottom:8 }}>📋 Guidelines</div>
                  <ul style={{ fontSize:12, color:'#555', lineHeight:1.8, paddingLeft:16, margin:0 }}>
                    <li>800–2,000 words preferred</li>
                    <li>English only (no Arabic text)</li>
                    <li>Original, unpublished content</li>
                    <li>MENA-relevant angle required</li>
                    <li>Response within 3–5 business days</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'24px 20px' }}>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:14 }}>📬 Get in touch</div>
                  {[
                    ['💬','General enquiries','hello@tlmena.com'],
                    ['🤝','Partnerships','partnerships@tlmena.com'],
                    ['📰','Press & media','press@tlmena.com'],
                    ['🛠️','Technical issues','support@tlmena.com'],
                  ].map(([icon, label, email]) => (
                    <div key={label} style={{ display:'flex', gap:10, marginBottom:14, alignItems:'flex-start' }}>
                      <span style={{ fontSize:18 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#1a1a1a' }}>{label}</div>
                        <a href={`mailto:${email}`} style={{ fontSize:12, color:'var(--orange)', textDecoration:'none', fontWeight:600 }}>{email}</a>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'20px' }}>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:10 }}>🌍 Based in MENA</div>
                  <p style={{ fontSize:12, color:'#888', lineHeight:1.7, margin:0 }}>
                    Tech Launch is a remote-first team spread across the MENA region. We typically respond within 1–2 business days.
                  </p>
                </div>
                <div style={{ background:'#0a0a0a', borderRadius:16, padding:'20px' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:8 }}>✍️ Want to write for us?</div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.7, margin:'0 0 12px' }}>
                    Share your expertise with the MENA tech community.
                  </p>
                  <Link to="/write-for-us" style={{ display:'inline-block', padding:'8px 16px', borderRadius:9, background:'var(--orange)', color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                    Submit a Pitch →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer/>
      <style>{`
        @media(max-width:800px){ .contact-grid{ grid-template-columns:1fr !important; } }
      `}</style>
    </>
  );
}
