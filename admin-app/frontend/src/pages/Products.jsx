import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState, SkeletonRows, Pagination, ConfirmModal, Drawer, DrawerField, fmtDate } from './shared.jsx';

const PAGE_SIZE = 20;

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

// ── Reject Reason Modal ───────────────────────────────────────────────────────
function RejectModal({ product, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    const h = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onCancel}>
      <div style={{background:'#fff',borderRadius:18,padding:28,width:440,maxWidth:'90vw',boxShadow:'0 24px 64px rgba(0,0,0,.22)'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,color:'#0A0A0A',marginBottom:4}}>Reject "{product?.name}"</div>
        <div style={{fontSize:13,color:'#888',marginBottom:18}}>The submitter will receive this reason in their account notification.</div>
        <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>
          Rejection Reason <span style={{color:'#dc2626'}}>*</span>
        </label>
        <textarea
          ref={ref}
          value={reason}
          onChange={e=>setReason(e.target.value)}
          placeholder="Explain why this product is being rejected…"
          rows={4}
          style={{width:'100%',borderRadius:10,border:`1.5px solid ${reason.trim()?'#E8E8E8':'#fca5a5'}`,padding:'10px 12px',fontSize:13,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box',lineHeight:1.5}}
        />
        <div style={{fontSize:11,color:'#aaa',textAlign:'right',marginTop:4}}>{reason.length}/500</div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
          <button onClick={onCancel} style={{padding:'9px 20px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#555',fontFamily:'inherit'}}>
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading}
            style={{padding:'9px 20px',borderRadius:9,border:'none',background:'#dc2626',color:'#fff',fontSize:13,fontWeight:700,cursor:(!reason.trim()||loading)?'not-allowed':'pointer',fontFamily:'inherit',opacity:(!reason.trim()||loading)?0.6:1}}>
            {loading ? '…' : '✕ Reject Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Detail Drawer ────────────────────────────────────────────────────
function ProductDrawer({ productId, onClose, onAction }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminAPI.getProduct(productId)
      .then(r => setDetail(r.data.data))
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setLoading(false));
  }, [productId]);

  const doApprove = async () => {
    setActing('approve');
    try {
      await adminAPI.approveProduct(productId);
      toast.success(`✅ ${detail.name} approved!`);
      onAction();
      onClose();
    } catch(e) { toast.error(e.message || 'Failed'); }
    finally { setActing(''); }
  };

  const doReject = async (reason) => {
    setActing('reject');
    try {
      await adminAPI.rejectProduct(productId, reason);
      toast.success(`${detail.name} rejected`);
      setShowReject(false);
      onAction();
      onClose();
    } catch(e) { toast.error(e.message || 'Failed'); }
    finally { setActing(''); }
  };

  const doFeature = async () => {
    setActing('feature');
    try {
      await adminAPI.featured(productId);
      toast.success(detail.featured ? `${detail.name} unfeatured` : `${detail.name} featured!`);
      onAction();
      onClose();
    } catch(e) { toast.error(e.message || 'Failed'); }
    finally { setActing(''); }
  };

  const sb = { live:'green', pending:'amber', soon:'blue', rejected:'red', draft:'gray' };

  return (
    <>
      <Drawer title={loading ? 'Loading…' : detail?.name} subtitle={loading ? '' : detail?.tagline} onClose={onClose} width={520}>
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {[...Array(6)].map((_,i)=>(
              <div key={i} style={{height:14,borderRadius:7,background:'#F0F0F0',animation:'pulse 1.4s ease-in-out infinite',width:i%2===0?'60%':'85%'}}/>
            ))}
          </div>
        ) : !detail ? (
          <div style={{textAlign:'center',color:'#888',padding:40}}>Failed to load product details.</div>
        ) : (
          <>
            {/* Header identity */}
            <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:24,paddingBottom:20,borderBottom:'1px solid #F0F0F0'}}>
              <div style={{width:56,height:56,borderRadius:14,background:'#F4F4F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>
                {detail.logo_emoji||'📦'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                  <span style={{fontSize:16,fontWeight:800,color:'#0A0A0A'}}>{detail.name}</span>
                  <Badge variant={sb[detail.status]||'gray'}>● {detail.status}</Badge>
                  {detail.featured && <Badge variant="orange">⭐ Featured</Badge>}
                </div>
                <div style={{fontSize:13,color:'#555'}}>{detail.tagline}</div>
              </div>
            </div>

            {/* Fields */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
              <DrawerField label="Category">{detail.category || detail.industry}</DrawerField>
              <DrawerField label="Country">{detail.country}</DrawerField>
              <DrawerField label="Upvotes">🎉 {detail.upvotes_count}</DrawerField>
              <DrawerField label="Waitlist">{detail.waitlist_count || 0} signups</DrawerField>
              <DrawerField label="Submitted">
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:detail.submitter_avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#fff',flexShrink:0}}>
                    {(detail.submitter_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2)}
                  </div>
                  <span>@{detail.submitter_handle}</span>
                  {detail.submitter_verified && <span style={{fontSize:10,color:'var(--orange)'}}>✓</span>}
                </div>
              </DrawerField>
              <DrawerField label="Submitted On">{fmtDate(detail.created_at)}</DrawerField>
            </div>

            {detail.description && (
              <DrawerField label="Description">
                <div style={{fontSize:13,color:'#444',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{detail.description}</div>
              </DrawerField>
            )}

            {detail.website && (
              <DrawerField label="Website">
                <a href={detail.website} target="_blank" rel="noreferrer" style={{color:'var(--orange)',fontSize:13,textDecoration:'none',wordBreak:'break-all'}}>
                  {detail.website}
                </a>
              </DrawerField>
            )}

            {detail.rejected_reason && (
              <div style={{padding:'12px 14px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,marginTop:4}}>
                <div style={{fontSize:11,fontWeight:700,color:'#991B1B',marginBottom:4,textTransform:'uppercase',letterSpacing:'.05em'}}>Rejection Reason</div>
                <div style={{fontSize:13,color:'#7F1D1D'}}>{detail.rejected_reason}</div>
              </div>
            )}

            {/* Actions */}
            {detail.status === 'pending' && (
              <div style={{display:'flex',gap:10,marginTop:24,paddingTop:20,borderTop:'1px solid #F0F0F0'}}>
                <button onClick={doApprove} disabled={!!acting}
                  style={{flex:1,padding:'11px',borderRadius:10,background:'#16a34a',color:'#fff',border:'none',fontSize:13,fontWeight:700,cursor:acting?'not-allowed':'pointer',fontFamily:'inherit',opacity:acting?0.7:1}}>
                  {acting==='approve'?'Approving…':'✓ Approve'}
                </button>
                <button onClick={() => setShowReject(true)} disabled={!!acting}
                  style={{flex:1,padding:'11px',borderRadius:10,background:'#FEE2E2',color:'#991B1B',border:'none',fontSize:13,fontWeight:700,cursor:acting?'not-allowed':'pointer',fontFamily:'inherit',opacity:acting?0.7:1}}>
                  ✕ Reject
                </button>
              </div>
            )}
            {detail.status !== 'pending' && (
              <div style={{display:'flex',gap:10,marginTop:24,paddingTop:20,borderTop:'1px solid #F0F0F0'}}>
                <button onClick={doFeature} disabled={!!acting}
                  style={{flex:1,padding:'10px',borderRadius:10,background:detail.featured?'#FEF3C7':'#FFF7ED',color:detail.featured?'#92400E':'#C2410C',border:`1.5px solid ${detail.featured?'#FDE68A':'#FED7AA'}`,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  {acting==='feature'?'…': detail.featured?'Unfeature':'⭐ Feature'}
                </button>
              </div>
            )}
          </>
        )}
      </Drawer>

      {showReject && (
        <RejectModal
          product={detail}
          onConfirm={doReject}
          onCancel={() => setShowReject(false)}
          loading={acting==='reject'}
        />
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Products() {
  const [products, setProducts] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('queue');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [acting,   setActing]   = useState({});
  const [selected, setSelected] = useState(new Set());
  const [bulking,  setBulking]  = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [bulkRejectConfirm, setBulkRejectConfirm] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: PAGE_SIZE, page };
    if (filter === 'queue' || filter === 'pending') params.status = 'pending';
    else if (filter === 'featured') params.featured = true;
    else if (filter !== 'all') params.status = filter;
    if (search) params.search = search;
    adminAPI.products(params)
      .then(({ data: d }) => {
        setProducts(d.data || []);
        setTotal(d.pagination?.total || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (key) => { setFilter(key); setPage(1); setSelected(new Set()); };
  const handleSearch = (e) => { if (e.key==='Enter') { setPage(1); load(); } };

  const pendingCount = filter === 'queue'
    ? total
    : products.filter(p => p.status === 'pending').length;

  const act = async (id, fn, msg) => {
    setActing(p => ({ ...p, [id]: true }));
    try { await fn(); toast.success(msg); load(); }
    catch(e) { toast.error(e.message || 'Failed'); }
    finally { setActing(p => ({ ...p, [id]: false })); }
  };

  const toggleAll = () => setSelected(selected.size===products.length ? new Set() : new Set(products.map(p=>p.id)));
  const toggleOne = (id) => { const s=new Set(selected); s.has(id)?s.delete(id):s.add(id); setSelected(s); };

  const doBulk = async (action) => {
    if (!selected.size) return;
    if (action === 'reject') { setBulkRejectConfirm(true); return; }
    setBulking(true);
    try {
      await adminAPI.bulkProducts({ ids: [...selected], action });
      toast.success(`${selected.size} product(s) ${action}d`);
      setSelected(new Set());
      load();
    } catch(e) { toast.error(e.message || 'Bulk action failed'); }
    finally { setBulking(false); }
  };

  const doBulkRejectConfirmed = async () => {
    setBulking(true);
    setBulkRejectConfirm(false);
    try {
      await adminAPI.bulkProducts({ ids: [...selected], action: 'reject' });
      toast.success(`${selected.size} product(s) rejected`);
      setSelected(new Set());
      load();
    } catch(e) { toast.error(e.message || 'Bulk reject failed'); }
    finally { setBulking(false); }
  };

  const doReject = async (reason) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await adminAPI.rejectProduct(rejectTarget.id, reason);
      toast.success(`${rejectTarget.name} rejected`);
      setRejectTarget(null);
      load();
    } catch(e) { toast.error(e.message || 'Failed'); }
    finally { setRejectLoading(false); }
  };

  const statusBadge = s => ({
    live:     {v:'green', l:'● Live'},
    pending:  {v:'amber', l:'● Pending'},
    soon:     {v:'blue',  l:'● Soon'},
    rejected: {v:'red',   l:'● Rejected'},
    draft:    {v:'gray',  l:'● Draft'},
  })[s] || {v:'gray', l:s};

  return (
    <div>
      {/* Filter pills */}
      <div style={{marginBottom:16}}>
        <div className="filters-bar" style={{marginBottom:10}}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => handleFilterChange(f.key)}
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
                <span style={{position:'absolute',top:-6,right:-4,minWidth:16,height:16,background:'#dc2626',color:'#fff',borderRadius:99,fontSize:9,fontWeight:800,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{position:'relative'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={handleSearch} placeholder="Search products… (Enter)"
              style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'8px 14px 8px 34px',fontSize:12,width:220,outline:'none',background:'#FAFAFA'}}/>
            <svg style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#AAAAAA'}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          {search && <button onClick={()=>{setSearch('');setPage(1);}} style={{padding:'8px 10px',borderRadius:9,border:'1px solid #E8E8E8',background:'#fff',fontSize:11,color:'#888',cursor:'pointer'}}>✕ Clear</button>}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'#FFF7F0',border:'1.5px solid var(--orange)',borderRadius:12,marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:700,color:'var(--orange)'}}>{selected.size} selected</span>
          <div style={{display:'flex',gap:6}}>
            {BULK_ACTIONS.map(ba => (
              <button key={ba.key} onClick={()=>doBulk(ba.key)} disabled={bulking}
                style={{padding:'6px 14px',borderRadius:8,border:'none',background:ba.bg,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',opacity:bulking?0.6:1}}>
                {ba.label}
              </button>
            ))}
          </div>
          <button onClick={()=>setSelected(new Set())}
            style={{marginLeft:'auto',padding:'5px 10px',borderRadius:8,border:'1px solid #E8E8E8',background:'#fff',fontSize:11,color:'#666',cursor:'pointer'}}>
            ✕ Clear
          </button>
        </div>
      )}

      {/* Review Queue banner */}
      {filter==='queue' && !loading && (
        <div style={{padding:'12px 18px',background:'#FFF7F0',border:'1.5px solid #FFD9C7',borderRadius:12,marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18}}>🔔</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>
              {total>0 ? `${total} product${total!==1?'s':''} awaiting review` : 'All caught up — no pending submissions'}
            </div>
            <div style={{fontSize:11,color:'#888',marginTop:2}}>Click a row to open the detail drawer. Select multiple for bulk actions.</div>
          </div>
        </div>
      )}

      <SCard>
        <Tbl heads={[
          <input key="chk" type="checkbox"
            checked={products.length>0 && selected.size===products.length}
            onChange={toggleAll}
            style={{cursor:'pointer',accentColor:'var(--orange)',width:14,height:14}}/>,
          'Product','Industry','Country','Submitter','Upvotes','Status','Featured','Actions'
        ]}>
          {loading
            ? <SkeletonRows cols={9} rows={6}/>
            : products.length===0
              ? <tr><td colSpan={9}><EmptyState icon="📦" title="No products found" sub="Try adjusting your filter or search."/></td></tr>
              : products.map(p => {
                  const sb  = statusBadge(p.status);
                  const sel = selected.has(p.id);
                  return (
                    <tr key={p.id}
                      style={{borderBottom:'1px solid #F4F4F4',background:sel?'#FFF7F0':'transparent',cursor:'pointer'}}
                      onClick={() => setDrawerProduct(p.id)}
                      onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background='#FAFAFA'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=sel?'#FFF7F0':'transparent'; }}>

                      <td style={{padding:'11px 8px 11px 16px',width:32}} onClick={e=>e.stopPropagation()}>
                        <input type="checkbox" checked={sel} onChange={()=>toggleOne(p.id)}
                          style={{cursor:'pointer',accentColor:'var(--orange)',width:14,height:14}}/>
                      </td>

                      <td style={{padding:'11px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:10,background:'#F4F4F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                            {p.logo||p.logo_emoji||'📦'}
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{p.name}</div>
                            <div style={{fontSize:11,color:'#AAAAAA',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.tagline}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'11px 16px'}}><Badge variant="purple">{p.category||p.industry||'—'}</Badge></td>
                      <td style={{padding:'11px 16px',fontSize:12,color:'#666'}}>{p.country}</td>
                      <td style={{padding:'11px 16px'}}><span style={{fontSize:11,color:'var(--orange)',fontWeight:600}}>@{p.submitter_handle}</span></td>
                      <td style={{padding:'11px 16px',fontSize:14,fontWeight:800,color:'var(--orange)'}}>🎉 {p.upvotes_count}</td>
                      <td style={{padding:'11px 16px'}}><Badge variant={sb.v}>{sb.l}</Badge></td>

                      <td style={{padding:'11px 16px'}} onClick={e=>e.stopPropagation()}>
                        <label style={{position:'relative',display:'inline-block',width:38,height:22,cursor:'pointer'}}>
                          <input type="checkbox" checked={!!p.featured}
                            onChange={()=>act(p.id, ()=>adminAPI.featured(p.id), p.featured?`${p.name} unfeatured`:`${p.name} featured!`)}
                            style={{opacity:0,width:0,height:0}}/>
                          <span style={{position:'absolute',inset:0,background:p.featured?'var(--orange)':'#E8E8E8',borderRadius:99,transition:'.2s'}}/>
                          <span style={{position:'absolute',left:p.featured?18:2,top:2,width:18,height:18,background:'#fff',borderRadius:'50%',transition:'.2s'}}/>
                        </label>
                      </td>

                      <td style={{padding:'11px 16px'}} onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:5}}>
                          {p.status==='pending' && <>
                            <ActionBtn variant="approve" loading={acting[p.id]} onClick={()=>act(p.id,()=>adminAPI.approveProduct(p.id),`✅ ${p.name} approved!`)}>✓ Approve</ActionBtn>
                            <ActionBtn variant="reject"  loading={acting[p.id]} onClick={()=>setRejectTarget(p)}>✕ Reject</ActionBtn>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
        </Tbl>
        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage}/>
      </SCard>

      {/* Reject reason modal */}
      {rejectTarget && (
        <RejectModal
          product={rejectTarget}
          onConfirm={doReject}
          onCancel={()=>setRejectTarget(null)}
          loading={rejectLoading}
        />
      )}

      {/* Bulk reject confirmation */}
      {bulkRejectConfirm && (
        <ConfirmModal
          title={`Reject ${selected.size} product${selected.size!==1?'s':''}?`}
          message="These products will be rejected. The submitters will be notified. This action cannot be undone."
          confirmLabel="Reject All"
          danger={true}
          onConfirm={doBulkRejectConfirmed}
          onCancel={()=>setBulkRejectConfirm(false)}
          loading={bulking}
        />
      )}

      {/* Product detail drawer */}
      {drawerProduct && (
        <ProductDrawer
          productId={drawerProduct}
          onClose={()=>setDrawerProduct(null)}
          onAction={load}
        />
      )}
    </div>
  );
}
