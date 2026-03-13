import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ─── SHARED HELPERS ───────────────────────────────────
function SectionCard({ title, sub, children, action }) {
  return (
    <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden',marginBottom:20}}>
      <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>{title}</div>
          {sub && <div style={{fontSize:11,color:'#AAAAAA'}}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function FilterChips({ options, value, onChange }) {
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'14px 20px',borderBottom:'1px solid #F4F4F4'}}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:value===o.key?700:500,cursor:'pointer',border:'1.5px solid',
            borderColor:value===o.key?'var(--orange)':'#E8E8E8',
            background:value===o.key?'var(--orange)':'#fff',
            color:value===o.key?'#fff':'#666'}}>{o.label}</button>
      ))}
    </div>
  );
}

function Badge({ children, variant='gray' }) {
  const map = {
    green:  { bg:'#DCFCE7', color:'#166534' },
    blue:   { bg:'#DBEAFE', color:'#1e40af' },
    amber:  { bg:'#FEF3C7', color:'#92400E' },
    red:    { bg:'#FEE2E2', color:'#991B1B' },
    purple: { bg:'#F3E8FF', color:'#6b21a8' },
    orange: { bg:'#FCEEE9', color:'var(--orange)' },
    gray:   { bg:'#F4F4F4', color:'#666' },
  };
  const s = map[variant]||map.gray;
  return <span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,whiteSpace:'nowrap'}}>{children}</span>;
}

function Tbl({ heads, children, empty }) {
  return (
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead>
        <tr style={{borderBottom:'1px solid #F4F4F4'}}>
          {heads.map(h => <th key={h} style={{padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap'}}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function ActionBtn({ onClick, variant, children, loading }) {
  const map = { approve:{bg:'#DCFCE7',color:'#166534'}, reject:{bg:'#FEE2E2',color:'#991B1B'}, verify:{bg:'#DBEAFE',color:'#1e40af'}, suspend:{bg:'#FEF3C7',color:'#92400E'}, edit:{bg:'#F4F4F4',color:'#666'}, delete:{bg:'#FEE2E2',color:'#991B1B'} };
  const s = map[variant]||map.edit;
  return <button onClick={onClick} disabled={loading} style={{background:s.bg,color:s.color,border:'none',borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',opacity:loading?0.5:1}}>{loading?'…':children}</button>;
}

function EmptyState({ icon='📭', title, sub }) {
  return (
    <div style={{textAlign:'center',padding:'48px 20px'}}>
      <div style={{fontSize:36,marginBottom:10}}>{icon}</div>
      <div style={{fontWeight:700,fontSize:14,color:'#0A0A0A',marginBottom:4}}>{title}</div>
      {sub && <div style={{fontSize:12,color:'#AAAAAA'}}>{sub}</div>}
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.users?.().then(({ data: d }) => setUsers(d.data || [])).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, successMsg) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await fn();
      toast.success(successMsg);
      load();
      setSelected(null);
    } catch {
      toast.error('Action failed');
    } finally {
      setActing(p => ({ ...p, [id]: false }));
    }
  };

  const FILTERS = [
    {key:'all',label:'All'},{key:'founder',label:'Founders'},{key:'investor',label:'Investors'},
    {key:'verified',label:'Verified ✓'},{key:'suspended',label:'Suspended'},
  ];

  const filtered = users.filter(u => {
    if (filter==='founder' && u.persona?.toLowerCase()!=='founder') return false;
    if (filter==='investor' && u.persona?.toLowerCase()!=='investor') return false;
    if (filter==='verified' && !u.verified) return false;
    if (filter==='suspended' && u.status!=='suspended') return false;
    if (search) { const q=search.toLowerCase(); return u.name?.toLowerCase().includes(q)||u.handle?.toLowerCase().includes(q); }
    return true;
  });

  const personaColor = { Founder:'#E15033', Investor:'#2563eb', 'Product Manager':'#7c3aed', Enthusiast:'#64748b' };

  return (
    <div>
      <SectionCard title="User Management" sub={`${users.length} total users on platform`}>
        <FilterChips options={FILTERS} value={filter} onChange={setFilter}/>
        <div style={{padding:'12px 20px',borderBottom:'1px solid #F4F4F4'}}>
          <div style={{position:'relative',maxWidth:300}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…"
              style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'7px 12px 7px 32px',fontSize:12,width:'100%',outline:'none',background:'#FAFAFA'}}/>
            <svg style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
        </div>
        <Tbl heads={['User','Persona','Country','Joined','Products','Votes','Status','Actions']}>
          {loading ? (
            <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon="👥" title="No users found"/></td></tr>
          ) : filtered.map(u => (
            <tr key={u.id} style={{borderBottom:'1px solid #F4F4F4',cursor:'pointer'}}
              onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              onClick={() => setSelected(u)}>
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
              <td style={{padding:'11px 16px',fontSize:12,fontWeight:700,color:personaColor[u.persona]||'#666'}}>{u.persona}</td>
              <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{u.country}</td>
              <td style={{padding:'11px 16px',fontSize:11,color:'#AAAAAA'}}>{u.joined||new Date(u.created_at).toLocaleDateString()}</td>
              <td style={{padding:'11px 16px',fontSize:13,fontWeight:700,textAlign:'center'}}>{u.products||0}</td>
              <td style={{padding:'11px 16px',fontSize:13,fontWeight:700,textAlign:'center'}}>{u.votes_given||0}</td>
              <td style={{padding:'11px 16px'}} onClick={e=>e.stopPropagation()}>
                {u.status==='suspended' ? <Badge variant="red">🚫 Suspended</Badge> : <Badge variant="green">● Active</Badge>}
              </td>
              <td style={{padding:'11px 16px'}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:6}}>
                  {!u.verified && <ActionBtn variant="verify" loading={acting[u.id]} onClick={()=>act(u.id, ()=>adminAPI.verifyUser(u.id), `${u.name} verified!`)}>✓ Verify</ActionBtn>}
                  {u.status!=='suspended'
                    ? <ActionBtn variant="suspend" loading={acting[u.id]} onClick={()=>act(u.id, ()=>adminAPI.suspendUser(u.id), `${u.name} suspended`)}>Suspend</ActionBtn>
                    : <ActionBtn variant="approve" loading={acting[u.id]} onClick={()=>act(u.id, ()=>adminAPI.reinstate(u.id), `${u.name} reinstated`)}>Reinstate</ActionBtn>}
                </div>
              </td>
            </tr>
          ))}
        </Tbl>
      </SectionCard>

      {selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setSelected(null)}>
          <div style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:480,padding:28,position:'relative'}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSelected(null)} style={{position:'absolute',top:16,right:16,background:'#F4F4F4',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',fontSize:14}}>✕</button>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
              <div style={{width:52,height:52,borderRadius:16,background:selected.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff'}}>
                {(selected.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2)}
              </div>
              <div>
                <div style={{fontSize:19,fontWeight:800,color:'#0A0A0A'}}>{selected.name} {selected.verified && <span style={{color:'var(--orange)',fontSize:14}}>✓</span>}</div>
                <div style={{fontSize:13,color:'#AAAAAA'}}>@{selected.handle} · {selected.persona} · {selected.country}</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
              {[['Products',selected.products||0],['Upvotes Given',selected.votes_given||0],['Status',selected.status==='active'?'✅':'🚫']].map(([l,v])=>(
                <div key={l} style={{background:'#FAFAFA',borderRadius:12,padding:'14px',textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:800}}>{v}</div>
                  <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              {!selected.verified && (
                <button onClick={()=>act(selected.id, ()=>adminAPI.verifyUser(selected.id), `${selected.name} verified!`)}
                  disabled={acting[selected.id]}
                  style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px 18px',fontWeight:700,fontSize:13,cursor:'pointer',opacity:acting[selected.id]?0.5:1}}>
                  {acting[selected.id]?'…':'✓ Verify'}
                </button>
              )}
              {selected.status !== 'suspended'
                ? <button onClick={()=>act(selected.id, ()=>adminAPI.suspendUser(selected.id), `${selected.name} suspended`)}
                    disabled={acting[selected.id]}
                    style={{background:'#FEF3C7',color:'#92400E',border:'none',borderRadius:10,padding:'10px 18px',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                    Suspend
                  </button>
                : <button onClick={()=>act(selected.id, ()=>adminAPI.reinstate(selected.id), `${selected.name} reinstated`)}
                    disabled={acting[selected.id]}
                    style={{background:'#DCFCE7',color:'#166534',border:'none',borderRadius:10,padding:'10px 18px',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                    Reinstate
                  </button>
              }
              <button onClick={()=>setSelected(null)} style={{background:'#F4F4F4',color:'#666',border:'none',borderRadius:10,padding:'10px 18px',fontWeight:600,fontSize:13,cursor:'pointer'}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ENTITIES ─────────────────────────────────────────
const ENTITY_TABS = [
  {key:'startups',    label:'Startups',        type:'startup'},
  {key:'accelerators',label:'Accelerators',    type:'accelerator'},
  {key:'investors',   label:'Investors',       type:'investor'},
  {key:'ventures',    label:'Venture Studios', type:'venture_studio'},
];

export function AdminEntities() {
  const [tab, setTab] = useState('startups');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});

  const load = useCallback((tabKey) => {
    setLoading(true);
    const typeMap = { startups:'startup', accelerators:'accelerator', investors:'investor', ventures:'venture_studio' };
    adminAPI.entities({ type: typeMap[tabKey], limit: 100 })
      .then(({ data: d }) => setList(d.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const verify = async (id, name) => {
    setActing(p => ({ ...p, [id]: true }));
    try {
      await adminAPI.verifyEntity(id);
      toast.success(`${name} verified!`);
      setList(l => l.map(e => e.id === id ? { ...e, verified: true } : e));
    } catch {
      toast.error('Failed to verify');
    } finally {
      setActing(p => ({ ...p, [id]: false }));
    }
  };

  const heads = {
    startups:     ['Entity','Industry','Country','Stage','Employees','Followers','Verified','Actions'],
    accelerators: ['Entity','Country','Focus','Stage','Portfolio','Verified','Actions'],
    investors:    ['Entity','Country','Focus','AUM','Portfolio','Verified','Actions'],
    ventures:     ['Entity','Country','Focus','Ventures Built','Verified','Actions'],
  };

  return (
    <SectionCard title="Entities" sub="Manage MENA ecosystem entities">
      <FilterChips options={ENTITY_TABS} value={tab} onChange={t => { setTab(t); }}/>
      <Tbl heads={heads[tab]||[]}>
        {loading ? (
          <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
        ) : list.length === 0 ? (
          <tr><td colSpan={8}><EmptyState icon="🏢" title="No entities found" sub="Entities submitted by users will appear here"/></td></tr>
        ) : list.map(e => {
          let cols;
          if (tab === 'startups') cols = <>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.industry||'—'}</span></td>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country||'—'}</td>
            <td style={{padding:'11px 16px'}}><Badge variant="purple">{e.stage||'—'}</Badge></td>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.employees||'—'}</td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.followers_count?.toLocaleString()||'0'}</td>
          </>;
          else if (tab === 'accelerators') cols = <>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country||'—'}</td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.focus||e.industry||'—'}</span></td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.stage||'—'}</span></td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.portfolio_count ? `${e.portfolio_count}+ startups` : '—'}</td>
          </>;
          else if (tab === 'investors') cols = <>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country||'—'}</td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.focus||e.industry||'—'}</span></td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700,color:'#16a34a'}}>{e.aum||'—'}</td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.portfolio_count||'—'}</td>
          </>;
          else cols = <>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country||'—'}</td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.focus||e.industry||'—'}</span></td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.portfolio_count||'—'}</td>
          </>;

          return (
            <tr key={e.id} style={{borderBottom:'1px solid #F4F4F4'}}
              onMouseEnter={ev=>ev.currentTarget.style.background='#FAFAFA'}
              onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
              <td style={{padding:'11px 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{fontSize:22}}>{e.logo_emoji||'🏢'}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:'#0A0A0A'}}>{e.name}</div>
                    {e.website && <div style={{fontSize:10,color:'#AAAAAA'}}>{e.website.replace(/^https?:\/\//,'').split('/')[0]}</div>}
                  </div>
                </div>
              </td>
              {cols}
              <td style={{padding:'11px 16px'}}>
                {e.verified ? <Badge variant="blue">✓ Verified</Badge> : <ActionBtn variant="verify" loading={acting[e.id]} onClick={()=>verify(e.id, e.name)}>Verify</ActionBtn>}
              </td>
              <td style={{padding:'11px 16px'}}>
                <div style={{display:'flex',gap:6}}>
                  <ActionBtn variant="delete" onClick={()=>toast.error('Delete not available yet')}>🗑</ActionBtn>
                </div>
              </td>
            </tr>
          );
        })}
      </Tbl>
    </SectionCard>
  );
}

// ─── APPLICATIONS ─────────────────────────────────────
const STATUS_MAP = {
  accepted:{v:'green',l:'Accepted'}, reviewing:{v:'blue',l:'Reviewing'}, pending:{v:'amber',l:'Pending'},
  rejected:{v:'red',l:'Rejected'}, interested:{v:'green',l:'Interested'}, 'follow-up':{v:'blue',l:'Follow-up'}, sent:{v:'gray',l:'Sent'}, open:{v:'green',l:'Open'},
};

export function AdminApplications() {
  const [data, setData] = useState({ accelerator_apps: [], investor_pitches: [], waitlists: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.applications()
      .then(({ data: d }) => setData(d.data || { accelerator_apps:[], investor_pitches:[], waitlists:[] }))
      .catch(() => setData({ accelerator_apps:[], investor_pitches:[], waitlists:[] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const accelApps = data.accelerator_apps || [];
  const pitches   = data.investor_pitches || [];
  const waitlists = data.waitlists || [];

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading…</div>;

  return (
    <div>
      {/* Accelerator Apps */}
      <SectionCard title="Accelerator Applications" sub={`${accelApps.length} applications`}>
        {accelApps.length === 0 ? <EmptyState icon="📋" title="No applications yet" sub="Accelerator applications will appear here"/> : (
          <Tbl heads={['Applicant','Startup','Accelerator','Stage','Date','Status','Actions']}>
            {accelApps.map(a => {
              const s = STATUS_MAP[a.status]||{v:'gray',l:a.status};
              return (
                <tr key={a.id} style={{borderBottom:'1px solid #F4F4F4'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{a.applicant_name}</div>
                    <div style={{fontSize:11,color:'#AAAAAA'}}>@{a.applicant_handle}</div>
                  </td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#0A0A0A'}}>{a.product_name||'—'}</td>
                  <td style={{padding:'11px 16px',fontSize:13,color:'#0A0A0A'}}>{a.entity_name}</td>
                  <td style={{padding:'11px 16px'}}><Badge variant="purple">{a.stage||'—'}</Badge></td>
                  <td style={{padding:'11px 16px',fontSize:11,color:'#AAAAAA'}}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td style={{padding:'11px 16px'}}><Badge variant={s.v}>{s.l}</Badge></td>
                  <td style={{padding:'11px 16px'}}>
                    {(a.status==='pending'||a.status==='reviewing') && (
                      <div style={{display:'flex',gap:6}}>
                        <ActionBtn variant="approve" onClick={()=>toast.success('Accepted!')}>Accept</ActionBtn>
                        <ActionBtn variant="reject" onClick={()=>toast.success('Rejected')}>Reject</ActionBtn>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </Tbl>
        )}
      </SectionCard>

      {/* Investor Pitches */}
      <SectionCard title="Investor Pitches" sub={`${pitches.length} pitch requests`}>
        {pitches.length === 0 ? <EmptyState icon="💼" title="No pitches yet" sub="Investor pitch requests will appear here"/> : (
          <Tbl heads={['Founder','Product','Investor','Ask','Date','Status']}>
            {pitches.map(p => {
              const s = STATUS_MAP[p.status]||{v:'gray',l:p.status};
              return (
                <tr key={p.id} style={{borderBottom:'1px solid #F4F4F4'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{p.founder_name}</div>
                    <div style={{fontSize:11,color:'#AAAAAA'}}>@{p.founder_handle}</div>
                  </td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#0A0A0A'}}>{p.product_name||'—'}</td>
                  <td style={{padding:'11px 16px',fontSize:13}}>{p.investor_name}</td>
                  <td style={{padding:'11px 16px',fontSize:14,fontWeight:800,color:'#16a34a'}}>{p.ask_amount ? `$${Number(p.ask_amount).toLocaleString()}` : '—'}</td>
                  <td style={{padding:'11px 16px',fontSize:11,color:'#AAAAAA'}}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{padding:'11px 16px'}}><Badge variant={s.v}>{s.l}</Badge></td>
                </tr>
              );
            })}
          </Tbl>
        )}
      </SectionCard>

      {/* Waitlists */}
      <SectionCard title="Waitlists" sub="Products with active waitlists">
        {waitlists.length === 0 ? <EmptyState icon="📬" title="No active waitlists" sub="Products with waitlists will appear here"/> : (
          <Tbl heads={['Product','Total Signups','Last 24h','Status','Actions']}>
            {waitlists.map(w => (
              <tr key={w.id} style={{borderBottom:'1px solid #F4F4F4'}}
                onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{padding:'11px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:20}}>{w.logo_emoji||'📦'}</span>
                    <span style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{w.name}</span>
                  </div>
                </td>
                <td style={{padding:'11px 16px',fontSize:15,fontWeight:800,color:'#0A0A0A'}}>{w.waitlist_count||0}</td>
                <td style={{padding:'11px 16px'}}><Badge variant="green">+{w.last_24h||0} today</Badge></td>
                <td style={{padding:'11px 16px'}}><Badge variant="green">● Open</Badge></td>
                <td style={{padding:'11px 16px'}}><ActionBtn variant="edit" onClick={()=>toast.success(`Exported ${w.name} CSV`)}>Export CSV</ActionBtn></td>
              </tr>
            ))}
          </Tbl>
        )}
      </SectionCard>
    </div>
  );
}

// ─── FEATURED ─────────────────────────────────────────
export function AdminFeatured() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const [banner, setBanner] = useState("🌟 MENA's #1 Tech Discovery Platform — Now featuring 340K+ monthly visitors!");
  const [editorNote, setEditorNote] = useState("This week's picks are tackling MENA's biggest infrastructure gaps.");
  const [savingBanner, setSavingBanner] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.products({ limit: 200 })
      .then(({ data: d }) => {
        const all = d.data || [];
        setAllProducts(all);
        setFeaturedProducts(all.filter(p => p.featured));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleFeatured = async (product) => {
    setToggling(p => ({ ...p, [product.id]: true }));
    try {
      await adminAPI.featured(product.id);
      toast.success(product.featured ? `${product.name} removed from featured` : `${product.name} featured!`);
      load();
    } catch {
      toast.error('Failed');
    } finally {
      setToggling(p => ({ ...p, [product.id]: false }));
    }
  };

  const nonFeatured = allProducts.filter(p => p.status === 'live' && !p.featured);

  return (
    <div>
      {/* Featured Spotlight */}
      <SectionCard title="Featured Spotlight" sub="Products currently featured on the homepage">
        <div style={{padding:'16px 20px'}}>
          {loading ? (
            <div style={{textAlign:'center',padding:'30px 0',color:'#AAAAAA',fontSize:13}}>Loading…</div>
          ) : featuredProducts.length === 0 ? (
            <EmptyState icon="⭐" title="No featured products" sub="Use the toggle below to feature live products"/>
          ) : featuredProducts.map((p, i) => (
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,background:'#FAFAFA',border:'1px solid #E8E8E8',borderRadius:14,padding:'14px 16px',marginBottom:10}}>
              <div style={{color:'#AAAAAA',fontSize:18,lineHeight:1}}>⠿</div>
              <div style={{fontSize:28}}>{p.logo||p.logo_emoji||'📦'}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:'#0A0A0A'}}>{p.name}</div>
                <div style={{fontSize:11,color:'#AAAAAA'}}>{p.tagline}</div>
                <div style={{fontSize:10,color:'#AAAAAA',marginTop:2}}>{p.category} · {p.country}</div>
              </div>
              <Badge variant="orange">⭐ #{i+1}</Badge>
              <ActionBtn variant="reject" loading={toggling[p.id]} onClick={()=>toggleFeatured(p)}>Remove</ActionBtn>
            </div>
          ))}

          {/* Add from live products */}
          {nonFeatured.length > 0 && (
            <div style={{marginTop:16}}>
              <div style={{fontSize:12,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Add from live products</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:280,overflowY:'auto'}}>
                {nonFeatured.map(p => (
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,border:'1px solid #E8E8E8',borderRadius:12,padding:'10px 14px'}}>
                    <div style={{fontSize:22}}>{p.logo||p.logo_emoji||'📦'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{p.name}</div>
                      <div style={{fontSize:11,color:'#AAAAAA'}}>{p.category} · {p.country}</div>
                    </div>
                    <ActionBtn variant="verify" loading={toggling[p.id]} onClick={()=>toggleFeatured(p)}>⭐ Feature</ActionBtn>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Banner settings */}
      <SectionCard title="Homepage Banner" sub="Announcement bar shown at the top of the public site">
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
          <textarea value={banner} onChange={e=>setBanner(e.target.value)} rows={2}
            style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',width:'100%'}}/>
          <div style={{display:'flex',gap:8}}>
            <button disabled={savingBanner} onClick={async()=>{setSavingBanner(true);await new Promise(r=>setTimeout(r,400));setSavingBanner(false);toast.success('Banner updated!');}} style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:700,fontSize:13,cursor:'pointer',opacity:savingBanner?0.6:1}}>
              {savingBanner?'Saving…':'Save Banner'}
            </button>
            <button onClick={()=>toast.success('Banner hidden')} style={{background:'#F4F4F4',color:'#666',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:600,fontSize:13,cursor:'pointer'}}>Hide</button>
          </div>
        </div>
      </SectionCard>

      {/* Editor's pick */}
      <SectionCard title="Editor's Pick" sub="Weekly editorial note shown on homepage">
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
          <textarea value={editorNote} onChange={e=>setEditorNote(e.target.value)} rows={3}
            style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',width:'100%'}}/>
          <button onClick={()=>toast.success("Editor's pick updated!")} style={{alignSelf:'flex-start',background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:700,fontSize:13,cursor:'pointer'}}>Update Pick</button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────
export function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.reports()
      .then(({ data: d }) => setData(d.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading reports…</div>;

  const k = data?.kpis || {};
  const kpis = [
    {label:'Live Products',      value: Number(k.live_products||0).toLocaleString(),    sub:`${k.avg_upvotes||0} avg upvotes/product`,       color:'var(--orange)'},
    {label:'Active Users',       value: Number(k.active_users||0).toLocaleString(),     sub:`+${k.new_users_week||0} this week`,              color:'#16a34a'},
    {label:'Total Upvotes',      value: Number(k.total_upvotes||0).toLocaleString(),    sub:'Across all products',                            color:'#2563eb'},
    {label:'Waitlist Signups',   value: Number(k.waitlist_total||0).toLocaleString(),   sub:'Across products with waitlists',                 color:'#7c3aed'},
    {label:'Applications',       value: Number(k.total_apps||0).toLocaleString(),       sub:'Accelerator & investor',                         color:'#d97706'},
    {label:'Avg Upvotes/Product',value: Number(k.avg_upvotes||0).toLocaleString(),      sub: k.top_product ? `Top: ${k.top_product}` : '—',  color:'#64748b'},
  ];

  const countries  = data?.country_breakdown  || [];
  const industries = data?.industry_breakdown  || [];
  const personas   = data?.persona_breakdown   || [];
  const trend      = data?.signup_trend        || [];

  const maxCountry  = Math.max(1, ...countries.map(c => Number(c.count)));
  const maxIndustry = Math.max(1, ...industries.map(i => Number(i.count)));
  const maxPersona  = Math.max(1, ...personas.map(p => Number(p.count)));
  const maxTrend    = Math.max(1, ...trend.map(t => Number(t.signups)));

  const COUNTRY_FLAGS = {
    'Saudi Arabia':'🇸🇦','UAE':'🇦🇪','Egypt':'🇪🇬','Jordan':'🇯🇴','Morocco':'🇲🇦',
    'Kuwait':'🇰🇼','Qatar':'🇶🇦','Bahrain':'🇧🇭','Oman':'🇴🇲','Iraq':'🇮🇶',
    'Lebanon':'🇱🇧','Tunisia':'🇹🇳','Libya':'🇱🇾','Algeria':'🇩🇿','Yemen':'🇾🇪',
    'Sudan':'🇸🇩','Syria':'🇸🇾','Palestine':'🇵🇸',
  };

  function BarRow({ label, pct, extra, barColor='var(--orange)' }) {
    return (
      <div style={{marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:13,color:'#0A0A0A'}}>{label}</span>
          <span style={{fontSize:12,fontWeight:700,color:'#0A0A0A'}}>{extra}</span>
        </div>
        <div style={{height:6,borderRadius:3,background:'#F4F4F4'}}>
          <div style={{height:'100%',width:`${Math.min(100,pct)}%`,borderRadius:3,background:barColor,transition:'width .4s'}}/>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* KPI grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
        {kpis.map((kpi,i) => (
          <div key={i} style={{background:'#fff',borderRadius:14,border:'1px solid #E8E8E8',padding:'16px 18px',borderLeft:`4px solid ${kpi.color}`}}>
            <div style={{fontSize:22,fontWeight:900,color:kpi.color,marginBottom:4}}>{kpi.value}</div>
            <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{kpi.label}</div>
            <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Signup trend */}
      {trend.length > 0 && (
        <SectionCard title="User Signups" sub="Weekly growth (last 8 weeks)">
          <div style={{padding:'20px',display:'flex',alignItems:'flex-end',gap:8,height:130}}>
            {trend.map((d,i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div title={`${d.signups} signups`} style={{width:'100%',height:Math.round((Number(d.signups)/maxTrend)*100)+'px',background:'var(--orange)',borderRadius:'4px 4px 0 0',transition:'height .3s'}}/>
                <div style={{fontSize:10,color:'#AAAAAA',fontWeight:600}}>W{i+1}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'0 20px 14px',fontSize:11,color:'#AAAAAA'}}>
            Total: {trend.reduce((a,b)=>a+Number(b.signups),0)} signups over {trend.length} weeks
          </div>
        </SectionCard>
      )}

      {/* Breakdowns */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        <SectionCard title="By Country">
          <div style={{padding:'16px 20px'}}>
            {countries.length === 0 ? <div style={{color:'#AAAAAA',fontSize:13}}>No data yet</div> :
              countries.map(c => {
                const flag = COUNTRY_FLAGS[c.country] || '🌍';
                const pct = Math.round((Number(c.count)/maxCountry)*100);
                return <BarRow key={c.country} label={`${flag} ${c.country}`} pct={pct} extra={c.count}/>;
              })}
          </div>
        </SectionCard>
        <SectionCard title="By Industry">
          <div style={{padding:'16px 20px'}}>
            {industries.length === 0 ? <div style={{color:'#AAAAAA',fontSize:13}}>No data yet</div> :
              industries.map(ind => {
                const pct = Math.round((Number(ind.count)/maxIndustry)*100);
                return <BarRow key={ind.industry} label={ind.industry||'Other'} pct={pct} extra={`${ind.count} products`} barColor="#2563eb"/>;
              })}
          </div>
        </SectionCard>
        <SectionCard title="By Persona">
          <div style={{padding:'16px 20px'}}>
            {personas.length === 0 ? <div style={{color:'#AAAAAA',fontSize:13}}>No data yet</div> :
              personas.map(p => {
                const pct = Math.round((Number(p.count)/maxPersona)*100);
                const icons = {Founder:'🚀',Investor:'💰','Product Manager':'🧠',Enthusiast:'⭐',Maker:'🛠️'};
                return <BarRow key={p.persona} label={`${icons[p.persona]||'👤'} ${p.persona}`} pct={pct} extra={p.count} barColor="#7c3aed"/>;
              })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────
export function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.settings()
      .then(({ data: d }) => setSettings(d.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
    setSaving(true);
    try {
      await adminAPI.saveSettings({ [key]: value });
      toast.success('Setting saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  function Toggle({ checked, onChange }) {
    return (
      <label style={{position:'relative',display:'inline-block',width:42,height:24,cursor:'pointer'}}>
        <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0}}/>
        <span style={{position:'absolute',inset:0,background:checked?'var(--orange)':'#E8E8E8',borderRadius:99,transition:'.2s'}}/>
        <span style={{position:'absolute',left:checked?20:2,top:2,width:20,height:20,background:'#fff',borderRadius:'50%',transition:'.2s',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}/>
      </label>
    );
  }

  function SettingRow({ label, sub, settingKey, fallback=false }) {
    const val = settings[settingKey] !== undefined ? settings[settingKey] : fallback;
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid #F4F4F4'}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'#0A0A0A'}}>{label}</div>
          {sub && <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{sub}</div>}
        </div>
        <Toggle checked={val} onChange={v => save(settingKey, v)}/>
      </div>
    );
  }

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading settings…</div>;

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <SectionCard title="Moderation" sub="Control how content is reviewed">
        <div style={{padding:'0 20px 8px'}}>
          <SettingRow label="Auto-approve Products" sub="Skip manual review for trusted submitters" settingKey="auto_approve" fallback={false}/>
          <SettingRow label="Spam Filter" sub="Auto-flag suspicious activity" settingKey="spam_filter" fallback={true}/>
          <SettingRow label="Require Email Verification" sub="Users must verify email to submit" settingKey="require_email_verification" fallback={true}/>
        </div>
      </SectionCard>

      <SectionCard title="Platform" sub="Global platform controls">
        <div style={{padding:'0 20px 8px'}}>
          <SettingRow label="Maintenance Mode" sub="Take site offline for updates" settingKey="maintenance_mode" fallback={false}/>
          <SettingRow label="Allow New Signups" sub="Open registration to the public" settingKey="allow_signups" fallback={true}/>
          <SettingRow label="Show Waitlist Widget" sub="Display waitlist on coming-soon products" settingKey="show_waitlist" fallback={true}/>
        </div>
      </SectionCard>

      <SectionCard title="Notifications" sub="Admin alert preferences">
        <div style={{padding:'0 20px 8px'}}>
          <SettingRow label="New Product Submissions" sub="Email when a product is submitted" settingKey="notify_new_product" fallback={true}/>
          <SettingRow label="New User Signups" sub="Daily digest of new registrations" settingKey="notify_new_user" fallback={true}/>
          <SettingRow label="Flagged Content" sub="Immediate alert for spam/violations" settingKey="notify_flagged" fallback={true}/>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" sub="Irreversible actions — proceed with caution">
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
          <button onClick={()=>toast.error('Cannot delete — contact system admin')} style={{background:'#FEE2E2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'left'}}>
            🗑️ Clear All Pending Products
          </button>
          <button onClick={()=>toast.error('Disabled in this environment')} style={{background:'#FEE2E2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'left'}}>
            ⚠️ Reset Platform Data
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// Default export (used by router)
export default function AdminPages() { return null; }

// ─── PROFILE ──────────────────────────────────────────
export function AdminProfile() {
  const { user } = useAuth();
  return (
    <div style={{maxWidth:600}}>
      <SectionCard title="My Profile" sub="Your admin account details">
        <div style={{padding:'24px 20px',display:'flex',gap:20,alignItems:'flex-start'}}>
          <div style={{width:64,height:64,borderRadius:18,background:user?.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>
            {(user?.name||'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:20,fontWeight:800,color:'#0A0A0A',marginBottom:4}}>{user?.name||'Admin'}</div>
            <div style={{fontSize:13,color:'#AAAAAA',marginBottom:16}}>@{user?.handle||'admin'} · {user?.role||'admin'} · {user?.email}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[['Name',user?.name],['Handle',`@${user?.handle}`],['Email',user?.email],['Role',user?.role]].map(([l,v])=>(
                <div key={l} style={{background:'#FAFAFA',borderRadius:10,padding:'10px 14px'}}>
                  <div style={{fontSize:10,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{v||'—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
