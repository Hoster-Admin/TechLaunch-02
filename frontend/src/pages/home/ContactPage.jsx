import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { suggestionsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const inputStyle = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  border:'1.5px solid #e8e8e8', fontSize:14,
  fontFamily:"'DM Sans',sans-serif", outline:'none',
  background:'#fff', color:'#0a0a0a', boxSizing:'border-box',
};

function SuggestionBox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, padding:'56px 32px', textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:20 }}>💡</div>
        <h2 style={{ fontSize:20, fontWeight:800, marginBottom:10, letterSpacing:'-.02em' }}>Sign in to send a suggestion</h2>
        <p style={{ color:'#888', fontSize:14, lineHeight:1.7, marginBottom:28, maxWidth:340, margin:'0 auto 28px' }}>
          We read every suggestion. Sign in to share your idea or recommendation with our team.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button onClick={() => navigate('/login', { state: { from: '/write-for-us' } })}
            style={{ padding:'11px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Sign in
          </button>
          <button onClick={() => navigate('/register')}
            style={{ padding:'11px 28px', borderRadius:12, background:'#f4f4f4', color:'#333', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Create account
          </button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, padding:'56px 32px', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:20 }}>🙏</div>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Thank you for helping us develop more</h2>
        <p style={{ color:'#888', lineHeight:1.7, marginBottom:28 }}>
          We read every suggestion. Your feedback helps us make the platform better for the whole community.
        </p>
        <button onClick={() => { setSent(false); setText(''); }}
          style={{ padding:'10px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          Send another
        </button>
      </div>
    );
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim()) { toast.error('Please write your suggestion'); return; }
    if (text.trim().length < 10) { toast.error('Please write at least a few words'); return; }
    setLoading(true);
    try {
      await suggestionsAPI.submit(text.trim());
      setSent(true);
    } catch {
      toast.error('Failed to send — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, padding:'36px 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background: user.avatar_color || 'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
          {user.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0a0a0a' }}>{user.name}</div>
          <div style={{ fontSize:12, color:'#aaa' }}>@{user.handle}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom:20, marginTop:20 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:8 }}>Your suggestion or recommendation</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={7}
            placeholder="Share an idea, feature request, or recommendation with our team…"
            style={{ ...inputStyle, resize:'vertical', lineHeight:1.7 }}
            onFocus={e => e.target.style.borderColor='var(--orange)'}
            onBlur={e => e.target.style.borderColor='#e8e8e8'}
          />
          <div style={{ textAlign:'right', fontSize:11, color:'#bbb', marginTop:4 }}>{text.length} characters</div>
        </div>

        <button type="submit" disabled={loading}
          style={{ width:'100%', padding:'13px 0', borderRadius:12, background:'var(--orange)', border:'none', color:'#fff', fontSize:15, fontWeight:800, cursor:loading?'not-allowed':'pointer', opacity:loading?0.75:1, transition:'opacity .15s', fontFamily:"'DM Sans',sans-serif" }}>
          {loading ? 'Sending…' : 'Send Suggestion'}
        </button>
      </form>
    </div>
  );
}

export function WriteForUsPage() {
  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#fafafa' }}>

        <div className="page-header-section">
          <div className="page-header-inner">
            <h2>💡 Help improve the platform</h2>
            <p>Have an idea, feature request, or feedback? We read every suggestion and use them to make Tech Launch better for everyone.</p>
          </div>
        </div>

        <div style={{ maxWidth:600, margin:'0 auto', padding:'48px 24px 80px' }}>
          <SuggestionBox/>
        </div>

      </div>
      <Footer/>
    </>
  );
}

export default function ContactPage() {
  return (
    <>
      <Navbar/>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#fafafa' }}>

        <div className="page-header-section">
          <div className="page-header-inner">
            <h2>📬 Contact Us</h2>
            <p>Have a question, partnership idea, or feedback? We'd love to hear from you.</p>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'48px 32px 80px', display:'grid', gridTemplateColumns:'1fr 360px', gap:48, alignItems:'start' }} className="contact-grid">

          <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:20, padding:'36px 32px' }}>
            <ContactForm/>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
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
              <div style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:8 }}>💡 Have a suggestion?</div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.7, margin:'0 0 12px' }}>
                Feature ideas, feedback, or recommendations — share them with us.
              </p>
              <Link to="/write-for-us" style={{ display:'inline-block', padding:'8px 16px', borderRadius:9, background:'var(--orange)', color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                Send a suggestion →
              </Link>
            </div>
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

function ContactForm() {
  const [form, setForm] = useState({ name:'', email:'', subject:'', message:'' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error('Please fill in all required fields'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  if (sent) return (
    <div style={{ textAlign:'center', padding:'40px 0' }}>
      <div style={{ fontSize:56, marginBottom:20 }}>🎉</div>
      <h2 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Message sent!</h2>
      <p style={{ color:'#888', lineHeight:1.7, marginBottom:24 }}>We've received your message and will get back to you within 1–2 business days.</p>
      <button onClick={() => setSent(false)} style={{ padding:'10px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
        Send another
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ fontSize:18, fontWeight:800, marginBottom:24, letterSpacing:'-.02em' }}>Send us a message</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>Full Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="Sara Al-Mahmoud" style={inputStyle}
            onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>Email *</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" style={inputStyle}
            onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>Subject</label>
        <input value={form.subject} onChange={set('subject')} placeholder="How can we help?" style={inputStyle}
          onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
      </div>
      <div style={{ marginBottom:24 }}>
        <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>Message *</label>
        <textarea value={form.message} onChange={set('message')} rows={6} placeholder="Tell us what's on your mind…"
          style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
          onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
      </div>
      <button type="submit" disabled={loading}
        style={{ width:'100%', padding:'13px 0', borderRadius:12, background:'var(--orange)', border:'none', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', opacity:loading?0.75:1, transition:'opacity .15s', fontFamily:"'DM Sans',sans-serif" }}>
        {loading ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
