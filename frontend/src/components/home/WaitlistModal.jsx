import React, { useState } from 'react';
import { productsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function WaitlistModal({ product, onClose }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  const submit = async () => {
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    try {
      await productsAPI.waitlist(product.id, email);
    } catch {}
    setDone(true);
    setLoading(false);
  };

  return (
    <div onClick={handleOverlay} style={{ position:'fixed', inset:0, zIndex:2100, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420, padding:'36px 36px 32px', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,.2)', animation:'modalIn .2s ease', textAlign:'center' }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:8, border:'1px solid #e8e8e8', background:'transparent', cursor:'pointer', fontSize:15, color:'#aaa', display:'grid', placeItems:'center' }}>✕</button>

        {done ? <>
          <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>You're on the list!</div>
          <p style={{ fontSize:14, color:'#666', lineHeight:1.6, marginBottom:24 }}>
            We'll notify you at <strong>{email}</strong> when <strong>{product.name}</strong> launches.
          </p>
          <button onClick={onClose} style={{ width:'100%', padding:13, borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:800, cursor:'pointer' }}>Done 🚀</button>
        </> : <>
          <div style={{ fontSize:44, marginBottom:16 }}>⏳</div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Join the Waitlist</div>
          <p style={{ fontSize:14, color:'#666', lineHeight:1.6, marginBottom:8 }}>
            Be the first to know when <strong>{product.name}</strong> launches.
          </p>
          {product.tagline && <div style={{ fontSize:13, color:'#aaa', marginBottom:24 }}>{product.tagline}</div>}
          <div style={{ textAlign:'left', marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>Your Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ display:'block', width:'100%', padding:'12px 16px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
          </div>
          <button onClick={submit} disabled={loading} style={{ width:'100%', padding:14, borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 20px rgba(232,98,26,.3)', opacity:loading?0.7:1 }}>
            {loading ? 'Joining…' : 'Join Waitlist ⚡'}
          </button>
          <div style={{ fontSize:11, color:'#bbb', marginTop:12 }}>No spam. Unsubscribe anytime.</div>
        </>}
      </div>
    </div>
  );
}
