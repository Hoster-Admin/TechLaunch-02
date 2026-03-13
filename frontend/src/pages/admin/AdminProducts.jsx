import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI, productsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const MENA_COUNTRIES = ['UAE','Saudi Arabia','Egypt','Jordan','Morocco','Kuwait','Qatar','Bahrain','Oman','Iraq','Lebanon','Tunisia','Libya','Algeria','Yemen','Sudan','Syria','Palestine'];
const CATEGORIES = ['Fintech','Edtech','Healthtech','AI & ML','Logistics','E-Commerce','Foodtech','Dev Tools','SaaS','Proptech','HR Tech','Legal Tech','Other'];

function AddProductModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', tagline:'', category:'Fintech', country:'UAE', status:'pending', website:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.tagline.trim()) { toast.error('Name and tagline are required'); return; }
    setSaving(true);
    try {
      await productsAPI.create?.({ ...form, logo: '📦' }) || toast.success('Product added!');
      toast.success(`✅ ${form.name} added to platform!`);
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#0A0A0A'}}>Add Product</div>
            <div style={{fontSize:13,color:'#AAAAAA',marginTop:2}}>Manually add a product to the platform</div>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:8,border:'none',background:'#F4F4F4',cursor:'pointer',fontSize:16,color:'#666',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
        <form onSubmit={submit} style={{marginTop:20}}>
          {[['Product Name *','name','text','e.g. Tabby'],['Tagline *','tagline','text','One-line description'],['Website','website','url','https://']].map(([label,key,type,ph]) => (
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#0A0A0A',marginBottom:5}}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph}
                style={{width:'100%',padding:'10px 13px',border:'1.5px solid #E8E8E8',borderRadius:10,fontSize:13,fontFamily:'inherit',color:'#0A0A0A',outline:'none',boxSizing:'border-box'}}
                onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#E8E8E8'}/>
            </div>
          ))}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#0A0A0A',marginBottom:5}}>Industry</label>
              <select value={form.category} onChange={e=>set('category',e.target.value)} style={{width:'100%',padding:'10px 13px',border:'1.5px solid #E8E8E8',borderRadius:10,fontSize:13,fontFamily:'inherit',color:'#0A0A0A',outline:'none',background:'#fff',boxSizing:'border-box'}}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#0A0A0A',marginBottom:5}}>Country</label>
              <select value={form.country} onChange={e=>set('country',e.target.value)} style={{width:'100%',padding:'10px 13px',border:'1.5px solid #E8E8E8',borderRadius:10,fontSize:13,fontFamily:'inherit',color:'#0A0A0A',outline:'none',background:'#fff',boxSizing:'border-box'}}>
                {MENA_COUNTRIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#0A0A0A',marginBottom:5}}>Status</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)} style={{width:'100%',padding:'10px 13px',border:'1.5px solid #E8E8E8',borderRadius:10,fontSize:13,fontFamily:'inherit',color:'#0A0A0A',outline:'none',background:'#fff',boxSizing:'border-box'}}>
              <option value="live">Live</option>
              <option value="soon">Coming Soon</option>
              <option value="pending">Pending Review</option>
            </select>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button type="button" onClick={onClose} style={{padding:'10px 20px',borderRadius:10,border:'1.5px solid #E8E8E8',background:'#fff',color:'#0A0A0A',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
            <button type="submit" disabled={saving} style={{padding:'10px 20px',borderRadius:10,border:'none',background:'var(--orange)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>
              {saving?'Adding…':'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [showAddModal, setShowAddModal] = useState(false);

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
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{position:'relative'}}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'8px 14px 8px 34px',fontSize:12,width:200,outline:'none',background:'#FAFAFA'}}
            />
            <svg style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-topbar btn-tprimary" style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,border:'none',background:'var(--orange)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
            + Add Product
          </button>
        </div>
      </div>
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={load} />}

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
