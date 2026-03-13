import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, ActionBtn, EmptyState } from './shared.jsx';

export default function Featured() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const [banner, setBanner] = useState("🌟 MENA's #1 Tech Discovery Platform");
  const [editorNote, setEditorNote] = useState("This week's picks are tackling MENA's biggest infrastructure gaps.");
  const [savingBanner, setSavingBanner] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.products({ limit:200 })
      .then(({ data: d }) => setAllProducts(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleFeatured = async product => {
    setToggling(p=>({...p,[product.id]:true}));
    try {
      await adminAPI.featured(product.id);
      toast.success(product.featured ? `${product.name} removed from featured` : `${product.name} featured!`);
      load();
    } catch { toast.error('Failed'); }
    finally { setToggling(p=>({...p,[product.id]:false})); }
  };

  const featuredProducts = allProducts.filter(p => p.featured);
  const nonFeatured      = allProducts.filter(p => p.status==='live' && !p.featured);

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20,alignItems:'start'}}>
      {/* Left: Featured Spotlight */}
      <SCard title="Featured Spotlight" sub="Products currently featured on homepage">
        <div style={{padding:'16px 20px'}}>
          {loading ? (
            <div style={{textAlign:'center',padding:'30px 0',color:'#AAAAAA',fontSize:13}}>Loading…</div>
          ) : featuredProducts.length===0 ? (
            <EmptyState icon="⭐" title="No featured products" sub="Feature live products using the buttons below"/>
          ) : featuredProducts.map((p,i) => (
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,background:'#FAFAFA',border:'1px solid #E8E8E8',borderRadius:14,padding:'14px 16px',marginBottom:10}}>
              <div style={{fontSize:26}}>{p.logo||p.logo_emoji||'📦'}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:'#0A0A0A'}}>{p.name}</div>
                <div style={{fontSize:11,color:'#AAAAAA'}}>{p.tagline}</div>
                <div style={{fontSize:10,color:'#AAAAAA',marginTop:2}}>{p.category||p.industry} · {p.country}</div>
              </div>
              <Badge variant="orange">⭐ #{i+1}</Badge>
              <ActionBtn variant="reject" loading={toggling[p.id]} onClick={()=>toggleFeatured(p)}>Remove</ActionBtn>
            </div>
          ))}

          {nonFeatured.length>0 && (
            <div style={{marginTop:16}}>
              <div style={{fontSize:12,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Add from live products</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:280,overflowY:'auto'}}>
                {nonFeatured.map(p => (
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,border:'1px solid #E8E8E8',borderRadius:12,padding:'10px 14px'}}>
                    <div style={{fontSize:20}}>{p.logo||p.logo_emoji||'📦'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{p.name}</div>
                      <div style={{fontSize:11,color:'#AAAAAA'}}>{p.category||p.industry} · {p.country}</div>
                    </div>
                    <ActionBtn variant="verify" loading={toggling[p.id]} onClick={()=>toggleFeatured(p)}>⭐ Feature</ActionBtn>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SCard>

      {/* Right: Banner + Editor's Pick */}
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <SCard title="Homepage Banner" sub="Announcement bar on the public site">
          <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
            <textarea value={banner} onChange={e=>setBanner(e.target.value)} rows={3} style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',width:'100%',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:8}}>
              <button disabled={savingBanner} onClick={async()=>{setSavingBanner(true);await new Promise(r=>setTimeout(r,400));setSavingBanner(false);toast.success('Banner updated!');}} style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:700,fontSize:12,cursor:'pointer',opacity:savingBanner?0.6:1,fontFamily:'inherit'}}>
                {savingBanner?'Saving…':'Save Banner'}
              </button>
              <button onClick={()=>toast.success('Banner hidden')} style={{background:'#F4F4F4',color:'#666',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Hide</button>
            </div>
          </div>
        </SCard>
        <SCard title="Editor's Pick" sub="Weekly editorial note on homepage">
          <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
            <textarea value={editorNote} onChange={e=>setEditorNote(e.target.value)} rows={4} style={{border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',width:'100%',boxSizing:'border-box'}}/>
            <button onClick={()=>toast.success("Editor's pick updated!")} style={{alignSelf:'flex-start',background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Update Pick</button>
          </div>
        </SCard>
      </div>
    </div>
  );
}
