import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, ActionBtn, EmptyState } from './shared.jsx';

const BANNER_DEFAULT  = "🌟 MENA's #1 Tech Discovery Platform";
const PICK_DEFAULT    = "This week's picks are tackling MENA's biggest infrastructure gaps.";

function FeatureModal({ onClose, onDone }) {
  const [query,    setQuery]    = useState('');
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [featuring, setFeaturing] = useState({});
  const timerRef = useRef(null);

  const search = useCallback((q) => {
    setLoading(true);
    adminAPI.products({ status: 'live', search: q, limit: 50 })
      .then(({ data: d }) => setProducts((d.data || []).filter(p => !p.featured)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { search(''); }, [search]);

  const handleQuery = (v) => {
    setQuery(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 280);
  };

  const feature = async (p) => {
    setFeaturing(f => ({ ...f, [p.id]: true }));
    try {
      await adminAPI.featured(p.id);
      toast.success(`⭐ ${p.name} is now featured!`);
      onDone();
      onClose();
    } catch { toast.error('Failed to feature product'); }
    finally { setFeaturing(f => ({ ...f, [p.id]: false })); }
  };

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9100,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onClose}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:480,maxWidth:'92vw',boxShadow:'0 24px 64px rgba(0,0,0,.22)',maxHeight:'80vh',display:'flex',flexDirection:'column'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>⭐ Feature a Product</div>
            <div style={{fontSize:12,color:'#888',marginTop:2}}>Choose a live product to feature on the homepage</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAA',lineHeight:1}}>✕</button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={e => handleQuery(e.target.value)}
          placeholder="Search live products…"
          style={{border:'1.5px solid #E8E8E8',borderRadius:10,padding:'9px 12px',fontSize:13,fontFamily:'inherit',outline:'none',marginBottom:12,width:'100%',boxSizing:'border-box'}}
        />
        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
          {loading ? (
            <div style={{textAlign:'center',padding:'30px 0',color:'#AAA',fontSize:13}}>Searching…</div>
          ) : products.length === 0 ? (
            <div style={{textAlign:'center',padding:'30px 0',color:'#AAA',fontSize:13}}>
              {query ? 'No live products match your search' : 'All live products are already featured'}
            </div>
          ) : products.map(p => (
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,border:'1px solid #F0F0F0',borderRadius:12,padding:'10px 14px',background:'#FAFAFA'}}>
              <span style={{fontSize:22,flexShrink:0}}>{p.logo_emoji||'📦'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                <div style={{fontSize:11,color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.tagline}</div>
                <div style={{fontSize:10,color:'#AAA',marginTop:2}}>by @{p.submitter_handle} · {p.country}</div>
              </div>
              <button onClick={() => feature(p)} disabled={featuring[p.id]}
                style={{padding:'7px 14px',borderRadius:8,border:'none',background:'var(--orange)',color:'#fff',fontSize:12,fontWeight:700,cursor:featuring[p.id]?'not-allowed':'pointer',opacity:featuring[p.id]?0.6:1,flexShrink:0,fontFamily:'inherit'}}>
                {featuring[p.id] ? '…' : '⭐ Feature'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Featured() {
  const [allProducts,  setAllProducts]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toggling,     setToggling]     = useState({});
  const [showModal,    setShowModal]    = useState(false);

  const [banner,       setBanner]       = useState(BANNER_DEFAULT);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [savingBanner, setSavingBanner] = useState(false);

  const [editorNote,   setEditorNote]   = useState(PICK_DEFAULT);
  const [savingPick,   setSavingPick]   = useState(false);

  const loadProducts = useCallback(() => {
    setLoading(true);
    adminAPI.products({ limit: 200 })
      .then(({ data: d }) => setAllProducts(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProducts();
    adminAPI.settings()
      .then(({ data: d }) => {
        const s = d.data || {};
        if (s.banner) {
          try {
            const b = JSON.parse(s.banner);
            if (b.text)    setBanner(b.text);
            if (b.visible !== undefined) setBannerVisible(b.visible);
          } catch { setBanner(s.banner); }
        }
        if (s.editors_pick) {
          try {
            const ep = JSON.parse(s.editors_pick);
            if (ep.text) setEditorNote(ep.text);
          } catch { setEditorNote(s.editors_pick); }
        }
      })
      .catch(() => {});
  }, [loadProducts]);

  const saveBanner = async () => {
    setSavingBanner(true);
    try {
      await adminAPI.saveBanner({ text: banner, visible: bannerVisible });
      toast.success('Banner saved!');
    } catch(e) { toast.error(e.message || 'Failed to save banner'); }
    finally { setSavingBanner(false); }
  };

  const hideBanner = async () => {
    setSavingBanner(true);
    try {
      await adminAPI.saveBanner({ text: banner, visible: false });
      setBannerVisible(false);
      toast.success('Banner hidden');
    } catch(e) { toast.error(e.message || 'Failed'); }
    finally { setSavingBanner(false); }
  };

  const savePick = async () => {
    setSavingPick(true);
    try {
      await adminAPI.saveEditorsPick({ text: editorNote });
      toast.success("Editor's pick saved!");
    } catch(e) { toast.error(e.message || "Failed to save editor's pick"); }
    finally { setSavingPick(false); }
  };

  const toggleFeatured = async product => {
    setToggling(p => ({ ...p, [product.id]: true }));
    try {
      await adminAPI.featured(product.id);
      toast.success(product.featured ? `${product.name} removed from featured` : `${product.name} featured!`);
      loadProducts();
    } catch { toast.error('Failed'); }
    finally { setToggling(p => ({ ...p, [product.id]: false })); }
  };

  const featuredProducts = allProducts.filter(p => p.featured);

  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20,alignItems:'start'}}>
        <SCard
          title="Featured Spotlight"
          sub="Products currently featured on homepage"
          action={
            <button onClick={() => setShowModal(true)}
              style={{padding:'6px 14px',borderRadius:8,border:'none',background:'var(--orange)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              + Feature a Product
            </button>
          }
        >
          <div style={{padding:'16px 20px'}}>
            {loading ? (
              <div style={{textAlign:'center',padding:'30px 0',color:'#AAAAAA',fontSize:13}}>Loading…</div>
            ) : featuredProducts.length === 0 ? (
              <EmptyState icon="⭐" title="No featured products" sub="Use the button above to feature a live product on the homepage"/>
            ) : featuredProducts.map((p, i) => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,background:'#FAFAFA',border:'1px solid #E8E8E8',borderRadius:14,padding:'14px 16px',marginBottom:10}}>
                <div style={{fontSize:26}}>{p.logo||p.logo_emoji||'📦'}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:'#0A0A0A'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'#AAAAAA'}}>{p.tagline}</div>
                  <div style={{fontSize:10,color:'#AAAAAA',marginTop:2}}>{p.category||p.industry} · {p.country}</div>
                </div>
                <Badge variant="orange">⭐ #{i+1}</Badge>
                <ActionBtn variant="reject" loading={toggling[p.id]} onClick={() => toggleFeatured(p)}>Remove</ActionBtn>
              </div>
            ))}
          </div>
        </SCard>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <SCard title="Homepage Banner" sub="Announcement bar on the public site">
            <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
              {!bannerVisible && (
                <div style={{fontSize:11,color:'#d97706',background:'#FEF3C7',borderRadius:8,padding:'6px 10px',fontWeight:600}}>
                  ⚠ Banner is currently hidden from the public site
                </div>
              )}
              <textarea value={banner} onChange={e=>setBanner(e.target.value)} rows={3}
                style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',width:'100%',boxSizing:'border-box'}}/>
              <div style={{display:'flex',gap:8}}>
                <button disabled={savingBanner} onClick={saveBanner}
                  style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:700,fontSize:12,cursor:savingBanner?'not-allowed':'pointer',opacity:savingBanner?0.6:1,fontFamily:'inherit'}}>
                  {savingBanner ? 'Saving…' : 'Save Banner'}
                </button>
                <button disabled={savingBanner} onClick={hideBanner}
                  style={{background:'#F4F4F4',color:'#666',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                  Hide
                </button>
              </div>
            </div>
          </SCard>

          <SCard title="Editor's Pick" sub="Weekly editorial note on homepage">
            <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
              <textarea value={editorNote} onChange={e=>setEditorNote(e.target.value)} rows={4}
                style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',width:'100%',boxSizing:'border-box'}}/>
              <button disabled={savingPick} onClick={savePick}
                style={{alignSelf:'flex-start',background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:700,fontSize:12,cursor:savingPick?'not-allowed':'pointer',opacity:savingPick?0.6:1,fontFamily:'inherit'}}>
                {savingPick ? 'Saving…' : "Update Pick"}
              </button>
            </div>
          </SCard>
        </div>
      </div>

      {showModal && (
        <FeatureModal onClose={() => setShowModal(false)} onDone={loadProducts} />
      )}
    </>
  );
}
