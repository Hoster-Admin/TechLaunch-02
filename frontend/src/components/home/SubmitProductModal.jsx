import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const COUNTRIES = [
  ['sa','🇸🇦','Saudi Arabia'],['ae','🇦🇪','UAE'],['eg','🇪🇬','Egypt'],['jo','🇯🇴','Jordan'],
  ['ma','🇲🇦','Morocco'],['kw','🇰🇼','Kuwait'],['qa','🇶🇦','Qatar'],['bh','🇧🇭','Bahrain'],
  ['tn','🇹🇳','Tunisia'],['lb','🇱🇧','Lebanon'],['iq','🇮🇶','Iraq'],['om','🇴🇲','Oman'],
  ['ly','🇱🇾','Libya'],['dz','🇩🇿','Algeria'],['sy','🇸🇾','Syria'],['ye','🇾🇪','Yemen'],
  ['ps','🇵🇸','Palestine'],['sd','🇸🇩','Sudan'],['other','🌍','Other MENA'],
];
const INDUSTRIES = ['Fintech','Edtech','Healthtech','E-Commerce','Logistics','AI & ML','Proptech','Cleantech','SaaS','Web3','Media','HR & Work','Foodtech','Traveltech','Other'];
const STEPS = ['Type','Details','Media','Profile','Review',''];

const Prog = ({ step }) => (
  <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:28 }}>
    {[1,2,3,4,5].map(s => (
      <React.Fragment key={s}>
        <div style={{ width:s===step?60:28, height:6, borderRadius:99, background:s<=step?'var(--orange)':'#e8e8e8', transition:'all .25s', flexShrink:0 }}/>
        {s < 5 && <div style={{ width:8, height:6, borderRadius:99, background:s<step?'var(--orange)':'#e8e8e8', flexShrink:0 }}/>}
      </React.Fragment>
    ))}
    <div style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'#aaa' }}>Step {step} of 5</div>
  </div>
);

export default function SubmitProductModal({ open, onClose }) {
  const { user } = useAuth();
  const { addNotification } = useUI();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ name:'', tagline:'', industry:'', description:'', website:'', logo:'🚀', videoUrl:'', linkProfile:true });
  const [selectedCountries, setCountries] = useState([]);
  const [mediaImages, setMediaImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const mediaRef = useRef(null);

  if (!open) return null;

  const reset = () => {
    setStep(1); setType(null); setForm({ name:'', tagline:'', industry:'', description:'', website:'', logo:'🚀', videoUrl:'', linkProfile:true });
    setCountries([]); setMediaImages([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const toggleCountry = (code) => {
    setCountries(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code]);
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    files.slice(0, 4 - mediaImages.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setMediaImages(prev => [...prev.slice(0,3), ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, logoDataUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await productsAPI.create({
        name: form.name, tagline: form.tagline, industry: form.industry,
        description: form.description, website: form.website,
        logo_emoji: form.logo, status: type || 'live',
        country: selectedCountries[0] || 'other',
      });
    } catch {}
    addNotification('product', `Your product "${form.name}" was submitted for review 🚀`, '🚀');
    setSubmitting(false);
    setStep(6);
  };

  return (
    <div onClick={handleOverlayClick} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto', padding:'32px 36px', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
        <button onClick={handleClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:8, border:'1px solid #e8e8e8', background:'transparent', display:'grid', placeItems:'center', cursor:'pointer', fontSize:16, color:'#aaa' }}>✕</button>

        {/* Step 1 */}
        {step === 1 && <>
          <Prog step={1}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>What are you launching?</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>Choose the type of product you're posting.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
            {[['live','🚀','It\'s Live','Your product is launched and ready for the world to discover.'],
              ['soon','⏳','Coming Soon','Still building. Collect a waitlist before you launch.']].map(([v,icon,label,desc]) => (
              <div key={v} onClick={() => setType(v)}
                style={{ border:`1.5px solid ${type===v?'var(--orange)':'#e8e8e8'}`, borderRadius:14, padding:'20px 16px', cursor:'pointer', textAlign:'center', background:type===v?'var(--orange-light)':'#fff', transition:'all .15s' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:14, fontWeight:800, marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:12, color:'#888', lineHeight:1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
          <button onClick={() => type && setStep(2)} style={{ width:'100%', padding:14, borderRadius:12, fontFamily:'Inter,sans-serif', fontSize:15, fontWeight:800, border:'none', background:type?'var(--orange)':'#e8e8e8', color:type?'#fff':'#bbb', cursor:type?'pointer':'not-allowed', transition:'all .15s' }}>Next →</button>
        </>}

        {/* Step 2 */}
        {step === 2 && <>
          <Prog step={2}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Tell us about it</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>The basics — you can edit everything later.</div>
          {[['name','Product Name *','e.g. Kader AI','text'],['tagline','Tagline *','e.g. The first Arabic-native HR automation platform','text'],['website','Website URL','https://yourproduct.com','url']].map(([k,label,ph,t]) => (
            <div key={k} style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:7 }}>{label}</label>
              <input type={t} value={form[k]} placeholder={ph} onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
                style={{ display:'block', width:'100%', padding:'12px 16px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none' }}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
            </div>
          ))}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:7 }}>Industry *</label>
            <select value={form.industry} onChange={e => setForm(f=>({...f,industry:e.target.value}))}
              style={{ display:'block', width:'100%', padding:'12px 16px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', background:'#fff' }}>
              <option value="">Select...</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:7 }}>Available In * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>Select all that apply</span></label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, padding:10, border:'1.5px solid #e8e8e8', borderRadius:12, background:'#fafafa', minHeight:48 }}>
              {COUNTRIES.map(([v,flag,name]) => (
                <label key={v} onClick={() => toggleCountry(v)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', background:selectedCountries.includes(v)?'var(--orange)':'#f0f0f0', color:selectedCountries.includes(v)?'#fff':'#444', transition:'all .15s', userSelect:'none' }}>
                  {flag} {name}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:7 }}>Short Description * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>3 sentences max</span></label>
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="What it does, who it's for, why it's different..."
              style={{ display:'block', width:'100%', padding:'12px 16px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', resize:'vertical' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:7 }}>Product Logo</label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div onClick={() => fileRef.current?.click()} style={{ width:64, height:64, borderRadius:16, background:'#f4f4f4', border:'1.5px dashed #ddd', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:28, cursor:'pointer', flexShrink:0, overflow:'hidden' }}>
                {form.logoDataUrl ? <img src={form.logoDataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="logo"/> : <><span style={{ fontSize:28 }}>{form.logo}</span><span style={{ fontSize:9, color:'#bbb', fontWeight:600, marginTop:2 }}>Upload</span></>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoUpload}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>Upload an image, or pick an emoji:</div>
                <input type="text" value={form.logo} placeholder="e.g. 🤖" maxLength={4} onChange={e => setForm(f=>({...f,logo:e.target.value}))}
                  style={{ width:'100%', padding:'8px 12px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:22, fontFamily:'Inter,sans-serif', outline:'none' }}/>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(1)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={() => setStep(3)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer' }}>Next →</button>
          </div>
        </>}

        {/* Step 3 */}
        {step === 3 && <>
          <Prog step={3}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Add media</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>Upload up to 4 screenshots or photos, and optionally a demo video.</div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Screenshots / Photos <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>Up to 4 images</span></label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {[0,1,2,3].map(i => (
                <div key={i} onClick={() => mediaRef.current?.click()} style={{ aspectRatio:'16/9', borderRadius:12, border:`1.5px dashed ${mediaImages[i]?'transparent':'#ddd'}`, background:mediaImages[i]?'transparent':'#fafafa', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}>
                  {mediaImages[i] ? <img src={mediaImages[i]} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={`media ${i}`}/> : <><span style={{ fontSize:22, color:'#bbb' }}>+</span><span style={{ fontSize:11, color:'#bbb', marginTop:4 }}>Add photo</span></>}
                </div>
              ))}
            </div>
            <input ref={mediaRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleMediaUpload}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:7 }}>Demo Video URL <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>YouTube or Vimeo</span></label>
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
              <input type="url" value={form.videoUrl} placeholder="https://youtube.com/watch?v=..." onChange={e => setForm(f=>({...f,videoUrl:e.target.value}))}
                style={{ display:'block', width:'100%', padding:'12px 16px 12px 34px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:'Inter,sans-serif', outline:'none' }}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(2)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={() => setStep(4)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer' }}>Next →</button>
          </div>
        </>}

        {/* Step 4 */}
        {step === 4 && <>
          <Prog step={4}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Link your profile?</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>Control whether your name appears on this product.</div>
          <div onClick={() => setForm(f=>({...f,linkProfile:!f.linkProfile}))}
            style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', border:`1.5px solid ${form.linkProfile?'var(--orange)':'#e8e8e8'}`, borderRadius:14, background:form.linkProfile?'var(--orange-light)':'#fafafa', cursor:'pointer', transition:'all .15s', marginBottom:16 }}>
            <div style={{ width:44, height:24, borderRadius:99, background:form.linkProfile?'var(--orange)':'#ddd', position:'relative', flexShrink:0, transition:'background .2s' }}>
              <div style={{ position:'absolute', top:3, left:form.linkProfile?23:3, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.2)', transition:'left .2s' }}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>Link to my profile</div>
              <div style={{ fontSize:12, color:'#888', marginTop:3, lineHeight:1.5 }}>Your name and <span style={{ color:'var(--orange)', fontWeight:700 }}>@{(user?.handle||'').replace('@','')}</span> will appear on the product card.</div>
            </div>
          </div>
          <div style={{ padding:'14px', background:'#f8f8f8', borderRadius:12, fontSize:13, color:'#666', marginBottom:20 }}>
            <strong style={{ color:'#0a0a0a' }}>Preview:</strong> Product will show <span style={{ color:'var(--orange)', fontWeight:700 }}>{form.linkProfile ? (user?.name || 'your name') : 'Anonymous'}</span> as the maker.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(3)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={() => setStep(5)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer' }}>Review →</button>
          </div>
        </>}

        {/* Step 5 */}
        {step === 5 && <>
          <Prog step={5}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Review your listing</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:20 }}>Check everything before submitting. You can still edit after.</div>
          <div style={{ background:'#f8f8f8', borderRadius:16, padding:20, marginBottom:16, border:'1px solid #eee' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'#fff', border:'1px solid #eee', display:'grid', placeItems:'center', fontSize:28, flexShrink:0 }}>{form.logoDataUrl ? <img src={form.logoDataUrl} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:14 }} alt="logo"/> : form.logo}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>{form.name || '(no name)'}</div>
                <div style={{ fontSize:13, color:'#666', marginBottom:8 }}>{form.tagline || '(no tagline)'}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {form.industry && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#f0f0f0', color:'#555' }}>{form.industry}</span>}
                  {selectedCountries.slice(0,3).map(c => { const match = COUNTRIES.find(x=>x[0]===c); return match ? <span key={c} style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#f0f0f0', color:'#555' }}>{match[1]} {match[2]}</span> : null; })}
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:type==='soon'?'#eef2ff':'#fceee9', color:type==='soon'?'#4f46e5':'var(--orange)' }}>{type==='soon'?'Coming Soon':'Live'}</span>
                </div>
              </div>
            </div>
            {form.description && <div style={{ fontSize:13, color:'#666', marginTop:14, lineHeight:1.6 }}>{form.description}</div>}
            {form.linkProfile && <div style={{ fontSize:12, color:'#aaa', marginTop:12, paddingTop:12, borderTop:'1px solid #eee' }}>👤 Linked to {user?.name || 'your profile'}</div>}
          </div>
          <div style={{ background:'var(--orange-light)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'#666', lineHeight:1.6, marginBottom:20 }}>
            ⏱️ Products are reviewed within 24 hours. You'll be notified when it goes live.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(4)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={submit} disabled={submitting} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer', opacity:submitting?0.7:1 }}>
              {submitting ? 'Submitting…' : 'Submit Product 🚀'}
            </button>
          </div>
        </>}

        {/* Step 6 — Success */}
        {step === 6 && <>
          <div style={{ textAlign:'center', padding:'20px 0 10px' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:8 }}>Product Submitted!</div>
            <p style={{ fontSize:14, color:'#666', lineHeight:1.6, marginBottom:28 }}>We'll review your submission and notify you when it goes live. Usually within 24 hours.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={handleClose} style={{ width:'100%', padding:13, borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:800, cursor:'pointer' }}>Back to Homepage</button>
              <button onClick={handleClose} style={{ width:'100%', padding:13, borderRadius:12, background:'#f5f5f5', color:'#666', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Close</button>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}
