import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const TABS = [
  {key:'',            label:'All'},
  {key:'startup',     label:'Startups'},
  {key:'accelerator', label:'Accelerators'},
  {key:'investor',    label:'Investors'},
  {key:'venture_studio', label:'Venture Studios'},
];

export default function Entities() {
  const [entities, setEntities] = useState([]);
  const [tab, setTab]     = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.entities({ ...(tab && {type:tab}), limit:200 })
      .then(({ data: d }) => setEntities(d.data || []))
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? entities.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()))
    : entities;

  const typeColor = { startup:'#E15033', accelerator:'#16a34a', investor:'#2563eb', venture_studio:'#7c3aed' };

  return (
    <SCard title="Entities" sub={`${entities.length} entities`}>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'14px 20px',borderBottom:'1px solid #F4F4F4'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:tab===t.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:tab===t.key?'var(--orange)':'#E8E8E8',background:tab===t.key?'var(--orange)':'#fff',color:tab===t.key?'#fff':'#666'}}>{t.label}</button>
        ))}
        <div style={{marginLeft:'auto',position:'relative'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'5px 10px 5px 28px',fontSize:12,width:180,outline:'none',background:'#FAFAFA'}}/>
          <svg style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
      </div>
      <Tbl heads={['Entity','Type','Country','Industry','Verified','Actions']}>
        {loading ? <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
        : filtered.length===0 ? <tr><td colSpan={6}><EmptyState icon="🏢" title="No entities found"/></td></tr>
        : filtered.map(e => (
          <tr key={e.id} style={{borderBottom:'1px solid #F4F4F4'}} onMouseEnter={el=>el.currentTarget.style.background='#FAFAFA'} onMouseLeave={el=>el.currentTarget.style.background='transparent'}>
            <td style={{padding:'11px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:`${typeColor[e.type]||'#E15033'}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{e.logo_emoji||'🏢'}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{e.name}</div>
                  {e.slug && <div style={{fontSize:11,color:'#AAAAAA'}}>{e.slug}</div>}
                </div>
              </div>
            </td>
            <td style={{padding:'11px 16px'}}><Badge variant={{startup:'orange',accelerator:'green',investor:'blue',venture_studio:'purple'}[e.type]||'gray'}>{e.type?.replace('_',' ')}</Badge></td>
            <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{e.country||'—'}</td>
            <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{e.industry||e.focus||'—'}</td>
            <td style={{padding:'11px 16px'}}>{e.verified ? <Badge variant="green">✓ Verified</Badge> : <Badge variant="gray">Unverified</Badge>}</td>
            <td style={{padding:'11px 16px'}}>
              {!e.verified && <ActionBtn variant="verify" loading={acting[e.id]} onClick={async()=>{setActing(p=>({...p,[e.id]:true}));try{await adminAPI.verifyEntity(e.id);toast.success(`${e.name} verified`);load();}catch(err){toast.error(err.message);}finally{setActing(p=>({...p,[e.id]:false}));}}}>✓ Verify</ActionBtn>}
            </td>
          </tr>
        ))}
      </Tbl>
    </SCard>
  );
}
