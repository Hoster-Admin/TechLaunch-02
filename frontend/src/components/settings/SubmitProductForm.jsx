import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productsAPI, entitiesAPI } from '../../utils/api';
import api from '../../utils/api';
import { SectionHead, AvatarCircleS } from './SettingsShared';
import { DRAFT_KEY } from './settingsConstants';

const SF_COUNTRIES = [
  ['sa','🇸🇦','Saudi Arabia'],['ae','🇦🇪','UAE'],['eg','🇪🇬','Egypt'],['jo','🇯🇴','Jordan'],
  ['ma','🇲🇦','Morocco'],['kw','🇰🇼','Kuwait'],['qa','🇶🇦','Qatar'],['bh','🇧🇭','Bahrain'],
  ['tn','🇹🇳','Tunisia'],['lb','🇱🇧','Lebanon'],['iq','🇮🇶','Iraq'],['om','🇴🇲','Oman'],
  ['ly','🇱🇾','Libya'],['dz','🇩🇿','Algeria'],['sy','🇸🇾','Syria'],['ye','🇾🇪','Yemen'],
  ['ps','🇵🇸','Palestine'],['sd','🇸🇩','Sudan'],['other','🌍','Other MENA'],
];
const SF_INDUSTRIES = ['Fintech','Edtech','Healthtech','E-Commerce','Logistics','AI & ML','Proptech','Cleantech','SaaS','Web3','Media','HR & Work','Foodtech','Traveltech','Other'];

const SI = { display:'block', width:'100%', padding:'11px 14px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box', background:'#fff', color:'#0a0a0a' };
const SL = { display:'block', fontSize:11, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 };

export default function SubmitProductForm({ user, onSuccess, onCancel, initialDraft }) {
  const [productType,    setProductType]    = useState(initialDraft?.type || null);
  const [form,           setForm]           = useState(initialDraft?.form || { name:'', tagline:'', website:'', industry:'', description:'', logoEmoji:'🚀', videoUrl:'', linkProfile:true });
  const [logoFile,       setLogoFile]       = useState(null);
  const [countries,      setCountries]      = useState(initialDraft?.selectedCountries || []);
  const [screenshots,    setScreenshots]    = useState([null,null,null,null]);
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  const [allEntities,    setAllEntities]    = useState([]);
  const [entityQ,        setEntityQ]        = useState(initialDraft?.selectedEntity?.name || '');
  const [entityResults,  setEntityResults]  = useState([]);
  const [entityOpen,     setEntityOpen]     = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(initialDraft?.selectedEntity || null);

  const [founderQ,       setFounderQ]       = useState('');
  const [founderResults, setFounderResults] = useState([]);
  const [founderOpen,    setFounderOpen]    = useState(false);
  const [coFounders,     setCoFounders]     = useState(initialDraft?.coFounders || []);

  const logoRef = useRef(null);
  const ssRefs  = [useRef(null),useRef(null),useRef(null),useRef(null)];

  useEffect(() => {
    entitiesAPI.list({ limit:50 }).then(r => setAllEntities(r.data?.data || r.data || [])).catch(()=>{});
  }, []);

  const fo = e => e.target.style.borderColor = 'var(--orange)';
  const bl = e => e.target.style.borderColor = '#e8e8e8';
  const toggleCountry = code => setCountries(p => p.includes(code) ? p.filter(c=>c!==code) : [...p, code]);

  const handleLogo = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setLogoFile(ev.target.result); r.readAsDataURL(f);
  };
  const handleSS = (i, e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setScreenshots(p => { const n=[...p]; n[i]=ev.target.result; return n; }); r.readAsDataURL(f);
  };
  const removeSS = (i, e) => { e.stopPropagation(); setScreenshots(p => { const n=[...p]; n[i]=null; return n; }); };

  const searchEntity = q => {
    setEntityQ(q);
    const lower = q.toLowerCase();
    setEntityResults(q.trim() ? allEntities.filter(e=>(e.name||'').toLowerCase().includes(lower)) : allEntities);
  };
  const searchFounder = async q => {
    setFounderQ(q);
    if (!q.trim()) { setFounderResults([]); return; }
    try {
      const res = await api.get(`/users?search=${encodeURIComponent(q)}&limit=6`);
      setFounderResults((res.data?.data||[]).filter(u => u.id !== user?.id && !coFounders.find(c=>c.id===u.id)));
    } catch { setFounderResults([]); }
  };

  const validate = () => {
    if (!productType) { toast.error('Select product type'); return false; }
    if (!form.name.trim()) { toast.error('Product name is required'); return false; }
    if (!form.tagline.trim()) { toast.error('Tagline is required'); return false; }
    if (!form.industry) { toast.error('Select an industry'); return false; }
    if (countries.length === 0) { toast.error('Select at least one country'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await productsAPI.create({
        name: form.name.trim(), tagline: form.tagline.trim(), industry: form.industry,
        description: form.description.trim() || null, website: form.website.trim() || null,
        logo_emoji: form.logoEmoji || '🚀', video_url: form.videoUrl.trim() || null,
        countries: countries.length > 0 ? countries : ['other'], tags: [],
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setSubmitted(true);
      onSuccess && onSuccess(form.name);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Try again.');
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:48, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>You're all set!</div>
        <div style={{ fontSize:15, color:'#555', marginBottom:12 }}>
          <strong>{form.name}</strong> has been submitted for review.
        </div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#fff9f7', border:'1.5px solid #ffd6c2', borderRadius:12, fontSize:14, color:'#c0600a', fontWeight:600, marginBottom:28 }}>
          ⏱ Under review — usually approved within 24 hours
        </div>
        <div><button onClick={onCancel} style={{ padding:'11px 28px', borderRadius:12, border:'none', background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Back to My Products</button></div>
      </div>
    );
  }

  const ssCount = screenshots.filter(Boolean).length;
  const entityList = entityQ.trim() ? entityResults : allEntities;

  return (
    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, overflow:'hidden' }}>
      <div style={{ padding:'20px 28px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={onCancel} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fafafa', fontSize:13, fontWeight:700, cursor:'pointer', color:'#555', flexShrink:0 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.01em' }}>Submit a Product</div>
          <div style={{ fontSize:12, color:'#aaa', marginTop:1 }}>Fill in the details below and submit — everything in one place.</div>
        </div>
      </div>

      <div style={{ padding:'28px 28px 36px' }}>
        <SectionHead icon="🚀" title="Launch Type"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:32 }}>
          {[['live','🚀','It\'s Live','Launched and ready to discover.'],
            ['soon','⏳','Coming Soon','Still building — collect a waitlist.']].map(([v,icon,label,desc]) => (
            <div key={v} onClick={() => setProductType(v)}
              style={{ border:`2px solid ${productType===v?'var(--orange)':'#e8e8e8'}`, borderRadius:14, padding:'18px 14px', cursor:'pointer', textAlign:'center', background:productType===v?'var(--orange-light)':'#fafafa', transition:'all .15s' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:12, color:'#888', lineHeight:1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        <SectionHead icon="🏷️" title="Product Identity"/>
        <div style={{ display:'flex', gap:20, marginBottom:20, alignItems:'flex-start' }}>
          <div style={{ flexShrink:0 }}>
            <label style={SL}>Logo</label>
            <div onClick={() => logoRef.current?.click()} style={{ position:'relative', width:80, height:80, borderRadius:20, overflow:'hidden', cursor:'pointer', background:'#f4f4f4', border:'1.5px solid #e8e8e8' }}>
              {logoFile
                ? <img src={logoFile} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="logo"/>
                : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36 }}>{form.logoEmoji||'🚀'}</div>
              }
              <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity .15s' }}
                onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                <span style={{ fontSize:20 }}>📷</span>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogo}/>
            {logoFile && <button onClick={()=>setLogoFile(null)} style={{ marginTop:6, fontSize:11, color:'#bbb', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline', display:'block' }}>Remove</button>}
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={SL}>Product Name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={SI} onFocus={fo} onBlur={bl}/>
            </div>
            <div>
              <label style={SL}>Tagline *</label>
              <input value={form.tagline} onChange={e=>setForm(f=>({...f,tagline:e.target.value}))} style={SI} onFocus={fo} onBlur={bl}/>
            </div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <label style={SL}>Website URL</label>
            <input type="url" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} style={SI} onFocus={fo} onBlur={bl}/>
          </div>
          <div>
            <label style={SL}>Industry *</label>
            <select value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} style={{ ...SI, cursor:'pointer' }} onFocus={fo} onBlur={bl}>
              <option value="">Select…</option>
              {SF_INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:32 }}>
          <label style={SL}>Description * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#bbb' }}>3 sentences max</span></label>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
            placeholder="What it does, who it's for, why it's different…"
            style={{ ...SI, resize:'vertical', lineHeight:1.6 }} onFocus={fo} onBlur={bl}/>
        </div>

        <SectionHead icon="🌍" title="Markets"/>
        <div style={{ marginBottom:32 }}>
          <label style={SL}>Available In * <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#bbb' }}>Select all that apply</span></label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, padding:12, border:'1.5px solid #e8e8e8', borderRadius:12, background:'#fafafa', minHeight:52 }}>
            {SF_COUNTRIES.map(([v,flag,name]) => (
              <span key={v} onClick={()=>toggleCountry(v)}
                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', userSelect:'none', transition:'all .12s', background:countries.includes(v)?'var(--orange)':'#f0f0f0', color:countries.includes(v)?'#fff':'#444' }}>
                {flag} {name}
              </span>
            ))}
          </div>
        </div>

        <SectionHead icon="🖼️" title="Media"/>
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'9px 14px', borderRadius:11, background: ssCount===4?'#f0fdf4':'#fafafa', border:`1px solid ${ssCount===4?'#bbf7d0':'#e8e8e8'}` }}>
            <div style={{ display:'flex', gap:5 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width:24, height:5, borderRadius:99, background:screenshots[i]?'var(--orange)':'#e0e0e0', transition:'background .2s' }}/>)}
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:ssCount===4?'#16a34a':'#aaa' }}>
              {ssCount===4 ? '✅ All 4 uploaded' : `${ssCount} / 4 photos`}
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[0,1,2,3].map(i => (
              <div key={i}>
                <input ref={ssRefs[i]} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleSS(i,e)}/>
                <div onClick={()=>ssRefs[i].current?.click()}
                  style={{ aspectRatio:'4/3', borderRadius:12, border:`1.5px dashed ${screenshots[i]?'transparent':'#ddd'}`, background:screenshots[i]?'transparent':'#f8f8f8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative', transition:'border-color .15s' }}
                  onMouseEnter={e=>{ if(!screenshots[i]) e.currentTarget.style.borderColor='var(--orange)'; }}
                  onMouseLeave={e=>{ if(!screenshots[i]) e.currentTarget.style.borderColor='#ddd'; }}>
                  {screenshots[i] ? (
                    <>
                      <img src={screenshots[i]} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt={`ss${i+1}`}/>
                      <button type="button" onClick={e=>removeSS(i,e)} style={{ position:'absolute',top:4,right:4,width:20,height:20,borderRadius:5,background:'rgba(0,0,0,.5)',border:'none',color:'#fff',fontSize:11,cursor:'pointer',display:'grid',placeItems:'center' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom:4 }}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span style={{ fontSize:9, color:'#ccc', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>Photo {i+1}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ flex:1, height:1, background:'#e8e8e8' }}/><span style={{ fontSize:11, fontWeight:700, color:'#bbb', letterSpacing:'.06em' }}>OR ADD A VIDEO</span><div style={{ flex:1, height:1, background:'#e8e8e8' }}/>
          </div>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
            <input type="url" value={form.videoUrl} placeholder="https://youtube.com/watch?v=…" onChange={e=>setForm(f=>({...f,videoUrl:e.target.value}))} style={{ ...SI, paddingLeft:34 }} onFocus={fo} onBlur={bl}/>
          </div>
        </div>

        <div style={{ marginBottom:32 }}>
          <SectionHead icon="🏢" title="Associated Entity"/>
          {selectedEntity ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', border:'1.5px solid var(--orange)', borderRadius:11, background:'var(--orange-light)' }}>
              <span style={{ fontSize:22 }}>{selectedEntity.logo_emoji||'🏢'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{selectedEntity.name}</div>
                <div style={{ fontSize:12, color:'#888', textTransform:'capitalize' }}>{(selectedEntity.type||selectedEntity.entity_type||'Company').replace('_',' ')}</div>
              </div>
              <button onClick={()=>{ setSelectedEntity(null); setEntityQ(''); }} style={{ background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#aaa',padding:4 }}>✕</button>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={entityQ} onChange={e=>{searchEntity(e.target.value);setEntityOpen(true);}}
                placeholder={`Search ${allEntities.length} registered companies…`}
                style={{ ...SI, paddingLeft:34 }}
                onFocus={()=>{setEntityOpen(true);if(!entityQ.trim())setEntityResults(allEntities);}}
                onBlur={()=>setTimeout(()=>setEntityOpen(false),180)}/>
              {entityOpen && entityList.length > 0 && (
                <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:200,background:'#fff',border:'1.5px solid #e8e8e8',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.12)',overflow:'hidden',maxHeight:200,overflowY:'auto' }}>
                  {entityList.map(e => (
                    <div key={e.id} onClick={()=>{setSelectedEntity(e);setEntityQ(e.name);setEntityOpen(false);}}
                      style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f4f4f4',transition:'background .1s' }}
                      onMouseEnter={ev=>ev.currentTarget.style.background='#fafafa'} onMouseLeave={ev=>ev.currentTarget.style.background='#fff'}>
                      <span style={{ fontSize:20 }}>{e.logo_emoji||'🏢'}</span>
                      <div>
                        <div style={{ fontSize:13,fontWeight:700 }}>{e.name}</div>
                        <div style={{ fontSize:11,color:'#aaa',textTransform:'capitalize' }}>{(e.type||e.entity_type||'Company').replace('_',' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <SectionHead icon="👥" title="Team & Visibility"/>
        <div onClick={()=>setForm(f=>({...f,linkProfile:!f.linkProfile}))}
          style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',border:`1.5px solid ${form.linkProfile?'var(--orange)':'#e8e8e8'}`,borderRadius:14,background:form.linkProfile?'var(--orange-light)':'#fafafa',cursor:'pointer',transition:'all .15s',marginBottom:10 }}>
          <div style={{ width:44,height:24,borderRadius:99,background:form.linkProfile?'var(--orange)':'#ddd',position:'relative',flexShrink:0,transition:'background .2s' }}>
            <div style={{ position:'absolute',top:3,left:form.linkProfile?23:3,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,.2)',transition:'left .2s' }}/>
          </div>
          <div>
            <div style={{ fontSize:14,fontWeight:700 }}>Tag my profile with this post</div>
            <div style={{ fontSize:12,color:'#888',marginTop:2 }}>Your name will appear on the product card as the maker</div>
          </div>
        </div>
        <div style={{ marginBottom:32 }}>
          <label style={{ ...SL, marginTop:16 }}>Tag co-founders / collaborators <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#bbb' }}>Optional</span></label>
          {coFounders.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
              {coFounders.map(cf => (
                <div key={cf.id} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 10px 5px 6px', border:'1.5px solid var(--orange)', borderRadius:20, background:'var(--orange-light)' }}>
                  <AvatarCircleS u={cf} size={22}/>
                  <span style={{ fontSize:13, fontWeight:700 }}>{cf.name}</span>
                  <button onClick={()=>setCoFounders(p=>p.filter(c=>c.id!==cf.id))} style={{ background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:14,padding:'0 0 0 2px',lineHeight:1 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={founderQ} onChange={e=>{searchFounder(e.target.value);setFounderOpen(true);}}
              placeholder="Search by name or @handle…" style={{ ...SI, paddingLeft:34 }}
              onFocus={()=>setFounderOpen(true)} onBlur={()=>setTimeout(()=>setFounderOpen(false),180)}/>
            {founderOpen && founderResults.length > 0 && (
              <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:200,background:'#fff',border:'1.5px solid #e8e8e8',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,.12)',overflow:'hidden' }}>
                {founderResults.map(u => (
                  <div key={u.id} onClick={()=>{ setCoFounders(p=>p.find(c=>c.id===u.id)?p:[...p,u]); setFounderQ(''); setFounderResults([]); setFounderOpen(false); }}
                    style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f4f4f4',transition:'background .1s' }}
                    onMouseEnter={ev=>ev.currentTarget.style.background='#fafafa'} onMouseLeave={ev=>ev.currentTarget.style.background='#fff'}>
                    <AvatarCircleS u={u} size={34}/>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700 }}>{u.name}</div>
                      <div style={{ fontSize:11,color:'#aaa' }}>@{u.handle} · {u.persona||'Member'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', background:'#fafafa', borderRadius:14, border:'1px solid #f0f0f0', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontSize:12, color:'#888', lineHeight:1.5 }}>
            ⏱ <strong style={{ color:'#555' }}>Under review</strong> — usually approved within 24 hours after submission.
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ padding:'13px 32px', borderRadius:12, border:'none', background:submitting?'#e8e8e8':'var(--orange)', color:submitting?'#aaa':'#fff', fontSize:15, fontWeight:800, cursor:submitting?'not-allowed':'pointer', transition:'all .15s', flexShrink:0 }}>
            {submitting ? 'Submitting…' : '🚀 Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
