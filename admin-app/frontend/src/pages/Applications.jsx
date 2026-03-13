import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState, STATUS_MAP } from './shared.jsx';

export default function Applications() {
  const [data, setData]       = useState({ accelerator_apps:[], investor_pitches:[], waitlists:[] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.applications()
      .then(({ data: d }) => setData(d.data || { accelerator_apps:[],investor_pitches:[],waitlists:[] }))
      .catch(() => setData({ accelerator_apps:[],investor_pitches:[],waitlists:[] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const { accelerator_apps: accelApps, investor_pitches: pitches, waitlists } = data;

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading…</div>;

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {/* Accelerator Apps */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>Accelerator Applications</div>
            <div style={{fontSize:11,color:'#AAAAAA'}}>{accelApps.length} applications</div>
          </div>
          {accelApps.length===0 ? <EmptyState icon="📋" title="No applications yet"/>
          : <div style={{overflowX:'auto'}}><Tbl heads={['Applicant','Startup','Accelerator','Status','Actions']}>
            {accelApps.map(a => {
              const s = STATUS_MAP[a.status]||{v:'gray',l:a.status};
              return (
                <tr key={a.id} style={{borderBottom:'1px solid #F4F4F4'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'10px 14px'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A'}}>{a.applicant_name}</div>
                    <div style={{fontSize:10,color:'#AAAAAA'}}>@{a.applicant_handle}</div>
                  </td>
                  <td style={{padding:'10px 14px',fontSize:11,color:'#0A0A0A'}}>{a.product_name||'—'}</td>
                  <td style={{padding:'10px 14px',fontSize:11,color:'#0A0A0A'}}>{a.entity_name}</td>
                  <td style={{padding:'10px 14px'}}><Badge variant={s.v}>{s.l}</Badge></td>
                  <td style={{padding:'10px 14px'}}>
                    {(a.status==='pending'||a.status==='reviewing') && (
                      <div style={{display:'flex',gap:4}}>
                        <ActionBtn variant="approve" onClick={()=>toast.success('Accepted!')}>✓</ActionBtn>
                        <ActionBtn variant="reject"  onClick={()=>toast.success('Rejected')}>✕</ActionBtn>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </Tbl></div>}
        </div>

        {/* Investor Pitches */}
        <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4'}}>
            <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>Investor Pitches</div>
            <div style={{fontSize:11,color:'#AAAAAA'}}>{pitches.length} pitch requests</div>
          </div>
          {pitches.length===0 ? <EmptyState icon="💼" title="No pitches yet"/>
          : <div style={{overflowX:'auto'}}><Tbl heads={['Founder','Product','Investor','Ask','Status']}>
            {pitches.map(p => {
              const s = STATUS_MAP[p.status]||{v:'gray',l:p.status};
              return (
                <tr key={p.id} style={{borderBottom:'1px solid #F4F4F4'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'10px 14px'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A'}}>{p.founder_name}</div>
                    <div style={{fontSize:10,color:'#AAAAAA'}}>@{p.founder_handle}</div>
                  </td>
                  <td style={{padding:'10px 14px',fontSize:11,color:'#0A0A0A'}}>{p.product_name||'—'}</td>
                  <td style={{padding:'10px 14px',fontSize:11}}>{p.investor_name}</td>
                  <td style={{padding:'10px 14px',fontSize:12,fontWeight:800,color:'#16a34a'}}>{p.ask_amount ? `$${Number(p.ask_amount).toLocaleString()}` : '—'}</td>
                  <td style={{padding:'10px 14px'}}><Badge variant={s.v}>{s.l}</Badge></td>
                </tr>
              );
            })}
          </Tbl></div>}
        </div>
      </div>

      {/* Waitlists */}
      <SCard title="Waitlists" sub="Products with active waitlists">
        {waitlists.length===0 ? <EmptyState icon="📬" title="No active waitlists"/>
        : <Tbl heads={['Product','Total Signups','Last 24h','Status','Actions']}>
          {waitlists.map(w=>(
            <tr key={w.id} style={{borderBottom:'1px solid #F4F4F4'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
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
        </Tbl>}
      </SCard>
    </div>
  );
}
