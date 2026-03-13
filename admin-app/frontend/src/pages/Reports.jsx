import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import { SCard } from './shared.jsx';
import toast from 'react-hot-toast';

const inputS = { border:'1px solid #E8E8E8', borderRadius:8, padding:'7px 10px', fontSize:12, outline:'none', background:'#FAFAFA', fontFamily:'inherit' };

export default function Reports() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [exporting, setExporting] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to)   params.to   = to;
    adminAPI.reports(params)
      .then(({ data: d }) => setData(d.data))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const doExport = async (type) => {
    setExporting(type);
    try {
      const p = {};
      if (from) p.from = from;
      if (to)   p.to   = to;
      await adminAPI.exportCSV(type, p);
      toast.success(`${type} CSV downloaded`);
    } catch(e) { toast.error(e.message || 'Export failed'); }
    finally { setExporting(''); }
  };

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading reports…</div>;
  if (!data)   return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>No data available</div>;

  const { kpis={}, country_breakdown=[], industry_breakdown=[], persona_breakdown=[], signup_trend=[] } = data;

  const KPI_CARDS = [
    { icon:'🚀', label:'Live Products',   value: kpis.live_products,  color:'#E15033' },
    { icon:'👥', label:'Active Users',    value: kpis.active_users,   color:'#16a34a' },
    { icon:'🎉', label:'Total Upvotes',   value: kpis.total_upvotes,  color:'#2563eb' },
    { icon:'📬', label:'Waitlist Signups',value: kpis.waitlist_total, color:'#7c3aed' },
    { icon:'📋', label:'Total Apps',      value: kpis.total_apps,     color:'#d97706' },
    { icon:'📊', label:'Avg Upvotes',     value: kpis.avg_upvotes,    color:'#0891b2' },
  ];

  const maxCountry  = Math.max(...country_breakdown.map(r=>parseInt(r.count)), 1);
  const maxIndustry = Math.max(...industry_breakdown.map(r=>parseInt(r.count)), 1);
  const maxSignup   = Math.max(...signup_trend.map(r=>parseInt(r.signups)), 1);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Date range + export bar */}
      <SCard>
        <div style={{padding:'12px 20px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:12,fontWeight:700,color:'#666'}}>Date range:</span>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,color:'#888'}}>From</span>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputS} />
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,color:'#888'}}>To</span>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputS} />
          </div>
          {(from||to) && (
            <button onClick={()=>{setFrom('');setTo('');}} style={{padding:'7px 12px',borderRadius:8,border:'1px solid #E8E8E8',background:'#fff',fontSize:11,color:'#666',cursor:'pointer',fontWeight:600}}>
              ✕ Clear
            </button>
          )}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            {['products','users','applications'].map(t=>(
              <button key={t} onClick={()=>doExport(t)} disabled={!!exporting} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:11,color:'#555',cursor:'pointer',fontWeight:600,opacity:exporting===t?.6:1}}>
                {exporting===t?'…':'↓ '+t.charAt(0).toUpperCase()+t.slice(1)+' CSV'}
              </button>
            ))}
          </div>
        </div>
      </SCard>

      {/* KPI grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {KPI_CARDS.map((c,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:16,border:'1.5px solid #E8E8E8',padding:'20px 22px'}}>
            <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:12,background:`${c.color}15`}}>{c.icon}</div>
            <div style={{fontSize:28,fontWeight:800,letterSpacing:'-.04em',color:'#0A0A0A',lineHeight:1}}>{parseInt(c.value||0).toLocaleString()}</div>
            <div style={{fontSize:12,color:'#737373',fontWeight:500,marginTop:4}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Signup trend */}
      <SCard title="Signup Trend" sub="New user registrations over the last 8 weeks">
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:100}}>
            {signup_trend.map((d,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{fontSize:9,color:'#AAAAAA',fontWeight:700}}>{d.signups}</div>
                <div style={{width:'100%',background:'var(--orange)',borderRadius:4,height:Math.max(4,Math.round((parseInt(d.signups)/maxSignup)*80))}}/>
                <div style={{fontSize:9,color:'#AAAAAA'}}>W{d.week?.slice(-2)||i+1}</div>
              </div>
            ))}
            {signup_trend.length===0 && <div style={{width:'100%',textAlign:'center',color:'#AAAAAA',fontSize:13,paddingBottom:20}}>No data yet</div>}
          </div>
        </div>
      </SCard>

      {/* Country + Industry + Persona breakdown */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
        <SCard title="By Country" sub="User distribution">
          <div style={{padding:'0 20px 16px'}}>
            {country_breakdown.map((r,i)=>(
              <div key={i} style={{marginTop:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:600,marginBottom:4}}>
                  <span>{r.country}</span><span style={{color:'var(--orange)',fontWeight:800}}>{r.count}</span>
                </div>
                <div style={{height:6,borderRadius:99,background:'#F4F4F4'}}>
                  <div style={{height:'100%',borderRadius:99,background:'var(--orange)',width:`${Math.round((parseInt(r.count)/maxCountry)*100)}%`}}/>
                </div>
              </div>
            ))}
            {country_breakdown.length===0 && <div style={{padding:'20px 0',textAlign:'center',color:'#AAAAAA',fontSize:12}}>No data</div>}
          </div>
        </SCard>

        <SCard title="By Industry" sub="Product categories">
          <div style={{padding:'0 20px 16px'}}>
            {industry_breakdown.map((r,i)=>(
              <div key={i} style={{marginTop:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:600,marginBottom:4}}>
                  <span>{r.industry||'Unknown'}</span><span style={{color:'#2563eb',fontWeight:800}}>{r.count}</span>
                </div>
                <div style={{height:6,borderRadius:99,background:'#F4F4F4'}}>
                  <div style={{height:'100%',borderRadius:99,background:'#2563eb',width:`${Math.round((parseInt(r.count)/maxIndustry)*100)}%`}}/>
                </div>
              </div>
            ))}
            {industry_breakdown.length===0 && <div style={{padding:'20px 0',textAlign:'center',color:'#AAAAAA',fontSize:12}}>No data</div>}
          </div>
        </SCard>

        <SCard title="By Persona" sub="User role distribution">
          <div style={{padding:'0 20px 16px'}}>
            {persona_breakdown.map((r,i)=>{
              const total = persona_breakdown.reduce((a,b)=>a+parseInt(b.count),0)||1;
              const pct   = Math.round((parseInt(r.count)/total)*100);
              return (
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F4F4F4'}}>
                  <span style={{fontSize:13,color:'#0A0A0A'}}>{r.persona||'Unknown'}</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:12,color:'#AAAAAA'}}>{r.count}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:99,background:'#F4F4F4',color:'#666'}}>{pct}%</span>
                  </div>
                </div>
              );
            })}
            {persona_breakdown.length===0 && <div style={{padding:'20px 0',textAlign:'center',color:'#AAAAAA',fontSize:12}}>No data</div>}
          </div>
        </SCard>
      </div>
    </div>
  );
}
