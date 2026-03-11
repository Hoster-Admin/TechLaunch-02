import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI, productsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  live:     { bg:'#DCFCE7', color:'#166534', label:'● Live' },
  pending:  { bg:'#FEF3C7', color:'#92400E', label:'● Pending' },
  soon:     { bg:'#DBEAFE', color:'#1e40af', label:'● Coming Soon' },
  rejected: { bg:'#FEE2E2', color:'#991B1B', label:'● Rejected' },
};

const FILTERS = [
  { key:'all', label:'All' },
  { key:'live', label:'Live' },
  { key:'pending', label:'Pending' },
  { key:'soon', label:'Coming Soon' },
  { key:'rejected', label:'Rejected' },
  { key:'featured', label:'Featured ⭐' },
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.products?.().then(({ data: d }) => {
      setProducts(d.data || []);
    }).catch(() => {
      productsAPI.getAll({ limit: 100 }).then(({ data: d }) => setProducts(d.data?.products || []));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action, fn) => {
    setActing(p => ({ ...p, [id]: action }));
    try { await fn(); toast.success(action === 'approve' ? 'Approved!' : action === 'reject' ? 'Rejected' : 'Done'); load(); }
    catch { toast.error('Failed'); }
    finally { setActing(p => ({ ...p, [id]: null })); }
  };

  const filtered = products.filter(p => {
    if (filter === 'featured' && !p.featured) return false;
    if (filter !== 'all' && filter !== 'featured' && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.tagline?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:filter===f.key?700:500,cursor:'pointer',border:'1.5px solid',
                borderColor: filter===f.key ? 'var(--orange)' : '#E8E8E8',
                background: filter===f.key ? 'var(--orange)' : '#fff',
                color: filter===f.key ? '#fff' : '#666',
              }}>{f.label}</button>
          ))}
        </div>
        <div style={{position:'relative'}}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'8px 14px 8px 34px',fontSize:12,width:220,outline:'none',background:'#FAFAFA'}}
          />
          <svg style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid #F4F4F4'}}>
              {['Product','Category','Country','Submitted By','Upvotes','Status','Featured','Actions'].map(h => (
                <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{padding:'40px',textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <div style={{textAlign:'center',padding:'48px 20px'}}>
                  <div style={{fontSize:32,marginBottom:8}}>📦</div>
                  <div style={{fontWeight:700,fontSize:14,color:'#0A0A0A'}}>No products found</div>
                </div>
              </td></tr>
            ) : filtered.map(p => {
              const badge = STATUS_BADGE[p.status] || STATUS_BADGE.pending;
              return (
                <tr key={p.id} style={{borderBottom:'1px solid #F4F4F4',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:38,height:38,borderRadius:10,background:'#F4F4F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{p.logo||'📦'}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{p.name}</div>
                        <div style={{fontSize:11,color:'#AAAAAA',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'12px 16px'}}><span style={{background:'#F4F4F4',color:'#666',fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>{p.category}</span></td>
                  <td style={{padding:'12px 16px',fontSize:12,color:'#666'}}>{p.country}</td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{fontSize:12,color:'var(--orange)',fontWeight:600}}>@{p.handle}</div>
                    <div style={{fontSize:10,color:'#AAAAAA'}}>{p.submitted_date || new Date(p.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:14,fontWeight:800,color:'var(--orange)'}}>🎉 {p.upvotes_count||p.upvotes||0}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{background:badge.bg,color:badge.color,fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:99,whiteSpace:'nowrap'}}>{badge.label}</span>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <label style={{position:'relative',display:'inline-block',width:36,height:20,cursor:'pointer'}}>
                      <input type="checkbox" defaultChecked={p.featured} style={{opacity:0,width:0,height:0}}
                        onChange={e => toast.success(e.target.checked ? `${p.name} featured!` : `${p.name} unfeatured`)}/>
                      <span style={{position:'absolute',inset:0,background:p.featured?'var(--orange)':'#E8E8E8',borderRadius:99,transition:'.2s'}}/>
                      <span style={{position:'absolute',left:p.featured?18:2,top:2,width:16,height:16,background:'#fff',borderRadius:'50%',transition:'.2s'}}/>
                    </label>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:6}}>
                      {p.status === 'pending' && <>
                        <ActionBtn onClick={() => act(p.id,'approve',() => adminAPI.approve(p.id))} loading={acting[p.id]==='approve'} variant="approve">✓ Approve</ActionBtn>
                        <ActionBtn onClick={() => act(p.id,'reject',() => adminAPI.reject(p.id))} loading={acting[p.id]==='reject'} variant="reject">✕ Reject</ActionBtn>
                      </>}
                      {p.status === 'live' && <ActionBtn onClick={() => toast.success('Edit product')} variant="edit">✎ Edit</ActionBtn>}
                      <ActionBtn onClick={() => toast.success(`${p.name} deleted`)} variant="delete">🗑</ActionBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, loading, variant, children }) {
  const styles = {
    approve: { bg:'#DCFCE7', color:'#166534' },
    reject:  { bg:'#FEE2E2', color:'#991B1B' },
    edit:    { bg:'#DBEAFE', color:'#1e40af' },
    delete:  { bg:'#FEF3C7', color:'#92400E' },
    feature: { bg:'#FEF9C3', color:'#713F12' },
  };
  const s = styles[variant] || styles.edit;
  return (
    <button onClick={onClick} disabled={loading}
      style={{background:s.bg,color:s.color,border:'none',borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',opacity:loading?.5:1}}>
      {loading ? '…' : children}
    </button>
  );
}
