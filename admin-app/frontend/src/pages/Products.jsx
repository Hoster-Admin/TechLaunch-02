import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState } from './shared.jsx';

const FILTERS = [
  { key:'queue',    label:'🔔 Review Queue' },
  { key:'all',      label:'All' },
  { key:'live',     label:'Live' },
  { key:'pending',  label:'Pending' },
  { key:'soon',     label:'Coming Soon' },
  { key:'rejected', label:'Rejected' },
  { key:'featured', label:'Featured ⭐' },
];

const BULK_ACTIONS = [
  { key:'approve', label:'✅ Approve', bg:'#16a34a' },
  { key:'reject',  label:'❌ Reject',  bg:'#dc2626' },
  { key:'feature', label:'⭐ Feature', bg:'#d97706' },
];

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('queue');
  const [search, setSearch]       = useState('');
  const [acting, setActing]       = useState({});
  const [selected, setSelected]   = useState(new Set());
  const [bulking, setBulking]     = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.products({ limit:200 })
      .then(({ data: d }) => setProducts(d.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, msg) => {
    setActing(p => ({ ...p, [id]: true }));
    try { await fn(); toast.success(msg); load(); }
    catch(e) { toast.error(e.message || 'Failed'); }
    finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const filtered = products.filter(p => {
    if (filter === 'queue')          { if (p.status !== 'pending') return false; }
    else if (filter === 'featured')  { if (!p.featured) return false; }
    else if (filter !== 'all')       { if (p.status !== filter) return false; }
    if (search) {
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.tagline?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = products.filter(p => p.status === 'pending').length;

  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  };

  const toggleOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const doBulk = async (action) => {
    if (!selected.size) return;
    setBulking(true);
    try {
      await adminAPI.bulkProducts({ ids: [...selected], action });
      toast.success(`${selected.size} product(s) ${action}d`);
      setSelected(new Set());
      load();
    } catch(e) {
      toast.error(e.message || 'Bulk action failed');
    } finally { setBulking(false); }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filter !== 'all' && filter !== 'queue' && filter !== 'featured') params.status = filter;
      await adminAPI.exportCSV('products', params);
      toast.success('Products CSV downloaded');
    } catch(e) {
      toast.error(e.message || 'Export failed');
    } finally { setExporting(false); }
  };

  const statusBadge = s => ({
    live:     { v:'green', l:'● Live' },
    pending:  { v:'amber', l:'● Pending' },
    soon:     { v:'blue',  l:'● Soon' },
    rejected: { v:'red',   l:'● Rejected' },
    draft:    { v:'gray',  l:'● Draft' },
  })[s] || { v:'gray', l: s };

  return (
    <div>
      {/* Filter pills + search + export */}
      <div style={{ marginBottom:16 }}>
        <div className="filters-bar" style={{ marginBottom:10 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setSelected(new Set()); }}
              style={{
                padding:'6px 14px', borderRadius:20, fontSize:12,
                fontWeight: filter===f.key ? 700 : 500,
                cursor:'pointer', border:'1.5px solid',
                borderColor: filter===f.key ? 'var(--orange)' : '#E8E8E8',
                background:  filter===f.key ? 'var(--orange)' : '#fff',
                color:       filter===f.key ? '#fff' : '#666',
                position:'relative',
              }}>
              {f.label}
              {f.key==='queue' && pendingCount > 0 && (
                <span style={{ position:'absolute', top:-6, right:-4, minWidth:16, height:16, background:'#dc2626', color:'#fff', borderRadius:99, fontSize:9, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…"
              style={{ border:'1px solid #E8E8E8', borderRadius:10, padding:'8px 14px 8px 34px', fontSize:12, width:200, outline:'none', background:'#FAFAFA' }}/>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#AAAAAA' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <button onClick={doExport} disabled={exporting}
            style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #E8E8E8', background:'#fff', fontSize:12, color:'#555', cursor:'pointer', fontWeight:600, opacity:exporting?0.6:1 }}>
            {exporting ? '…' : '↓ Export CSV'}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'#FFF7F0', border:'1.5px solid var(--orange)', borderRadius:12, marginBottom:12 }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--orange)' }}>{selected.size} selected</span>
          <div style={{ display:'flex', gap:6 }}>
            {BULK_ACTIONS.map(ba => (
              <button key={ba.key} onClick={() => doBulk(ba.key)} disabled={bulking}
                style={{ padding:'6px 14px', borderRadius:8, border:'none', background:ba.bg, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', opacity:bulking?0.6:1 }}>
                {ba.label}
              </button>
            ))}
          </div>
          <button onClick={() => setSelected(new Set())}
            style={{ marginLeft:'auto', padding:'5px 10px', borderRadius:8, border:'1px solid #E8E8E8', background:'#fff', fontSize:11, color:'#666', cursor:'pointer' }}>
            ✕ Clear
          </button>
        </div>
      )}

      {/* Review Queue banner */}
      {filter === 'queue' && !loading && (
        <div style={{ padding:'12px 18px', background:'#FFF7F0', border:'1.5px solid #FFD9C7', borderRadius:12, marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>🔔</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0A0A0A' }}>
              {pendingCount > 0 ? `${pendingCount} product${pendingCount!==1?'s':''} awaiting review` : 'All caught up — no pending submissions'}
            </div>
            <div style={{ fontSize:11, color:'#888', marginTop:2 }}>Approve or reject each product below, or select multiple for bulk actions</div>
          </div>
        </div>
      )}

      <SCard>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#AAAAAA', fontSize:13 }}>Loading…</div>
        ) : (
          <Tbl heads={[
            <input key="chk" type="checkbox"
              checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={toggleAll}
              style={{ cursor:'pointer', accentColor:'var(--orange)', width:14, height:14 }}/>,
            'Product','Industry','Country','Submitted','Upvotes','Status','Featured','Actions'
          ]}>
            {filtered.length === 0
              ? <tr><td colSpan={9}><EmptyState icon="📦" title="No products found"/></td></tr>
              : filtered.map(p => {
                  const sb  = statusBadge(p.status);
                  const sel = selected.has(p.id);
                  return (
                    <tr key={p.id}
                      style={{ borderBottom:'1px solid #F4F4F4', background: sel ? '#FFF7F0' : 'transparent' }}
                      onMouseEnter={e=>{ if (!sel) e.currentTarget.style.background='#FAFAFA'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background = sel ? '#FFF7F0' : 'transparent'; }}>

                      <td style={{ padding:'11px 8px 11px 16px', width:32 }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleOne(p.id)}
                          style={{ cursor:'pointer', accentColor:'var(--orange)', width:14, height:14 }}/>
                      </td>

                      <td style={{ padding:'11px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:'#F4F4F4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                            {p.logo||p.logo_emoji||'📦'}
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#0A0A0A' }}>{p.name}</div>
                            <div style={{ fontSize:11, color:'#AAAAAA', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.tagline}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'11px 16px' }}><Badge variant="purple">{p.category||p.industry||'—'}</Badge></td>
                      <td style={{ padding:'11px 16px', fontSize:12, color:'#666' }}>{p.country}</td>
                      <td style={{ padding:'11px 16px' }}><span style={{ fontSize:11, color:'var(--orange)', fontWeight:600 }}>@{p.submitter_handle}</span></td>
                      <td style={{ padding:'11px 16px', fontSize:14, fontWeight:800, color:'var(--orange)' }}>🎉 {p.upvotes_count}</td>
                      <td style={{ padding:'11px 16px' }}><Badge variant={sb.v}>{sb.l}</Badge></td>

                      <td style={{ padding:'11px 16px' }}>
                        <label style={{ position:'relative', display:'inline-block', width:38, height:22, cursor:'pointer' }}>
                          <input type="checkbox" checked={!!p.featured}
                            onChange={() => act(p.id, () => adminAPI.featured(p.id), p.featured ? `${p.name} unfeatured` : `${p.name} featured!`)}
                            style={{ opacity:0, width:0, height:0 }}/>
                          <span style={{ position:'absolute', inset:0, background:p.featured?'var(--orange)':'#E8E8E8', borderRadius:99, transition:'.2s' }}/>
                          <span style={{ position:'absolute', left:p.featured?18:2, top:2, width:18, height:18, background:'#fff', borderRadius:'50%', transition:'.2s' }}/>
                        </label>
                      </td>

                      <td style={{ padding:'11px 16px' }}>
                        <div style={{ display:'flex', gap:5 }}>
                          {p.status==='pending' && <>
                            <ActionBtn variant="approve" loading={acting[p.id]} onClick={() => act(p.id, () => adminAPI.approveProduct(p.id), `✅ ${p.name} approved!`)}>✓ Approve</ActionBtn>
                            <ActionBtn variant="reject"  loading={acting[p.id]} onClick={() => act(p.id, () => adminAPI.rejectProduct(p.id),  `✕ ${p.name} rejected`)}>✕ Reject</ActionBtn>
                          </>}
                          {p.status==='live' && <ActionBtn variant="edit" onClick={() => toast.success(`Edit ${p.name}`)}>✎ Edit</ActionBtn>}
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
