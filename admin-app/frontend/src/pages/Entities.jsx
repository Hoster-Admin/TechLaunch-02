import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const TABS = [
  {key:'',              label:'All'},
  {key:'startup',       label:'Companies'},
  {key:'accelerator',   label:'Accelerators'},
  {key:'investor',      label:'Investors'},
  {key:'venture_studio',label:'Venture Studios'},
];

const ENTITY_TYPES = [
  { value:'startup',        label:'Companies',                  desc:'Submit and showcase your product' },
  { value:'accelerator',    label:'Accelerators & Incubators',  desc:'List your program and find companies' },
  { value:'investor',       label:'Investment Firms',           desc:'Discover MENA deals and founders' },
  { value:'venture_studio', label:'Venture Studios',            desc:'Build and co-found companies' },
];

const COUNTRIES = [
  ['sa','🇸🇦','Saudi Arabia'],['ae','🇦🇪','UAE'],['eg','🇪🇬','Egypt'],['jo','🇯🇴','Jordan'],
  ['ma','🇲🇦','Morocco'],['kw','🇰🇼','Kuwait'],['qa','🇶🇦','Qatar'],['bh','🇧🇭','Bahrain'],
  ['tn','🇹🇳','Tunisia'],['lb','🇱🇧','Lebanon'],['iq','🇮🇶','Iraq'],['om','🇴🇲','Oman'],
  ['ly','🇱🇾','Libya'],['dz','🇩🇿','Algeria'],['sy','🇸🇾','Syria'],['ye','🇾🇪','Yemen'],
  ['ps','🇵🇸','Palestine'],['sd','🇸🇩','Sudan'],['other','🌍','Other MENA'],
];

const TYPE_BADGE = { startup:'orange', accelerator:'green', investor:'blue', venture_studio:'purple' };
const typeColor  = { startup:'#E15033', accelerator:'#16a34a', investor:'#2563eb', venture_studio:'#7c3aed' };

const inputStyle  = {width:'100%',border:'1px solid #E8E8E8',borderRadius:8,padding:'8px 10px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#FAFAFA'};
const selectStyle = {...inputStyle,cursor:'pointer'};

function Field({ label, children, span }) {
  return (
    <div style={{marginBottom:14, ...(span && {gridColumn:'1/-1'})}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</label>
      {children}
    </div>
  );
}

const EMPTY_FORM = {
  name:'', type:'accelerator', country:'', description:'', website:'',
  stage:'', industry:'', aum:'', portfolio_count:'', logo_url:'',
  linkedin:'', twitter:'', why_us_items:[''],
};

export default function Entities() {
  const [entities, setEntities]   = useState([]);
  const [tab, setTab]             = useState('');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState({});
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileRef = useRef();

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.entities({ ...(tab && {type:tab}), limit:200 })
      .then(({ data: d }) => setEntities(d.data || []))
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? entities.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()))
    : entities;

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setForm(f => ({ ...f, logo_url: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const setWhyItem = (idx, val) => {
    setForm(f => {
      const items = [...f.why_us_items];
      items[idx] = val;
      return { ...f, why_us_items: items };
    });
  };

  const addWhyItem = () => {
    if (form.why_us_items.length >= 8) return;
    setForm(f => ({ ...f, why_us_items: [...f.why_us_items, ''] }));
  };

  const removeWhyItem = (idx) => {
    setForm(f => {
      const items = f.why_us_items.filter((_,i)=>i!==idx);
      return { ...f, why_us_items: items.length ? items : [''] };
    });
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setLogoPreview(null);
    setShowModal(true);
  };

  const create = async () => {
    if (!form.name.trim()) return toast.error('Entity name is required');
    if (!form.country) return toast.error('Country is required');
    setSaving(true);
    try {
      const why_us = form.why_us_items.filter(s=>s.trim()).join('\n') || null;
      const payload = {
        ...form,
        why_us,
        portfolio_count: form.portfolio_count ? parseInt(form.portfolio_count) : undefined,
        why_us_items: undefined,
      };
      const { data: d } = await adminAPI.createEntity(payload);
      toast.success(d.message || 'Entity created!');
      setShowModal(false);
      setForm(EMPTY_FORM);
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

  const isInvestor = form.type === 'investor';

  return (
    <>
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowModal(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:28,width:520,maxWidth:'94vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>Create Entity</div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAAAAA'}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>

              <div style={{gridColumn:'1/-1'}}>
                <Field label="Entity Name *">
                  <input style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder=""/>
                </Field>
              </div>

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

              <Field label="Country *">
                <select style={selectStyle} value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map(([v,flag,name])=>(
                    <option key={v} value={name}>{flag} {name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Website">
                <input style={inputStyle} value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://"/>
              </Field>

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
                      <button onClick={()=>fileRef.current.click()} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#444'}}>
                        Upload Logo
                      </button>
                      <div style={{fontSize:10,color:'#AAAAAA',marginTop:4}}>PNG, JPG or SVG · Max 2MB</div>
                    </div>
                    {logoPreview && (
                      <button onClick={()=>{setLogoPreview(null);setForm(f=>({...f,logo_url:''}));}} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#AAAAAA'}}>Remove</button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoUpload}/>
                </Field>
              </div>

              <Field label="Industry / Focus">
                <input style={inputStyle} value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} placeholder=""/>
              </Field>

              {isInvestor && (
                <Field label="Stage Focus">
                  <input style={inputStyle} value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} placeholder="Pre-Seed, Series A…"/>
                </Field>
              )}

              {isInvestor && (
                <>
                  <Field label="AUM">
                    <input style={inputStyle} value={form.aum} onChange={e=>setForm(f=>({...f,aum:e.target.value}))} placeholder="$50M"/>
                  </Field>
                  <Field label="Portfolio Count">
                    <input style={inputStyle} type="number" value={form.portfolio_count} onChange={e=>setForm(f=>({...f,portfolio_count:e.target.value}))} placeholder="0"/>
                  </Field>
                </>
              )}

              <div style={{gridColumn:'1/-1'}}>
                <Field label="About">
                  <textarea style={{...inputStyle,resize:'vertical',minHeight:80}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder=""/>
                </Field>
              </div>

              <div style={{gridColumn:'1/-1',marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'#666',marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>
                  🎯 Why {form.name.trim() || 'this entity'}?
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {form.why_us_items.map((item,idx)=>(
                    <div key={idx} style={{display:'flex',gap:6,alignItems:'center'}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'#E15033',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>{idx+1}</div>
                      <input
                        style={{...inputStyle,flex:1}}
                        value={item}
                        onChange={e=>setWhyItem(idx,e.target.value)}
                        placeholder={`Reason ${idx+1}…`}
                      />
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

              <Field label="LinkedIn">
                <input style={inputStyle} value={form.linkedin} onChange={e=>setForm(f=>({...f,linkedin:e.target.value}))} placeholder="linkedin.com/company/…"/>
              </Field>

              <Field label="Twitter / X">
                <input style={inputStyle} value={form.twitter} onChange={e=>setForm(f=>({...f,twitter:e.target.value}))} placeholder="@handle"/>
              </Field>

            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={create} disabled={saving} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?.7:1}}>
                {saving ? 'Creating…' : 'Create Entity'}
              </button>
              <button onClick={()=>setShowModal(false)} style={{padding:'11px 18px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <SCard
        title="Entities"
        sub={`${entities.length} entities — companies, accelerators, investors & venture studios`}
        action={<button onClick={openModal} style={{padding:'7px 14px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Create Entity</button>}
      >
        <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'14px 20px',borderBottom:'1px solid #F4F4F4',alignItems:'center'}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:tab===t.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:tab===t.key?'var(--orange)':'#E8E8E8',background:tab===t.key?'var(--orange)':'#fff',color:tab===t.key?'#fff':'#666'}}>{t.label}</button>
          ))}
          <div style={{marginLeft:'auto',position:'relative'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'5px 10px 5px 28px',fontSize:12,width:180,outline:'none',background:'#FAFAFA'}}/>
            <svg style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
        </div>
        <Tbl heads={['Entity','Type','Country','Industry','Verified','Actions']}>
          {loading
            ? <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
            : filtered.length===0
              ? <tr><td colSpan={6}><EmptyState icon="🏢" title="No entities found"/></td></tr>
              : filtered.map(e => (
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
                  <td style={{padding:'11px 16px'}}><Badge variant={TYPE_BADGE[e.type]||'gray'}>{ENTITY_TYPES.find(t=>t.value===e.type)?.label||e.type?.replace(/_/g,' ')}</Badge></td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{e.country||'—'}</td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{e.industry||e.focus||'—'}</td>
                  <td style={{padding:'11px 16px'}}>{e.verified ? <Badge variant="green">✓ Verified</Badge> : <Badge variant="gray">Unverified</Badge>}</td>
                  <td style={{padding:'11px 16px'}}>
                    {!e.verified && <ActionBtn variant="verify" loading={acting[e.id]} onClick={()=>verifyEntity(e)}>✓ Verify</ActionBtn>}
                  </td>
                </tr>
              ))
          }
        </Tbl>
      </SCard>
    </>
  );
}
