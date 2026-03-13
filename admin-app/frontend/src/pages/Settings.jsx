import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard } from './shared.jsx';

function Toggle({ checked, onChange }) {
  return (
    <label style={{position:'relative',display:'inline-block',width:42,height:24,cursor:'pointer'}}>
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0}}/>
      <span style={{position:'absolute',inset:0,background:checked?'var(--orange)':'#E8E8E8',borderRadius:99,transition:'.2s'}}/>
      <span style={{position:'absolute',left:checked?20:2,top:2,width:20,height:20,background:'#fff',borderRadius:'50%',transition:'.2s',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}/>
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    adminAPI.settings()
      .then(({ data: d }) => setSettings(d.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (key, value) => {
    setSettings(s=>({...s,[key]:value}));
    try { await adminAPI.saveSettings({ [key]: value }); toast.success('Setting saved'); }
    catch { toast.error('Failed to save'); }
  };

  function SettingRow({ label, sub, settingKey, fallback=false }) {
    const val = settings[settingKey] !== undefined ? settings[settingKey] : fallback;
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid #F4F4F4'}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:'#0A0A0A'}}>{label}</div>
          {sub && <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{sub}</div>}
        </div>
        <Toggle checked={val} onChange={v=>save(settingKey,v)}/>
      </div>
    );
  }

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading settings…</div>;

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <SCard title="Moderation" sub="Control how content is reviewed">
          <div style={{padding:'0 20px 8px'}}>
            <SettingRow label="Auto-approve Products" sub="Skip manual review for trusted submitters" settingKey="auto_approve"/>
            <SettingRow label="Spam Filter"            sub="Auto-flag suspicious activity"            settingKey="spam_filter" fallback={true}/>
            <SettingRow label="Require Email Verification" sub="Users must verify email to submit"   settingKey="require_email_verification" fallback={true}/>
          </div>
        </SCard>

        <SCard title="Platform" sub="Global platform controls">
          <div style={{padding:'0 20px 8px'}}>
            <SettingRow label="Maintenance Mode"     sub="Take site offline for updates"                 settingKey="maintenance_mode"/>
            <SettingRow label="Allow New Signups"    sub="Open registration to the public"               settingKey="allow_signups" fallback={true}/>
            <SettingRow label="Show Waitlist Widget" sub="Display waitlist on coming-soon products"      settingKey="show_waitlist" fallback={true}/>
          </div>
        </SCard>

        <SCard title="Notifications" sub="Admin alert preferences">
          <div style={{padding:'0 20px 8px'}}>
            <SettingRow label="New Product Submissions" sub="Email when a product is submitted"     settingKey="notify_new_product" fallback={true}/>
            <SettingRow label="New User Signups"        sub="Daily digest of new registrations"    settingKey="notify_new_user"    fallback={true}/>
            <SettingRow label="Flagged Content"         sub="Immediate alert for spam/violations"  settingKey="notify_flagged"     fallback={true}/>
          </div>
        </SCard>

        <SCard title="Integrations" sub="Connected services and third-party tools">
          <div style={{padding:'0 20px 8px'}}>
            {[
              {icon:'📧',name:'Resend',         desc:'Transactional email delivery',       color:'#0A0A0A', status:'connected'},
              {icon:'📊',name:'Mixpanel',        desc:'Product analytics & funnels',        color:'#7c3aed', status:'disconnected'},
              {icon:'🗄️',name:'Neon DB',         desc:'PostgreSQL database (production)',   color:'#16a34a', status:'connected'},
              {icon:'🪣',name:'Cloudflare R2',   desc:'Object storage for media',           color:'#d97706', status:'disconnected'},
            ].map((intg,i,arr)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:i<arr.length-1?'1px solid #F4F4F4':'none'}}>
                <div style={{width:36,height:36,borderRadius:10,background:intg.status==='connected'?`${intg.color}12`:'#F4F4F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{intg.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{intg.name}</div>
                  <div style={{fontSize:11,color:'#AAAAAA'}}>{intg.desc}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,background:intg.status==='connected'?'#DCFCE7':'#F4F4F4',color:intg.status==='connected'?'#166534':'#666'}}>
                  {intg.status==='connected'?'● Connected':'○ Not connected'}
                </span>
              </div>
            ))}
          </div>
        </SCard>
      </div>

      <div style={{marginTop:20}}>
        <SCard title="Danger Zone" sub="Irreversible actions — proceed with caution">
          <div style={{padding:'16px 20px',display:'flex',gap:10,flexWrap:'wrap'}}>
            <button onClick={()=>toast.error('Cannot delete — contact system admin')} style={{background:'#FEE2E2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>🗑️ Clear All Pending Products</button>
            <button onClick={()=>toast.error('Disabled in this environment')}          style={{background:'#FEE2E2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>⚠️ Reset Platform Data</button>
            <button onClick={()=>toast.success('Export started — check your email')}   style={{background:'#F4F4F4',color:'#0A0A0A',border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>📤 Export All Data (CSV)</button>
          </div>
        </SCard>
      </div>
    </div>
  );
}
