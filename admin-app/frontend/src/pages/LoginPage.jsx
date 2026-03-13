import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api.js';
import { useAuth } from '../App.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email:'', password:'' });
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
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'Inter,sans-serif' }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:14, background:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 12px' }}>📡</div>
        <div style={{ color:'#fff', fontSize:22, fontWeight:800, letterSpacing:'-.03em' }}>Tech Launch MENA</div>
        <div style={{ color:'rgba(255,255,255,.35)', fontSize:13, marginTop:4 }}>Admin Panel — Restricted Access</div>
      </div>

      <div style={{ background:'#fff', borderRadius:20, padding:'28px 32px', width:'100%', maxWidth:400, boxShadow:'0 24px 80px rgba(0,0,0,.4)' }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#0A0A0A', marginBottom:4 }}>Sign In</div>
        <div style={{ fontSize:13, color:'#AAAAAA', marginBottom:24 }}>Admin credentials only</div>

        <form onSubmit={submit}>
          {[['Email','email','email','admin@techlaunch.io'],['Password','password','password','••••••••']].map(([label,key,type,ph]) => (
            <div key={key} style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#0A0A0A', marginBottom:6 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} required
                style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E8E8E8', borderRadius:11, fontSize:14, fontFamily:'inherit', color:'#0A0A0A', outline:'none', boxSizing:'border-box', transition:'border-color .15s' }}
                onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#E8E8E8'}/>
            </div>
          ))}
          <button type="submit" disabled={loading}
            style={{ width:'100%', marginTop:8, padding:'13px', borderRadius:12, border:'none', background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.6:1, letterSpacing:'-.01em' }}>
            {loading ? 'Signing in…' : 'Sign In to Admin'}
          </button>
        </form>

        <div style={{ marginTop:20, padding:'14px 16px', background:'#FFF8F6', borderRadius:12, border:'1px solid #FCE5DE' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--orange)', marginBottom:4 }}>ADMIN ONLY</div>
          <div style={{ fontSize:12, color:'#666' }}>This portal is restricted to platform administrators. Unauthorised access is prohibited.</div>
        </div>
      </div>
    </div>
  );
}
