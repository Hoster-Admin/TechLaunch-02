import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import { fmtDate } from './shared.jsx';

const ACTION_LABELS = {
  'product.approve':   'Approved a product',
  'product.reject':    'Rejected a product',
  'product.feature':   'Featured a product',
  'product.unfeature': 'Unfeatured a product',
  'user.verified':     'Verified a user',
  'user.suspended':    'Suspended a user',
  'user.reinstated':   'Reinstated a user',
  'user.warned':       'Warned a user',
  'user.deleted':      'Deleted a user',
  'user.created':      'Added a user',
  'user.signup':       'New member signup',
  'entity.created':    'Created an entity',
  'entity.updated':    'Updated an entity',
  'entity.deleted':    'Deleted an entity',
  'settings.updated':  'Updated settings',
  'bulk.approve':      'Bulk approved products',
  'bulk.reject':       'Bulk rejected products',
};
function humanizeAction(action) {
  return ACTION_LABELS[action] || action.split('.').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
}

const ICON_COLORS = { orange:'#E15033', green:'#16a34a', blue:'#2563eb', purple:'#7c3aed' };

export default function Dashboard({ onNavigate }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    adminAPI.dashboard()
      .then(({ data: d }) => setData(d.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div>
      <div className="resp-grid-4" style={{marginBottom:20}}>
        {[...Array(4)].map((_,i) => (
          <div key={i} style={{height:110,background:'#fff',borderRadius:16,border:'1px solid var(--gray-200)',animation:'pulse 1.5s ease-in-out infinite'}}/>
        ))}
      </div>
      <div style={{textAlign:'center',padding:'60px 0',color:'var(--gray-400)',fontSize:13}}>Loading dashboard…</div>
    </div>
  );

  if (error) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',gap:16}}>
      <div style={{fontSize:40}}>⚠️</div>
      <div style={{fontSize:16,fontWeight:700,color:'#0A0A0A'}}>Failed to load dashboard</div>
      <div style={{fontSize:13,color:'#888'}}>There was a problem fetching the dashboard data.</div>
      <button onClick={load} style={{marginTop:8,padding:'10px 24px',borderRadius:10,background:'var(--orange)',color:'#fff',border:'none',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
        ↺ Retry
      </button>
    </div>
  );

  const s              = data?.stats || {};
  const topProducts    = data?.topProducts || [];
  const activity       = data?.activity    || [];
  const newUsers       = data?.newUsers    || [];
  const pendingCount   = Number(s.products?.pending ?? 0);
  const appsPending    = Number(s.apps_pending ?? 0);
  const totalPending   = pendingCount + appsPending;

  const STAT_CARDS = [
    { icon:'🚀', label:'Live Products',     value:s.products?.live ?? 0, delta:`↑ ${pendingCount} pending review`, color:'orange', page:'products' },
    { icon:'👥', label:'Registered Users',  value:s.users?.total   ?? 0, delta:`${s.users?.active??0} active now`,   color:'green',  page:'users'    },
    { icon:'🎉', label:'Total Upvotes',     value:s.upvotes        ?? 0, delta:'Across all products',                color:'blue',   page:null       },
    { icon:'📬', label:'Waitlist Signups',  value:s.waitlist       ?? 0, delta:Number(s.waitlist??0)>0?'↑ users waiting':'No signups yet', color:'purple', page:null },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Action Required Banner */}
      {totalPending > 0 && (
        <div style={{background:'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',borderRadius:16,padding:'16px 24px',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 20px rgba(255,107,53,.25)'}}>
          <span style={{fontSize:24,flexShrink:0}}>🔔</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:2}}>
              Action Required — {totalPending} item{totalPending!==1?'s':''} need{totalPending===1?'s':''} your attention
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.85)'}}>
              {pendingCount > 0 && `${pendingCount} product${pendingCount!==1?'s':''} pending review`}
              {pendingCount > 0 && appsPending > 0 && '  ·  '}
              {appsPending > 0 && `${appsPending} application${appsPending!==1?'s':''} awaiting decision`}
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            {pendingCount > 0 && (
              <button onClick={() => onNavigate?.('products')}
                style={{padding:'8px 16px',borderRadius:9,background:'rgba(255,255,255,.2)',color:'#fff',border:'1.5px solid rgba(255,255,255,.4)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',backdropFilter:'blur(4px)'}}>
                Review Products →
              </button>
            )}
            {appsPending > 0 && (
              <button onClick={() => onNavigate?.('applications')}
                style={{padding:'8px 16px',borderRadius:9,background:'rgba(255,255,255,.2)',color:'#fff',border:'1.5px solid rgba(255,255,255,.4)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',backdropFilter:'blur(4px)'}}>
                Review Applications →
              </button>
            )}
          </div>
        </div>
      )}
      {/* Stat cards — clickable */}
      <div className="resp-grid-4">
        {STAT_CARDS.map((c,i) => (
          <div key={i}
            className={`stat-card ${c.color}`}
            onClick={() => c.page && onNavigate?.(c.page)}
            style={{cursor:c.page?'pointer':'default',transition:'transform .12s, box-shadow .12s'}}
            onMouseEnter={e=>{ if(c.page){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.09)'; } }}
            onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
            <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:12,background:`${ICON_COLORS[c.color]}12`}}>{c.icon}</div>
            <div style={{fontSize:30,fontWeight:800,letterSpacing:'-.05em',color:'var(--ink)',lineHeight:1}}>{Number(c.value).toLocaleString()}</div>
            <div style={{fontSize:12,color:'var(--gray-400)',fontWeight:500,marginTop:4}}>{c.label}</div>
            <div style={{fontSize:11,fontWeight:700,marginTop:6,color:`${ICON_COLORS[c.color]}`}}>{c.delta}</div>
          </div>
        ))}
      </div>

      {/* Pending queue + chart row */}
      <div className="resp-grid-main-aside">
        {/* Pending queue */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Review Queue</span>
            {pendingCount > 0 && (
              <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:'var(--amber-light)',color:'var(--amber)'}}>{pendingCount} waiting</span>
            )}
          </div>
          {pendingCount === 0 ? (
            <div style={{padding:'20px 20px',display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:22}}>✅</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>Queue is clear</div>
                <div style={{fontSize:12,color:'#888',marginTop:2}}>All submissions have been reviewed.</div>
              </div>
            </div>
          ) : (
            <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:20}}>🔔</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{pendingCount} product{pendingCount!==1?'s':''} awaiting review</div>
                <div style={{fontSize:12,color:'#888',marginTop:2}}>Click below to review and approve or reject.</div>
              </div>
              <button onClick={() => onNavigate?.('products')}
                style={{padding:'8px 16px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                Review Queue →
              </button>
            </div>
          )}
        </div>

        {/* Upvote chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Upvote Activity</span></div>
          <div style={{padding:'16px 20px'}}>
            <BarChart data={data?.charts?.upvotes||[]} color="var(--orange)"/>
          </div>
        </div>
      </div>

      {/* 3-column bottom row */}
      <div className="resp-grid-3">
        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <button onClick={() => onNavigate?.('activity')}
              style={{background:'none',border:'none',fontSize:12,fontWeight:600,color:'var(--orange)',cursor:'pointer',padding:0,fontFamily:'inherit'}}>
              View audit log →
            </button>
          </div>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {activity.length===0
              ? <div style={{padding:'24px 20px',textAlign:'center',color:'var(--gray-400)',fontSize:13}}>No activity yet</div>
              : activity.map((a,i) => (
                <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 20px',borderBottom:'1px solid var(--gray-100)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--orange)',flexShrink:0,marginTop:5}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,color:'var(--ink)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      <strong>{a.actor_name}</strong> — <span style={{color:'var(--gray-400)'}}>{humanizeAction(a.action)}</span>
                    </div>
                    <div style={{fontSize:10,color:'var(--gray-400)',marginTop:2}}>{fmtDate(a.created_at)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top Products</span></div>
          {topProducts.length===0
            ? <div style={{padding:'24px 16px',textAlign:'center',color:'var(--gray-400)',fontSize:12}}>No products yet</div>
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
            ? <div style={{padding:'24px 16px',textAlign:'center',color:'var(--gray-400)',fontSize:12}}>No users yet</div>
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

function BarChart({ data, color }) {
  if (!data || data.length === 0) {
    return (
      <div style={{height:56,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gray-400)',fontSize:12,gap:6}}>
        <span>📊</span> No upvote data for the last 7 days
      </div>
    );
  }
  const max = Math.max(...data.map(d => parseInt(d.count||0)), 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:5,height:80}}>
      {data.map((d,i) => {
        const val = parseInt(d.count||0);
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
