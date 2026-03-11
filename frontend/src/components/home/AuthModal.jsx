import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import toast from 'react-hot-toast';

const PERSONAS = [
  { key:'startup',     icon:'🚀', label:'Startup',         desc:'Submit & grow your product' },
  { key:'investor',    icon:'💰', label:'Investor',        desc:'Discover MENA deals' },
  { key:'accelerator', icon:'🏢', label:'Accelerator',     desc:'List your program' },
  { key:'pm',          icon:'🧠', label:'Product Manager', desc:'Discover & follow launches' },
  { key:'enthusiast',  icon:'⭐', label:'Enthusiast',      desc:'Browse, upvote & support MENA tech', fullWidth:true },
];

const PERSONA_LABELS = { startup:'Startup', investor:'Investor', accelerator:'Accelerator', pm:'Product Manager', enthusiast:'Enthusiast' };
const PERSONA_DB_MAP = { startup:'Founder', investor:'Investor', accelerator:'Accelerator', pm:'Product Manager', enthusiast:'Enthusiast' };

export default function AuthModal() {
  const { login, register } = useAuth();
  const { authModal, setAuthModal, setSubmitOpen } = useUI();
  const navigate = useNavigate();

  // step: 'persona' | 'signup' | 'login' | 'gate'
  const [step, setStep] = useState('persona');
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // signup form
  const [sName,  setSName]  = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPass,  setSPass]  = useState('');
  const [sPassShow, setSPassShow] = useState(false);

  // login form
  const [lEmail, setLEmail] = useState('');
  const [lPass,  setLPass]  = useState('');
  const [lPassShow, setLPassShow] = useState(false);

  useEffect(() => {
    if (authModal === 'login')   { setStep('login');   setError(''); }
    if (authModal === 'signup')  { setStep('persona'); setError(''); setSelectedPersona(null); }
    if (authModal === 'gate')    { setStep('gate');    setError(''); }
    if (authModal === null) {
      // reset form when closed
      setSName(''); setSEmail(''); setSPass('');
      setLEmail(''); setLPass('');
      setError('');
    }
  }, [authModal]);

  const close = () => setAuthModal(null);
  const handleOverlay = (e) => { if (e.target === e.currentTarget) close(); };

  if (!authModal) return null;

  // ── SIGNUP
  const doSignup = async () => {
    if (!sName.trim()) { setError('Full name is required'); return; }
    if (!sEmail.trim() || !sEmail.includes('@')) { setError('Valid email is required'); return; }
    if (sPass.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const handle = sName.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').slice(0,20) + Math.floor(Math.random()*100);
      const dbPersona = PERSONA_DB_MAP[selectedPersona] || 'Enthusiast';
      const user = await register({ name:sName.trim(), email:sEmail.trim(), password:sPass, handle, persona:dbPersona });
      toast.success(`Welcome to Tech Launch, ${user.name.split(' ')[0]}! 🚀`);
      close();
      if (selectedPersona === 'startup') setSubmitOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Try again.');
    } finally { setLoading(false); }
  };

  // ── LOGIN
  const doLogin = async () => {
    if (!lEmail.trim()) { setError('Email is required'); return; }
    if (!lPass) { setError('Password is required'); return; }
    setLoading(true); setError('');
    try {
      const user = await login(lEmail.trim(), lPass);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      close();
      if (user.role === 'admin' || user.role === 'moderator') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const LogoIcon = () => (
    <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
      <div style={{ width:52, height:52, borderRadius:16, background:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg viewBox="0 0 20 20" fill="none" style={{ width:28, height:28 }}>
          <path d="M10 2C10 2 15 5.5 15 10.5C15 13.5 12.8 16 10 17C7.2 16 5 13.5 5 10.5C5 5.5 10 2 10 2Z" fill="white"/>
          <circle cx="10" cy="10.5" r="2.2" fill="#E15033"/>
        </svg>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay open" onClick={handleOverlay} style={{ zIndex:2000 }}>
      <div className="modal" style={{ maxWidth:440, position:'relative' }}>
        <button className="modal-close" onClick={close}>✕</button>

        {/* ── STEP: PERSONA */}
        {step === 'persona' && (
          <div>
            <LogoIcon/>
            <div className="modal-title">Join Tech Launch</div>
            <div className="modal-sub">Who are you? Choose your role to get started.</div>
            <div className="persona-grid">
              {PERSONAS.filter(p => !p.fullWidth).map(p => (
                <div key={p.key} className={`persona-card${selectedPersona===p.key?' selected':''}`}
                  onClick={() => setSelectedPersona(p.key)}>
                  <div className="persona-icon">{p.icon}</div>
                  <div className="persona-label">{p.label}</div>
                  <div className="persona-desc">{p.desc}</div>
                </div>
              ))}
              {PERSONAS.filter(p => p.fullWidth).map(p => (
                <div key={p.key} className={`persona-card full-width${selectedPersona===p.key?' selected':''}`}
                  onClick={() => setSelectedPersona(p.key)}>
                  <div className="persona-icon">{p.icon}</div>
                  <div className="persona-label">{p.label}</div>
                  <div className="persona-desc">{p.desc}</div>
                </div>
              ))}
            </div>
            <button className="btn-full" disabled={!selectedPersona} onClick={() => setStep('signup')}
              style={{ opacity:selectedPersona?1:.4, cursor:selectedPersona?'pointer':'not-allowed' }}>
              Continue →
            </button>
            <div className="modal-switch">
              Already have an account? <a onClick={() => setStep('login')}>Sign in</a>
            </div>
          </div>
        )}

        {/* ── STEP: SIGNUP */}
        {step === 'signup' && (
          <div>
            <div className="modal-title">Create Account</div>
            <div className="modal-sub">
              Join as a <span>{PERSONA_LABELS[selectedPersona] || 'Member'}</span>
            </div>
            {error && <div style={{ background:'#fff5f5', border:'1px solid #fecaca', color:'#dc2626', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={sName} onChange={e => setSName(e.target.value)} placeholder="Ahmad Al-Rashid" autoComplete="name"/>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="ahmad@startup.sa" autoComplete="email"/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <input className="form-input" type={sPassShow?'text':'password'} value={sPass} onChange={e => setSPass(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password"
                  onKeyDown={e => e.key==='Enter' && doSignup()}
                  style={{ paddingRight:44 }}/>
                <button type="button" onClick={() => setSPassShow(v=>!v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#aaa', padding:4 }}>
                  {sPassShow ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button className="btn-full" onClick={doSignup} disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account 🚀'}
            </button>
            <div className="modal-switch">
              Already have an account? <a onClick={() => { setStep('login'); setError(''); }}>Sign in</a>
            </div>
            <div style={{ marginTop:12, textAlign:'center' }}>
              <a onClick={() => { setStep('persona'); setError(''); }} style={{ fontSize:12, color:'#aaa', cursor:'pointer' }}>← Back</a>
            </div>
          </div>
        )}

        {/* ── STEP: LOGIN */}
        {step === 'login' && (
          <div>
            <LogoIcon/>
            <div className="modal-title" style={{ marginTop:4 }}>Welcome back</div>
            <div className="modal-sub">Sign in to your Tech Launch account</div>
            {error && <div style={{ background:'#fff5f5', border:'1px solid #fecaca', color:'#dc2626', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>{error}</div>}
            {/* Demo hint */}
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#15803d', lineHeight:1.5 }}>
              <strong>Demo:</strong> admin@techlaunch.io / admin123 &nbsp;·&nbsp; sara@example.com / password123
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="your@email.com" autoComplete="email"
                onKeyDown={e => e.key==='Enter' && doLogin()}/>
            </div>
            <div className="form-group">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <label className="form-label" style={{ margin:0 }}>Password</label>
                <a onClick={() => toast('Password reset coming soon 📧')} style={{ fontSize:12, fontWeight:600, color:'var(--orange)', cursor:'pointer' }}>Forgot password?</a>
              </div>
              <div style={{ position:'relative' }}>
                <input className="form-input" type={lPassShow?'text':'password'} value={lPass} onChange={e => setLPass(e.target.value)} placeholder="Your password" autoComplete="current-password"
                  onKeyDown={e => e.key==='Enter' && doLogin()}
                  style={{ paddingRight:44 }}/>
                <button type="button" onClick={() => setLPassShow(v=>!v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#aaa', padding:4 }}>
                  {lPassShow ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button className="btn-full" onClick={doLogin} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="modal-switch">
              Don't have an account? <a onClick={() => { setStep('persona'); setError(''); setSelectedPersona(null); }}>Sign up free</a>
            </div>
          </div>
        )}

        {/* ── STEP: GATE (unauthenticated action) */}
        {step === 'gate' && (
          <div>
            <LogoIcon/>
            <div className="modal-title">Sign in to continue</div>
            <div className="modal-sub">Create a free account to <span>upvote, bookmark, and connect</span> with MENA's best products.</div>
            <button className="btn-full" onClick={() => { setStep('persona'); setError(''); setSelectedPersona(null); }} style={{ marginBottom:10 }}>
              Create Free Account 🚀
            </button>
            <button className="btn-full" onClick={() => { setStep('login'); setError(''); }} style={{ background:'var(--black)' }}>
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
