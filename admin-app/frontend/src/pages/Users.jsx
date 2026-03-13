import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const FILTERS = [
  {key:'all',label:'All'},{key:'founder',label:'Founders'},{key:'investor',label:'Investors'},
  {key:'verified',label:'Verified ✓'},{key:'suspended',label:'Suspended'},
];
const PERSONA_COLOR = { Founder:'#E15033', Investor:'#2563eb', 'Product Manager':'#7c3aed', Enthusiast:'#64748b' };
const ROLE_COLOR    = { admin:'#E15033', moderator:'#2563eb', editor:'#7c3aed' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:28,width:420,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}} onClick={e=>e.stopPropagation()}>
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
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5}}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {width:'100%',border:'1px solid #E8E8E8',borderRadius:8,padding:'8px 10px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#FAFAFA'};
const selectStyle = {...inputStyle,cursor:'pointer'};

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [team, setTeam]       = useState([]);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState({});
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name:'', email:'', password:'', role:'moderator' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminAPI.users({ limit:200 }),
      adminAPI.team(),
    ])
      .then(([ures, tres]) => {
        setUsers(ures.data?.data || []);
        setTeam(tres.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, msg) => {
    setActing(p=>({...p,[id]:true}));
    try { await fn(); toast.success(msg); load(); }
    catch(e) { toast.error(e.message||'Failed'); }
    finally { setActing(p=>({...p,[id]:false})); }
  };

  const invite = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setSaving(true);
    try {
      const { data: d } = await adminAPI.createUser(form);
      toast.success(d.message || 'Team member added!');
      setShowModal(false);
      setForm({ name:'', email:'', password:'', role:'moderator' });
      load();
    } catch(e) { toast.error(e.message||'Failed to create user'); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    if (filter==='founder'   && u.persona?.toLowerCase()!=='founder')   return false;
    if (filter==='investor'  && u.persona?.toLowerCase()!=='investor')  return false;
    if (filter==='verified'  && !u.verified)                            return false;
    if (filter==='suspended' && u.status!=='suspended')                 return false;
    if (search) { const q=search.toLowerCase(); return u.name?.toLowerCase().includes(q)||u.handle?.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {showModal && (
        <Modal title="Invite Team Member" onClose={()=>setShowModal(false)}>
          <Field label="Full Name">
            <input style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Khaled Al-Rashid"/>
          </Field>
          <Field label="Email Address">
            <input style={inputStyle} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="khaled@techlaunch.io"/>
          </Field>
          <Field label="Temporary Password">
            <input style={inputStyle} type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 8 characters"/>
          </Field>
          <Field label="Role">
            <select style={selectStyle} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="moderator">Moderator — can review content</option>
              <option value="editor">Editor — can manage products &amp; entities</option>
              <option value="admin">Admin — full access</option>
            </select>
          </Field>
          <div style={{display:'flex',gap:8,marginTop:4}}>
            <button onClick={invite} disabled={saving} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
              {saving ? 'Adding…' : 'Add Team Member'}
            </button>
            <button onClick={()=>setShowModal(false)} style={{padding:'10px 16px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Team Members */}
      <SCard
        title="Team Members"
        sub={`${team.length} admin & moderator accounts`}
        action={<button onClick={()=>setShowModal(true)} style={{padding:'7px 14px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Invite Member</button>}
      >
        {team.length === 0
          ? <EmptyState icon="👋" title="No team members yet" sub="Invite your first team member above"/>
          : <Tbl heads={['Member','Email','Role','Status','Joined']}>
              {team.map(m => (
                <tr key={m.id} style={{borderBottom:'1px solid #F4F4F4'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'10px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:32,height:32,borderRadius:10,background:m.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
                        {(m.name||'T').split(' ').map(w=>w[0]).join('').slice(0,2)}
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{m.name}</div>
                    </div>
                  </td>
                  <td style={{padding:'10px 16px',fontSize:12,color:'#666'}}>{m.email}</td>
                  <td style={{padding:'10px 16px'}}>
                    <Badge variant={{admin:'orange',moderator:'blue',editor:'purple'}[m.role]||'gray'}>
                      {m.role}
                    </Badge>
                  </td>
                  <td style={{padding:'10px 16px'}}>
                    <Badge variant={m.status==='active'?'green':'red'}>{m.status}</Badge>
                  </td>
                  <td style={{padding:'10px 16px',fontSize:11,color:'#AAAAAA'}}>{new Date(m.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </Tbl>
        }
      </SCard>

      {/* Platform Users */}
      <SCard title="Platform Users" sub={`${users.length} registered users`}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'14px 20px',borderBottom:'1px solid #F4F4F4'}}>
          {FILTERS.map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:filter===f.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:filter===f.key?'var(--orange)':'#E8E8E8',background:filter===f.key?'var(--orange)':'#fff',color:filter===f.key?'#fff':'#666'}}>{f.label}</button>
          ))}
        </div>
        <div style={{padding:'12px 20px',borderBottom:'1px solid #F4F4F4'}}>
          <div style={{position:'relative',maxWidth:300}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'7px 12px 7px 32px',fontSize:12,width:'100%',outline:'none',background:'#FAFAFA'}}/>
            <svg style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
        </div>
        <Tbl heads={['User','Persona','Country','Joined','Products','Status','Actions']}>
          {loading
            ? <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
            : filtered.length===0
              ? <tr><td colSpan={7}><EmptyState icon="👥" title="No users found"/></td></tr>
              : filtered.map(u => (
                <tr key={u.id} style={{borderBottom:'1px solid #F4F4F4'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
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
              ))
          }
        </Tbl>
      </SCard>
    </div>
  );
}
