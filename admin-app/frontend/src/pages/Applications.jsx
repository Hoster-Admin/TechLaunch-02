import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState, fmtDate } from './shared.jsx';

const PITCH_STATUSES = ['sent','reviewing','interested','follow-up','rejected','funded'];

const APP_STATUS_BADGE = {
  pending:   { v:'amber', l:'Pending'   },
  reviewing: { v:'blue',  l:'Reviewing' },
  accepted:  { v:'green', l:'Accepted'  },
  rejected:  { v:'red',   l:'Rejected'  },
};
const PITCH_STATUS_MAP = {
  sent:        { v:'amber',  l:'Sent'       },
  reviewing:   { v:'blue',   l:'Reviewing'  },
  interested:  { v:'green',  l:'Interested' },
  'follow-up': { v:'purple', l:'Follow-up'  },
  rejected:    { v:'red',    l:'Rejected'   },
  funded:      { v:'green',  l:'Funded 🎉'  },
};

function NotesCell({ value, onSave, busy }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value || '');
  const save = async () => { await onSave(text); setOpen(false); };
  if (!open) return (
    <button onClick={() => { setText(value || ''); setOpen(true); }}
      style={{fontSize:11,color:'#AAAAAA',background:'none',border:'1px dashed #E8E8E8',borderRadius:6,padding:'3px 8px',cursor:'pointer',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'inherit'}}>
      {value ? `📝 ${value.slice(0,18)}${value.length>18?'…':''}` : '+ Add note'}
    </button>
  );
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:160}}>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={2}
        style={{fontSize:11,border:'1px solid #E8E8E8',borderRadius:6,padding:'4px 6px',resize:'vertical',fontFamily:'inherit',width:'100%'}}/>
      <div style={{display:'flex',gap:4}}>
        <ActionBtn variant="approve" onClick={save} disabled={busy}>Save</ActionBtn>
        <ActionBtn variant="edit" onClick={()=>setOpen(false)}>Cancel</ActionBtn>
      </div>
    </div>
  );
}

function StatusSelect({ value, options, statusMap, onChange, busy }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} disabled={busy}
      style={{fontSize:11,border:'1px solid #E8E8E8',borderRadius:6,padding:'4px 8px',fontFamily:'inherit',cursor:'pointer',background:'#fff'}}>
      {options.map(s => <option key={s} value={s}>{statusMap[s]?.l || s}</option>)}
    </select>
  );
}

export default function Applications() {
  const [data, setData]       = useState({ accelerator_apps:[], investor_pitches:[], waitlists:[] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.applications()
      .then(({ data: d }) => setData(d.data || { accelerator_apps:[],investor_pitches:[],waitlists:[] }))
      .catch(() => setData({ accelerator_apps:[],investor_pitches:[],waitlists:[] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const setBusyKey = (key, val) => setBusy(b => ({ ...b, [key]: val }));

  const updateAccel = async (id, body) => {
    const key = `accel-${id}`;
    setBusyKey(key, true);
    try {
      await adminAPI.updateAccelApp(id, body);
      toast.success('Application updated');
      load();
    } catch { toast.error('Update failed'); }
    finally { setBusyKey(key, false); }
  };

  const updatePitch = async (id, body) => {
    const key = `pitch-${id}`;
    setBusyKey(key, true);
    try {
      await adminAPI.updatePitch(id, body);
      toast.success('Pitch updated');
      load();
    } catch { toast.error('Update failed'); }
    finally { setBusyKey(key, false); }
  };

  const { accelerator_apps: accelApps, investor_pitches: pitches, waitlists } = data;

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading…</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>

      {/* Accelerator Applications — read-only, entity-managed */}
      <SCard
        title="Accelerator Applications"
        sub={`${accelApps.length} total · ${accelApps.filter(a=>a.status==='pending').length} pending · managed by each entity`}
        action={<span style={{fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:20,background:'#F4F4F4',color:'#888',display:'flex',alignItems:'center',gap:5}}>🔒 View only</span>}
      >
        {accelApps.length === 0
          ? <EmptyState icon="📋" title="No applications yet"/>
          : <div style={{overflowX:'auto'}}>
              <Tbl heads={['Applicant','Startup','Accelerator','Stage','Status','Notes','Submitted','Pitch']}>
                {accelApps.map(a => {
                  const badge = APP_STATUS_BADGE[a.status] || APP_STATUS_BADGE.pending;
                  return (
                    <tr key={a.id} style={{borderBottom:'1px solid #F4F4F4'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A'}}>{a.applicant_name}</div>
                        <div style={{fontSize:10,color:'#AAAAAA'}}>@{a.applicant_handle}</div>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:11,fontWeight:600,color:'#0A0A0A'}}>
                        {a.startup_name || a.product_name || '—'}
                      </td>
                      <td style={{padding:'10px 14px',fontSize:11,color:'#0A0A0A'}}>{a.entity_name}</td>
                      <td style={{padding:'10px 14px',fontSize:11,color:'#AAAAAA'}}>{a.stage || '—'}</td>
                      <td style={{padding:'10px 14px'}}>
                        <Badge variant={badge.v}>{badge.l}</Badge>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:11,color:'#666',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {a.notes || <span style={{color:'#ccc'}}>—</span>}
                      </td>
                      <td style={{padding:'10px 14px',fontSize:11,color:'#AAAAAA',whiteSpace:'nowrap'}}>
                        {fmtDate(a.created_at)}
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        {a.pitch ? (
                          <ActionBtn variant="edit" onClick={() => {
                            const w = window.open('','_blank');
                            w.document.write(`<pre style="white-space:pre-wrap;font-family:sans-serif;padding:24px;max-width:700px;line-height:1.6">${a.pitch}</pre>`);
                          }}>
                            View Pitch
                          </ActionBtn>
                        ) : <span style={{fontSize:11,color:'#ddd'}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </Tbl>
            </div>
        }
      </SCard>

      {/* Investor Pitches */}
      <SCard
        title="Investor Pitches"
        sub={`${pitches.length} total · ${pitches.filter(p=>p.status==='sent'||p.status==='reviewing').length} active`}
      >
        {pitches.length === 0
          ? <EmptyState icon="💼" title="No pitches yet"/>
          : <div style={{overflowX:'auto'}}>
              <Tbl heads={['Founder','Investor','Ask','Description','Status','Notes']}>
                {pitches.map(p => {
                  const key = `pitch-${p.id}`;
                  return (
                    <tr key={p.id} style={{borderBottom:'1px solid #F4F4F4'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A'}}>{p.founder_name}</div>
                        <div style={{fontSize:10,color:'#AAAAAA'}}>@{p.founder_handle}</div>
                        {p.product_name && <div style={{fontSize:10,color:'#AAAAAA'}}>{p.product_name}</div>}
                      </td>
                      <td style={{padding:'10px 14px',fontSize:12,fontWeight:600,color:'#0A0A0A'}}>{p.investor_name}</td>
                      <td style={{padding:'10px 14px',fontSize:13,fontWeight:800,color:'#16a34a',whiteSpace:'nowrap'}}>
                        {p.ask_amount ? `$${Number(p.ask_amount).toLocaleString()}` : '—'}
                      </td>
                      <td style={{padding:'10px 14px',fontSize:11,color:'#666',maxWidth:200}}>
                        {p.description
                          ? <span title={p.description}>{p.description.slice(0,60)}{p.description.length>60?'…':''}</span>
                          : '—'}
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <StatusSelect
                          value={p.status}
                          options={PITCH_STATUSES}
                          statusMap={PITCH_STATUS_MAP}
                          onChange={status => updatePitch(p.id, { status })}
                          busy={!!busy[key]}
                        />
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <NotesCell value={p.notes} onSave={notes=>updatePitch(p.id,{notes})} busy={!!busy[key]}/>
                      </td>
                    </tr>
                  );
                })}
              </Tbl>
            </div>
        }
      </SCard>

      {/* Waitlists */}
      <SCard title="Waitlists" sub="Products with active waitlists">
        {waitlists.length === 0
          ? <EmptyState icon="📬" title="No active waitlists"/>
          : <Tbl heads={['Product','Total Signups','Last 24h','Status','Actions']}>
              {waitlists.map(w => (
                <tr key={w.id} style={{borderBottom:'1px solid #F4F4F4'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:6,background:'#F0F0F0',display:'grid',placeItems:'center',fontSize:14,flexShrink:0,overflow:'hidden'}}>
                        {w.logo_url&&(w.logo_url.startsWith('http')||w.logo_url.startsWith('data:'))
                          ?<img src={w.logo_url} alt={w.name} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                          :(w.logo_emoji||'📦')}
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{w.name}</span>
                    </div>
                  </td>
                  <td style={{padding:'11px 16px',fontSize:15,fontWeight:800,color:'#0A0A0A'}}>{w.waitlist_count||0}</td>
                  <td style={{padding:'11px 16px'}}><Badge variant="green">+{w.last_24h||0} today</Badge></td>
                  <td style={{padding:'11px 16px'}}><Badge variant="green">● Open</Badge></td>
                  <td style={{padding:'11px 16px'}}>
                    <ActionBtn variant="edit" loading={busy[`csv_${w.id}`]} onClick={async () => {
                      setBusy(b => ({ ...b, [`csv_${w.id}`]: true }));
                      try {
                        await adminAPI.exportCSV('waitlist', { product_id: w.id });
                        toast.success(`${w.name} waitlist exported`);
                      } catch { toast.error('Export failed'); }
                      finally { setBusy(b => ({ ...b, [`csv_${w.id}`]: false })); }
                    }}>Export CSV</ActionBtn>
                  </td>
                </tr>
              ))}
            </Tbl>
        }
      </SCard>
    </div>
  );
}
