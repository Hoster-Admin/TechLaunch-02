import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { productsAPI, entitiesAPI, uploadAPI } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DRAFT_KEY = 'tlmena_draft_product';

const COUNTRIES = [
  ['sa','🇸🇦','Saudi Arabia'],['ae','🇦🇪','UAE'],['eg','🇪🇬','Egypt'],['jo','🇯🇴','Jordan'],
  ['ma','🇲🇦','Morocco'],['kw','🇰🇼','Kuwait'],['qa','🇶🇦','Qatar'],['bh','🇧🇭','Bahrain'],
  ['tn','🇹🇳','Tunisia'],['lb','🇱🇧','Lebanon'],['iq','🇮🇶','Iraq'],['om','🇴🇲','Oman'],
  ['ly','🇱🇾','Libya'],['dz','🇩🇿','Algeria'],['sy','🇸🇾','Syria'],['ye','🇾🇪','Yemen'],
  ['ps','🇵🇸','Palestine'],['sd','🇸🇩','Sudan'],['other','🌍','Other MENA'],
];
const INDUSTRIES = ['Fintech','Edtech','Healthtech','E-Commerce','Logistics','AI & ML','Proptech','Cleantech','SaaS','Web3','Media','HR & Work','Foodtech','Traveltech','Other'];

const inp = { display:'block', width:'100%', padding:'11px 14px', borderRadius:11, border:'1.5px solid #e8e8e8', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box', background:'#fff' };
const lbl = { display:'block', fontSize:12, fontWeight:700, color:'#999', letterSpacing:'.01em', marginBottom:7 };

const Prog = ({ step }) => (
  <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:28, paddingRight:40 }}>
    <div style={{ fontSize:11, fontWeight:700, color:'#aaa', marginRight:8, whiteSpace:'nowrap' }}>Step {step} of 5</div>
    {[1,2,3,4,5].map(s => (
      <React.Fragment key={s}>
        <div style={{ width:s===step?60:28, height:6, borderRadius:99, background:s<=step?'var(--orange)':'#e8e8e8', transition:'all .25s', flexShrink:0 }}/>
        {s < 5 && <div style={{ width:8, height:6, borderRadius:99, background:s<step?'var(--orange)':'#e8e8e8', flexShrink:0 }}/>}
      </React.Fragment>
    ))}
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

const AvatarCircle = ({ user, size=32 }) => {
  const colors = ['#FF6B35','#E63946','#457B9D','#2A9D8F','#E9C46A','#7B2D8B'];
  const bg = user.avatar_color || colors[(user.handle||'').charCodeAt(0) % colors.length] || '#FF6B35';
  const initials = (user.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if (user.avatar_url) return <img src={user.avatar_url} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover' }} alt={user.name}/>;
  return <div style={{ width:size, height:size, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:800, color:'#fff', flexShrink:0 }}>{initials}</div>;
};

function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
}
function loadDraft() {
  try { const d = localStorage.getItem(DRAFT_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

export default function SubmitProductModal({ open, onClose }) {
  const { user } = useAuth();
  const { addNotification } = useUI();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ name:'', tagline:'', industry:'', stage:'', description:'', website:'', logoEmoji:'🚀', videoUrl:'', linkProfile:true });
  const [logoFile, setLogoFile] = useState(null);
  const [logoRawFile, setLogoRawFile] = useState(null);
  const [selectedCountries, setCountries] = useState([]);
  const [screenshots, setScreenshots] = useState([null, null, null, null]);
  const [screenshotFiles, setScreenshotFiles] = useState([null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);

  // Country tag-input
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDDOpen, setCountryDDOpen] = useState(false);

  // Custom dropdowns
  const [industryDDOpen, setIndustryDDOpen] = useState(false);
  const [stageDDOpen, setStageDDOpen] = useState(false);

  // Inline field validation
  const [fieldErrors, setFieldErrors] = useState({});
  const validateField = (field, value) => {
    if (field === 'name' && value.trim().length < 3) return 'Minimum 3 characters';
    if (field === 'tagline' && value.trim().length < 10) return 'Minimum 10 characters';
    if (field === 'website' && value.trim() && !/^https:\/\/.+\..+/.test(value.trim())) return 'Must start with https://';
    return '';
  };
  const isStep2Valid = () => {
    return form.name.trim().length >= 3 && form.tagline.trim().length >= 10
      && (!form.website.trim() || /^https:\/\/.+\..+/.test(form.website.trim()))
      && form.description.length < 500;
  };
  const handleFieldBlur = (field, value) => {
    if (!value.trim() && field !== 'website') return;
    const err = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };
  const handleFieldChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      const err = validateField(field, value);
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  // Entity search
  const [entityQ, setEntityQ] = useState('');
  const [entityResults, setEntityResults] = useState([]);
  const [allEntities, setAllEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityOpen, setEntityOpen] = useState(false);

  // Co-founder search (Step 4)
  const [founderQ, setFounderQ] = useState('');
  const [founderResults, setFounderResults] = useState([]);
  const [coFounders, setCoFounders] = useState([]);
  const [founderOpen, setFounderOpen] = useState(false);

  // Draft dialog
  const [draftPrompt, setDraftPrompt] = useState(null); // 'save' | 'restore'
  const [pendingDraft, setPendingDraft] = useState(null);

  const logoInputRef = useRef(null);
  const screenshotRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Load all entities on mount
  useEffect(() => {
    entitiesAPI.list({ limit: 50 }).then(res => {
      setAllEntities(res.data?.data || res.data || []);
    }).catch(() => {});
  }, []);

  // Check for draft when modal opens
  useEffect(() => {
    if (!open) return;
    const draft = loadDraft();
    if (draft && draft.form?.name) {
      setPendingDraft(draft);
      setDraftPrompt('restore');
    }
  }, [open]);

  if (!open) return null;

  const restoreDraft = () => {
    if (!pendingDraft) return;
    setStep(pendingDraft.step || 1);
    setType(pendingDraft.type || null);
    setForm(pendingDraft.form || { name:'', tagline:'', industry:'', stage:'', description:'', website:'', logoEmoji:'🚀', videoUrl:'', linkProfile:true });
    setCountries(pendingDraft.selectedCountries || []);
    setSelectedEntity(pendingDraft.selectedEntity || null);
    setEntityQ(pendingDraft.selectedEntity?.name || '');
    setCoFounders(pendingDraft.coFounders || []);
    setDraftPrompt(null);
    setPendingDraft(null);
  };

  const discardDraft = () => {
    clearDraft();
    setPendingDraft(null);
    setDraftPrompt(null);
  };

  const reset = () => {
    setStep(1); setType(null);
    setForm({ name:'', tagline:'', industry:'', stage:'', description:'', website:'', logoEmoji:'🚀', videoUrl:'', linkProfile:true });
    setLogoFile(null); setLogoRawFile(null); setCountries([]); setScreenshots([null,null,null,null]); setScreenshotFiles([null,null,null,null]);
    setEntityQ(''); setSelectedEntity(null); setEntityResults([]);
    setFounderQ(''); setFounderResults([]); setCoFounders([]);
    setDraftPrompt(null); setPendingDraft(null);
  };

  const handleClose = () => {
    const hasData = type !== null || form.name.trim() || form.tagline.trim() || form.description.trim() || selectedCountries.length > 0 || coFounders.length > 0;
    if (hasData) {
      setDraftPrompt('save');
      return;
    }
    reset(); onClose();
  };

  const confirmSaveDraft = () => {
    saveDraft({ step, type, form, selectedCountries, selectedEntity, coFounders });
    toast.success('Draft saved — find it in Settings → My Products');
    reset(); onClose();
  };

  const confirmDiscardAndClose = () => {
    clearDraft();
    reset(); onClose();
  };

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };
  const toggleCountry = (code) => setCountries(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code]);
  const fo = e => { e.target.style.borderColor='var(--orange)'; };
  const bl = e => { e.target.style.borderColor='#e8e8e8'; };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoRawFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoFile(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleScreenshot = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshotFiles(prev => { const n=[...prev]; n[idx]=file; return n; });
    const reader = new FileReader();
    reader.onload = ev => setScreenshots(prev => { const n=[...prev]; n[idx]=ev.target.result; return n; });
    reader.readAsDataURL(file);
  };

  const removeScreenshot = (idx, e) => {
    e.stopPropagation();
    setScreenshots(prev => { const n=[...prev]; n[idx]=null; return n; });
    setScreenshotFiles(prev => { const n=[...prev]; n[idx]=null; return n; });
  };

  const searchEntities = async (q) => {
    setEntityQ(q);
    if (!q.trim()) {
      setEntityResults(allEntities);
      return;
    }
    const lower = q.toLowerCase();
    setEntityResults(allEntities.filter(e => (e.name||'').toLowerCase().includes(lower) || (e.type||'').toLowerCase().includes(lower)));
  };

  const searchFounders = async (q) => {
    setFounderQ(q);
    if (!q.trim()) { setFounderResults([]); return; }
    try {
      const res = await api.get(`/users?search=${encodeURIComponent(q)}&limit=6`);
      const results = (res.data?.data || []).filter(u => u.id !== user?.id && !coFounders.find(c=>c.id===u.id));
      setFounderResults(results);
    } catch { setFounderResults([]); }
  };

  const addCoFounder = (u) => {
    setCoFounders(prev => prev.find(c=>c.id===u.id) ? prev : [...prev, u]);
    setFounderQ('');
    setFounderResults([]);
    setFounderOpen(false);
  };

  const removeCoFounder = (id) => setCoFounders(prev => prev.filter(c=>c.id!==id));

  const isValidYouTubeUrl = (url) => {
    if (!url || !url.trim()) return true;
    return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url.trim());
  };

  const [videoUrlError, setVideoUrlError] = useState('');

  const validateStep2 = () => {
    const errs = {};
    errs.name = validateField('name', form.name);
    errs.tagline = validateField('tagline', form.tagline);
    errs.website = validateField('website', form.website);
    Object.keys(errs).forEach(k => { if (!errs[k]) delete errs[k]; });
    if (Object.keys(errs).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...errs }));
      toast.error(Object.values(errs)[0]);
      return false;
    }
    if (!form.industry) { toast.error('Please select an industry'); return false; }
    if (selectedCountries.length === 0) { toast.error('Select at least one country'); return false; }
    if (form.description.length >= 500) { toast.error('Short description exceeds the character limit'); return false; }
    return true;
  };

  const submit = async () => {
    if (!form.name.trim() || !form.tagline.trim() || !form.industry) {
      toast.error('Please complete all required fields'); return;
    }
    setSubmitting(true);
    try {
      // Upload logo image if a file was selected
      let logoUrl = null;
      if (logoRawFile) {
        try {
          const uploadRes = await uploadAPI.postImage(logoRawFile);
          logoUrl = uploadRes.data?.data?.url || null;
        } catch { /* continue without logo URL */ }
      }

      // Create product
      const res = await productsAPI.create({
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        industry: form.industry,
        stage: form.stage || null,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        logo_emoji: form.logoEmoji || '🚀',
        logo_url: logoUrl,
        video_url: form.videoUrl.trim() || null,
        countries: selectedCountries.length > 0 ? selectedCountries : ['other'],
        tags: [],
        maker_ids: coFounders.map(cf => cf.id),
      });

      const productId = res.data?.data?.id;

      // Upload screenshots and attach to product
      if (productId) {
        const uploads = screenshotFiles
          .map((file, idx) => file ? { file, idx } : null)
          .filter(Boolean);
        for (const { file, idx } of uploads) {
          try {
            const uploadRes = await uploadAPI.postImage(file);
            const url = uploadRes.data?.data?.url;
            if (url) {
              await api.post(`/products/${productId}/media`, { url, type:'screenshot', order_num: idx });
            }
          } catch { /* non-fatal, skip this screenshot */ }
        }
      }

      clearDraft();
      addNotification('product', `Your product "${form.name}" was submitted for review 🚀`, '🚀');
      setStep(6);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const entityDisplayList = entityQ.trim() ? entityResults : allEntities;

  return (
    <div onClick={handleOverlayClick} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'93vh', overflowY:'auto', padding:'32px 36px', position:'relative', boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}>

        {/* ── Draft: restore prompt ── */}
        {draftPrompt === 'restore' && (
          <div style={{ position:'absolute', inset:0, zIndex:9999, background:'rgba(255,255,255,.97)', borderRadius:20, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:16 }}>📝</div>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>You have a saved draft</div>
            <div style={{ fontSize:14, color:'#666', marginBottom:8 }}><strong>{pendingDraft?.form?.name || 'Untitled product'}</strong></div>
            <div style={{ fontSize:13, color:'#aaa', marginBottom:28 }}>
              Saved {pendingDraft?.savedAt ? new Date(pendingDraft.savedAt).toLocaleDateString() : ''}
            </div>
            <div style={{ display:'flex', gap:12, width:'100%' }}>
              <button onClick={discardDraft} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#f8f8f8', fontSize:14, fontWeight:700, cursor:'pointer', color:'#666' }}>Start Fresh</button>
              <button onClick={restoreDraft} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'none', background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>Continue Draft →</button>
            </div>
          </div>
        )}

        {/* ── Draft: save-on-close prompt ── */}
        {draftPrompt === 'save' && (
          <div style={{ position:'absolute', inset:0, zIndex:9999, background:'rgba(255,255,255,.97)', borderRadius:20, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:16 }}>💾</div>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Save your progress?</div>
            <div style={{ fontSize:14, color:'#666', marginBottom:28, lineHeight:1.6 }}>
              Your draft will be saved and you can continue later from <strong>Settings → My Products</strong>.
            </div>
            <div style={{ display:'flex', gap:12, width:'100%' }}>
              <button onClick={confirmDiscardAndClose} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#f8f8f8', fontSize:14, fontWeight:700, cursor:'pointer', color:'#e63946' }}>Discard</button>
              <button onClick={confirmSaveDraft} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'none', background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>Save Draft 💾</button>
            </div>
          </div>
        )}

        <button onClick={handleClose} style={{ position:'absolute', top:16, right:16, width:32, height:32, borderRadius:8, border:'1px solid #e8e8e8', background:'transparent', display:'grid', placeItems:'center', cursor:'pointer', fontSize:16, color:'#aaa' }}>✕</button>

        {/* ── Step 1: Type ── */}
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

        {/* ── Step 2: Details ── */}
        {step === 2 && <>
          <Prog step={2}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Tell us about it</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>The basics — you can edit everything later.</div>

          {/* Logo */}
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Product logo</label>
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
                {logoFile && <button type="button" onClick={() => setLogoFile(null)}
                  style={{ marginTop:6, fontSize:11, color:'#aaa', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline' }}>Remove</button>}
              </div>
            </div>
          </div>

          {[['name','Product name *'],['tagline','Tagline *'],['website','Website URL']].map(([k,label]) => (
            <div key={k} style={{ marginBottom:16 }}>
              <label style={lbl}>{label}</label>
              <input type={k==='website'?'url':'text'} value={form[k]}
                onChange={e => handleFieldChange(k, e.target.value)}
                style={{ ...inp, borderColor: fieldErrors[k] ? '#dc2626' : undefined }}
                onFocus={fo}
                onBlur={e => { bl(e); handleFieldBlur(k, e.target.value); }}
                placeholder={k==='name'?'Your product name':k==='tagline'?'A short, catchy tagline':k==='website'?'https://yourproduct.com':''}/>
              {fieldErrors[k] && <div style={{ fontSize:11, fontWeight:600, color:'#dc2626', marginTop:4 }}>{fieldErrors[k]}</div>}
            </div>
          ))}

          <div style={{ marginBottom:16, position:'relative' }}>
            <label style={lbl}>Industry *</label>
            <div onClick={() => { setIndustryDDOpen(!industryDDOpen); setStageDDOpen(false); }}
              style={{ ...inp, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', borderColor: industryDDOpen ? 'var(--orange)' : undefined }}>
              <span style={{ color: form.industry ? '#0a0a0a' : '#aaa' }}>{form.industry || 'Select…'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            {industryDDOpen && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', marginTop:4, maxHeight:220, overflowY:'auto' }}>
                {INDUSTRIES.map(i => (
                  <div key={i} onClick={() => { setForm(f=>({...f,industry:i})); setIndustryDDOpen(false); }}
                    style={{ padding:'10px 14px', cursor:'pointer', fontSize:13, fontWeight: form.industry===i?700:500, color: form.industry===i?'var(--orange)':'#333', background: form.industry===i?'var(--orange-light)':'#fff', borderBottom:'1px solid #f4f4f4', transition:'background .1s' }}
                    onMouseEnter={ev => { if(form.industry!==i) ev.currentTarget.style.background='#fafafa'; }}
                    onMouseLeave={ev => { if(form.industry!==i) ev.currentTarget.style.background='#fff'; }}>
                    {i}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom:16, position:'relative' }}>
            <label style={lbl}>Stage</label>
            <div onClick={() => { setStageDDOpen(!stageDDOpen); setIndustryDDOpen(false); }}
              style={{ ...inp, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', borderColor: stageDDOpen ? 'var(--orange)' : undefined }}>
              <span style={{ color: form.stage ? '#0a0a0a' : '#aaa' }}>{form.stage || 'Select stage (optional)'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            {stageDDOpen && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', marginTop:4, maxHeight:220, overflowY:'auto' }}>
                {['Idea Stage','Pre-Seed','Seed','Series A','Series B+','Bootstrapped'].map(s => (
                  <div key={s} onClick={() => { setForm(f=>({...f,stage:s})); setStageDDOpen(false); }}
                    style={{ padding:'10px 14px', cursor:'pointer', fontSize:13, fontWeight: form.stage===s?700:500, color: form.stage===s?'var(--orange)':'#333', background: form.stage===s?'var(--orange-light)':'#fff', borderBottom:'1px solid #f4f4f4', transition:'background .1s' }}
                    onMouseEnter={ev => { if(form.stage!==s) ev.currentTarget.style.background='#fafafa'; }}
                    onMouseLeave={ev => { if(form.stage!==s) ev.currentTarget.style.background='#fff'; }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom:16, position:'relative' }}>
            <label style={lbl}>Available in * <span style={{ fontWeight:400, fontSize:11, color:'#aaa' }}>Select all that apply</span></label>
            <div onClick={() => { setCountryDDOpen(true); setIndustryDDOpen(false); setStageDDOpen(false); }}
              style={{ ...inp, display:'flex', flexWrap:'wrap', gap:6, padding:'8px 10px', minHeight:44, cursor:'text', borderColor: countryDDOpen ? 'var(--orange)' : undefined }}>
              {selectedCountries.map(v => {
                const c = COUNTRIES.find(([code]) => code === v);
                if (!c) return null;
                return <span key={v} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:16, fontSize:12, fontWeight:600, background:'var(--orange)', color:'#fff', whiteSpace:'nowrap' }}>
                  {c[1]} {c[2]}
                  <span onClick={e => { e.stopPropagation(); toggleCountry(v); }} style={{ cursor:'pointer', marginLeft:2, fontSize:14, lineHeight:1 }}>×</span>
                </span>;
              })}
              <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                placeholder={selectedCountries.length === 0 ? 'Search countries…' : ''}
                style={{ border:'none', outline:'none', fontSize:13, flex:1, minWidth:80, background:'transparent', fontFamily:"'DM Sans',sans-serif", padding:'3px 0' }}
                onFocus={() => setCountryDDOpen(true)}
                onBlur={() => setTimeout(() => setCountryDDOpen(false), 180)}/>
            </div>
            {countryDDOpen && (() => {
              const filtered = COUNTRIES.filter(([v,,name]) =>
                !selectedCountries.includes(v) && name.toLowerCase().includes(countrySearch.toLowerCase())
              );
              if (filtered.length === 0) return null;
              return <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', marginTop:4, maxHeight:200, overflowY:'auto' }}>
                {filtered.map(([v, flag, name]) => (
                  <div key={v} onMouseDown={e => e.preventDefault()} onClick={() => { toggleCountry(v); setCountrySearch(''); }}
                    style={{ padding:'10px 14px', cursor:'pointer', fontSize:13, fontWeight:500, color:'#333', borderBottom:'1px solid #f4f4f4', display:'flex', alignItems:'center', gap:8, transition:'background .1s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background='#fafafa'}
                    onMouseLeave={ev => ev.currentTarget.style.background='#fff'}>
                    <span>{flag}</span> {name}
                  </div>
                ))}
              </div>;
            })()}
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Short description * <span style={{ fontWeight:400, fontSize:11, color:'#aaa' }}>3 sentences max</span></label>
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3}
              placeholder="What it does, who it's for, why it's different..."
              style={{ ...inp, resize:'vertical', lineHeight:1.6, borderColor: form.description.length >= 500 ? '#dc2626' : undefined }} onFocus={fo} onBlur={bl}/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
              {form.description.length >= 500
                ? <span style={{ fontSize:11, fontWeight:600, color:'#dc2626' }}>Character limit reached</span>
                : <span/>}
              <span style={{ fontSize:11, fontWeight:600,
                color: form.description.length >= 500 ? '#dc2626' : form.description.length >= 450 ? 'var(--orange)' : '#bbb' }}>
                {form.description.length} / 500
              </span>
            </div>
          </div>

          {/* Associated Entity — shows all 17 on focus */}
          <div style={{ marginBottom:20, position:'relative' }}>
            <label style={lbl}>Associated entity <span style={{ fontWeight:400, fontSize:11, color:'#aaa' }}>Optional — link to a registered company</span></label>
            {selectedEntity ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'1.5px solid var(--orange)', borderRadius:11, background:'var(--orange-light)' }}>
                <span style={{ fontSize:20 }}>{selectedEntity.logo_emoji || '🏢'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{selectedEntity.name}</div>
                  <div style={{ fontSize:12, color:'#888', textTransform:'capitalize' }}>{(selectedEntity.type || selectedEntity.entity_type || 'Company').replace('_',' ')}</div>
                </div>
                <button type="button" onClick={() => { setSelectedEntity(null); setEntityQ(''); }}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#aaa', padding:4 }}>✕</button>
              </div>
            ) : (
              <>
                <div style={{ position:'relative' }}>
                  <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input value={entityQ}
                    onChange={e => { searchEntities(e.target.value); setEntityOpen(true); }}
                    placeholder={`Search ${allEntities.length} registered companies…`}
                    style={{ ...inp, paddingLeft:34 }}
                    onFocus={() => { setEntityOpen(true); if (!entityQ.trim()) setEntityResults(allEntities); }}
                    onBlur={() => setTimeout(() => setEntityOpen(false), 180)}/>
                </div>
                {entityOpen && entityDisplayList.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', overflow:'hidden', marginTop:4, maxHeight:220, overflowY:'auto' }}>
                    {entityDisplayList.map(e => (
                      <div key={e.id} onClick={() => { setSelectedEntity(e); setEntityQ(e.name); setEntityOpen(false); }}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f4f4f4', transition:'background .1s' }}
                        onMouseEnter={ev => ev.currentTarget.style.background='#fafafa'} onMouseLeave={ev => ev.currentTarget.style.background='#fff'}>
                        <span style={{ fontSize:20 }}>{e.logo_emoji || '🏢'}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700 }}>{e.name}</div>
                          <div style={{ fontSize:11, color:'#aaa', textTransform:'capitalize' }}>{(e.type || e.entity_type || 'Company').replace('_',' ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {(() => {
            const blocked = !isStep2Valid();
            return <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep(1)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
              <button onClick={() => validateStep2() && setStep(3)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background: blocked ? '#e8e8e8' : 'var(--orange)', color: blocked ? '#bbb' : '#fff', cursor: blocked ? 'not-allowed' : 'pointer' }}>Next →</button>
            </div>;
          })()}
        </>}

        {/* ── Step 3: Media ── */}
        {step === 3 && (()=>{
          const filled = screenshots.filter(Boolean).length;
          const hasVideo = form.videoUrl.trim().length > 0;
          const mediaOk = filled === 4 || hasVideo;
          return <>
          <Prog step={3}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>Add media</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:16 }}>Upload <strong>4 screenshots</strong> — or add a <strong>demo video</strong> instead.</div>

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

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:'#e8e8e8' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'#bbb', letterSpacing:'.06em' }}>OR ADD A VIDEO</span>
            <div style={{ flex:1, height:1, background:'#e8e8e8' }}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Demo video URL <span style={{ fontWeight:400, fontSize:11, color:'#aaa' }}>YouTube link</span></label>
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
              <input type="url" value={form.videoUrl} placeholder="https://youtube.com/watch?v=…" onChange={e => { setForm(f=>({...f,videoUrl:e.target.value})); if (videoUrlError) setVideoUrlError(''); }}
                style={{ ...inp, paddingLeft:34, borderColor: videoUrlError ? '#dc2626' : undefined }}
                onFocus={fo}
                onBlur={e => { bl(e); if (e.target.value.trim() && !isValidYouTubeUrl(e.target.value)) setVideoUrlError('Please enter a valid YouTube URL.'); else setVideoUrlError(''); }}/>
            </div>
            {videoUrlError && <div style={{ fontSize:11, fontWeight:600, color:'#dc2626', marginTop:4 }}>{videoUrlError}</div>}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(2)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            {(() => { const invalidVideo = !!(form.videoUrl.trim() && !isValidYouTubeUrl(form.videoUrl)); return <button onClick={() => {
              if (invalidVideo) { setVideoUrlError('Please enter a valid YouTube URL.'); return; }
              setStep(4);
            }} disabled={invalidVideo} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background: invalidVideo ? '#e8e8e8' : 'var(--orange)', color: invalidVideo ? '#bbb' : '#fff', cursor: invalidVideo ? 'not-allowed' : 'pointer' }}>
              {mediaOk ? 'Next →' : 'Skip for now →'}
            </button>; })()}
          </div>
        </>})()}

        {/* ── Step 4: Visibility + Co-founders ── */}
        {step === 4 && <>
          <Prog step={4}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:6 }}>Team & visibility</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:24 }}>Tag your team and control how this post appears.</div>

          {/* Profile toggle */}
          <Toggle on={form.linkProfile} onChange={() => setForm(f=>({...f,linkProfile:!f.linkProfile}))}
            label="Tag my public profile with this post"
            sub="Your name and handle will appear on the product card:"
            handle={user?.handle}/>

          <div style={{ padding:'10px 14px', background:'#f8f8f8', borderRadius:10, fontSize:13, color:'#666', marginBottom:20, marginTop:10 }}>
            <strong style={{ color:'#0a0a0a' }}>Preview:</strong> Product will show <span style={{ color:'var(--orange)', fontWeight:700 }}>{form.linkProfile ? (user?.name || 'your name') : 'Anonymous'}</span> as the maker.
          </div>

          {/* Co-founder tagging */}
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Tag co-founders / collaborators <span style={{ fontWeight:400, fontSize:11, color:'#aaa' }}>Others working on this product</span></label>

            {/* Tagged co-founders list */}
            {coFounders.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                {coFounders.map(cf => (
                  <div key={cf.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'1.5px solid var(--orange)', borderRadius:12, background:'var(--orange-light)' }}>
                    <AvatarCircle user={cf} size={36}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{cf.name}</div>
                      <div style={{ fontSize:12, color:'#888' }}>@{cf.handle}</div>
                    </div>
                    <button type="button" onClick={() => removeCoFounder(cf.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#aaa', padding:4 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={founderQ}
                onChange={e => { searchFounders(e.target.value); setFounderOpen(true); }}
                placeholder="Search by name or @handle…"
                style={{ ...inp, paddingLeft:34 }}
                onFocus={() => setFounderOpen(true)}
                onBlur={() => setTimeout(() => setFounderOpen(false), 180)}/>
            </div>
            {founderOpen && founderResults.length > 0 && (
              <div style={{ position:'relative', zIndex:100 }}>
                <div style={{ position:'absolute', top:4, left:0, right:0, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', overflow:'hidden' }}>
                  {founderResults.map(u => (
                    <div key={u.id} onClick={() => addCoFounder(u)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f4f4f4', transition:'background .1s' }}
                      onMouseEnter={ev => ev.currentTarget.style.background='#fafafa'} onMouseLeave={ev => ev.currentTarget.style.background='#fff'}>
                      <AvatarCircle user={u} size={34}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700 }}>{u.name}</div>
                        <div style={{ fontSize:11, color:'#aaa' }}>@{u.handle} · {u.persona || 'Member'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {founderQ.length > 1 && founderResults.length === 0 && founderOpen && (
              <div style={{ padding:'10px 14px', fontSize:13, color:'#aaa', background:'#fafafa', borderRadius:10, marginTop:4 }}>
                No members found for "{founderQ}"
              </div>
            )}
            <div style={{ fontSize:12, color:'#bbb', marginTop:8 }}>They'll be notified and can confirm their role after you launch.</div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(3)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={() => setStep(5)} style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer' }}>Review →</button>
          </div>
        </>}

        {/* ── Step 5: Review ── */}
        {step === 5 && <>
          <Prog step={5}/>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>Review your listing</div>
          <div style={{ fontSize:14, color:'#666', marginBottom:20 }}>Looks good? Hit submit and we'll review it within 24 hours.</div>

          {/* Product card preview */}
          <div style={{ border:'1.5px solid #e8e8e8', borderRadius:16, padding:20, marginBottom:16, background:'#fafafa' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
              {/* Big logo */}
              <div style={{ width:80, height:80, borderRadius:20, overflow:'hidden', background:'#f0f0f0', flexShrink:0, border:'2px solid #e8e8e8' }}>
                {logoFile
                  ? <img src={logoFile} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="logo"/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>{form.logoEmoji || '🚀'}</div>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>{form.name || '—'}</div>
                <div style={{ fontSize:13, color:'#666', lineHeight:1.5 }}>{form.tagline || '—'}</div>
                {form.website && <div style={{ fontSize:12, color:'var(--orange)', marginTop:4 }}>{form.website}</div>}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div style={{ background:'#fff', border:'1px solid #f0f0f0', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Industry</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{form.industry || '—'}</div>
              </div>
              <div style={{ background:'#fff', border:'1px solid #f0f0f0', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Type</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{type === 'live' ? '🚀 Live' : '⏳ Coming Soon'}</div>
              </div>
            </div>

            {selectedCountries.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Available In</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {selectedCountries.map(code => {
                    const c = COUNTRIES.find(([v])=>v===code);
                    return c ? <span key={code} style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'#f0f0f0', fontWeight:600 }}>{c[1]} {c[2]}</span> : null;
                  })}
                </div>
              </div>
            )}

            {form.description && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Description</div>
                <div style={{ fontSize:13, color:'#444', lineHeight:1.6 }}>{form.description}</div>
              </div>
            )}

            {selectedEntity && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#fff', border:'1px solid #f0f0f0', borderRadius:10, marginBottom:12 }}>
                <span style={{ fontSize:18 }}>{selectedEntity.logo_emoji || '🏢'}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.04em' }}>Associated With</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{selectedEntity.name}</div>
                </div>
              </div>
            )}

            {coFounders.length > 0 && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Team</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {form.linkProfile && user && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'#f0f0f0', borderRadius:20 }}>
                      <AvatarCircle user={user} size={20}/>
                      <span style={{ fontSize:12, fontWeight:700 }}>{user.name}</span>
                      <span style={{ fontSize:11, color:'#888' }}>(you)</span>
                    </div>
                  )}
                  {coFounders.map(cf => (
                    <div key={cf.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'#f0f0f0', borderRadius:20 }}>
                      <AvatarCircle user={cf} size={20}/>
                      <span style={{ fontSize:12, fontWeight:700 }}>{cf.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop:12, padding:'8px 12px', background: form.linkProfile ? 'var(--orange-light)' : '#f8f8f8', borderRadius:10, fontSize:12, color:'#666', border:`1px solid ${form.linkProfile ? '#ffd6c2' : '#f0f0f0'}` }}>
              {form.linkProfile
                ? <>Posted by <span style={{ fontWeight:700, color:'var(--orange)' }}>@{user?.handle}</span></>
                : 'Posted anonymously'}
            </div>
          </div>

          <div style={{ padding:'12px 16px', background:'#fff9f7', border:'1px solid #ffe4d4', borderRadius:12, fontSize:13, color:'#c0600a', marginBottom:20, lineHeight:1.6 }}>
            ⏱ <strong>Under review</strong> — usually approved within 24 hours.
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(4)} style={{ flex:'0 0 80px', padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:'#f4f4f4', color:'#444', cursor:'pointer' }}>← Back</button>
            <button onClick={submit} disabled={submitting}
              style={{ flex:1, padding:14, borderRadius:12, fontSize:15, fontWeight:800, border:'none', background:submitting?'#e8e8e8':'var(--orange)', color:submitting?'#aaa':'#fff', cursor:submitting?'not-allowed':'pointer', transition:'all .15s' }}>
              {submitting ? 'Submitting…' : '🚀 Submit for Review'}
            </button>
          </div>
        </>}

        {/* ── Step 6: Success ── */}
        {step === 6 && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-.02em', marginBottom:8 }}>You're all set!</div>
            <div style={{ fontSize:15, color:'#555', lineHeight:1.7, marginBottom:8 }}>
              <strong>{form.name}</strong> has been submitted.
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#fff9f7', border:'1.5px solid #ffd6c2', borderRadius:12, fontSize:14, color:'#c0600a', fontWeight:600, marginBottom:28, lineHeight:1.5 }}>
              ⏱ Under review — usually approved within 24 hours
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => { reset(); onClose(); }} style={{ padding:'12px 28px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#f8f8f8', fontSize:14, fontWeight:700, cursor:'pointer', color:'#444' }}>Close</button>
              <button onClick={() => { reset(); }} style={{ padding:'12px 28px', borderRadius:12, border:'none', background:'var(--orange)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>Submit Another 🚀</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
