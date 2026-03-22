import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState, SkeletonRows, Pagination } from './shared.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  {key:'',              label:'All'},
  {key:'startup',       label:'Companies'},
  {key:'accelerator',   label:'Accelerators'},
  {key:'investor',      label:'Investors'},
  {key:'venture_studio',label:'Venture Studios'},
];

const ENTITY_TYPES = [
  { value:'startup',        label:'Companies',               desc:'Submit and showcase your product' },
  { value:'accelerator',    label:'Accelerators & Incubators', desc:'List your program and find companies' },
  { value:'investor',       label:'Investment Firms',        desc:'Discover MENA deals and founders' },
  { value:'venture_studio', label:'Venture Studios',         desc:'Build and co-found companies' },
];

const COUNTRIES = [
  ['sa','🇸🇦','Saudi Arabia'],['ae','🇦🇪','UAE'],['eg','🇪🇬','Egypt'],['jo','🇯🇴','Jordan'],
  ['ma','🇲🇦','Morocco'],['kw','🇰🇼','Kuwait'],['qa','🇶🇦','Qatar'],['bh','🇧🇭','Bahrain'],
  ['tn','🇹🇳','Tunisia'],['lb','🇱🇧','Lebanon'],['iq','🇮🇶','Iraq'],['om','🇴🇲','Oman'],
  ['ly','🇱🇾','Libya'],['dz','🇩🇿','Algeria'],['sy','🇸🇾','Syria'],['ye','🇾🇪','Yemen'],
  ['ps','🇵🇸','Palestine'],['sd','🇸🇩','Sudan'],['other','🌍','Other MENA'],
];

const INDUSTRIES = [
  'Fintech','Edtech','Healthtech','E-Commerce','Logistics','AI & ML',
  'Proptech','Cleantech','SaaS','Web3','Media','HR & Work','Foodtech','Traveltech','Other',
];

const STAGES = ['Ideation','Pre-Seed','Seed','Series A','Series B','Series C','Pre-IPO'];

const TYPE_BADGE  = { startup:'orange', accelerator:'green', investor:'blue', venture_studio:'purple' };
const typeColor   = { startup:'#E15033', accelerator:'#16a34a', investor:'#2563eb', venture_studio:'#7c3aed' };

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle  = {width:'100%',border:'1px solid #E8E8E8',borderRadius:8,padding:'8px 10px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#FAFAFA'};
const selectStyle = {...inputStyle,cursor:'pointer'};

function Field({ label, children, span }) {
  return (
    <div style={{marginBottom:14,...(span&&{gridColumn:'1/-1'})}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</label>
      {children}
    </div>
  );
}

// ─── Logo Crop Modal ──────────────────────────────────────────────────────────

function LogoCropper({ src, onDone, onCancel }) {
  const [zoom, setZoom]   = useState(1);
  const [pos, setPos]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const imgRef  = useRef();
  const FRAME   = 220;

  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y });
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart) return;
    setPos({ x: dragStart.px + e.clientX - dragStart.mx, y: dragStart.py + e.clientY - dragStart.my });
  };
  const onMouseUp = () => setDragging(false);

  const apply = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas  = document.createElement('canvas');
    const SIZE    = 256;
    canvas.width  = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const displayW = img.width  * zoom;
    const displayH = img.height * zoom;
    const cx = (FRAME / 2 - (displayW / 2 + pos.x)) / displayW * naturalW;
    const cy = (FRAME / 2 - (displayH / 2 + pos.y)) / displayH * naturalH;
    const cw = (FRAME / displayW) * naturalW;
    const ch = (FRAME / displayH) * naturalH;
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, SIZE, SIZE);
    onDone(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:16,padding:24,width:320,boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
        <div style={{fontWeight:800,fontSize:14,marginBottom:16,color:'#0A0A0A'}}>Crop & Adjust Logo</div>

        <div
          style={{width:FRAME,height:FRAME,overflow:'hidden',borderRadius:12,border:'2px solid #E8E8E8',cursor:'grab',position:'relative',margin:'0 auto 14px',background:'#F4F4F4',userSelect:'none'}}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <img
            ref={imgRef}
            src={src}
            draggable={false}
            style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${zoom}) translate(${pos.x/zoom}px,${pos.y/zoom}px)`,transformOrigin:'center center',display:'block',pointerEvents:'none'}}
          />
          <div style={{position:'absolute',inset:0,border:'2px dashed rgba(255,255,255,.6)',borderRadius:10,pointerEvents:'none'}}/>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'#888',marginBottom:6,textTransform:'uppercase',letterSpacing:'.04em'}}>Zoom</div>
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e=>setZoom(parseFloat(e.target.value))}
            style={{width:'100%',accentColor:'var(--orange)'}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#CCC',marginTop:2}}><span>1×</span><span>3×</span></div>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button onClick={apply} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:9,padding:'9px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            Apply
          </button>
          <button onClick={onCancel} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Multi-select Chips ───────────────────────────────────────────────────────

function ChipSelect({ options, selected, onChange, color='#E15033' }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(s=>s!==v) : [...selected,v]);
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      {options.map(o=>{
        const on = selected.includes(o);
        return (
          <span key={o} onClick={()=>toggle(o)} style={{fontSize:12,fontWeight:600,padding:'5px 12px',borderRadius:20,cursor:'pointer',userSelect:'none',transition:'all .12s',border:`1.5px solid ${on?color:'#E8E8E8'}`,background:on?color:'#FAFAFA',color:on?'#fff':'#555'}}>
            {o}
          </span>
        );
      })}
    </div>
  );
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:'', type:'accelerator', country:'', description:'', website:'',
  stages:[], industries:[], logo_url:'', logo_emoji:'',
  employees:'', founded_year:'', aum:'', portfolio_count:'', focus:'',
  linkedin:'', twitter:'', why_us_items:[''], verified:false,
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ENT_PAGE_SIZE = 20;

export default function Entities() {
  const [entities, setEntities]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [tab, setTab]               = useState('');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState({});
  const [sortBy, setSortBy]         = useState('created_at');
  const [sortOrder, setSortOrder]   = useState('desc');
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState(null);
  const [cropSrc, setCropSrc]       = useState(null);
  const fileRef    = useRef();
  const importRef  = useRef();
  const [showImport, setShowImport]   = useState(false);
  const [importing, setImporting]     = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleSort = (col) => {
    if (sortBy === col) setSortOrder(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('desc'); }
    setPage(1);
  };
  const SortArrow = ({ col }) => sortBy === col
    ? <span style={{marginLeft:4,fontSize:9,color:'var(--orange)'}}>{sortOrder==='asc'?'▲':'▼'}</span>
    : <span style={{marginLeft:4,fontSize:9,color:'#ddd'}}>▼</span>;

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.entities({ ...(tab && {type:tab}), ...(search && {search}), limit:ENT_PAGE_SIZE, page, sortBy, sortOrder })
      .then(({ data: d }) => { setEntities(d.data || []); setTotal(d.pagination?.total || 0); })
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, [tab, search, page, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const filtered = entities;

  // Logo: open file → show cropper
  const handleLogoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropDone = (dataUrl) => {
    setLogoPreview(dataUrl);
    setForm(f => ({ ...f, logo_url: dataUrl }));
    setCropSrc(null);
  };

  const setWhyItem = (idx, val) => setForm(f => { const items=[...f.why_us_items]; items[idx]=val; return {...f,why_us_items:items}; });
  const addWhyItem = () => { if(form.why_us_items.length<8) setForm(f=>({...f,why_us_items:[...f.why_us_items,'']})); };
  const removeWhyItem = (idx) => setForm(f=>{ const items=f.why_us_items.filter((_,i)=>i!==idx); return {...f,why_us_items:items.length?items:['']}; });

  const openModal = () => { setForm(EMPTY_FORM); setLogoPreview(null); setShowModal(true); };

  const create = async () => {
    if (!form.name.trim()) return toast.error('Entity name is required');
    if (!form.country)     return toast.error('Country is required');
    setSaving(true);
    try {
      const why_us        = form.why_us_items.filter(s=>s.trim()).join(' | ') || null;
      const stage         = form.stages.join(', ')    || null;
      const industry      = form.industries.join(', ') || null;
      const founded_year  = form.founded_year ? parseInt(form.founded_year) : null;
      const portfolio_count = form.portfolio_count ? parseInt(form.portfolio_count) : null;
      const { data: d } = await adminAPI.createEntity({
        name: form.name, type: form.type, country: form.country,
        description: form.description || null,
        website: form.website || null,
        stage, industry,
        employees: form.employees || null,
        founded_year,
        aum: form.aum || null,
        portfolio_count,
        focus: form.focus || null,
        logo_url: form.logo_url || null,
        logo_emoji: form.logo_emoji || null,
        linkedin: form.linkedin || null,
        twitter: form.twitter || null,
        why_us,
        verified: form.verified,
      });
      toast.success(d.message || 'Entity created!');
      setShowModal(false);
      setLogoPreview(null);
      load();
    } catch(e) { toast.error(e.message || 'Failed to create entity'); }
    finally { setSaving(false); }
  };

  const verifyEntity = async (e) => {
    setActing(p=>({...p,[e.id]:true}));
    try { await adminAPI.verifyEntity(e.id); toast.success(`${e.name} verified`); load(); }
    catch(err) { toast.error(err.message); }
    finally { setActing(p=>({...p,[e.id]:false})); }
  };

  const downloadTemplate = () => {
    const token = localStorage.getItem('tlmena_admin_token') || '';
    const url = `/api/admin/entities/csv-template?token=${encodeURIComponent(token)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entities-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (!file.name.endsWith('.csv')) return toast.error('Please upload a .csv file');
    setImporting(true); setImportResult(null);
    try {
      const { data: d } = await adminAPI.bulkImportEntities(file);
      setImportResult(d);
      if (d.created > 0) { toast.success(`${d.created} entit${d.created===1?'y':'ies'} imported!`); load(); }
      if (d.failed > 0)  { toast.error(`${d.failed} row${d.failed===1?' has':'s have'} errors — check the list below`); }
    } catch(e) { toast.error(e.message || 'Import failed'); }
    finally { setImporting(false); }
  };

  const isInvestor = form.type === 'investor';

  return (
    <>
      {/* Crop modal */}
      {cropSrc && (
        <LogoCropper
          src={cropSrc}
          onDone={handleCropDone}
          onCancel={()=>setCropSrc(null)}
        />
      )}

      {/* Create entity modal */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowModal(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:28,width:540,maxWidth:'94vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>Create Entity</div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAAAAA'}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>

              {/* Entity Name */}
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Entity Name *">
                  <input style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder=""/>
                </Field>
              </div>

              {/* Type selector */}
              <Field label="Type *" span>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {ENTITY_TYPES.map(t=>(
                    <div key={t.value} onClick={()=>setForm(f=>({...f,type:t.value}))}
                      style={{padding:'10px 12px',borderRadius:10,border:`1.5px solid ${form.type===t.value?'var(--orange)':'#E8E8E8'}`,cursor:'pointer',background:form.type===t.value?'#FFF5F2':'#FAFAFA',transition:'all .15s'}}>
                      <div style={{fontSize:12,fontWeight:700,color:form.type===t.value?'var(--orange)':'#222'}}>{t.label}</div>
                      <div style={{fontSize:10,color:'#AAA',marginTop:2,lineHeight:1.3}}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </Field>

              {/* Country */}
              <Field label="Country *">
                <select style={selectStyle} value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map(([v,flag,name])=>(
                    <option key={v} value={name}>{flag} {name}</option>
                  ))}
                </select>
              </Field>

              {/* Website */}
              <Field label="Website">
                <input style={inputStyle} value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://"/>
              </Field>

              {/* Logo Upload */}
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Entity Logo">
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div
                      onClick={()=>fileRef.current.click()}
                      style={{width:64,height:64,borderRadius:12,border:'2px dashed #E8E8E8',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',background:'#FAFAFA',flexShrink:0}}>
                      {logoPreview
                        ? <img src={logoPreview} alt="logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <span style={{fontSize:24,color:'#DDD'}}>+</span>
                      }
                    </div>
                    <div>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>fileRef.current.click()} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#444'}}>
                          Upload
                        </button>
                        {logoPreview && (
                          <button onClick={()=>setCropSrc(logoPreview)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#E15033'}}>
                            Crop & Resize
                          </button>
                        )}
                        {logoPreview && (
                          <button onClick={()=>{setLogoPreview(null);setForm(f=>({...f,logo_url:''}));}} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#CCC'}}>
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{fontSize:10,color:'#AAAAAA',marginTop:4}}>PNG, JPG · Max 5MB · Cropped to square</div>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoFile}/>
                </Field>
              </div>

              {/* Logo emoji fallback */}
              <Field label="Logo Emoji (fallback)">
                <input style={inputStyle} value={form.logo_emoji} onChange={e=>setForm(f=>({...f,logo_emoji:e.target.value}))} placeholder="🚀 🏢 💰 🎯"/>
              </Field>

              {/* Employees */}
              <Field label="Team Size">
                <select style={selectStyle} value={form.employees} onChange={e=>setForm(f=>({...f,employees:e.target.value}))}>
                  <option value="">Select…</option>
                  {['1-10','11-50','51-200','201-500','500+'].map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </Field>

              {/* Founded year */}
              <Field label="Founded Year">
                <input style={inputStyle} type="number" min="1990" max="2030" value={form.founded_year} onChange={e=>setForm(f=>({...f,founded_year:e.target.value}))} placeholder="2019"/>
              </Field>

              {/* AUM — investors/venture studios */}
              {(form.type==='investor'||form.type==='venture_studio') && (
                <Field label="AUM / Fund Size">
                  <input style={inputStyle} value={form.aum} onChange={e=>setForm(f=>({...f,aum:e.target.value}))} placeholder="$50M"/>
                </Field>
              )}

              {/* Portfolio count — investors/accelerators/venture studios */}
              {form.type!=='startup' && (
                <Field label="Portfolio / Alumni Count">
                  <input style={inputStyle} type="number" min="0" value={form.portfolio_count} onChange={e=>setForm(f=>({...f,portfolio_count:e.target.value}))} placeholder="45"/>
                </Field>
              )}

              {/* Industry — multi-select chips */}
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Industry / Focus">
                  <ChipSelect options={INDUSTRIES} selected={form.industries} onChange={v=>setForm(f=>({...f,industries:v}))} color="#E15033"/>
                </Field>
              </div>

              {/* Focus text */}
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Focus Description">
                  <input style={inputStyle} value={form.focus} onChange={e=>setForm(f=>({...f,focus:e.target.value}))} placeholder="Short focus area e.g. Deep tech and digital infrastructure"/>
                </Field>
              </div>

              {/* Stage Focus — investor only, multi-select chips */}
              {isInvestor && (
                <div style={{gridColumn:'1/-1'}}>
                  <Field label="Stage Focus">
                    <ChipSelect options={STAGES} selected={form.stages} onChange={v=>setForm(f=>({...f,stages:v}))} color="#2563eb"/>
                  </Field>
                </div>
              )}

              {/* About */}
              <div style={{gridColumn:'1/-1'}}>
                <Field label="About">
                  <textarea style={{...inputStyle,resize:'vertical',minHeight:80}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder=""/>
                </Field>
              </div>

              {/* Why section */}
              <div style={{gridColumn:'1/-1',marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'#666',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>
                  🎯 Why {form.name.trim() || 'this entity'}?
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {form.why_us_items.map((item,idx)=>(
                    <div key={idx} style={{display:'flex',gap:6,alignItems:'center'}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'#E15033',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>{idx+1}</div>
                      <input style={{...inputStyle,flex:1}} value={item} onChange={e=>setWhyItem(idx,e.target.value)} placeholder={`Reason ${idx+1}…`}/>
                      {form.why_us_items.length > 1 && (
                        <button onClick={()=>removeWhyItem(idx)} style={{background:'none',border:'none',cursor:'pointer',color:'#CCCCCC',fontSize:16,lineHeight:1,padding:'0 2px'}}>✕</button>
                      )}
                    </div>
                  ))}
                  {form.why_us_items.length < 8 && (
                    <button onClick={addWhyItem} style={{alignSelf:'flex-start',padding:'5px 12px',borderRadius:8,border:'1px dashed #E8E8E8',background:'#FAFAFA',fontSize:12,fontWeight:600,cursor:'pointer',color:'#AAAAAA',fontFamily:'inherit',marginTop:2}}>
                      + Add reason
                    </button>
                  )}
                </div>
              </div>

              {/* Social */}
              <Field label="LinkedIn">
                <input style={inputStyle} value={form.linkedin} onChange={e=>setForm(f=>({...f,linkedin:e.target.value}))} placeholder="linkedin.com/company/…"/>
              </Field>
              <Field label="Twitter / X">
                <input style={inputStyle} value={form.twitter} onChange={e=>setForm(f=>({...f,twitter:e.target.value}))} placeholder="@handle"/>
              </Field>

              {/* Verified toggle */}
              <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:'#F9F9F9',border:'1px solid #EFEFEF',cursor:'pointer'}} onClick={()=>setForm(f=>({...f,verified:!f.verified}))}>
                <input type="checkbox" checked={form.verified} onChange={()=>setForm(f=>({...f,verified:!f.verified}))} style={{width:16,height:16,accentColor:'var(--orange)',cursor:'pointer',flexShrink:0}}/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'#333'}}>Mark as Verified</div>
                  <div style={{fontSize:11,color:'#AAAAAA'}}>Shows ✓ Verified badge on the public profile</div>
                </div>
              </div>

            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={create} disabled={saving} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.7:1}}>
                {saving ? 'Creating…' : 'Create Entity'}
              </button>
              <button onClick={()=>setShowModal(false)} style={{padding:'11px 18px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV modal */}
      {showImport && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>{ setShowImport(false); setImportResult(null); }}>
          <div style={{background:'#fff',borderRadius:16,padding:28,width:560,maxWidth:'94vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)',maxHeight:'88vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>Import Entities from CSV</div>
              <button onClick={()=>{ setShowImport(false); setImportResult(null); }} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAAAAA'}}>✕</button>
            </div>

            {/* Field guide */}
            <div style={{background:'#F9F9F9',borderRadius:10,padding:14,marginBottom:18,fontSize:11,color:'#555',lineHeight:1.7}}>
              <div style={{fontWeight:800,color:'#0A0A0A',marginBottom:8,fontSize:12}}>📋 CSV Column Guide</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px'}}>
                {[
                  ['name','Required — entity display name'],
                  ['type','Required — startup / accelerator / investor / venture_studio'],
                  ['country','Required — full name e.g. Saudi Arabia, UAE, Egypt'],
                  ['description','1-3 sentences about the entity'],
                  ['website','https://…'],
                  ['industry','Fintech, AI & ML, Healthtech…'],
                  ['stage','Pre-Seed, Seed, Series A, Growth'],
                  ['employees','1-10 / 11-50 / 51-200 / 201-500 / 500+'],
                  ['founded_year','Number: 2019'],
                  ['aum','Investors only: $50M, $200M'],
                  ['portfolio_count','Investors only: number of portfolio companies'],
                  ['focus','Short focus area description'],
                  ['logo_url','Use https://logo.clearbit.com/domain.com'],
                  ['logo_emoji','Fallback emoji if no logo: 🚀 🏢 💰 🎯'],
                  ['linkedin','Full LinkedIn URL'],
                  ['twitter','@handle'],
                  ['why_us','Pipe-separated: Reason 1 | Reason 2 | Reason 3'],
                  ['verified','true or false (default false)'],
                ].map(([col, desc]) => (
                  <div key={col} style={{display:'flex',gap:6}}>
                    <code style={{background:'#EFEFEF',borderRadius:4,padding:'1px 5px',fontSize:10,fontWeight:700,color:'#E15033',whiteSpace:'nowrap',flexShrink:0}}>{col}</code>
                    <span style={{color:'#777'}}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Logo note */}
            <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,padding:'10px 14px',marginBottom:18,fontSize:11,color:'#1e40af'}}>
              <strong>Logo tip:</strong> Use a public image URL in the <code style={{background:'#DBEAFE',borderRadius:3,padding:'1px 4px'}}>logo_url</code> column — e.g. from the company's own website or <code style={{background:'#DBEAFE',borderRadius:3,padding:'1px 4px'}}>https://logo.clearbit.com/domain.com</code> for a free logo lookup by domain.
            </div>

            {/* Actions */}
            <div style={{display:'flex',gap:8,marginBottom:18}}>
              <button onClick={downloadTemplate}
                style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',color:'#444',display:'flex',alignItems:'center',gap:6}}>
                ⬇ Download Template CSV
              </button>
              <button onClick={()=>importRef.current?.click()} disabled={importing}
                style={{flex:1,padding:'9px 16px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:importing?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                {importing ? '⏳ Importing…' : '⬆ Upload CSV File'}
              </button>
              <input ref={importRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleImportFile}/>
            </div>

            {/* Results */}
            {importResult && (
              <div>
                <div style={{display:'flex',gap:10,marginBottom:12}}>
                  <div style={{flex:1,background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:8,padding:'10px 14px',textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:800,color:'#16a34a'}}>{importResult.created}</div>
                    <div style={{fontSize:11,color:'#15803d',fontWeight:600}}>Created</div>
                  </div>
                  {importResult.updated > 0 && (
                    <div style={{flex:1,background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,padding:'10px 14px',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:800,color:'#2563eb'}}>{importResult.updated}</div>
                      <div style={{fontSize:11,color:'#1d4ed8',fontWeight:600}}>Updated</div>
                    </div>
                  )}
                  {importResult.failed > 0 && (
                    <div style={{flex:1,background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'10px 14px',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:800,color:'#dc2626'}}>{importResult.failed}</div>
                      <div style={{fontSize:11,color:'#b91c1c',fontWeight:600}}>Failed</div>
                    </div>
                  )}
                </div>
                {importResult.errors?.length > 0 && (
                  <div style={{background:'#FEF2F2',borderRadius:8,padding:12,maxHeight:200,overflowY:'auto'}}>
                    <div style={{fontSize:11,fontWeight:800,color:'#7f1d1d',marginBottom:8}}>Rows with errors:</div>
                    {importResult.errors.map((err, i) => (
                      <div key={i} style={{fontSize:11,color:'#991b1b',marginBottom:4,display:'flex',gap:8}}>
                        <span style={{fontWeight:700,flexShrink:0}}>Row {err.row}:</span>
                        <span style={{fontWeight:600,color:'#555',flexShrink:0}}>{err.name}</span>
                        <span style={{color:'#B91C1C'}}>— {err.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entities table */}
      <SCard
        title="Entities"
        sub={`${total.toLocaleString()} entities — companies, accelerators, investors & venture studios`}
        action={
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{ setShowImport(true); setImportResult(null); }}
              style={{padding:'7px 14px',borderRadius:9,background:'#fff',color:'#555',border:'1px solid #E8E8E8',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              ⬆ Import CSV
            </button>
            <button onClick={openModal} style={{padding:'7px 14px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              + Create Entity
            </button>
          </div>
        }
      >
        <div className="filters-bar" style={{padding:'12px 20px',borderBottom:'1px solid #F4F4F4'}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>{setTab(t.key);setPage(1);}} style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:tab===t.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:tab===t.key?'var(--orange)':'#E8E8E8',background:tab===t.key?'var(--orange)':'#fff',color:tab===t.key?'#fff':'#666'}}>
              {t.label}
            </button>
          ))}
          <div style={{marginLeft:'auto',position:'relative',flexShrink:0}}>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search…" style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'5px 10px 5px 28px',fontSize:12,width:160,outline:'none',background:'#FAFAFA'}}/>
            <svg style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
        </div>

        <Tbl heads={[
          <span key="n" style={{cursor:'pointer',userSelect:'none'}} onClick={()=>handleSort('name')}>Entity<SortArrow col="name"/></span>,
          <span key="t" style={{cursor:'pointer',userSelect:'none'}} onClick={()=>handleSort('type')}>Type<SortArrow col="type"/></span>,
          <span key="c" style={{cursor:'pointer',userSelect:'none'}} onClick={()=>handleSort('country')}>Country<SortArrow col="country"/></span>,
          'Industry',
          <span key="v" style={{cursor:'pointer',userSelect:'none'}} onClick={()=>handleSort('verified')}>Verified<SortArrow col="verified"/></span>,
          'Actions',
        ]}>
          {loading
            ? <SkeletonRows cols={6} rows={5}/>
            : filtered.length===0
              ? <tr><td colSpan={6}><EmptyState icon="🏢" title="No entities found" sub="Try creating your first entity with the button above."/></td></tr>
              : filtered.map(e=>(
                <tr key={e.id} style={{borderBottom:'1px solid #F4F4F4'}}
                  onMouseEnter={el=>el.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={el=>el.currentTarget.style.background='transparent'}>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:10,background:`${typeColor[e.type]||'#E15033'}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                        {e.logo_url
                          ? <img src={e.logo_url} alt={e.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <span style={{fontSize:16,color:typeColor[e.type]||'#E15033'}}>◈</span>
                        }
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{e.name}</div>
                        {e.website && <div style={{fontSize:11,color:'#AAAAAA'}}>{e.website.replace(/^https?:\/\//,'')}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'11px 16px'}}>
                    <Badge variant={TYPE_BADGE[e.type]||'gray'}>{ENTITY_TYPES.find(t=>t.value===e.type)?.label||e.type?.replace(/_/g,' ')}</Badge>
                  </td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{e.country||'—'}</td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{e.industry||e.focus||'—'}</td>
                  <td style={{padding:'11px 16px'}}>{e.verified?<Badge variant="green">✓ Verified</Badge>:<Badge variant="gray">Unverified</Badge>}</td>
                  <td style={{padding:'11px 16px'}}>
                    {!e.verified && <ActionBtn variant="verify" loading={acting[e.id]} onClick={()=>verifyEntity(e)}>✓ Verify</ActionBtn>}
                  </td>
                </tr>
              ))
          }
        </Tbl>
        <Pagination page={page} total={total} limit={ENT_PAGE_SIZE} onChange={setPage}/>
      </SCard>
    </>
  );
}
