import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import api from '../../utils/api';
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

function Spinner() {
  return (
    <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .6s linear infinite', verticalAlign:'middle', marginRight:8 }}/>
  );
}

export default function AuthModal() {
  const { login, register } = useAuth();
  const { authModal, setAuthModal, setSubmitOpen, authRedirect, setAuthRedirect } = useUI();
  const navigate = useNavigate();

  const [step, setStep] = useState('persona');
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [sName,     setSName]     = useState('');
  const [sHandle,   setSHandle]   = useState('');
  const [sEmail,    setSEmail]    = useState('');
  const [sPass,     setSPass]     = useState('');
  const [sPassShow, setSPassShow] = useState(false);

  const [lEmail, setLEmail] = useState('');
  const [lPass,  setLPass]  = useState('');
  const [lPassShow, setLPassShow] = useState(false);

  const [fpEmail, setFpEmail] = useState('');
  const [fpSent,  setFpSent]  = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  useEffect(() => {
    if (authModal === 'login')   { setStep('login');   setError(''); }
    if (authModal === 'signup')  { setStep('persona'); setError(''); setSelectedPersona(null); }
    if (authModal === 'gate')    { setStep('gate');    setError(''); }
    if (authModal === null) {
      setSName(''); setSHandle(''); setSEmail(''); setSPass('');
      setLEmail(''); setLPass('');
      setFpEmail(''); setFpSent(false);
      setError(''); setFieldErrors({});
    }
  }, [authModal]);

  const autoHandle = (name) => {
    return name.trim().toLowerCase()
      .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 18) || 'user';
  };

  const handleNameChange = (val) => {
    setSName(val);
    if (!sHandle || sHandle === autoHandle(sName)) {
      setSHandle(autoHandle(val));
      setFieldErrors(f => ({ ...f, handle: '' }));
    }
  };

  const close = () => setAuthModal(null);
  const handleOverlay = (e) => { if (e.target === e.currentTarget) close(); };

  if (!authModal) return null;

  const doSignup = async () => {
    if (!sName.trim()) { setError('Full name is required'); return; }
    if (!sEmail.trim() || !sEmail.includes('@')) { setFieldErrors(f => ({ ...f, email: 'Please enter a valid email' })); return; }
    if (sPass.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError(''); setFieldErrors({});
    try {
      const handle = sHandle.trim() || autoHandle(sName);
      const dbPersona = PERSONA_DB_MAP[selectedPersona] || 'Enthusiast';
      const user = await register({ name:sName.trim(), email:sEmail.trim(), password:sPass, handle, persona:dbPersona });
      toast.success(`Welcome to Tech Launch, ${user.name.split(' ')[0]}! 🚀`);
      close();
      if (authRedirect) {
        const dest = authRedirect;
        setAuthRedirect(null);
        navigate(dest);
      } else if (selectedPersona === 'startup') {
        setSubmitOpen(true);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.field === 'handle') {
        setFieldErrors({ handle: 'This username is already taken' });
      } else if (data?.field === 'email') {
        setFieldErrors({ email: 'This email is already registered — try signing in instead' });
      } else {
        setError(data?.message || 'Signup failed. Try again.');
      }
    } finally { setLoading(false); }
  };

  const doLogin = async () => {
    if (!lEmail.trim()) { setError('Email is required'); return; }
    if (!lPass) { setError('Password is required'); return; }
    setLoading(true); setError('');
    try {
      const user = await login(lEmail.trim(), lPass);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      close();
      if (authRedirect) {
        const dest = authRedirect;
        setAuthRedirect(null);
        navigate(dest);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const doForgotPassword = async () => {
    if (!fpEmail.trim() || !fpEmail.includes('@')) { setError('Please enter a valid email'); return; }
    setFpLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: fpEmail.trim() });
      setFpSent(true);
    } catch {
      setFpSent(true);
    } finally { setFpLoading(false); }
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
    <>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
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
                <input className="form-input" type="text" value={sName} onChange={e => handleNameChange(e.target.value)} placeholder="Ahmad Al-Rashid" autoComplete="name"/>
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#aaa', fontSize:14, pointerEvents:'none' }}>@</span>
                  <input className="form-input" type="text" value={sHandle}
                    onChange={e => { setSHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)); setFieldErrors(f => ({ ...f, handle: '' })); }}
                    placeholder="your_handle" autoComplete="username"
                    style={{ paddingLeft:30, borderColor: fieldErrors.handle ? '#dc2626' : '' }}/>
                </div>
                {fieldErrors.handle ? (
                  <div style={{ marginTop:6, fontSize:12, color:'#dc2626', paddingLeft:2, fontWeight:500 }}>
                    ⚠️ {fieldErrors.handle}
                  </div>
                ) : sHandle ? (
                  <div style={{ marginTop:6, fontSize:12, color:'#888', paddingLeft:2 }}>
                    🔗 Your profile: <span style={{ color:'var(--orange)', fontWeight:600 }}>tlmena.com/@{sHandle}</span>
                  </div>
                ) : null}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={sEmail}
                  onChange={e => { setSEmail(e.target.value); setFieldErrors(f => ({ ...f, email: '' })); }}
                  placeholder="ahmad@startup.sa" autoComplete="email"
                  style={{ borderColor: fieldErrors.email ? '#dc2626' : '' }}/>
                {fieldErrors.email ? (
                  <div style={{ marginTop:6, fontSize:12, color:'#dc2626', paddingLeft:2, fontWeight:500 }}>
                    ⚠️ {fieldErrors.email}
                  </div>
                ) : sEmail ? (
                  <div style={{ marginTop:6, fontSize:12, color:'#888', paddingLeft:2 }}>
                    ✉️ Confirmation & login link will be sent here
                  </div>
                ) : null}
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
                {loading ? <><Spinner/>Creating Account…</> : 'Create Account 🚀'}
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
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="your@email.com" autoComplete="email"
                  onKeyDown={e => e.key==='Enter' && doLogin()}/>
              </div>
              <div className="form-group">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                  <label className="form-label" style={{ margin:0 }}>Password</label>
                  <a onClick={() => { setStep('forgot'); setFpEmail(lEmail); setFpSent(false); setError(''); }} style={{ fontSize:12, fontWeight:600, color:'var(--orange)', cursor:'pointer' }}>Forgot password?</a>
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
                {loading ? <><Spinner/>Signing in…</> : 'Sign In'}
              </button>
              <div className="modal-switch">
                Don't have an account? <a onClick={() => { setStep('persona'); setError(''); setSelectedPersona(null); }}>Sign up free</a>
              </div>
            </div>
          )}

          {/* ── STEP: FORGOT PASSWORD */}
          {step === 'forgot' && (
            <div>
              <LogoIcon/>
              <div className="modal-title" style={{ marginTop:4 }}>Reset Password</div>
              {!fpSent ? (
                <>
                  <div className="modal-sub">Enter your email and we'll send you a reset link.</div>
                  {error && <div style={{ background:'#fff5f5', border:'1px solid #fecaca', color:'#dc2626', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>{error}</div>}
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="your@email.com" autoComplete="email"
                      onKeyDown={e => { if (e.key === 'Enter') doForgotPassword(); }}/>
                  </div>
                  <button className="btn-full" disabled={fpLoading} onClick={doForgotPassword}>
                    {fpLoading ? <><Spinner/>Sending…</> : 'Send Reset Link'}
                  </button>
                  <div style={{ marginTop:14, textAlign:'center' }}>
                    <a onClick={() => { setStep('login'); setError(''); }} style={{ fontSize:12, color:'#aaa', cursor:'pointer' }}>← Back to sign in</a>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
                    <div style={{ fontSize:44, marginBottom:16 }}>📧</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#0a0a0a', marginBottom:8 }}>Check your inbox</div>
                    <div style={{ fontSize:13, color:'#666', lineHeight:1.6 }}>
                      If <b>{fpEmail}</b> is registered, you'll receive a password reset link shortly.<br/>
                      <span style={{ fontSize:12, color:'#aaa' }}>Don't see it? Check your spam folder.</span>
                    </div>
                  </div>
                  <button className="btn-full" onClick={close}>Done</button>
                  <div style={{ marginTop:14, textAlign:'center' }}>
                    <a onClick={() => { setFpSent(false); setFpEmail(''); setError(''); }} style={{ fontSize:12, color:'#aaa', cursor:'pointer' }}>Try a different email</a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP: GATE (unauthenticated action) */}
          {step === 'gate' && (
            <div>
              <LogoIcon/>
              <div className="modal-title">Sign in to continue</div>
              <div className="modal-sub">Create a free account to <span>upvote products</span> and support MENA tech.</div>
              <button className="btn-full" onClick={() => { setStep('persona'); setError(''); setSelectedPersona(null); }} style={{ marginBottom:10 }}>
                Create Free Account 🚀
              </button>
              <button className="btn-full" onClick={() => { setStep('login'); setError(''); }}
                style={{ background:'transparent', color:'var(--black)', border:'1.5px solid #e8e8e8' }}>
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
