import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import { SCard } from './shared.jsx';
import toast from 'react-hot-toast';


export default function Reports() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.reports({})
      .then(({ data: d }) => setData(d.data))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading reports…</div>;
  if (!data)   return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>No data available</div>;

  const { kpis={}, country_breakdown=[], industry_breakdown=[], persona_breakdown=[], signup_trend=[] } = data;

  const COUNTRY_NAMES = {
    AE:'UAE', SA:'Saudi Arabia', EG:'Egypt', KW:'Kuwait', QA:'Qatar',
    BH:'Bahrain', OM:'Oman', JO:'Jordan', LB:'Lebanon', IQ:'Iraq',
    YE:'Yemen', PS:'Palestine', SY:'Syria', LY:'Libya', TN:'Tunisia',
    MA:'Morocco', DZ:'Algeria', SD:'Sudan', SO:'Somalia', DJ:'Djibouti',
    KM:'Comoros', MR:'Mauritania', US:'United States', GB:'United Kingdom',
    DE:'Germany', FR:'France', CA:'Canada', AU:'Australia', IN:'India',
    PK:'Pakistan', TR:'Turkey', NG:'Nigeria', ZA:'South Africa',
  };
  const countryName = code => COUNTRY_NAMES[code] || code;

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
                  <span>{countryName(r.country)}</span><span style={{color:'var(--orange)',fontWeight:800}}>{r.count}</span>
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
