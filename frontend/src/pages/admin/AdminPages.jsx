import React, { useEffect, useState } from 'react';
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

function ActionBtn({ onClick, variant, children }) {
  const map = { approve:{bg:'#DCFCE7',color:'#166534'}, reject:{bg:'#FEE2E2',color:'#991B1B'}, verify:{bg:'#DBEAFE',color:'#1e40af'}, suspend:{bg:'#FEF3C7',color:'#92400E'}, edit:{bg:'#F4F4F4',color:'#666'}, delete:{bg:'#FEE2E2',color:'#991B1B'} };
  const s = map[variant]||map.edit;
  return <button onClick={onClick} style={{background:s.bg,color:s.color,border:'none',borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer'}}>{children}</button>;
}

// ─── USERS ────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.users?.().then(({ data: d }) => setUsers(d.data || [])).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  const act = (id, fn, msg) => {
    setUsers(u => u.map(x => x.id === id ? fn(x) : x));
    toast.success(msg);
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
                  {!u.verified && <ActionBtn variant="verify" onClick={()=>act(u.id,x=>({...x,verified:true}),`${u.name} verified!`)}>✓ Verify</ActionBtn>}
                  {u.status!=='suspended'
                    ? <ActionBtn variant="suspend" onClick={()=>act(u.id,x=>({...x,status:'suspended'}),`${u.name} suspended`)}>Suspend</ActionBtn>
                    : <ActionBtn variant="approve" onClick={()=>act(u.id,x=>({...x,status:'active'}),`${u.name} reinstated`)}>Reinstate</ActionBtn>}
                </div>
              </td>
            </tr>
          ))}
        </Tbl>
      </SectionCard>

      {/* User detail modal */}
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
              {!selected.verified && <button onClick={()=>{act(selected.id,x=>({...x,verified:true}),`${selected.name} verified!`);setSelected(null);}} style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px 18px',fontWeight:700,fontSize:13,cursor:'pointer'}}>✓ Verify</button>}
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
  {key:'startups',label:'Startups'},
  {key:'accelerators',label:'Accelerators'},
  {key:'investors',label:'Investors'},
  {key:'ventures',label:'Venture Studios'},
];

const MOCK_STARTUPS = [
  {name:'Tabby',logo:'💳',country:'🇦🇪 UAE',industry:'Fintech',stage:'Growth',employees:'200+',verified:true,followers:1240},
  {name:'Noon Academy',logo:'📚',country:'🇸🇦 Saudi Arabia',industry:'Edtech',stage:'Growth',employees:'100+',verified:true,followers:980},
  {name:'Vezeeta',logo:'🏥',country:'🇪🇬 Egypt',industry:'Healthtech',stage:'Series A+',employees:'500+',verified:true,followers:1560},
  {name:'Baraka',logo:'📈',country:'🇦🇪 UAE',industry:'Fintech',stage:'Early Stage',employees:'50+',verified:false,followers:670},
  {name:'Tamara',logo:'🛒',country:'🇸🇦 Saudi Arabia',industry:'Fintech',stage:'Series A+',employees:'300+',verified:true,followers:1100},
  {name:'Kader AI',logo:'🤖',country:'🇯🇴 Jordan',industry:'AI & ML',stage:'MVP',employees:'15',verified:false,followers:290},
];
const MOCK_ACCELS = [
  {name:'Flat6Labs',logo:'🚀',country:'🇪🇬 Egypt',focus:'All Sectors',stage:'Seed',verified:true,portfolio:400},
  {name:'Wamda Capital',logo:'💡',country:'🇦🇪 UAE',focus:'Tech',stage:'Series A',verified:true,portfolio:60},
  {name:'TAQADAM',logo:'🔥',country:'🇸🇦 Saudi Arabia',focus:'Deep Tech',stage:'Pre-Seed',verified:true,portfolio:60},
  {name:'Oasis500',logo:'🌴',country:'🇯🇴 Jordan',focus:'Mobile/SaaS',stage:'Seed',verified:true,portfolio:200},
];
const MOCK_INVESTORS = [
  {name:'STV',logo:'💼',country:'🇸🇦 Saudi Arabia',type:'VC Fund',aum:'$500M+',portfolio:45,verified:true},
  {name:'500 Global MENA',logo:'🔢',country:'🇦🇪 UAE',type:'Micro VC',aum:'$30M',portfolio:120,verified:true},
  {name:'Algebra Ventures',logo:'🔬',country:'🇪🇬 Egypt',type:'VC Fund',aum:'$54M',portfolio:25,verified:true},
];
const MOCK_VENTURES = [
  {name:'Misk Innovation',logo:'🌙',country:'🇸🇦 Saudi Arabia',focus:'Deep Tech · AI',ventures:12,verified:true},
  {name:'Dtec Ventures',logo:'🏗️',country:'🇦🇪 UAE',focus:'Proptech · Smart Cities',ventures:15,verified:true},
];

export function AdminEntities() {
  const [tab, setTab] = useState('startups');

  const DATA = { startups:MOCK_STARTUPS, accelerators:MOCK_ACCELS, investors:MOCK_INVESTORS, ventures:MOCK_VENTURES };
  const list = DATA[tab] || [];

  const heads = {
    startups:     ['Entity','Industry','Country','Stage','Employees','Followers','Verified','Actions'],
    accelerators: ['Entity','Country','Focus','Stage','Portfolio','Verified','Actions'],
    investors:    ['Entity','Country','Type','AUM','Portfolio','Verified','Actions'],
    ventures:     ['Entity','Country','Focus','Ventures Built','Verified','Actions'],
  };

  return (
    <SectionCard title="Entities" sub="Manage MENA ecosystem entities">
      <FilterChips options={ENTITY_TABS} value={tab} onChange={setTab}/>
      <Tbl heads={heads[tab]||[]}>
        {list.map((e,i) => {
          let cols;
          if (tab==='startups') cols = <>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.industry}</span></td>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country}</td>
            <td style={{padding:'11px 16px'}}><Badge variant="purple">{e.stage}</Badge></td>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.employees}</td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.followers?.toLocaleString()}</td>
          </>;
          else if (tab==='accelerators') cols = <>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country}</td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.focus}</span></td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.stage}</span></td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.portfolio}+ startups</td>
          </>;
          else if (tab==='investors') cols = <>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country}</td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.type}</span></td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700,color:'#16a34a'}}>{e.aum}</td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.portfolio}</td>
          </>;
          else cols = <>
            <td style={{padding:'11px 16px',fontSize:12}}>{e.country}</td>
            <td style={{padding:'11px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{e.focus}</span></td>
            <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{e.ventures}</td>
          </>;

          return (
            <tr key={i} style={{borderBottom:'1px solid #F4F4F4'}}
              onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{padding:'11px 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{fontSize:22}}>{e.logo}</div>
                  <div style={{fontWeight:700,fontSize:13,color:'#0A0A0A'}}>{e.name}</div>
                </div>
              </td>
              {cols}
              <td style={{padding:'11px 16px'}}>
                {e.verified ? <Badge variant="blue">✓ Verified</Badge> : <ActionBtn variant="verify" onClick={()=>toast.success(`${e.name} verified!`)}>Verify</ActionBtn>}
              </td>
              <td style={{padding:'11px 16px'}}>
                <div style={{display:'flex',gap:6}}>
                  <ActionBtn variant="edit" onClick={()=>toast.success(`Edit ${e.name}`)}>✎ Edit</ActionBtn>
                  <ActionBtn variant="delete" onClick={()=>toast.success(`${e.name} removed`)}>🗑</ActionBtn>
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

const MOCK_ACCEL_APPS = [
  {id:1,applicant:'Sara Al-Mahmoud',handle:'@sara_builds',startup:'Tabby',accelerator:'Flat6Labs',country:'🇪🇬 Egypt',stage:'Growth',date:'Jan 14, 2026',status:'accepted'},
  {id:2,applicant:'Mona Hassan',handle:'@mona_codes',startup:'Kader AI',accelerator:'TAQADAM',country:'🇸🇦 Saudi Arabia',stage:'MVP',date:'Feb 2, 2026',status:'reviewing'},
  {id:3,applicant:'Layla Karimi',handle:'@layla_startup',startup:'HealthApp',accelerator:'Brinc MENA',country:'🇦🇪 UAE',stage:'MVP',date:'Mar 1, 2026',status:'pending'},
];
const MOCK_PITCHES = [
  {id:1,founder:'Sara Al-Mahmoud',startup:'Tabby',investor:'STV',ask:'$500K',date:'Jan 20, 2026',status:'interested'},
  {id:2,founder:'Omar Mansour',startup:'Trella',investor:'Wamda Capital',ask:'$250K',date:'Feb 10, 2026',status:'follow-up'},
  {id:3,founder:'Mona Hassan',startup:'Kader AI',investor:'500 Global MENA',ask:'$150K',date:'Mar 2, 2026',status:'sent'},
];
const MOCK_WAITLIST = [
  {id:1,name:'Kader AI',logo:'🤖',total:67,last24h:12,rate:'4.2%',status:'open'},
  {id:2,name:'Cura',logo:'🧠',total:89,last24h:8,rate:'5.8%',status:'open'},
];

export function AdminApplications() {
  return (
    <div>
      {/* Accelerator Apps */}
      <SectionCard title="Accelerator Applications" sub={`${MOCK_ACCEL_APPS.length} applications`}>
        <Tbl heads={['Applicant','Accelerator','Stage','Date','Status','Actions']}>
          {MOCK_ACCEL_APPS.map(a => {
            const s = STATUS_MAP[a.status]||{v:'gray',l:a.status};
            return (
              <tr key={a.id} style={{borderBottom:'1px solid #F4F4F4'}}
                onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{padding:'11px 16px'}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{a.applicant}</div>
                  <div style={{fontSize:11,color:'#AAAAAA'}}>{a.handle} · {a.startup}</div>
                </td>
                <td style={{padding:'11px 16px',fontSize:13,color:'#0A0A0A'}}>{a.accelerator}</td>
                <td style={{padding:'11px 16px'}}><Badge variant="purple">{a.stage}</Badge></td>
                <td style={{padding:'11px 16px',fontSize:11,color:'#AAAAAA'}}>{a.date}</td>
                <td style={{padding:'11px 16px'}}><Badge variant={s.v}>{s.l}</Badge></td>
                <td style={{padding:'11px 16px'}}>
                  {(a.status==='pending'||a.status==='reviewing') && (
                    <div style={{display:'flex',gap:6}}>
                      <ActionBtn variant="approve" onClick={()=>toast.success('Application accepted!')}>Accept</ActionBtn>
                      <ActionBtn variant="reject" onClick={()=>toast.success('Application rejected')}>Reject</ActionBtn>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </Tbl>
      </SectionCard>

      {/* Investor Pitches */}
      <SectionCard title="Investor Pitches" sub={`${MOCK_PITCHES.length} pitch requests`}>
        <Tbl heads={['Founder','Investor','Ask','Date','Status']}>
          {MOCK_PITCHES.map(p => {
            const s = STATUS_MAP[p.status]||{v:'gray',l:p.status};
            return (
              <tr key={p.id} style={{borderBottom:'1px solid #F4F4F4'}}
                onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{padding:'11px 16px'}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{p.founder}</div>
                  <div style={{fontSize:11,color:'#AAAAAA'}}>{p.startup}</div>
                </td>
                <td style={{padding:'11px 16px',fontSize:13}}>{p.investor}</td>
                <td style={{padding:'11px 16px',fontSize:14,fontWeight:800,color:'#16a34a'}}>{p.ask}</td>
                <td style={{padding:'11px 16px',fontSize:11,color:'#AAAAAA'}}>{p.date}</td>
                <td style={{padding:'11px 16px'}}><Badge variant={s.v}>{s.l}</Badge></td>
              </tr>
            );
          })}
        </Tbl>
      </SectionCard>

      {/* Waitlists */}
      <SectionCard title="Waitlists" sub="Products with active waitlists">
        <Tbl heads={['Product','Total Signups','Last 24h','Conv. Rate','Status','Actions']}>
          {MOCK_WAITLIST.map(w => (
            <tr key={w.id} style={{borderBottom:'1px solid #F4F4F4'}}
              onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <td style={{padding:'11px 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:20}}>{w.logo}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{w.name}</span>
                </div>
              </td>
              <td style={{padding:'11px 16px',fontSize:15,fontWeight:800,color:'#0A0A0A'}}>{w.total}</td>
              <td style={{padding:'11px 16px'}}><Badge variant="green">+{w.last24h} today</Badge></td>
              <td style={{padding:'11px 16px',fontSize:13,fontWeight:700}}>{w.rate}</td>
              <td style={{padding:'11px 16px'}}><Badge variant="green">● Open</Badge></td>
              <td style={{padding:'11px 16px'}}><ActionBtn variant="edit" onClick={()=>toast.success(`Exported ${w.name} CSV`)}>Export CSV</ActionBtn></td>
            </tr>
          ))}
        </Tbl>
      </SectionCard>
    </div>
  );
}

// ─── FEATURED ─────────────────────────────────────────
const MOCK_FEATURED = [
  {id:1,name:'Tabby',logo:'💳',tagline:'Buy now, pay later · Fintech · UAE',since:'Mar 1, 2026'},
  {id:2,name:'Noon Academy',logo:'📚',tagline:'Social learning · Edtech · Saudi Arabia',since:'Mar 3, 2026'},
  {id:3,name:'Trella',logo:'🚛',tagline:'Freight marketplace · Logistics · Egypt',since:'Mar 5, 2026'},
];

export function AdminFeatured() {
  const [featured, setFeatured] = useState(MOCK_FEATURED);
  const [banner, setBanner] = useState('🌟 MENA's #1 Tech Discovery Platform — Now featuring 340K+ monthly visitors!');
  const [editorNote, setEditorNote] = useState("This week's picks are tackling MENA's biggest infrastructure gaps.");

  return (
    <div>
      {/* Featured Spotlight */}
      <SectionCard title="Featured Spotlight" sub="Drag to reorder homepage featured products">
        <div style={{padding:'16px 20px'}}>
          {featured.map((p, i) => (
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,background:'#FAFAFA',border:'1px solid #E8E8E8',borderRadius:14,padding:'14px 16px',marginBottom:10}}>
              <div style={{color:'#AAAAAA',cursor:'grab',fontSize:18,lineHeight:1}}>⠿</div>
              <div style={{fontSize:28}}>{p.logo}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:'#0A0A0A'}}>{p.name}</div>
                <div style={{fontSize:11,color:'#AAAAAA'}}>{p.tagline}</div>
                <div style={{fontSize:10,color:'#AAAAAA',marginTop:2}}>Featured since {p.since}</div>
              </div>
              <Badge variant="orange">⭐ #{i+1}</Badge>
              <ActionBtn variant="reject" onClick={() => { setFeatured(f => f.filter(x=>x.id!==p.id)); toast.success(`${p.name} removed from featured`); }}>Remove</ActionBtn>
            </div>
          ))}
          <button style={{width:'100%',border:'2px dashed #E8E8E8',borderRadius:14,padding:'14px',background:'transparent',cursor:'pointer',color:'#AAAAAA',fontSize:13,fontWeight:600,marginTop:4}} onClick={()=>toast.success('Add product to featured')}>
            + Add Featured Product
          </button>
        </div>
      </SectionCard>

      {/* Banner settings */}
      <SectionCard title="Homepage Banner" sub="Announcement bar shown at the top of the public site">
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
          <textarea value={banner} onChange={e=>setBanner(e.target.value)} rows={2}
            style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',width:'100%'}}/>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>toast.success('Banner updated!')} style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:700,fontSize:13,cursor:'pointer'}}>Save Banner</button>
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
const SIGNUP_CHART = [
  {w:'W1',v:38},{w:'W2',v:52},{w:'W3',v:44},{w:'W4',v:67},
  {w:'W5',v:91},{w:'W6',v:73},{w:'W7',v:118},{w:'W8',v:127},
];

export function AdminReports() {
  const maxSignup = Math.max(...SIGNUP_CHART.map(d=>d.v));
  const kpis = [
    {label:'Total Products',value:'15',sub:'12 live · 2 soon · 3 pending',color:'var(--orange)'},
    {label:'Total Users',value:'1,842',sub:'+127 this week',color:'#16a34a'},
    {label:'Total Upvotes',value:'8,430',sub:'Across all products',color:'#2563eb'},
    {label:'Waitlist Signups',value:'156',sub:'2 products · active',color:'#7c3aed'},
    {label:'Applications',value:'8',sub:'5 accelerator · 3 investor',color:'#d97706'},
    {label:'Avg Upvotes/Product',value:'562',sub:'Top: Tabby with 342',color:'#64748b'},
  ];

  const countries = [
    {flag:'🇸🇦',name:'Saudi Arabia',count:612,pct:33},
    {flag:'🇦🇪',name:'UAE',count:489,pct:27},
    {flag:'🇪🇬',name:'Egypt',count:368,pct:20},
    {flag:'🇯🇴',name:'Jordan',count:184,pct:10},
    {flag:'🇲🇦',name:'Morocco',count:110,pct:6},
    {flag:'🌍',name:'Other',count:79,pct:4},
  ];
  const industries = [
    {name:'Fintech',count:4,pct:80},{name:'E-Commerce',count:3,pct:60},
    {name:'Healthtech',count:2,pct:40},{name:'Logistics',count:2,pct:40},
    {name:'AI & ML',count:1,pct:20},{name:'Foodtech',count:1,pct:20},
  ];
  const personas = [
    {icon:'🚀',name:'Founders',count:28,pct:67},{icon:'💰',name:'Investors',count:6,pct:14},
    {icon:'🧠',name:'Product Managers',count:5,pct:12},{icon:'⭐',name:'Enthusiasts',count:3,pct:7},
  ];

  function BarRow({ label, pct, extra, barColor='var(--orange)' }) {
    return (
      <div style={{marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:13,color:'#0A0A0A'}}>{label}</span>
          <span style={{fontSize:12,fontWeight:700,color:'#0A0A0A'}}>{extra}</span>
        </div>
        <div style={{height:6,borderRadius:3,background:'#F4F4F4'}}>
          <div style={{height:'100%',width:`${pct}%`,borderRadius:3,background:barColor,transition:'width .4s'}}/>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* KPI grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
        {kpis.map((k,i) => (
          <div key={i} style={{background:'#fff',borderRadius:14,border:'1px solid #E8E8E8',padding:'16px 18px',borderLeft:`4px solid ${k.color}`}}>
            <div style={{fontSize:22,fontWeight:900,color:k.color,marginBottom:4}}>{k.value}</div>
            <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{k.label}</div>
            <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Signup chart */}
      <SectionCard title="User Signups" sub="Weekly growth over last 8 weeks">
        <div style={{padding:'20px',display:'flex',alignItems:'flex-end',gap:8,height:130}}>
          {SIGNUP_CHART.map((d,i) => (
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div title={`${d.v} signups`} style={{width:'100%',height:Math.round((d.v/maxSignup)*100)+'px',background:'var(--orange)',borderRadius:'4px 4px 0 0',transition:'height .3s'}}/>
              <div style={{fontSize:10,color:'#AAAAAA',fontWeight:600}}>{d.w}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'0 20px 14px',fontSize:11,color:'#AAAAAA'}}>Total: {SIGNUP_CHART.reduce((a,b)=>a+b.v,0)} signups over 8 weeks</div>
      </SectionCard>

      {/* Breakdowns */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        <SectionCard title="By Country">
          <div style={{padding:'16px 20px'}}>
            {countries.map(c => <BarRow key={c.name} label={`${c.flag} ${c.name}`} pct={c.pct} extra={`${c.count} (${c.pct}%)`}/>)}
          </div>
        </SectionCard>
        <SectionCard title="By Industry">
          <div style={{padding:'16px 20px'}}>
            {industries.map(i => <BarRow key={i.name} label={i.name} pct={i.pct} extra={`${i.count} products`} barColor="#2563eb"/>)}
          </div>
        </SectionCard>
        <SectionCard title="By Persona">
          <div style={{padding:'16px 20px'}}>
            {personas.map(p => <BarRow key={p.name} label={`${p.icon} ${p.name}`} pct={p.pct} extra={`${p.count} (${p.pct}%)`} barColor="#7c3aed"/>)}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────
export function AdminSettings() {
  const [moderation, setModeration] = useState({ autoApprove:false, spamFilter:true, requireEmail:true });
  const [platform, setPlatform] = useState({ maintenanceMode:false, allowSignups:true, showWaitlist:true });

  function Toggle({ checked, onChange }) {
    return (
      <label style={{position:'relative',display:'inline-block',width:42,height:24,cursor:'pointer'}}>
        <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0}}/>
        <span style={{position:'absolute',inset:0,background:checked?'var(--orange)':'#E8E8E8',borderRadius:99,transition:'.2s'}}/>
        <span style={{position:'absolute',left:checked?20:2,top:2,width:20,height:20,background:'#fff',borderRadius:'50%',transition:'.2s',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}/>
      </label>
    );
  }

  function SettingRow({ label, sub, checked, onChange }) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid #F4F4F4'}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'#0A0A0A'}}>{label}</div>
          {sub && <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{sub}</div>}
        </div>
        <Toggle checked={checked} onChange={onChange}/>
      </div>
    );
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <SectionCard title="Moderation" sub="Control how content is reviewed">
        <div style={{padding:'0 20px 8px'}}>
          <SettingRow label="Auto-approve Products" sub="Skip manual review for trusted submitters" checked={moderation.autoApprove} onChange={v=>setModeration(m=>({...m,autoApprove:v}))}/>
          <SettingRow label="Spam Filter" sub="Auto-flag suspicious activity" checked={moderation.spamFilter} onChange={v=>setModeration(m=>({...m,spamFilter:v}))}/>
          <SettingRow label="Require Email Verification" sub="Users must verify email to submit" checked={moderation.requireEmail} onChange={v=>setModeration(m=>({...m,requireEmail:v}))}/>
        </div>
      </SectionCard>

      <SectionCard title="Platform" sub="Global platform controls">
        <div style={{padding:'0 20px 8px'}}>
          <SettingRow label="Maintenance Mode" sub="Take site offline for updates" checked={platform.maintenanceMode} onChange={v=>setPlatform(p=>({...p,maintenanceMode:v}))}/>
          <SettingRow label="Allow New Signups" sub="Open registration to the public" checked={platform.allowSignups} onChange={v=>setPlatform(p=>({...p,allowSignups:v}))}/>
          <SettingRow label="Show Waitlist Widget" sub="Display waitlist on coming-soon products" checked={platform.showWaitlist} onChange={v=>setPlatform(p=>({...p,showWaitlist:v}))}/>
        </div>
      </SectionCard>

      <SectionCard title="Notifications" sub="Admin alert preferences">
        <div style={{padding:'0 20px 8px'}}>
          <SettingRow label="New Product Submissions" sub="Email when a product is submitted" checked={true} onChange={()=>toast.success('Saved')}/>
          <SettingRow label="New User Signups" sub="Daily digest of new registrations" checked={true} onChange={()=>toast.success('Saved')}/>
          <SettingRow label="Flagged Content" sub="Immediate alert for spam/violations" checked={true} onChange={()=>toast.success('Saved')}/>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" sub="Irreversible actions — proceed with caution">
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
          <button onClick={()=>toast.error('Cannot delete — contact Anthropic')} style={{background:'#FEE2E2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',textAlign:'left'}}>
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
