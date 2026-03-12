import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI, entitiesAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const COUNTRIES = [
  ['sa','🇸🇦','Saudi Arabia'],['ae','🇦🇪','UAE'],['eg','🇪🇬','Egypt'],['jo','🇯🇴','Jordan'],
  ['ma','🇲🇦','Morocco'],['kw','🇰🇼','Kuwait'],['qa','🇶🇦','Qatar'],['bh','🇧🇭','Bahrain'],
  ['tn','🇹🇳','Tunisia'],['lb','🇱🇧','Lebanon'],['iq','🇮🇶','Iraq'],['om','🇴🇲','Oman'],
  ['ly','🇱🇾','Libya'],['dz','🇩🇿','Algeria'],['sy','🇸🇾','Syria'],['ye','🇾🇪','Yemen'],
  ['ps','🇵🇸','Palestine'],['sd','🇸🇩','Sudan'],['other','🌍','Other MENA'],
];
const INDUSTRIES = ['Fintech','Edtech','Healthtech','E-Commerce','Logistics','AI & ML','Proptech','Cleantech','SaaS','Web3','Media','HR & Work','Foodtech','Traveltech','Other'];

const inp = { display:'block', width:'100%', padding:'11px 14px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box', background:'#fff' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 };

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

const Toggle = ({ on, onChange, label, sub, handle }) => (
  <div onClick={onChange} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', border:`1.5px solid ${on?'var(--orange)':'#e8e8e8'}`, borderRadius:14, background:on?'var(--orange-light)':'#fafafa', cursor:'pointer', transition:'all .15s' }}>
    <div style={{ width:44, height:24, borderRadius:99, background:on?'var(--orange)':'#ddd', position:'relative', flexShrink:0, transition:'background .2s' }}>
      <div style={{ position:'absolute', top:3, left:on?23:3, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.2)', transition:'left .2s' }}/>
    </div>
    <div>
      <div style={{ fontSize:14, fontWeight:700 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:'#888', marginTop:2, lineHeight:1.5 }}>{sub} {handle && <span style={{ color:'var(--orange)', fontWeight:700 }}>@{handle.replace('@','')}</span>}</div>}
    </div>
  </div>
);

export default function SubmitProductModal({ open, onClose }) {
  const { user } = useAuth();
  const { addNotification } = useUI();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ name:'', tagline:'', industry:'', description:'', website:'', logoEmoji:'🚀', videoUrl:'', linkProfile:true });
  const [logoFile, setLogoFile] = useState(null);
  const [selectedCountries, setCountries] = useState([]);
  const [screenshots, setScreenshots] = useState([null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);

  // Entity search
  const [entityQ, setEntityQ] = useState('');
  const [entityResults, setEntityResults] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityOpen, setEntityOpen] = useState(false);
  const entityRef = useRef(null);

  const logoInputRef = useRef(null);
  const screenshotRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  if (!open) return null;

  const reset = () => {
    setStep(1); setType(null);
    setForm({ name:'', tagline:'', industry:'', description:'', website:'', logoEmoji:'🚀', videoUrl:'', linkProfile:true });
    setLogoFile(null); setCountries([]); setScreenshots([null,null,null,null]);
    setEntityQ(''); setSelectedEntity(null); setEntityResults([]);
  };

  const handleClose = () => { reset(); onClose(); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };
  const toggleCountry = (code) => setCountries(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code]);
  const fo = e => { e.target.style.borderColor='var(--orange)'; };
  const bl = e => { e.target.style.borderColor='#e8e8e8'; };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoFile(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleScreenshot = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setScreenshots(prev => { const n=[...prev]; n[idx]=ev.target.result; return n; });
    reader.readAsDataURL(file);
  };

  const removeScreenshot = (idx, e) => {
    e.stopPropagation();
    setScreenshots(prev => { const n=[...prev]; n[idx]=null; return n; });
  };

  const searchEntities = async (q) => {
    setEntityQ(q);
    if (!q.trim()) { setEntityResults([]); return; }
    try {
      const res = await entitiesAPI.list({ search: q, limit: 6 });
      setEntityResults(res.data?.data || res.data || []);
    } catch { setEntityResults([]); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await productsAPI.create({
        name: form.name, tagline: form.tagline, industry: form.industry,
        description: form.description, website: form.website,
        logo_emoji: form.logoEmoji, status: type || 'live',
        country: selectedCountries[0] || 'other',
      });
    } catch {}
    addNotification('product', `Your product "${form.name}" was submitted for review 🚀`, '🚀');
    setSubmitting(false);
    setStep(6);
  };

  return (
    <div onClick={handleOverlayClick} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'93vh', overflowY:'auto', padding:'32px 36px', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}>
        <button onClick={handleClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:8, border:'1px solid #e8e8e8', background:'transparent', display:'grid', placeItems:'center', cursor:'pointer', fontSize:16, color:'#aaa' }}>✕</button>

        {/* ── Step 1: Type */}
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
          <button onClick={() => type && setStep(2)} style={{ width:'100%', padding:14, borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:800, border:'none', background:type?'var(--orange)':'#e8e8e8', color:type?'#fff':'#bbb', cursor:type?'pointer':'not-allowed', transition:'all .15s' }}>Next →</button>
        </>}

        {/* ── Step 2: Details */}
        {step === 2 && <>
          <Prog step={2}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Tell us about it</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>The basics — you can edit everything later.</div>

          {/* Logo upload — clean, no box */}
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Product Logo</label>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div onClick={() => logoInputRef.current?.click()} style={{ position:'relative', width:72, height:72, borderRadius:18, overflow:'hidden', cursor:'pointer', flexShrink:0, background:'#f4f4f4' }}>
                {logoFile
                  ? <img src={logoFile} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="logo"/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>{form.logoEmoji || '🚀'}</div>
                }
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                  <span style={{ fontSize:20 }}>📷</span>
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoUpload}/>
              <div style={{ flex:1 }}>
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  style={{ display:'block', width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fafafa', fontSize:13, fontWeight:600, cursor:'pointer', color:'#555', textAlign:'left' }}>
                  📤 Upload logo image
                </button>
                <div style={{ fontSize:11, color:'#bbb', marginTop:8, lineHeight:1.5 }}>PNG, JPG or SVG · Recommended 200×200 px</div>
                {logoFile && (
                  <button type="button" onClick={() => setLogoFile(null)}
                    style={{ marginTop:8, fontSize:11, color:'#aaa', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline' }}>Remove</button>
                )}
              </div>
            </div>
          </div>

          {/* Text fields — empty boxes */}
          {[['name','Product Name *'],['tagline','Tagline *'],['website','Website URL']].map(([k,label]) => (
            <div key={k} style={{ marginBottom:16 }}>
              <label style={lbl}>{label}</label>
              <input type={k==='website'?'url':'text'} value={form[k]} placeholder="" onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
                style={inp} onFocus={fo} onBlur={bl}/>
            </div>
          ))}

          {/* Industry */}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Industry *</label>
            <select value={form.industry} onChange={e => setForm(f=>({...f,industry:e.target.value}))}
              style={{ ...inp, cursor:'pointer' }} onFocus={fo} onBlur={bl}>
              <option value="">Select…</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          {/* Available In */}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Available In * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>Select all that apply</span></label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, padding:10, border:'1.5px solid #e8e8e8', borderRadius:12, background:'#fafafa', minHeight:48 }}>
              {COUNTRIES.map(([v,flag,name]) => (
                <span key={v} onClick={() => toggleCountry(v)}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', background:selectedCountries.includes(v)?'var(--orange)':'#f0f0f0', color:selectedCountries.includes(v)?'#fff':'#444', transition:'all .15s', userSelect:'none' }}>
                  {flag} {name}
                </span>
              ))}
            </div>
          </div>

          {/* Short Description — keeps placeholder */}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Short Description * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>3 sentences max</span></label>
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3}
              placeholder="What it does, who it's for, why it's different..."
              style={{ ...inp, resize:'vertical', lineHeight:1.6 }} onFocus={fo} onBlur={bl}/>
          </div>

          {/* Associated Entity */}
          <div style={{ marginBottom:20, position:'relative' }} ref={entityRef}>
            <label style={lbl}>Associated Entity <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>Optional — link to a company registered with us</span></label>
            {selectedEntity ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'1.5px solid var(--orange)', borderRadius:11, background:'var(--orange-light)' }}>
                <span style={{ fontSize:20 }}>{selectedEntity.logo_emoji || '🏢'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{selectedEntity.name}</div>
                  <div style={{ fontSize:12, color:'#888' }}>{selectedEntity.type || selectedEntity.entity_type || 'Company'}</div>
                </div>
                <button type="button" onClick={() => { setSelectedEntity(null); setEntityQ(''); }}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#aaa', padding:4 }}>✕</button>
              </div>
            ) : (
              <>
                <div style={{ position:'relative' }}>
                  <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input value={entityQ} onChange={e => { searchEntities(e.target.value); setEntityOpen(true); }} placeholder="Search companies, accelerators…"
                    style={{ ...inp, paddingLeft:34 }} onFocus={() => setEntityOpen(true)} onBlur={() => setTimeout(() => setEntityOpen(false), 150)}/>
                </div>
                {entityOpen && entityResults.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', overflow:'hidden', marginTop:4 }}>
                    {entityResults.map(e => (
                      <div key={e.id} onClick={() => { setSelectedEntity(e); setEntityQ(e.name); setEntityOpen(false); }}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f4f4f4', transition:'background .1s' }}
                        onMouseEnter={ev => ev.currentTarget.style.background='#fafafa'} onMouseLeave={ev => ev.currentTarget.style.background='#fff'}>
                        <span style={{ fontSize:20 }}>{e.logo_emoji || '🏢'}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700 }}>{e.name}</div>
                          <div style={{ fontSize:11, color:'#aaa' }}>{e.type || e.entity_type || 'Company'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(1)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={() => setStep(3)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer' }}>Next →</button>
          </div>
        </>}

        {/* ── Step 3: Media */}
        {step === 3 && (()=>{
          const filled = screenshots.filter(Boolean).length;
          const hasVideo = form.videoUrl.trim().length > 0;
          const mediaOk = filled === 4 || hasVideo;
          return <>
          <Prog step={3}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>Add media</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:16 }}>Upload <strong>4 screenshots</strong> — or add a <strong>demo video</strong> instead.</div>

          {/* Progress bar */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 14px', borderRadius:12, background: mediaOk ? '#f0fdf4' : '#fafafa', border:`1px solid ${mediaOk?'#bbf7d0':'#e8e8e8'}` }}>
            <div style={{ display:'flex', gap:5 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:28, height:6, borderRadius:99, background: screenshots[i] ? 'var(--orange)' : '#e0e0e0', transition:'background .2s' }}/>
              ))}
            </div>
            <span style={{ fontSize:12, fontWeight:700, color: mediaOk ? '#16a34a' : '#aaa' }}>
              {hasVideo ? '✅ Video added' : filled === 4 ? '✅ All 4 uploaded' : `${filled} / 4 photos${filled === 0 ? ' — or add a video below' : ''}`}
            </span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
            {[0,1,2,3].map(i => (
              <div key={i}>
                <input ref={screenshotRefs[i]} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleScreenshot(i, e)}/>
                <div onClick={() => screenshotRefs[i].current?.click()}
                  style={{ aspectRatio:'16/9', borderRadius:14, border:`1.5px dashed ${screenshots[i]?'transparent':'#ddd'}`, background:screenshots[i]?'transparent':'#f8f8f8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative', transition:'border-color .15s' }}
                  onMouseEnter={e=>{ if(!screenshots[i]) e.currentTarget.style.borderColor='var(--orange)'; }}
                  onMouseLeave={e=>{ if(!screenshots[i]) e.currentTarget.style.borderColor='#ddd'; }}>
                  {screenshots[i] ? (
                    <>
                      <img src={screenshots[i]} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={`screenshot ${i+1}`}/>
                      <button type="button" onClick={e => removeScreenshot(i, e)}
                        style={{ position:'absolute', top:6, right:6, width:24, height:24, borderRadius:6, background:'rgba(0,0,0,.55)', border:'none', color:'#fff', fontSize:13, cursor:'pointer', display:'grid', placeItems:'center', lineHeight:1 }}>✕</button>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom:5 }}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span style={{ fontSize:10, color:'#ccc', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Photo {i+1}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* OR divider */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:'#e8e8e8' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'#bbb', letterSpacing:'.06em' }}>OR ADD A VIDEO</span>
            <div style={{ flex:1, height:1, background:'#e8e8e8' }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Demo Video URL <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#aaa' }}>YouTube or Vimeo link</span></label>
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
              <input type="url" value={form.videoUrl} placeholder="https://youtube.com/watch?v=…" onChange={e => setForm(f=>({...f,videoUrl:e.target.value}))}
                style={{ ...inp, paddingLeft:34 }} onFocus={fo} onBlur={bl}/>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(2)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={() => setStep(4)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer' }}>Next →</button>
          </div>
        </>})()}

        {/* ── Step 4: Visibility */}
        {step === 4 && <>
          <Prog step={4}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Visibility settings</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>Control how your product post appears on the platform.</div>

          <Toggle on={form.linkProfile} onChange={() => setForm(f=>({...f,linkProfile:!f.linkProfile}))}
            label="Tag my public profile with this post"
            sub="Your name and handle will appear on the product card:"
            handle={user?.handle}/>

          <div style={{ padding:'12px 14px', background:'#f8f8f8', borderRadius:12, fontSize:13, color:'#666', marginBottom:16, marginTop:12 }}>
            <strong style={{ color:'#0a0a0a' }}>Preview:</strong> Product will show <span style={{ color:'var(--orange)', fontWeight:700 }}>{form.linkProfile ? (user?.name || 'your name') : 'Anonymous'}</span> as the maker.
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(3)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={() => setStep(5)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer' }}>Review →</button>
          </div>
        </>}

        {/* ── Step 5: Review */}
        {step === 5 && <>
          <Prog step={5}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Review your listing</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:20 }}>Check everything before submitting.</div>

          <div style={{ background:'#f8f8f8', borderRadius:16, padding:20, marginBottom:16, border:'1px solid #eee' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'#fff', border:'1px solid #eee', display:'grid', placeItems:'center', fontSize:28, flexShrink:0, overflow:'hidden' }}>
                {logoFile ? <img src={logoFile} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="logo"/> : form.logoEmoji}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>{form.name || '(no name)'}</div>
                <div style={{ fontSize:13, color:'#666', marginBottom:8 }}>{form.tagline || '(no tagline)'}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {form.industry && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#f0f0f0', color:'#555' }}>{form.industry}</span>}
                  {selectedCountries.slice(0,3).map(c => { const m=COUNTRIES.find(x=>x[0]===c); return m?<span key={c} style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:'#f0f0f0', color:'#555' }}>{m[1]} {m[2]}</span>:null; })}
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:5, background:type==='soon'?'#eef2ff':'#fceee9', color:type==='soon'?'#4f46e5':'var(--orange)' }}>{type==='soon'?'Coming Soon':'Live'}</span>
                </div>
              </div>
            </div>
            {form.description && <div style={{ fontSize:13, color:'#666', marginTop:14, lineHeight:1.6 }}>{form.description}</div>}
            {selectedEntity && (
              <div style={{ fontSize:12, color:'#aaa', marginTop:12, paddingTop:12, borderTop:'1px solid #eee', display:'flex', alignItems:'center', gap:6 }}>
                <span>{selectedEntity.logo_emoji || '🏢'}</span> Associated with <strong style={{ color:'#555' }}>{selectedEntity.name}</strong>
              </div>
            )}
            {form.linkProfile && <div style={{ fontSize:12, color:'#aaa', marginTop:8, display:'flex', alignItems:'center', gap:6 }}><span>👤</span> Tagged to {user?.name || 'your profile'}</div>}
          </div>

          {screenshots.some(Boolean) && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {screenshots.map((s,i) => s ? (
                <div key={i} style={{ aspectRatio:'16/9', borderRadius:8, overflow:'hidden' }}>
                  <img src={s} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={`ss${i+1}`}/>
                </div>
              ) : null)}
            </div>
          )}

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

        {/* ── Step 6: Success */}
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
