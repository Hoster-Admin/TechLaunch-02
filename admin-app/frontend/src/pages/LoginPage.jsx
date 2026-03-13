import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api.js';
import { useAuth } from '../App.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Email and password required'); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.data.token, data.data.user);
      toast.success(`Welcome back, ${data.data.user.name}!`);
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--black)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,fontFamily:"'DM Sans',sans-serif"}}>
      {/* Logo */}
      <div style={{marginBottom:32,textAlign:'center'}}>
        <div style={{width:52,height:52,borderRadius:14,background:'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 14px'}}>📡</div>
        <div style={{color:'#fff',fontSize:22,fontWeight:800,letterSpacing:'-.03em'}}>Tech Launch MENA</div>
        <div style={{color:'rgba(255,255,255,.35)',fontSize:13,marginTop:4,fontWeight:500}}>admin.tlmena.com — Restricted Access</div>
      </div>

      {/* Card */}
      <div style={{background:'#fff',borderRadius:20,padding:'28px 32px',width:'100%',maxWidth:400,boxShadow:'0 32px 80px rgba(0,0,0,.5)'}}>
        <div style={{fontSize:20,fontWeight:800,color:'var(--ink)',letterSpacing:'-.03em',marginBottom:2}}>Sign In</div>
        <div style={{fontSize:13,color:'var(--gray-400)',marginBottom:24,fontWeight:500}}>Admin credentials only</div>

        <form onSubmit={submit}>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--ink)',marginBottom:6}}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e=>setForm(f=>({...f,email:e.target.value}))}
              placeholder="admin@tlmena.com"
              autoComplete="email"
              required
              style={{width:'100%',padding:'11px 14px',border:'1.5px solid var(--gray-200)',borderRadius:10,fontSize:14,fontFamily:'inherit',color:'var(--ink)',outline:'none',boxSizing:'border-box',transition:'border-color .15s'}}
              onFocus={e=>e.target.style.borderColor='var(--orange)'}
              onBlur={e=>e.target.style.borderColor='var(--gray-200)'}
            />
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--ink)',marginBottom:6}}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e=>setForm(f=>({...f,password:e.target.value}))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{width:'100%',padding:'11px 14px',border:'1.5px solid var(--gray-200)',borderRadius:10,fontSize:14,fontFamily:'inherit',color:'var(--ink)',outline:'none',boxSizing:'border-box',transition:'border-color .15s'}}
              onFocus={e=>e.target.style.borderColor='var(--orange)'}
              onBlur={e=>e.target.style.borderColor='var(--gray-200)'}
            />
          </div>
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'13px',borderRadius:11,border:'none',background:'var(--orange)',color:'#fff',fontSize:14,fontWeight:800,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?0.65:1,letterSpacing:'-.01em',transition:'background .15s'}}
            onMouseEnter={e=>{if(!loading)e.target.style.background='var(--orange-dark)'}}
            onMouseLeave={e=>e.target.style.background='var(--orange)'}>
            {loading ? 'Signing in…' : 'Sign In to Admin'}
          </button>
        </form>

        <div style={{marginTop:20,padding:'12px 14px',background:'var(--orange-light)',borderRadius:11,border:'1px solid var(--orange-mid)'}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--orange)',marginBottom:3}}>ADMIN ONLY</div>
          <div style={{fontSize:12,color:'var(--gray-600)',fontWeight:500}}>This portal is restricted to platform administrators. Unauthorised access is prohibited.</div>
        </div>
      </div>
    </div>
  );
}
