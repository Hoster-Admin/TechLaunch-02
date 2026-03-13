import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import { SCard, EmptyState } from './shared.jsx';
import toast from 'react-hot-toast';

const ACTION_META = {
  'product.approve':            { icon:'✅', label:'Approved product',         color:'#16a34a', bg:'#dcfce7' },
  'product.rejected':           { icon:'❌', label:'Rejected product',          color:'#dc2626', bg:'#fee2e2' },
  'product.featured':           { icon:'⭐', label:'Featured product',          color:'#d97706', bg:'#fef3c7' },
  'product.unfeatured':         { icon:'☆',  label:'Unfeatured product',        color:'#737373', bg:'#f3f4f6' },
  'user.verified':              { icon:'✓',  label:'Verified user',             color:'#2563eb', bg:'#dbeafe' },
  'user.suspended':             { icon:'🚫', label:'Suspended user',            color:'#dc2626', bg:'#fee2e2' },
  'user.reinstated':            { icon:'↩',  label:'Reinstated user',           color:'#16a34a', bg:'#dcfce7' },
  'user.created':               { icon:'👤', label:'Created team member',       color:'#7c3aed', bg:'#ede9fe' },
  'entity.created':             { icon:'🏢', label:'Created entity',            color:'#0891b2', bg:'#cffafe' },
  'entity.verified':            { icon:'✓',  label:'Verified entity',           color:'#2563eb', bg:'#dbeafe' },
  'application.status_updated': { icon:'📋', label:'Updated application status',color:'#d97706', bg:'#fef3c7' },
  'pitch.status_updated':       { icon:'💼', label:'Updated pitch status',      color:'#7c3aed', bg:'#ede9fe' },
  'settings.updated':           { icon:'⚙️', label:'Updated settings',          color:'#737373', bg:'#f3f4f6' },
  'products.bulk_approve':      { icon:'✅', label:'Bulk approved products',    color:'#16a34a', bg:'#dcfce7' },
  'products.bulk_reject':       { icon:'❌', label:'Bulk rejected products',    color:'#dc2626', bg:'#fee2e2' },
  'products.bulk_feature':      { icon:'⭐', label:'Bulk featured products',    color:'#d97706', bg:'#fef3c7' },
  'products.bulk_unfeature':    { icon:'☆',  label:'Bulk unfeatured products',  color:'#737373', bg:'#f3f4f6' },
  'users.bulk_verify':          { icon:'✓',  label:'Bulk verified users',       color:'#2563eb', bg:'#dbeafe' },
  'users.bulk_suspend':         { icon:'🚫', label:'Bulk suspended users',      color:'#dc2626', bg:'#fee2e2' },
  'users.bulk_reinstate':       { icon:'↩',  label:'Bulk reinstated users',     color:'#16a34a', bg:'#dcfce7' },
};

function getMeta(action) {
  return ACTION_META[action] || { icon:'📝', label: action.replace(/[._]/g,' '), color:'#737373', bg:'#f3f4f6' };
}

function relTime(ts) {
  const diff = Date.now() - new Date(ts);
  if (diff < 60000)     return 'just now';
  if (diff < 3600000)   return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000)  return `${Math.floor(diff/3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff/86400000)}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function fullTime(ts) {
  return new Date(ts).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

const ENTITY_OPTIONS = [
  { value:'', label:'All types' },
  { value:'product', label:'Products' },
  { value:'user', label:'Users' },
  { value:'entity', label:'Entities' },
  { value:'application', label:'Applications' },
  { value:'pitch', label:'Pitches' },
  { value:'settings', label:'Settings' },
];

const inputS = { border:'1px solid #E8E8E8', borderRadius:8, padding:'7px 10px', fontSize:12, outline:'none', background:'#FAFAFA', fontFamily:'inherit' };

export default function ActivityLog() {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [actorQ,  setActorQ]  = useState('');
  const [actionQ, setActionQ] = useState('');
  const [entityQ, setEntityQ] = useState('');
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');

  const load = useCallback((reset = true) => {
    const params = { page: reset ? 1 : page, limit: 50 };
    if (actorQ)  params.actor  = actorQ;
    if (actionQ) params.action = actionQ;
    if (entityQ) params.entity = entityQ;
    if (from)    params.from   = from;
    if (to)      params.to     = to;

    if (reset) { setLoading(true); setPage(1); }
    else setLoadingMore(true);

    adminAPI.activityLog(params)
      .then(({ data: d }) => {
        const incoming = d.data?.logs || [];
        setTotal(d.data?.total || 0);
        if (reset) setLogs(incoming);
        else setLogs(prev => [...prev, ...incoming]);
        if (!reset) setPage(p => p + 1);
      })
      .catch(() => toast.error('Failed to load audit log'))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [actorQ, actionQ, entityQ, from, to, page]);

  useEffect(() => { load(true); }, [actorQ, actionQ, entityQ, from, to]);

  const clearFilters = () => {
    setActorQ(''); setActionQ(''); setEntityQ(''); setFrom(''); setTo('');
  };

  const hasFilters = actorQ || actionQ || entityQ || from || to;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Filters */}
      <SCard>
        <div style={{ padding:'14px 20px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <input
            value={actorQ} onChange={e=>setActorQ(e.target.value)}
            placeholder="Filter by admin name…" style={{ ...inputS, width:180 }}
          />
          <input
            value={actionQ} onChange={e=>setActionQ(e.target.value)}
            placeholder="Filter by action…" style={{ ...inputS, width:160 }}
          />
          <select value={entityQ} onChange={e=>setEntityQ(e.target.value)} style={{ ...inputS, cursor:'pointer' }}>
            {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'#888', fontWeight:600 }}>From</span>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ ...inputS }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'#888', fontWeight:600 }}>To</span>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ ...inputS }} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #E8E8E8', background:'#fff', fontSize:11, color:'#666', cursor:'pointer', fontWeight:600 }}>
              ✕ Clear
            </button>
          )}
          <div style={{ marginLeft:'auto', fontSize:12, color:'#AAAAAA', fontWeight:600 }}>
            {total.toLocaleString()} event{total!==1?'s':''}
          </div>
        </div>
      </SCard>

      {/* Log list */}
      <SCard>
        {loading ? (
          <div style={{ padding:50, textAlign:'center', color:'#AAAAAA', fontSize:13 }}>Loading audit log…</div>
        ) : logs.length === 0 ? (
          <EmptyState icon="📝" title="No activity yet" sub="Admin actions will appear here once you start managing the platform" />
        ) : (
          <div style={{ padding:'8px 0' }}>
            {logs.map((log, i) => {
              const meta    = getMeta(log.action);
              const initials = (log.actor_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
              const details  = log.details || {};
              const label    = details.name
                ? `${meta.label}: "${details.name}"`
                : details.count
                  ? `${meta.label} (${details.count} items)`
                  : details.status
                    ? `${meta.label} → ${details.status}`
                    : meta.label;

              return (
                <div key={log.id} style={{
                  display:'flex', alignItems:'flex-start', gap:14,
                  padding:'14px 20px',
                  borderBottom: i < logs.length-1 ? '1px solid #F4F4F4' : 'none',
                }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  {/* Admin avatar */}
                  <div style={{
                    width:36, height:36, borderRadius:10, flexShrink:0,
                    background: log.avatar_color || 'var(--orange)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:800, color:'#fff',
                  }}>{initials}</div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0A0A0A' }}>
                        {log.actor_name || 'System'}
                      </span>
                      {log.actor_role && (
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:99, background:'#F4F4F4', color:'#737373', textTransform:'uppercase' }}>
                          {log.actor_role}
                        </span>
                      )}
                      {/* Action badge */}
                      <span style={{
                        fontSize:11, fontWeight:700, padding:'3px 9px',
                        borderRadius:99, background:meta.bg, color:meta.color,
                        display:'inline-flex', alignItems:'center', gap:4,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:'#555', marginTop:3 }}>{label}</div>
                    {details.reason && (
                      <div style={{ fontSize:11, color:'#dc2626', marginTop:2, fontStyle:'italic' }}>Reason: {details.reason}</div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--orange)' }}>{relTime(log.created_at)}</div>
                    <div style={{ fontSize:10, color:'#AAAAAA', marginTop:2 }}>{fullTime(log.created_at)}</div>
                    {log.entity && (
                      <div style={{ fontSize:10, color:'#AAAAAA', marginTop:2, textTransform:'capitalize' }}>{log.entity}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {logs.length < total && (
              <div style={{ padding:'16px 20px', textAlign:'center' }}>
                <button
                  onClick={() => load(false)}
                  disabled={loadingMore}
                  style={{
                    padding:'8px 24px', borderRadius:10, border:'1.5px solid #E8E8E8',
                    background:'#fff', fontSize:12, color:'#666', cursor:'pointer', fontWeight:600,
                  }}
                >
                  {loadingMore ? 'Loading…' : `Load more (${total - logs.length} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}
      </SCard>
    </div>
  );
}
