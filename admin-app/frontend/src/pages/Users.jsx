import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState, SkeletonRows, Pagination, ConfirmModal, Drawer, DrawerField, fmtDate } from './shared.jsx';

const PAGE_SIZE = 20;

const FILTERS = [
  {key:'all',label:'All'},{key:'startup',label:'Startups'},{key:'investor',label:'Investors & VCs'},
  {key:'verified',label:'Verified ✓'},{key:'suspended',label:'Suspended'},
];
const PERSONA_COLOR = { Founder:'#E15033', Investor:'#2563eb', 'Product Manager':'#7c3aed', Enthusiast:'#64748b' };

function Field({ label, required, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5,textTransform:'uppercase',letterSpacing:'.04em'}}>
        {label}{required && <span style={{color:'#dc2626',marginLeft:3}}>*</span>}
      </label>
      {children}
    </div>
  );
}
const iS = {width:'100%',border:'1px solid #E8E8E8',borderRadius:8,padding:'9px 11px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#FAFAFA'};
const sS = {...iS,cursor:'pointer'};

// ── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', handle:'', email:'', entityType:'Startup', country:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const save = async () => {
    if (!form.email) return toast.error('Email is required');
    setSaving(true);
    try {
      await adminAPI.createUser({ ...form, persona: form.entityType, role: 'user' });
      toast.success(`@${form.handle||form.email.split('@')[0]} added!`);
      onSuccess();
      onClose();
    } catch(e) { toast.error(e.message || 'Failed to add user'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:28,width:460,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>Add Platform User</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAAAAA',lineHeight:1}}>✕</button>
        </div>
        <Field label="Full Name"><input style={iS} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus/></Field>
        <Field label="Handle">
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA',fontSize:13}}>@</span>
            <input style={{...iS,paddingLeft:22}} value={form.handle} onChange={e=>setForm(f=>({...f,handle:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')}))} placeholder="auto-generated if blank"/>
          </div>
        </Field>
        <Field label="Email Address" required><input style={iS} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Field>
        <Field label="Entity Type">
          <select style={sS} value={form.entityType} onChange={e=>setForm(f=>({...f,entityType:e.target.value}))}>
            <option>Startup</option><option>VC / Investor</option><option>Accelerator</option>
            <option>Venture Studio</option><option>Corporate</option><option>Individual</option>
          </select>
        </Field>
        <Field label="Country"><input style={iS} value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/></Field>
        <div style={{fontSize:11,color:'#AAAAAA',marginBottom:12}}>Fields marked <span style={{color:'#dc2626'}}>*</span> are required</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={save} disabled={saving} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>
            {saving?'Adding…':'Add User'}
          </button>
          <button onClick={onClose} style={{padding:'10px 16px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User Detail Drawer ────────────────────────────────────────────────────────
function UserDrawer({ userId, onClose, onAction }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    setLoading(true);
    adminAPI.getUser(userId)
      .then(r => setDetail(r.data.data))
      .catch(() => toast.error('Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  const perform = async (action, fn, successMsg) => {
    setActing(action);
    setConfirmAction(null);
    try {
      await fn();
      toast.success(successMsg);
      onAction();
      if (action === 'delete') onClose();
      else {
        const r = await adminAPI.getUser(userId);
        setDetail(r.data.data);
      }
    } catch(e) { toast.error(e.message || 'Action failed'); }
    finally { setActing(''); }
  };

  const CONFIRM_MAP = {
    suspend: {
      title: `Suspend ${detail?.name}?`,
      message: `@${detail?.handle} will be suspended and unable to use the platform.`,
      confirmLabel: 'Suspend',
    },
    delete: {
      title: `Delete ${detail?.name}?`,
      message: `This will permanently remove @${detail?.handle} and all their data. This cannot be undone.`,
      confirmLabel: 'Delete Account',
    },
  };

  return (
    <>
      <Drawer title={loading?'Loading…':detail?.name} subtitle={loading?'':(`@${detail?.handle} · ${detail?.persona||''}`)?.trim()} onClose={onClose} width={480}>
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[...Array(5)].map((_,i)=>(
              <div key={i} style={{height:13,borderRadius:6,background:'#F0F0F0',animation:'pulse 1.4s ease-in-out infinite',width:i%2===0?'55%':'80%'}}/>
            ))}
          </div>
        ) : !detail ? (
          <div style={{textAlign:'center',color:'#888',padding:40}}>Failed to load user details.</div>
        ) : (
          <>
            {/* Avatar + identity */}
            <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:24,paddingBottom:20,borderBottom:'1px solid #F0F0F0'}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:detail.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',flexShrink:0}}>
                {(detail.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2)}
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                  <span style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>{detail.name}</span>
                  {detail.verified && <span style={{fontSize:10,fontWeight:700,color:'var(--orange)'}}>✓ Verified</span>}
                </div>
                <div style={{fontSize:12,color:'#888'}}>@{detail.handle}</div>
                {detail.email && <div style={{fontSize:12,color:'#888'}}>{detail.email}</div>}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
              <DrawerField label="Persona">{detail.persona}</DrawerField>
              <DrawerField label="Country">{detail.country}</DrawerField>
              <DrawerField label="Status">
                {detail.status==='suspended'
                  ? <Badge variant="red">🚫 Suspended</Badge>
                  : <Badge variant="green">● Active</Badge>}
              </DrawerField>
              <DrawerField label="Joined">{fmtDate(detail.created_at)}</DrawerField>
              <DrawerField label="Products">{detail.products_count||0} submitted</DrawerField>
            </div>

            {/* Recent products */}
            {detail.recent_products?.length > 0 && (
              <div style={{marginTop:4}}>
                <div style={{fontSize:10,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Recent Submissions</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {detail.recent_products.map(p => (
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#FAFAFA',borderRadius:10,border:'1px solid #F0F0F0'}}>
                      <span style={{fontSize:18}}>{p.logo_emoji||'📦'}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                      </div>
                      <Badge variant={{live:'green',pending:'amber',rejected:'red',soon:'blue'}[p.status]||'gray'}>
                        {p.status}
                      </Badge>
                      <span style={{fontSize:11,color:'#888',flexShrink:0}}>🎉 {p.upvotes_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid #F0F0F0',display:'flex',flexWrap:'wrap',gap:8}}>
              {!detail.verified && (
                <ActionBtn variant="verify" loading={acting==='verify'}
                  onClick={()=>perform('verify',()=>adminAPI.verifyUser(userId),`${detail.name} verified`)}>
                  ✓ Verify
                </ActionBtn>
              )}
              <ActionBtn variant="warn" loading={acting==='warn'}
                onClick={()=>perform('warn',()=>adminAPI.warnUser(userId,'Administrative warning'),`Warning sent to ${detail.name}`)}>
                ⚠ Warn
              </ActionBtn>
              {detail.status==='active'
                ? <ActionBtn variant="suspend" onClick={()=>setConfirmAction('suspend')}>Suspend</ActionBtn>
                : <ActionBtn variant="reinstate" loading={acting==='reinstate'}
                    onClick={()=>perform('reinstate',()=>adminAPI.reinstateUser(userId),`${detail.name} reinstated`)}>
                    Reinstate
                  </ActionBtn>
              }
              <ActionBtn variant="delete" onClick={()=>setConfirmAction('delete')}>🗑 Delete</ActionBtn>
            </div>
          </>
        )}
      </Drawer>

      {confirmAction && CONFIRM_MAP[confirmAction] && (
        <ConfirmModal
          title={CONFIRM_MAP[confirmAction].title}
          message={CONFIRM_MAP[confirmAction].message}
          confirmLabel={CONFIRM_MAP[confirmAction].confirmLabel}
          danger={true}
          loading={!!acting}
          onConfirm={() => {
            if (confirmAction==='suspend') perform('suspend',()=>adminAPI.suspendUser(userId),`${detail?.name} suspended`);
            if (confirmAction==='delete')  perform('delete', ()=>adminAPI.deleteUser(userId),  `${detail?.name} deleted`);
          }}
          onCancel={()=>setConfirmAction(null)}
        />
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Users() {
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState({});
  const [selected, setSelected] = useState(new Set());
  const [bulking,  setBulking]  = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: PAGE_SIZE, page };
    if (filter==='verified')  params.verified  = true;
    if (filter==='suspended') params.status    = 'suspended';
    if (filter==='startup')   params.persona   = 'Founder';
    if (filter==='investor')  params.persona   = 'Investor';
    if (search) params.search = search;
    adminAPI.users(params)
      .then(res => {
        setUsers(res.data?.data || []);
        setTotal(res.data?.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (key) => { setFilter(key); setPage(1); setSelected(new Set()); };

  const act = async (id, fn, msg) => {
    setActing(p=>({...p,[id]:true}));
    try { await fn(); toast.success(msg); load(); }
    catch(e) { toast.error(e.message||'Failed'); }
    finally { setActing(p=>({...p,[id]:false})); }
  };

  const toggleAll = () => setSelected(selected.size===users.length ? new Set() : new Set(users.map(u=>u.id)));
  const toggleOne = (id) => { const s=new Set(selected); s.has(id)?s.delete(id):s.add(id); setSelected(s); };

  const doBulk = async (action) => {
    if (!selected.size) return;
    setBulking(true);
    try {
      await adminAPI.bulkUsers({ ids: [...selected], action });
      toast.success(`${selected.size} user(s) updated`);
      setSelected(new Set());
      load();
    } catch(e) { toast.error(e.message||'Bulk action failed'); }
    finally { setBulking(false); }
  };

  const doSuspendConfirmed = async () => {
    if (!suspendTarget) return;
    const { id, name } = suspendTarget;
    setSuspendTarget(null);
    await act(id, ()=>adminAPI.suspendUser(id), `${name} suspended`);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {showAdd && <AddUserModal onClose={()=>setShowAdd(false)} onSuccess={load}/>}

      {suspendTarget && (
        <ConfirmModal
          title={`Suspend ${suspendTarget.name}?`}
          message={`@${suspendTarget.handle} will be suspended and unable to access the platform.`}
          confirmLabel="Suspend User"
          danger={true}
          onConfirm={doSuspendConfirmed}
          onCancel={()=>setSuspendTarget(null)}
        />
      )}

      <SCard title="Platform Users" sub={`${total.toLocaleString()} registered user${total!==1?'s':''}`}
        action={
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowAdd(true)} style={{padding:'7px 14px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Add User</button>
          </div>
        }>
        {/* Filter pills */}
        <div className="filters-bar" style={{padding:'12px 20px',borderBottom:'1px solid #F4F4F4'}}>
          {FILTERS.map(f=>(
            <button key={f.key} onClick={()=>handleFilterChange(f.key)}
              style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:filter===f.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:filter===f.key?'var(--orange)':'#E8E8E8',background:filter===f.key?'var(--orange)':'#fff',color:filter===f.key?'#fff':'#666'}}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + bulk bar */}
        <div style={{padding:'12px 20px',borderBottom:'1px solid #F4F4F4',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{position:'relative',maxWidth:300,flex:1}}>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search users…"
              style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'7px 12px 7px 32px',fontSize:12,width:'100%',outline:'none',background:'#FAFAFA'}}/>
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
            checked={users.length>0 && selected.size===users.length}
            onChange={toggleAll}
            style={{cursor:'pointer',accentColor:'var(--orange)',width:14,height:14}}/>,
          'User','Persona','Country','Joined','Products','Status','Actions'
        ]}>
          {loading
            ? <SkeletonRows cols={8} rows={6}/>
            : users.length===0
              ? <tr><td colSpan={8}><EmptyState icon="👥" title="No users found" sub="Try adjusting your filter or search."/></td></tr>
              : users.map(u => {
                const sel = selected.has(u.id);
                return (
                  <tr key={u.id}
                    style={{borderBottom:'1px solid #F4F4F4',background:sel?'#FFF7F0':'transparent',cursor:'pointer'}}
                    onClick={()=>setDrawerUser(u.id)}
                    onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background='#FAFAFA'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=sel?'#FFF7F0':'transparent'; }}>

                    <td style={{padding:'11px 8px 11px 16px',width:32}} onClick={e=>e.stopPropagation()}>
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
                    <td style={{padding:'11px 16px',fontSize:11,color:'#AAAAAA'}}>{fmtDate(u.created_at)}</td>
                    <td style={{padding:'11px 16px',fontSize:13,fontWeight:700,textAlign:'center'}}>{u.products_count||0}</td>
                    <td style={{padding:'11px 16px'}}>
                      {u.status==='suspended' ? <Badge variant="red">🚫 Suspended</Badge> : <Badge variant="green">● Active</Badge>}
                    </td>
                    <td style={{padding:'11px 16px'}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',gap:5}}>
                        {!u.verified && (
                          <ActionBtn variant="verify" loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.verifyUser(u.id),`${u.name} verified`)}>✓ Verify</ActionBtn>
                        )}
                        <ActionBtn variant="warn" loading={acting[u.id]}
                          onClick={()=>act(u.id,()=>adminAPI.warnUser(u.id,'Administrative warning'),`Warning sent to ${u.name}`)}>
                          ⚠ Warn
                        </ActionBtn>
                        {u.status==='active'
                          ? <ActionBtn variant="suspend" onClick={()=>setSuspendTarget(u)}>Suspend</ActionBtn>
                          : <ActionBtn variant="reinstate" loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.reinstateUser(u.id),`${u.name} reinstated`)}>Reinstate</ActionBtn>
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
        </Tbl>
        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={p=>{setPage(p);setSelected(new Set());}}/>
      </SCard>

      {/* User detail drawer */}
      {drawerUser && (
        <UserDrawer
          userId={drawerUser}
          onClose={()=>setDrawerUser(null)}
          onAction={load}
        />
      )}
    </div>
  );
}
