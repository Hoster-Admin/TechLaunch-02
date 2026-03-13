import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const FILTERS = [
  {key:'all',label:'All'},{key:'startup',label:'Startups'},{key:'investor',label:'Investors & VCs'},
  {key:'verified',label:'Verified ✓'},{key:'suspended',label:'Suspended'},
];
const PERSONA_COLOR = { Founder:'#E15033', Investor:'#2563eb', 'Product Manager':'#7c3aed', Enthusiast:'#64748b' };
const ROLE_COLOR    = { admin:'#E15033', moderator:'#2563eb', editor:'#7c3aed' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:28,width:440,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAAAAA',lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</label>
      {children}
    </div>
  );
}
const iS = {width:'100%',border:'1px solid #E8E8E8',borderRadius:8,padding:'9px 11px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#FAFAFA'};
const sS = {...iS,cursor:'pointer'};

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState({});
  const [selected, setSelected]   = useState(new Set());
  const [bulking, setBulking]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ name:'', handle:'', email:'', entityType:'Startup', country:'' });

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.users({ limit:200 })
      .then(res => setUsers(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addUser = async () => {
    if (!form.handle || !form.email) return toast.error('Handle and email are required');
    setSaving(true);
    try {
      await adminAPI.createUser({ ...form, persona: form.entityType, role: 'user' });
      toast.success(`@${form.handle} added successfully!`);
      setShowAdd(false);
      setForm({ name:'', handle:'', email:'', entityType:'Startup', country:'' });
      load();
    } catch(e) { toast.error(e.message || 'Failed to add user'); }
    finally { setSaving(false); }
  };

  const act = async (id, fn, msg) => {
    setActing(p=>({...p,[id]:true}));
    try { await fn(); toast.success(msg); load(); }
    catch(e) { toast.error(e.message||'Failed'); }
    finally { setActing(p=>({...p,[id]:false})); }
  };

  const toggleAll = (list) => {
    setSelected(selected.size === list.length ? new Set() : new Set(list.map(u => u.id)));
  };

  const toggleOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const doBulk = async (action) => {
    if (!selected.size) return;
    setBulking(true);
    try {
      await adminAPI.bulkUsers({ ids: [...selected], action });
      toast.success(`${selected.size} user(s) updated`);
      setSelected(new Set());
      load();
    } catch(e) {
      toast.error(e.message || 'Bulk action failed');
    } finally { setBulking(false); }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      await adminAPI.exportCSV('users');
      toast.success('Users CSV downloaded');
    } catch(e) {
      toast.error(e.message || 'Export failed');
    } finally { setExporting(false); }
  };

  const filtered = users.filter(u => {
    if (filter==='startup'  && !['founder','startup'].includes(u.persona?.toLowerCase()))  return false;
    if (filter==='investor' && !['investor','vc / investor','vc/investor','accelerator','venture studio'].includes(u.persona?.toLowerCase())) return false;
    if (filter==='verified'  && !u.verified)                            return false;
    if (filter==='suspended' && u.status!=='suspended')                 return false;
    if (search) { const q=search.toLowerCase(); return u.name?.toLowerCase().includes(q)||u.handle?.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>

      {showAdd && (
        <Modal title="Add Platform User" onClose={()=>setShowAdd(false)}>
          <Field label="Full Name">
            <input style={iS} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus/>
          </Field>
          <Field label="Handle Name">
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA',fontSize:13}}>@</span>
              <input style={{...iS,paddingLeft:22}} value={form.handle} onChange={e=>setForm(f=>({...f,handle:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')}))} placeholder="auto-generated if blank"/>
            </div>
          </Field>
          <Field label="Email Address">
            <input style={iS} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
          </Field>
          <Field label="Entity Type">
            <select style={sS} value={form.entityType} onChange={e=>setForm(f=>({...f,entityType:e.target.value}))}>
              <option>Startup</option>
              <option>VC / Investor</option>
              <option>Accelerator</option>
              <option>Venture Studio</option>
              <option>Corporate</option>
              <option>Individual</option>
            </select>
          </Field>
          <Field label="Country (optional)">
            <input style={iS} value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/>
          </Field>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button onClick={addUser} disabled={saving} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>
              {saving ? 'Adding…' : 'Add User'}
            </button>
            <button onClick={()=>setShowAdd(false)} style={{padding:'10px 16px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Platform Users */}
      <SCard title="Platform Users" sub={`${users.length} registered user${users.length!==1?'s':''}`}
        action={
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowAdd(true)} style={{padding:'7px 14px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Add User</button>
            <button onClick={doExport} disabled={exporting} style={{padding:'7px 14px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',color:'#555',opacity:exporting?0.6:1}}>{exporting?'…':'↓ Export CSV'}</button>
          </div>
        }>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'14px 20px',borderBottom:'1px solid #F4F4F4'}}>
          {FILTERS.map(f=>(
            <button key={f.key} onClick={()=>{setFilter(f.key);setSelected(new Set());}} style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:filter===f.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:filter===f.key?'var(--orange)':'#E8E8E8',background:filter===f.key?'var(--orange)':'#fff',color:filter===f.key?'#fff':'#666'}}>{f.label}</button>
          ))}
        </div>
        <div style={{padding:'12px 20px',borderBottom:'1px solid #F4F4F4',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{position:'relative',maxWidth:300,flex:1}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'7px 12px 7px 32px',fontSize:12,width:'100%',outline:'none',background:'#FAFAFA'}}/>
            <svg style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          {selected.size > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#FFF7F0',border:'1.5px solid var(--orange)',borderRadius:10}}>
              <span style={{fontSize:11,fontWeight:700,color:'var(--orange)'}}>{selected.size} selected</span>
              <button onClick={()=>doBulk('verify')}    disabled={bulking} style={{padding:'4px 10px',borderRadius:7,border:'none',background:'#2563eb',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>✓ Verify</button>
              <button onClick={()=>doBulk('suspend')}   disabled={bulking} style={{padding:'4px 10px',borderRadius:7,border:'none',background:'#dc2626',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Suspend</button>
              <button onClick={()=>doBulk('reinstate')} disabled={bulking} style={{padding:'4px 10px',borderRadius:7,border:'none',background:'#16a34a',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Reinstate</button>
              <button onClick={()=>setSelected(new Set())} style={{padding:'4px 8px',borderRadius:7,border:'1px solid #E8E8E8',background:'#fff',fontSize:11,color:'#666',cursor:'pointer'}}>✕</button>
            </div>
          )}
        </div>
        <Tbl heads={[
          <input key="chk" type="checkbox"
            checked={filtered.length>0 && selected.size===filtered.length}
            onChange={()=>toggleAll(filtered)}
            style={{cursor:'pointer',accentColor:'var(--orange)',width:14,height:14}}/>,
          'User','Persona','Country','Joined','Products','Status','Actions'
        ]}>
          {loading
            ? <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
            : filtered.length===0
              ? <tr><td colSpan={8}><EmptyState icon="👥" title="No users found"/></td></tr>
              : filtered.map(u => {
                const sel = selected.has(u.id);
                return (
                <tr key={u.id} style={{borderBottom:'1px solid #F4F4F4',background:sel?'#FFF7F0':'transparent'}}
                  onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background='#FAFAFA'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=sel?'#FFF7F0':'transparent'; }}>
                  <td style={{padding:'11px 8px 11px 16px',width:32}}>
                    <input type="checkbox" checked={sel} onChange={()=>toggleOne(u.id)}
                      style={{cursor:'pointer',accentColor:'var(--orange)',width:14,height:14}}/>
                  </td>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:32,height:32,borderRadius:10,background:u.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
                        {(u.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{u.name} {u.verified && <span style={{color:'var(--orange)',fontSize:11}}>✓</span>}</div>
                        <div style={{fontSize:11,color:'#AAAAAA'}}>@{u.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'11px 16px',fontSize:12,fontWeight:700,color:PERSONA_COLOR[u.persona]||'#666'}}>{u.persona}</td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{u.country}</td>
                  <td style={{padding:'11px 16px',fontSize:11,color:'#AAAAAA'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{padding:'11px 16px',fontSize:13,fontWeight:700,textAlign:'center'}}>{u.products_count||0}</td>
                  <td style={{padding:'11px 16px'}}>
                    {u.status==='suspended' ? <Badge variant="red">🚫 Suspended</Badge> : <Badge variant="green">● Active</Badge>}
                  </td>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{display:'flex',gap:5}}>
                      {!u.verified     && <ActionBtn variant="verify"    loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.verifyUser(u.id),  `${u.name} verified`)}>✓ Verify</ActionBtn>}
                      {u.status==='active'    && <ActionBtn variant="suspend"   loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.suspendUser(u.id),  `${u.name} suspended`)}>Suspend</ActionBtn>}
                      {u.status==='suspended' && <ActionBtn variant="reinstate" loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.reinstateUser(u.id),`${u.name} reinstated`)}>Reinstate</ActionBtn>}
                    </div>
                  </td>
                </tr>
              ); })
          }
        </Tbl>
      </SCard>
    </div>
  );
}
