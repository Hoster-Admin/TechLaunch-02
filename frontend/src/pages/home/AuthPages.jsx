import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PERSONAS  = ['Founder','Investor','Product Manager','Accelerator','Enthusiast'];
const COUNTRIES = ['Saudi Arabia','UAE','Egypt','Jordan','Morocco','Kuwait','Qatar','Bahrain','Tunisia','Other'];

const pageStyle = {
  minHeight: '100vh', background: '#fafafa',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px 16px', fontFamily: "'DM Sans', sans-serif",
};
const cardStyle = {
  width: '100%', maxWidth: 440,
  background: '#fff', borderRadius: 20,
  border: '1px solid #e8e8e8',
  boxShadow: '0 4px 40px rgba(0,0,0,.07)',
  padding: '36px 32px',
};
const inputStyle = (err) => ({
  width: '100%', padding: '11px 14px',
  borderRadius: 10, border: `1.5px solid ${err ? '#dc2626' : '#e8e8e8'}`,
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none', background: '#fff', color: '#0a0a0a',
  boxSizing: 'border-box',
});
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, letterSpacing: '.01em' };
const errStyle   = { fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 };

// ══════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════
export function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from || '/';
  const [form, setForm]     = useState({ email:'', password:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email)    errs.email    = 'Email required';
    if (!form.password) errs.password = 'Password required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' || user.role === 'moderator' ? '/admin' : from, { replace: true });
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Invalid email or password' });
    } finally { setLoading(false); }
  };

  return (
    <div style={pageStyle}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:20 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#0a0a0a', display:'grid', placeItems:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <span style={{ fontSize:18, fontWeight:800, color:'#0a0a0a', letterSpacing:'-.03em' }}>Tech Launch</span>
          </Link>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0a0a0a', letterSpacing:'-.02em', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:14, color:'#888', fontWeight:400 }}>Sign in to your account</p>
        </div>

        <div style={cardStyle}>
          {errors.general && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:13, padding:'12px 16px', borderRadius:10, marginBottom:20, fontWeight:500 }}>
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email"
                style={inputStyle(errors.email)}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor=errors.email?'#dc2626':'#e8e8e8'}/>
              {errors.email && <div style={errStyle}>{errors.email}</div>}
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Your password" autoComplete="current-password"
                style={inputStyle(errors.password)}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor=errors.password?'#dc2626':'#e8e8e8'}/>
              {errors.password && <div style={errStyle}>{errors.password}</div>}
            </div>
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px 0', borderRadius:12, background:'var(--orange)', border:'none', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', opacity:loading?.75:1, transition:'opacity .15s', fontFamily:"'DM Sans',sans-serif" }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign:'center', fontSize:13, color:'#888', marginTop:20 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--orange)', fontWeight:700, textDecoration:'none' }}>Join Tech Launch</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// REGISTER PAGE
// ══════════════════════════════════════════════
export function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ name:'', handle:'', email:'', password:'', persona:'Founder', country:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())        errs.name     = 'Name required';
    if (!form.handle.trim())      errs.handle   = 'Handle required';
    if (!/^[a-zA-Z0-9_]+$/.test(form.handle)) errs.handle = 'Only letters, numbers, underscores';
    if (!form.email)              errs.email    = 'Email required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to Tech Launch!');
      navigate('/');
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed' });
    } finally { setLoading(false); }
  };

  const PERSONA_ICONS = { Founder:'🚀', Investor:'💰', 'Product Manager':'🧠', Accelerator:'🏢', Enthusiast:'⭐' };

  return (
    <div style={{ ...pageStyle, alignItems:'flex-start', paddingTop:40 }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:20 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#0a0a0a', display:'grid', placeItems:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <span style={{ fontSize:18, fontWeight:800, color:'#0a0a0a', letterSpacing:'-.03em' }}>Tech Launch</span>
          </Link>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0a0a0a', letterSpacing:'-.02em', marginBottom:6 }}>Join the community</h1>
          <p style={{ fontSize:14, color:'#888' }}>MENA's premier product discovery platform</p>
        </div>

        <div style={cardStyle}>
          {errors.general && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:13, padding:'12px 16px', borderRadius:10, marginBottom:20, fontWeight:500 }}>
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input value={form.name} onChange={set('name')} placeholder="Sara Al-Mahmoud"
                  style={inputStyle(errors.name)}
                  onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor=errors.name?'#dc2626':'#e8e8e8'}/>
                {errors.name && <div style={errStyle}>{errors.name}</div>}
              </div>
              <div>
                <label style={labelStyle}>Handle</label>
                <input value={form.handle} onChange={set('handle')} placeholder="sara_builds"
                  style={inputStyle(errors.handle)}
                  onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor=errors.handle?'#dc2626':'#e8e8e8'}/>
                {errors.handle && <div style={errStyle}>{errors.handle}</div>}
                {!errors.handle && <div style={{ fontSize:10, color:'#aaa', marginTop:3 }}>@{form.handle||'yourhandle'}</div>}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
                style={inputStyle(errors.email)}
                onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor=errors.email?'#dc2626':'#e8e8e8'}/>
              {errors.email && <div style={errStyle}>{errors.email}</div>}
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters"
                style={inputStyle(errors.password)}
                onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor=errors.password?'#dc2626':'#e8e8e8'}/>
              {errors.password && <div style={errStyle}>{errors.password}</div>}
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>I am a…</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {PERSONAS.map(p => (
                  <button key={p} type="button"
                    onClick={() => setForm(f => ({ ...f, persona: p }))}
                    style={{ padding:'10px 8px', borderRadius:12, border:`2px solid ${form.persona===p?'var(--orange)':'#e8e8e8'}`, background:form.persona===p?'var(--orange-light)':'#fff', cursor:'pointer', fontSize:12, fontWeight:700, color:form.persona===p?'var(--orange)':'#555', fontFamily:"'DM Sans',sans-serif", textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:18 }}>{PERSONA_ICONS[p]}</span>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={labelStyle}>Country</label>
              <select value={form.country} onChange={set('country')}
                style={{ ...inputStyle(false), appearance:'none', cursor:'pointer' }}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px 0', borderRadius:12, background:'var(--orange)', border:'none', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', opacity:loading?.75:1, transition:'opacity .15s', fontFamily:"'DM Sans',sans-serif" }}>
              {loading ? 'Creating account…' : 'Create Account 🚀'}
            </button>
          </form>
          <p style={{ textAlign:'center', fontSize:13, color:'#888', marginTop:20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--orange)', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
