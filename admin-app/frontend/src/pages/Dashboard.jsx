import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api.js';

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .then(({ data: d }) => setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="resp-grid-4" style={{marginBottom:20}}>
        {[...Array(4)].map((_,i) => (
          <div key={i} style={{height:110,background:'#fff',borderRadius:16,border:'1px solid var(--gray-200)',animation:'pulse 1.5s ease-in-out infinite'}}/>
        ))}
      </div>
      <div style={{textAlign:'center',padding:'40px 0',color:'var(--gray-400)',fontSize:13}}>Loading dashboard…</div>
    </div>
  );

  const s = data?.stats || {};
  const topProducts = data?.topProducts || [];
  const activity    = data?.activity    || [];
  const newUsers    = data?.newUsers    || [];

  const STAT_CARDS = [
    { icon:'🚀', label:'Live Products',    value:s.products?.live    ?? 0,  delta:`↑ ${s.products?.pending??0} pending review`, color:'orange' },
    { icon:'👥', label:'Registered Users', value:s.users?.total      ?? 0,  delta:`${s.users?.active??0} active now`,           color:'green'  },
    { icon:'🎉', label:'Total Upvotes',    value:s.upvotes           ?? 0,  delta:'Across all products',                        color:'blue'   },
    { icon:'⏳', label:'Waitlist Signups',  value:s.products?.pending ?? 0,  delta:(s.products?.pending??0)>0?'↑ needs attention':'For product', color:'purple' },
  ];

  const ICON_COLORS = { orange:'#E15033', green:'#16a34a', blue:'#2563eb', purple:'#7c3aed' };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Stat cards */}
      <div className="resp-grid-4">
        {STAT_CARDS.map((c,i) => (
          <div key={i} className={`stat-card ${c.color}`}>
            <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:12,background:`${ICON_COLORS[c.color]}12`}}>{c.icon}</div>
            <div style={{fontSize:30,fontWeight:800,letterSpacing:'-.05em',color:'var(--ink)',lineHeight:1}}>{Number(c.value).toLocaleString()}</div>
            <div style={{fontSize:12,color:'var(--gray-400)',fontWeight:500,marginTop:4}}>{c.label}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:6,color:'var(--green)'}}>{c.delta}</div>
          </div>
        ))}
      </div>

      {/* Pending queue + chart row */}
      <div className="resp-grid-main-aside">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Review Queue</span>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:'var(--amber-light)',color:'var(--amber)'}}>{s.products?.pending??0} waiting</span>
          </div>
          {(s.products?.pending??0)===0
            ? <div style={{padding:'40px 20px',textAlign:'center',color:'var(--gray-400)',fontSize:13}}>✅ Queue is clear — no pending products</div>
            : <div style={{padding:'16px 20px',color:'var(--gray-500)',fontSize:13}}>Go to Products → Pending to review and approve/reject submissions.</div>
          }
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Upvote Activity</span></div>
          <div style={{padding:'16px 20px'}}>
            <BarChart data={data?.charts?.upvotes||[]} label="upvotes" color="var(--orange)"/>
          </div>
        </div>
      </div>

      {/* 3-column bottom row */}
      <div className="resp-grid-3">
        {/* Activity feed */}
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Activity</span></div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {activity.length===0
              ? <div style={{padding:'30px 20px',textAlign:'center',color:'var(--gray-400)',fontSize:13}}>No activity yet</div>
              : activity.map((a,i) => (
                <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 20px',borderBottom:'1px solid var(--gray-100)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--orange)',flexShrink:0,marginTop:5}}/>
                  <div>
                    <div style={{fontSize:12,color:'var(--ink)',fontWeight:500}}>{a.actor_name} — <span style={{color:'var(--gray-400)'}}>{a.action}</span></div>
                    <div style={{fontSize:10,color:'var(--gray-400)',marginTop:1}}>{new Date(a.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top Products</span></div>
          {topProducts.length===0
            ? <div style={{padding:'30px 16px',textAlign:'center',color:'var(--gray-400)',fontSize:12}}>No products yet</div>
            : topProducts.map((p,i) => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid var(--gray-100)'}}>
                <div style={{fontSize:14,fontWeight:800,color:['#F59E0B','#94A3B8','#CD7C2F'][i]||'var(--gray-400)',width:18,flexShrink:0}}>{i+1}</div>
                <div style={{width:32,height:32,borderRadius:9,background:'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{p.logo_emoji||'📦'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                  <div style={{fontSize:10,color:'var(--gray-400)'}}>{p.industry}</div>
                </div>
                <div style={{fontSize:12,fontWeight:800,color:'var(--orange)',flexShrink:0}}>🎉 {p.upvotes_count}</div>
              </div>
            ))}
        </div>

        {/* New Users */}
        <div className="card">
          <div className="card-header"><span className="card-title">New Members</span></div>
          {newUsers.length===0
            ? <div style={{padding:'30px 16px',textAlign:'center',color:'var(--gray-400)',fontSize:12}}>No users yet</div>
            : newUsers.map(u => (
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid var(--gray-100)'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:u.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>
                  {(u.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                  <div style={{fontSize:10,color:'var(--gray-400)'}}>{u.persona}</div>
                </div>
                {u.verified && <span style={{fontSize:10,color:'var(--orange)'}}>✓</span>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, label, color }) {
  if (!data || data.length === 0) {
    return <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gray-400)',fontSize:12}}>No data yet</div>;
  }
  const max = Math.max(...data.map(d => parseInt(d.count||d.signups||0)), 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:5,height:80}}>
      {data.map((d,i) => {
        const val = parseInt(d.count||d.signups||0);
        return (
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
            <div style={{width:'100%',background:color,borderRadius:'3px 3px 0 0',height:Math.max(4,Math.round((val/max)*70)),minHeight:4}}/>
            <div style={{fontSize:9,color:'var(--gray-400)',fontWeight:600}}>{d.day||`W${i+1}`}</div>
          </div>
        );
      })}
    </div>
  );
}
