import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, usersAPI, entitiesAPI } from '../../utils/api';
import { useUI } from '../../context/UIContext';

const COLOR_MAP = {
  orange:'#E15033', violet:'#7c3aed', blue:'#2563eb', emerald:'#059669',
  rose:'#e11d48', amber:'#d97706', teal:'#0d9488', indigo:'#4338ca',
};

const ENTITY_TYPE_LABEL = {
  startup: 'Company', company: 'Company',
  accelerator: 'Accelerator', investor: 'Investor', venture_studio: 'Venture Studio',
};

export default function SearchDropdown({ query, onClose }) {
  const navigate = useNavigate();
  const { setEntityModal } = useUI();
  const [products,  setProducts]  = useState([]);
  const [people,    setPeople]    = useState([]);
  const [entities,  setEntities]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setProducts([]); setPeople([]); setEntities([]); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodRes, peopleRes, entRes] = await Promise.allSettled([
          productsAPI.list({ search: query.trim(), status: 'all', limit: 5, sort: 'upvotes' }),
          usersAPI.people({ search: query.trim(), limit: 3 }),
          entitiesAPI.list({ search: query.trim(), limit: 4 }),
        ]);
        setProducts(prodRes.status  === 'fulfilled' ? (prodRes.value.data?.data   || []) : []);
        setPeople(peopleRes.status  === 'fulfilled' ? (peopleRes.value.data?.data || []) : []);
        setEntities(entRes.status   === 'fulfilled' ? (entRes.value.data?.data    || []) : []);
      } catch {
        setProducts([]); setPeople([]); setEntities([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  if (!query.trim()) return null;

  const noResults = !loading && !products.length && !people.length && !entities.length;

  const openEntity = (ent) => {
    setEntityModal({
      ...ent,
      flag: ent.flag || '🌍',
      icon: ent.logo_emoji || '🏢',
      type: ENTITY_TYPE_LABEL[ent.type] || ent.type,
      about: ent.description || '',
      tags: [ent.stage].filter(Boolean),
      industries: ent.industry ? [ent.industry] : [],
      links: ent.website ? [{ icon:'🌐', label:'Website', url: ent.website }] : [],
      teamMembers: [],
    });
    onClose();
  };

  return (
    <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, boxShadow:'0 12px 48px rgba(0,0,0,.14)', zIndex:9999, overflow:'hidden', maxHeight:500, overflowY:'auto' }}>

      {loading && (
        <div style={{ padding:'16px', textAlign:'center', fontSize:13, color:'#aaa' }}>
          <span style={{ display:'inline-block', animation:'spin 1s linear infinite', marginRight:6 }}>⟳</span>
          Searching…
        </div>
      )}

      {noResults && (
        <div style={{ padding:'20px 16px', textAlign:'center', fontSize:13, color:'#aaa' }}>
          No results for "<b>{query}</b>"
        </div>
      )}

      {/* ── People ── */}
      {!loading && people.length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', padding:'12px 16px 6px' }}>People</div>
          {people.map(p => {
            const initials = (p.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const bg = COLOR_MAP[p.avatar_color] || '#E15033';
            return (
              <div key={p.id} onMouseDown={() => { navigate(`/u/${p.handle}`); onClose(); }}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', transition:'background .1s' }}
                onMouseOver={e => e.currentTarget.style.background='#f8f8f8'}
                onMouseOut={e => e.currentTarget.style.background=''}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:bg, color:'#fff', display:'grid', placeItems:'center', fontSize:13, fontWeight:900, flexShrink:0 }}>{initials}</div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a' }}>{p.name}{p.verified ? ' ✓' : ''}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>@{p.handle} · {p.persona || 'Member'}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'#f4f4f4', color:'#888', flexShrink:0 }}>{p.persona || 'Member'}</span>
              </div>
            );
          })}
          {(entities.length > 0 || products.length > 0) && <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>}
        </>
      )}

      {/* ── Entities ── */}
      {!loading && entities.length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', padding:'12px 16px 6px' }}>Companies & Entities</div>
          {entities.map(ent => (
            <div key={ent.id} onMouseDown={() => openEntity(ent)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', transition:'background .1s' }}
              onMouseOver={e => e.currentTarget.style.background='#f8f8f8'}
              onMouseOut={e => e.currentTarget.style.background=''}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#f4f4f4', display:'grid', placeItems:'center', fontSize:18, flexShrink:0, border:'1px solid #eee', overflow:'hidden' }}>
                {ent.logo_url
                  ? <img src={ent.logo_url} alt={ent.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : ent.logo_emoji || '🏢'}
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a' }}>{ent.name}</div>
                <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{ENTITY_TYPE_LABEL[ent.type] || ent.type} · {ent.country || 'MENA'}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'#f5f3ff', color:'#7c3aed', flexShrink:0 }}>
                {ENTITY_TYPE_LABEL[ent.type] || ent.type}
              </span>
            </div>
          ))}
          {products.length > 0 && <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>}
        </>
      )}

      {/* ── Products ── */}
      {!loading && products.length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'#aaa', padding:'12px 16px 6px' }}>Products</div>
          {products.map(p => (
            <div key={p.id} onMouseDown={() => { navigate(`/products/${p.id}`); onClose(); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', transition:'background .1s' }}
              onMouseOver={e => e.currentTarget.style.background='#f8f8f8'}
              onMouseOut={e => e.currentTarget.style.background=''}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#f4f4f4', display:'grid', placeItems:'center', fontSize:18, flexShrink:0, border:'1px solid #eee', overflow:'hidden' }}>
                {p.logo_url
                  ? <img src={p.logo_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : p.logo_emoji || '📦'}
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a' }}>{p.name}</div>
                <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{p.industry} · {(p.countries || [])[0] || ''}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, flexShrink:0, background:p.status==='soon'?'#fff8ed':'#eefbf3', color:p.status==='soon'?'#d97706':'#16a34a' }}>
                {p.status === 'soon' ? 'Soon' : 'Live'}
              </span>
            </div>
          ))}
          <div onMouseDown={() => { navigate(`/products?q=${encodeURIComponent(query)}`); onClose(); }}
            style={{ padding:'10px 16px', fontSize:12, fontWeight:700, color:'var(--orange)', cursor:'pointer', textAlign:'center', borderTop:'1px solid #f0f0f0' }}
            onMouseOver={e => e.currentTarget.style.background='#fef5f3'}
            onMouseOut={e => e.currentTarget.style.background=''}>
            See all results for "{query}" →
          </div>
        </>
      )}
    </div>
  );
}
