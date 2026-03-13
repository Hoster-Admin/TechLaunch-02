import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const UPVOTE_CHART = [
  { day:'Mon', v:420 }, { day:'Tue', v:380 }, { day:'Wed', v:510 },
  { day:'Thu', v:460 }, { day:'Fri', v:620 }, { day:'Sat', v:390 }, { day:'Sun', v:540 },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});

  const load = () =>
    adminAPI.dashboard().then(({ data: d }) => { setData(d.data); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setApproving(p => ({ ...p, [id]: 'approve' }));
    try { await adminAPI.approve(id); toast.success('Product approved!'); load(); }
    catch { toast.error('Failed'); }
    finally { setApproving(p => ({ ...p, [id]: null })); }
  };

  const handleReject = async (id) => {
    setApproving(p => ({ ...p, [id]: 'reject' }));
    try { await adminAPI.reject(id); toast.success('Product rejected'); load(); }
    catch { toast.error('Failed'); }
    finally { setApproving(p => ({ ...p, [id]: null })); }
  };

  if (loading) return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
      {[...Array(4)].map((_,i) => <div key={i} style={{height:100,background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',animation:'pulse 1.5s ease-in-out infinite'}}/>)}
    </div>
  );

  const s = data?.stats || {};
  const pending = data?.pendingProducts || [];
  const topProducts = data?.topProducts || [];
  const activity = data?.activity || [];
  const newUsers = data?.newUsers || [];

  const statCards = [
    { icon:'🚀', label:'Live Products',  value: s.products?.live  ?? '—', delta:`↑ ${s.products?.pending??0} pending review`, deltaUp:true,  color:'#E15033', colorKey:'orange' },
    { icon:'👥', label:'Registered Users', value: s.users?.total ?? '—',  delta:`${s.users?.active??0} active now`,           deltaUp:true,  color:'#16a34a', colorKey:'green'  },
    { icon:'🎉', label:'Total Upvotes',   value: s.upvotes?.total  ?? '—', delta:'Across all products',                       deltaUp:true,  color:'#2563eb', colorKey:'blue'   },
    { icon:'⏳', label:'Pending Review',  value: s.products?.pending ?? '—', delta: (s.products?.pending??0) > 0 ? '↑ needs attention' : 'Queue is clear', deltaUp:false, color:'#d97706', colorKey:'purple' },
  ];

  const maxUpvote = Math.max(...UPVOTE_CHART.map(d => d.v));

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {statCards.map((c, i) => (
          <div key={i} style={{background:'#fff',borderRadius:16,border:'1.5px solid #E8E8E8',padding:'20px 22px',position:'relative',overflow:'hidden'}}>
            <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:12,background:`${c.color}15`}}>{c.icon}</div>
            <div style={{fontSize:28,fontWeight:800,letterSpacing:'-.04em',color:'#0A0A0A',lineHeight:1}}>{c.value?.toLocaleString?.() ?? c.value}</div>
            <div style={{fontSize:12,color:'#737373',fontWeight:500,marginTop:4}}>{c.label}</div>
            <div style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,fontWeight:700,marginTop:6,color:c.deltaUp?'#16a34a':'#d97706'}}>{c.delta}</div>
          </div>
        ))}
      </div>

      {/* Row: Pending Queue + Chart */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:16}}>
        {/* Pending queue */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>Pending Review Queue</div>
              <div style={{fontSize:11,color:'#AAAAAA'}}>{pending.length} product{pending.length!==1?'s':''} awaiting approval</div>
            </div>
            {pending.length > 0 && <span style={{background:'#FEF3C7',color:'#92400E',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99}}>{pending.length} pending</span>}
          </div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {pending.length === 0 ? (
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:32,marginBottom:8}}>✅</div>
                <div style={{fontWeight:700,color:'#0A0A0A',fontSize:14}}>Queue is clear!</div>
                <div style={{color:'#AAAAAA',fontSize:12,marginTop:4}}>No products pending review</div>
              </div>
            ) : pending.map(p => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 20px',borderBottom:'1px solid #F4F4F4'}}>
                <div style={{width:42,height:42,borderRadius:12,background:'#F4F4F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{p.logo||'📦'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:'#0A0A0A'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'#AAAAAA',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.category} · {p.country} · by @{p.handle} · {p.submittedDate || new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button onClick={() => handleApprove(p.id)} disabled={approving[p.id]} style={{background:'#DCFCE7',color:'#166534',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>✓ Approve</button>
                  <button onClick={() => handleReject(p.id)} disabled={approving[p.id]} style={{background:'#FEE2E2',color:'#991B1B',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upvote chart */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',padding:'18px 20px'}}>
          <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A',marginBottom:4}}>Daily Upvotes</div>
          <div style={{fontSize:11,color:'#AAAAAA',marginBottom:16}}>This week · {UPVOTE_CHART.reduce((a,b)=>a+b.v,0).toLocaleString()} total</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:100}}>
            {UPVOTE_CHART.map((d, i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div title={`${d.v} upvotes`} style={{width:'100%',height:Math.round((d.v/maxUpvote)*90)+'px',background:'var(--orange)',borderRadius:'4px 4px 0 0',transition:'height .3s'}}/>
                <div style={{fontSize:10,color:'#AAAAAA',fontWeight:600}}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Top Products + Platform Breakdown + Activity */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 260px 1fr',gap:16}}>
        {/* Top products */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>Top Products Today</div>
          </div>
          <div>
            {topProducts.slice(0,5).map((p, i) => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',borderBottom:'1px solid #F4F4F4'}}>
                <div style={{
                  width:26,height:26,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,flexShrink:0,
                  background: i===0?'linear-gradient(135deg,#FFD700,#FFA500)':i===1?'linear-gradient(135deg,#C0C0C0,#A8A8A8)':i===2?'linear-gradient(135deg,#CD7F32,#A0522D)':'#F4F4F4',
                  color: i<3?'#fff':'#666',
                }}>{i+1}</div>
                <div style={{fontSize:20}}>{p.logo||'📦'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'#AAAAAA'}}>{p.category}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--orange)'}}>🎉 {p.upvotes_count||p.upvotes||0}</div>
              </div>
            ))}
            {topProducts.length === 0 && <div style={{padding:'30px 20px',textAlign:'center',color:'#AAAAAA',fontSize:13}}>No data yet</div>}
          </div>
        </div>

        {/* Platform breakdown */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',padding:'18px 20px'}}>
          <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A',marginBottom:16}}>Platform Breakdown</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              { label:'Live Products', value: s.products?.live||0, color:'#16a34a' },
              { label:'Coming Soon',   value: s.products?.soon||0, color:'#2563eb' },
              { label:'Pending Review',value: s.products?.pending||0, color:'#d97706' },
              { label:'Total Users',   value: s.users?.active||0, color:'var(--orange)' },
              { label:'Waitlist Signups', value: 156, color:'#7c3aed' },
            ].map((b, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:b.color,flexShrink:0}}/>
                  <span style={{fontSize:12,color:'#666'}}>{b.label}</span>
                </div>
                <span style={{fontSize:13,fontWeight:800,color:'#0A0A0A'}}>{b.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>Recent Activity</div>
          </div>
          <div style={{maxHeight:320,overflowY:'auto'}}>
            {activity.length === 0 ? (
              <div style={{padding:'30px 20px',textAlign:'center',color:'#AAAAAA',fontSize:13}}>No recent activity</div>
            ) : activity.map((a, i) => (
              <div key={i} style={{display:'flex',gap:10,padding:'12px 20px',borderBottom:'1px solid #F4F4F4',alignItems:'flex-start'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:a.color||'var(--orange)',flexShrink:0,marginTop:5}}/>
                <div>
                  <div style={{fontSize:12,color:'#0A0A0A',lineHeight:1.4}} dangerouslySetInnerHTML={{__html: a.text}}/>
                  <div style={{fontSize:10,color:'#AAAAAA',marginTop:2}}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Users */}
      <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4'}}>
          <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>New Users</div>
          <div style={{fontSize:11,color:'#AAAAAA'}}>Recently joined the platform</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))'}}>
          {newUsers.length === 0 ? (
            <div style={{padding:'24px',color:'#AAAAAA',fontSize:13}}>No new users today</div>
          ) : newUsers.map(u => (
            <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',borderBottom:'1px solid #F4F4F4'}}>
              <div style={{width:30,height:30,borderRadius:10,background:u.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
                {(u.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.name}</div>
                <div style={{fontSize:10,color:'#AAAAAA'}}>@{u.handle} · {u.persona}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
