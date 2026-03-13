import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const FILTERS = [
  {key:'all',label:'All'},{key:'live',label:'Live'},{key:'pending',label:'Pending'},
  {key:'soon',label:'Coming Soon'},{key:'rejected',label:'Rejected'},{key:'featured',label:'Featured ⭐'},
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [acting, setActing]     = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.products({ limit:200 })
      .then(({ data: d }) => setProducts(d.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, msg) => {
    setActing(p => ({...p,[id]:true}));
    try { await fn(); toast.success(msg); load(); }
    catch(e) { toast.error(e.message || 'Failed'); }
    finally { setActing(p => ({...p,[id]:false})); }
  };

  const filtered = products.filter(p => {
    if (filter==='featured' && !p.featured) return false;
    if (filter!=='all' && filter!=='featured' && p.status!==filter) return false;
    if (search) { const q=search.toLowerCase(); return p.name?.toLowerCase().includes(q)||p.tagline?.toLowerCase().includes(q)||p.category?.toLowerCase().includes(q); }
    return true;
  });

  const statusBadge = s => ({live:{v:'green',l:'● Live'},pending:{v:'amber',l:'● Pending'},soon:{v:'blue',l:'● Soon'},rejected:{v:'red',l:'● Rejected'}})[s] || {v:'gray',l:s};

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {FILTERS.map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:filter===f.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:filter===f.key?'var(--orange)':'#E8E8E8',background:filter===f.key?'var(--orange)':'#fff',color:filter===f.key?'#fff':'#666'}}>{f.label}</button>
          ))}
        </div>
        <div style={{position:'relative'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'8px 14px 8px 34px',fontSize:12,width:220,outline:'none',background:'#FAFAFA'}}/>
          <svg style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
      </div>
      <SCard>
        {loading ? <div style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</div> : (
          <Tbl heads={['Product','Industry','Country','Submitted','Upvotes','Status','Featured','Actions']}>
            {filtered.length===0 ? <tr><td colSpan={8}><EmptyState icon="📦" title="No products found"/></td></tr>
            : filtered.map(p => {
              const sb = statusBadge(p.status);
              return (
                <tr key={p.id} style={{borderBottom:'1px solid #F4F4F4'}} onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:10,background:'#F4F4F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{p.logo||p.logo_emoji||'📦'}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{p.name}</div>
                        <div style={{fontSize:11,color:'#AAAAAA',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'11px 16px'}}><Badge variant="purple">{p.category||p.industry||'—'}</Badge></td>
                  <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{p.country}</td>
                  <td style={{padding:'11px 16px'}}><span style={{fontSize:11,color:'var(--orange)',fontWeight:600}}>@{p.submitter_handle}</span></td>
                  <td style={{padding:'11px 16px',fontSize:14,fontWeight:800,color:'var(--orange)'}}>🎉 {p.upvotes_count}</td>
                  <td style={{padding:'11px 16px'}}><Badge variant={sb.v}>{sb.l}</Badge></td>
                  <td style={{padding:'11px 16px'}}>
                    <label style={{position:'relative',display:'inline-block',width:38,height:22,cursor:'pointer'}}>
                      <input type="checkbox" checked={!!p.featured} onChange={()=>act(p.id, ()=>adminAPI.featured(p.id), p.featured?`${p.name} unfeatured`:`${p.name} featured!`)} style={{opacity:0,width:0,height:0}}/>
                      <span style={{position:'absolute',inset:0,background:p.featured?'var(--orange)':'#E8E8E8',borderRadius:99,transition:'.2s'}}/>
                      <span style={{position:'absolute',left:p.featured?18:2,top:2,width:18,height:18,background:'#fff',borderRadius:'50%',transition:'.2s'}}/>
                    </label>
                  </td>
                  <td style={{padding:'11px 16px'}}>
                    <div style={{display:'flex',gap:5}}>
                      {p.status==='pending' && <>
                        <ActionBtn variant="approve" loading={acting[p.id]} onClick={()=>act(p.id,()=>adminAPI.approveProduct(p.id),`✅ ${p.name} approved!`)}>✓ Approve</ActionBtn>
                        <ActionBtn variant="reject"  loading={acting[p.id]} onClick={()=>act(p.id,()=>adminAPI.rejectProduct(p.id),`✕ ${p.name} rejected`)}>✕ Reject</ActionBtn>
                      </>}
                      {p.status==='live' && <ActionBtn variant="edit" onClick={()=>toast.success(`Edit ${p.name}`)}>✎ Edit</ActionBtn>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Tbl>
        )}
      </SCard>
    </div>
  );
}
