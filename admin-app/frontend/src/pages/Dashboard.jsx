import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api.js';

const UPVOTE_CHART = [
  {day:'Mon',v:420},{day:'Tue',v:380},{day:'Wed',v:510},
  {day:'Thu',v:460},{day:'Fri',v:620},{day:'Sat',v:390},{day:'Sun',v:540},
];

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .then(({ data: d }) => setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading dashboard…</div>;

  const s = data?.stats || {};
  const topProducts = data?.topProducts || [];
  const activity    = data?.activity    || [];
  const newUsers    = data?.newUsers    || [];

  const statCards = [
    { icon:'🚀', label:'Live Products',    value: s.products?.live    ?? '—', delta:`↑ ${s.products?.pending??0} pending`, color:'#E15033' },
    { icon:'👥', label:'Registered Users', value: s.users?.total      ?? '—', delta:`${s.users?.active??0} active`,       color:'#16a34a' },
    { icon:'🎉', label:'Total Upvotes',    value: s.upvotes           ?? '—', delta:'Across all products',                color:'#2563eb' },
    { icon:'⏳', label:'Pending Review',   value: s.products?.pending ?? '—', delta: (s.products?.pending??0)>0 ? '↑ needs attention' : 'Queue is clear', color:'#d97706' },
  ];

  const maxUpvote = Math.max(...UPVOTE_CHART.map(d => d.v));

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {statCards.map((c,i) => (
          <div key={i} style={{background:'#fff',borderRadius:16,border:'1.5px solid #E8E8E8',padding:'20px 22px'}}>
            <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:12,background:`${c.color}15`}}>{c.icon}</div>
            <div style={{fontSize:28,fontWeight:800,letterSpacing:'-.04em',color:'#0A0A0A',lineHeight:1}}>{c.value?.toLocaleString?.() ?? c.value}</div>
            <div style={{fontSize:12,color:'#737373',fontWeight:500,marginTop:4}}>{c.label}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:6,color:'#16a34a'}}>{c.delta}</div>
          </div>
        ))}
      </div>

      {/* Pending Queue + Upvote Chart */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:16}}>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',fontWeight:800,fontSize:14}}>Pending Review Queue</div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {data?.newUsers?.filter?.(()=>false).length === 0
              ? <div style={{padding:'40px 20px',textAlign:'center',color:'#AAAAAA',fontSize:13}}>Queue is clear ✅</div>
              : (s.products?.pending > 0
                  ? <div style={{padding:'20px',color:'#AAAAAA',fontSize:13}}>Load products section to review pending items</div>
                  : <div style={{padding:'40px 20px',textAlign:'center',color:'#AAAAAA',fontSize:13}}>✅ No pending products</div>
                )
            }
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',fontWeight:800,fontSize:14}}>Upvotes This Week</div>
          <div style={{padding:'16px 20px 8px'}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
              {UPVOTE_CHART.map(d => (
                <div key={d.day} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{width:'100%',background:'var(--orange)',borderRadius:4,height:Math.round((d.v/maxUpvote)*70)}}/>
                  <div style={{fontSize:10,color:'#AAAAAA'}}>{d.day}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'#AAAAAA',marginTop:8}}>Total: {UPVOTE_CHART.reduce((a,b)=>a+b.v,0).toLocaleString()} upvotes this week</div>
          </div>
        </div>
      </div>

      {/* Activity + Top Products + New Users */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 260px 260px',gap:16}}>
        {/* Activity feed */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',fontWeight:800,fontSize:14}}>Recent Activity</div>
          <div style={{maxHeight:280,overflowY:'auto'}}>
            {activity.length === 0 ? (
              <div style={{padding:'30px 20px',textAlign:'center',color:'#AAAAAA',fontSize:13}}>No activity yet</div>
            ) : activity.map((a,i) => (
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 20px',borderBottom:'1px solid #F4F4F4'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'var(--orange)',flexShrink:0,marginTop:4}}/>
                <div>
                  <div style={{fontSize:12,color:'#0A0A0A'}}>{a.actor_name} — {a.action}</div>
                  <div style={{fontSize:10,color:'#AAAAAA'}}>{new Date(a.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',fontWeight:800,fontSize:14}}>Top Products</div>
          <div>
            {topProducts.map((p,i) => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid #F4F4F4'}}>
                <div style={{fontSize:14,fontWeight:800,color:['#F59E0B','#94A3B8','#CD7C2F'][i]||'#AAAAAA',width:18}}>{i+1}</div>
                <div style={{fontSize:18}}>{p.logo_emoji||'📦'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                  <div style={{fontSize:10,color:'#AAAAAA'}}>{p.industry}</div>
                </div>
                <div style={{fontSize:12,fontWeight:800,color:'var(--orange)'}}>🎉{p.upvotes_count}</div>
              </div>
            ))}
            {topProducts.length === 0 && <div style={{padding:'30px 16px',textAlign:'center',color:'#AAAAAA',fontSize:12}}>No products yet</div>}
          </div>
        </div>

        {/* New Users */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',fontWeight:800,fontSize:14}}>New Users</div>
          <div>
            {newUsers.map(u => (
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid #F4F4F4'}}>
                <div style={{width:28,height:28,borderRadius:8,background:u.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>
                  {(u.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                  <div style={{fontSize:10,color:'#AAAAAA'}}>{u.persona}</div>
                </div>
              </div>
            ))}
            {newUsers.length === 0 && <div style={{padding:'30px 16px',textAlign:'center',color:'#AAAAAA',fontSize:12}}>No users yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
