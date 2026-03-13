import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const FILTERS = [
  {key:'all',label:'All'},{key:'founder',label:'Founders'},{key:'investor',label:'Investors'},
  {key:'verified',label:'Verified ✓'},{key:'suspended',label:'Suspended'},
];

const PERSONA_COLOR = { Founder:'#E15033', Investor:'#2563eb', 'Product Manager':'#7c3aed', Enthusiast:'#64748b' };

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.users({ limit:200 })
      .then(({ data: d }) => setUsers(d.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, msg) => {
    setActing(p=>({...p,[id]:true}));
    try { await fn(); toast.success(msg); load(); }
    catch(e) { toast.error(e.message||'Failed'); }
    finally { setActing(p=>({...p,[id]:false})); }
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
    <SCard title="User Management" sub={`${users.length} total users`}>
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
        {loading ? <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
        : filtered.length===0 ? <tr><td colSpan={7}><EmptyState icon="👥" title="No users found"/></td></tr>
        : filtered.map(u => (
          <tr key={u.id} style={{borderBottom:'1px solid #F4F4F4'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
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
                {!u.verified && <ActionBtn variant="verify"   loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.verifyUser(u.id),`✅ ${u.name} verified`)}>✓ Verify</ActionBtn>}
                {u.status==='active'    && <ActionBtn variant="suspend"   loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.suspendUser(u.id),`🚫 ${u.name} suspended`)}>Suspend</ActionBtn>}
                {u.status==='suspended' && <ActionBtn variant="reinstate" loading={acting[u.id]} onClick={()=>act(u.id,()=>adminAPI.reinstateUser(u.id),`✅ ${u.name} reinstated`)}>Reinstate</ActionBtn>}
              </div>
            </td>
          </tr>
        ))}
      </Tbl>
    </SCard>
  );
}
