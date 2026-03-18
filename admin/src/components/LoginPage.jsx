import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F8F8F8', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <Toaster position="top-center"/>
      <div style={{ background:'#fff', border:'1px solid #E8E8E8', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🛠</div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em' }}>Admin Panel</div>
          <div style={{ fontSize:13, color:'#AAA', marginTop:4 }}>TechLaunch MENA — Staff Access Only</div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E8E8E8', borderRadius:10, fontSize:14, fontFamily:'inherit', marginBottom:16, outline:'none' }}
            placeholder="admin@techlaunch.com"
          />

          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E8E8E8', borderRadius:10, fontSize:14, fontFamily:'inherit', marginBottom:24, outline:'none' }}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', padding:'13px', borderRadius:12, background:'#E15033', color:'#fff', border:'none', fontSize:15, fontWeight:800, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'inherit' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
