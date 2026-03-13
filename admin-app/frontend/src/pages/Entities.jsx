import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const TABS = [
  {key:'',              label:'All'},
  {key:'accelerator',   label:'Accelerators'},
  {key:'investor',      label:'Investors'},
  {key:'venture_studio',label:'Venture Studios'},
];
const TYPE_BADGE = { accelerator:'green', investor:'blue', venture_studio:'purple' };
const typeColor  = { accelerator:'#16a34a', investor:'#2563eb', venture_studio:'#7c3aed' };

const inputStyle  = {width:'100%',border:'1px solid #E8E8E8',borderRadius:8,padding:'8px 10px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#FAFAFA'};
const selectStyle = {...inputStyle,cursor:'pointer'};

function Field({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5}}>{label}</label>
      {children}
    </div>
  );
}

const EMPTY_FORM = { name:'', type:'accelerator', country:'', description:'', website:'', stage:'', industry:'', aum:'', portfolio_count:'', logo_emoji:'🏢' };

export default function Entities() {
  const [entities, setEntities] = useState([]);
  const [tab, setTab]       = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState(EMPTY_FORM);

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

  const create = async () => {
    if (!form.name || !form.country) return toast.error('Name and country are required');
    setSaving(true);
    try {
      const payload = { ...form, portfolio_count: form.portfolio_count ? parseInt(form.portfolio_count) : undefined };
      const { data: d } = await adminAPI.createEntity(payload);
      toast.success(d.message || 'Entity created!');
      setShowModal(false);
      setForm(EMPTY_FORM);
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

  return (
    <>
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowModal(false)}>
          <div style={{background:'#fff',borderRadius:16,padding:28,width:480,maxWidth:'92vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>Create Entity</div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAAAAA'}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Entity Name *">
                  <input style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. MENA Ventures Fund III"/>
                </Field>
              </div>
              <Field label="Type *">
                <select style={selectStyle} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="accelerator">Accelerator</option>
                  <option value="investor">Investor / VC</option>
                  <option value="venture_studio">Venture Studio</option>
                </select>
              </Field>
              <Field label="Country *">
                <input style={inputStyle} value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} placeholder="e.g. Saudi Arabia"/>
              </Field>
              <Field label="Emoji Logo">
                <input style={inputStyle} value={form.logo_emoji} onChange={e=>setForm(f=>({...f,logo_emoji:e.target.value}))} placeholder="🏢"/>
              </Field>
              <Field label="Website">
                <input style={inputStyle} value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://"/>
              </Field>
              <Field label="Industry / Focus">
                <input style={inputStyle} value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} placeholder="e.g. FinTech, EdTech"/>
              </Field>
              <Field label="Stage Focus">
                <input style={inputStyle} value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} placeholder="e.g. Pre-Seed, Series A"/>
              </Field>
              {form.type==='investor' && (
                <>
                  <Field label="AUM">
                    <input style={inputStyle} value={form.aum} onChange={e=>setForm(f=>({...f,aum:e.target.value}))} placeholder="e.g. $50M"/>
                  </Field>
                  <Field label="Portfolio Count">
                    <input style={inputStyle} type="number" value={form.portfolio_count} onChange={e=>setForm(f=>({...f,portfolio_count:e.target.value}))} placeholder="0"/>
                  </Field>
                </>
              )}
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Description">
                  <textarea style={{...inputStyle,resize:'vertical',minHeight:72}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief overview of this entity…"/>
                </Field>
              </div>
            </div>

            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={create} disabled={saving} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                {saving ? 'Creating…' : 'Create Entity'}
              </button>
              <button onClick={()=>setShowModal(false)} style={{padding:'10px 16px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <SCard
        title="Entities"
        sub={`${entities.length} entities — accelerators, investors & venture studios`}
        action={<button onClick={()=>setShowModal(true)} style={{padding:'7px 14px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Create Entity</button>}
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
                      <div style={{width:36,height:36,borderRadius:10,background:`${typeColor[e.type]||'#E15033'}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{e.logo_emoji||'🏢'}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{e.name}</div>
                        {e.website && <div style={{fontSize:11,color:'#AAAAAA'}}>{e.website.replace(/^https?:\/\//,'')}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'11px 16px'}}><Badge variant={TYPE_BADGE[e.type]||'gray'}>{e.type?.replace('_',' ')}</Badge></td>
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
