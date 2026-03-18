import React, { useState, useRef, useEffect } from 'react';
import { MENA_COUNTRIES_LIST, FUNDING_STAGES, labelStyle } from './settingsConstants';
import { INDUSTRIES, INDUSTRY_ICONS } from '../../utils/menaIndustries';

export default function CompanyTab({
  assocQ, assocResults, assocSelected, assocCurrent, assocSaving,
  searchAssocEntities, saveEntityAssoc, removeEntityAssoc,
  setAssocSelected, setAssocQ, setAssocResults,
  coType, setCoType, coName, setCoName, coLogoImg, setCoLogoImg,
  coIndustry, setCoIndustry, coCountry, setCoCountry,
  coCountryOpen, setCoCountryOpen, coStages, setCoStages,
  coAbout, setCoAbout, coWebsite, setCoWebsite,
  coLinkedIn, setCoLinkedIn, coTwitter, setCoTwitter,
  coTikTok, setCoTikTok, coInstagram, setCoInstagram,
  coTeam, setCoTeam, coFounded, setCoFounded,
  coAum, setCoAum, coPortfolio, setCoPortfolio,
  coWhyReasons, setCoWhyReasons,
  coStageOpen, setCoStageOpen, coSubmitted, setCoSubmitted,
  coSaving, handleCoLogoUpload, toggleCoStage, toggleCoCountry, handleCoSubmit,
}) {
  const inpStyle = { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' };
  const selStyle = { ...inpStyle, background:'#fff', cursor:'pointer' };
  const fo = e => { e.target.style.borderColor='var(--orange)'; };
  const bl = e => { e.target.style.borderColor='#e8e8e8'; };

  const [indOpen,   setIndOpen]   = useState(false);
  const [indSearch, setIndSearch] = useState('');
  const indRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (indRef.current && !indRef.current.contains(e.target)) setIndOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const yearOpts = Array.from({length:2026-1990+1},(_,i)=>2026-i);
  const ENTITY_TYPES = ['Company','Accelerator/Incubator','Venture Studio','Investment Firm'];
  const isInvFirm = coType === 'Investment Firm';
  const isCompany = coType === 'Company';

  const resetForm = () => {
    setCoType(''); setCoName(''); setCoLogoImg(null); setCoIndustry(''); setCoCountry([]);
    setCoStages([]); setCoAbout(''); setCoWebsite(''); setCoLinkedIn(''); setCoTwitter('');
    setCoTikTok(''); setCoInstagram(''); setCoTeam(''); setCoFounded('');
    setCoAum(''); setCoPortfolio(''); setCoWhyReasons(['']); setCoSubmitted(false);
  };

  const previewLinks = [
    coWebsite   && { icon:'🌐', label:'Website',   url: coWebsite },
    coLinkedIn  && { icon:'💼', label:'LinkedIn',  url: coLinkedIn },
    coTwitter   && { icon:'𝕏',  label:'Twitter',   url: coTwitter },
    coTikTok    && { icon:'♪',  label:'TikTok',    url: coTikTok },
    coInstagram && { icon:'📸', label:'Instagram', url: coInstagram },
  ].filter(Boolean);

  const assocSection = (
    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:24 }}>
      <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>🏢 My Associated Entity</div>
      <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>Link your account to an existing entity on the platform.</div>
      {assocCurrent ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'#f8f8f8', borderRadius:14, padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'var(--orange-light)', display:'grid', placeItems:'center', fontSize:20 }}>🏢</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'#0a0a0a' }}>{assocCurrent}</div>
              <div style={{ fontSize:12, color:'#aaa' }}>Currently linked entity</div>
            </div>
          </div>
          <button onClick={removeEntityAssoc} disabled={assocSaving}
            style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', color:'#e11d48', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {assocSaving ? 'Removing…' : 'Unlink'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'#888', marginBottom:6 }}>Search Entity</div>
          <div style={{ position:'relative' }}>
            <input
              type="text"
              placeholder="Type entity name e.g. Flat6Labs, STV…"
              value={assocQ}
              onChange={e => searchAssocEntities(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='var(--orange)'}
              onBlur={e => e.target.style.borderColor='#e8e8e8'}
            />
            {assocResults.length > 0 && !assocSelected && (
              <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:500, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', overflow:'hidden' }}>
                {assocResults.map(ent => (
                  <button key={ent.id} onClick={() => { setAssocSelected(ent); setAssocQ(ent.name); setAssocResults([]); }}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'none', borderBottom:'1px solid #f5f5f5', background:'#fff', cursor:'pointer', textAlign:'left' }}
                    onMouseOver={e=>e.currentTarget.style.background='#fff5f3'}
                    onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'#f5f5f5', display:'grid', placeItems:'center', fontSize:16, flexShrink:0 }}>🏢</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#0a0a0a' }}>{ent.name}</div>
                      <div style={{ fontSize:11, color:'#aaa', textTransform:'capitalize' }}>{(ent.type||'').replace('_',' ')} · {ent.country||'MENA'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {assocSelected && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginTop:12, background:'#fff5f3', border:'1.5px solid var(--orange)', borderRadius:12, padding:'12px 16px' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#0a0a0a' }}>{assocSelected.name}</div>
                <div style={{ fontSize:11, color:'#aaa', textTransform:'capitalize' }}>{(assocSelected.type||'').replace('_',' ')} · {assocSelected.country||'MENA'}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setAssocSelected(null); setAssocQ(''); }}
                  style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', color:'#888', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  Clear
                </button>
                <button onClick={saveEntityAssoc} disabled={assocSaving}
                  style={{ padding:'8px 20px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {assocSaving ? 'Linking…' : 'Link Entity'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {assocSection}

      <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>Create Entity Page</div>
      <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>List your company or organization on Tech Launch MENA's directory.</div>

      {coSubmitted ? (
        <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'52px 32px', textAlign:'center' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'#f0fdf4', display:'grid', placeItems:'center', fontSize:36, margin:'0 auto 20px' }}>✅</div>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Your entity is under review</div>
          <p style={{ color:'#666', fontSize:14, lineHeight:1.7, maxWidth:420, margin:'0 auto 20px' }}>
            <strong>{coName}</strong> has been submitted. Our team will review and publish your entity page within 48 hours.
          </p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#f0fdf4', padding:'8px 20px', borderRadius:20, fontSize:13, fontWeight:700, color:'#16a34a', marginBottom:28 }}>
            Under review · Estimated 48 hours
          </div>
          <br/>
          <button onClick={resetForm}
            style={{ padding:'10px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Submit Another Entity
          </button>
        </div>
      ) : (
        <>
          {coName && (
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'20px 24px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:16 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'#f5f5f5', border:'1px solid #eee', display:'grid', placeItems:'center', fontSize:28, flexShrink:0, overflow:'hidden' }}>
                {coLogoImg ? <img src={coLogoImg} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:22, color:'#bbb' }}>?</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#0a0a0a' }}>{coName}</div>
                <div style={{ fontSize:12, color:'#aaa', margin:'3px 0 6px', display:'flex', gap:5, flexWrap:'wrap' }}>
                  {coType && <span>{coType}</span>}
                  {coType && coCountry.length>0 && <span>·</span>}
                  {coCountry.length>0 && <span>{coCountry.map(v=>MENA_COUNTRIES_LIST.find(c=>c.v===v)?.l).filter(Boolean).join(', ')}</span>}
                  {coCountry.length>0 && coIndustry && <span>·</span>}
                  {coIndustry && <span>{coIndustry}</span>}
                  {isInvFirm && coStages.length > 0 && <><span>·</span><span>{coStages.join(', ')}</span></>}
                  {isCompany && coTeam && <><span>·</span><span>{coTeam} people</span></>}
                  {coFounded && <><span>·</span><span>Est. {coFounded}</span></>}
                </div>
                {coAbout && <div style={{ fontSize:13, color:'#555', lineHeight:1.6, marginBottom:previewLinks.length?8:0 }}>{coAbout}</div>}
                {previewLinks.length > 0 && (
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                    {previewLinks.map(lk => (
                      <a key={lk.label} href={lk.url} target="_blank" rel="noreferrer"
                        style={{ fontSize:12, color:'var(--orange)', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                        {lk.icon} {lk.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>Entity Details</div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>ENTITY TYPE *</label>
              <select value={coType} onChange={e=>setCoType(e.target.value)} style={selStyle} onFocus={fo} onBlur={bl}>
                <option value="">Select entity type</option>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>COMPANY LOGO</label>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'#f5f5f5', border:'1.5px solid #e8e8e8', display:'grid', placeItems:'center', overflow:'hidden', flexShrink:0 }}>
                  {coLogoImg ? <img src={coLogoImg} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <span style={{ fontSize:22, color:'#ccc' }}>?</span>}
                </div>
                <label style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:13, fontWeight:600, color:'#333', cursor:'pointer', background:'#fafafa', whiteSpace:'nowrap' }}>
                  Upload company logo
                  <input type="file" accept="image/*" onChange={handleCoLogoUpload} style={{ display:'none' }}/>
                </label>
                <span style={{ fontSize:12, color:'#bbb' }}>PNG, JPG up to 2MB</span>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>ENTITY NAME *</label>
              <input value={coName} onChange={e=>setCoName(e.target.value)} placeholder="e.g. Tabby" style={inpStyle} onFocus={fo} onBlur={bl}/>
            </div>

            <div className="settings-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div style={{ position:'relative' }} ref={indRef}>
                <label style={labelStyle}>INDUSTRY</label>
                <div onClick={() => { setIndOpen(o=>!o); setIndSearch(''); }}
                  style={{ ...inpStyle, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', borderColor: indOpen ? 'var(--orange)' : '#e8e8e8', userSelect:'none' }}>
                  <span style={{ color: coIndustry ? '#0a0a0a' : '#aaa', display:'flex', alignItems:'center', gap:7 }}>
                    {coIndustry ? <><span style={{ fontSize:15 }}>{INDUSTRY_ICONS[coIndustry]||'🏭'}</span>{coIndustry}</> : 'Select industry'}
                  </span>
                  <span style={{ fontSize:10, color:'#aaa', flexShrink:0 }}>▼</span>
                </div>
                {indOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:100, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, boxShadow:'0 8px 28px rgba(0,0,0,.1)' }}>
                    <div style={{ padding:'7px 10px', borderBottom:'1px solid #f0f0f0' }}>
                      <input value={indSearch} onChange={e=>setIndSearch(e.target.value)} placeholder="Search industry…" autoFocus
                        style={{ width:'100%', padding:'5px 9px', border:'1.5px solid #e8e8e8', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', background:'#fafafa', boxSizing:'border-box' }}/>
                    </div>
                    <div style={{ maxHeight:200, overflowY:'auto', overscrollBehavior:'contain' }}>
                      {INDUSTRIES.filter(i => i.toLowerCase().includes(indSearch.toLowerCase())).map(i => (
                        <div key={i} onClick={() => { setCoIndustry(i); setIndOpen(false); setIndSearch(''); }}
                          style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:8, fontWeight: coIndustry===i?700:500, color: coIndustry===i?'var(--orange)':'#333', background: coIndustry===i?'var(--orange-light)':'#fff', borderBottom:'1px solid #f4f4f4' }}
                          onMouseEnter={ev => { if(coIndustry!==i) ev.currentTarget.style.background='#fafafa'; }}
                          onMouseLeave={ev => { if(coIndustry!==i) ev.currentTarget.style.background='#fff'; }}>
                          <span style={{ fontSize:15 }}>{INDUSTRY_ICONS[i]||'🏭'}</span>
                          {i}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ position:'relative' }}>
                <label style={labelStyle}>COUNTRY (select all that apply)</label>
                <div onClick={()=>setCoCountryOpen(o=>!o)}
                  style={{ ...inpStyle, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none', color: coCountry.length ? '#0a0a0a' : '#aaa' }}>
                  {coCountry.length
                    ? coCountry.map(v=>MENA_COUNTRIES_LIST.find(c=>c.v===v)?.l).filter(Boolean).join(', ')
                    : 'Select countries…'}
                  <span style={{ fontSize:10, color:'#aaa', flexShrink:0, marginLeft:6 }}>▼</span>
                </div>
                {coCountryOpen && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, zIndex:50, marginTop:4, maxHeight:220, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,.08)' }}>
                    {MENA_COUNTRIES_LIST.map(c => (
                      <label key={c.v} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 16px', cursor:'pointer', fontSize:14, fontFamily:'Inter,sans-serif' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <input type="checkbox" checked={coCountry.includes(c.v)} onChange={()=>toggleCoCountry(c.v)}
                          style={{ accentColor:'var(--orange)', width:16, height:16, cursor:'pointer' }}/>
                        {c.l}
                      </label>
                    ))}
                    <div style={{ padding:'8px 16px', borderTop:'1px solid #f0f0f0' }}>
                      <button onClick={()=>setCoCountryOpen(false)} style={{ fontSize:12, fontWeight:700, color:'var(--orange)', background:'none', border:'none', cursor:'pointer', padding:0 }}>Done</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isInvFirm && (
              <div style={{ marginBottom:16, position:'relative' }}>
                <label style={labelStyle}>STAGE FOCUS (select all that apply)</label>
                <div onClick={()=>setCoStageOpen(o=>!o)}
                  style={{ ...inpStyle, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none', color: coStages.length ? '#0a0a0a' : '#aaa' }}>
                  {coStages.length ? coStages.join(', ') : 'Select stages…'}
                  <span style={{ fontSize:10, color:'#aaa' }}>▼</span>
                </div>
                {coStageOpen && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:12, zIndex:50, marginTop:4, padding:'8px 0', boxShadow:'0 8px 24px rgba(0,0,0,.08)' }}>
                    {FUNDING_STAGES.map(s => (
                      <label key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', cursor:'pointer', fontSize:14, fontFamily:'Inter,sans-serif' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <input type="checkbox" checked={coStages.includes(s)} onChange={()=>toggleCoStage(s)}
                          style={{ accentColor:'var(--orange)', width:16, height:16, cursor:'pointer' }}/>
                        {s}
                      </label>
                    ))}
                    <div style={{ padding:'8px 16px', borderTop:'1px solid #f0f0f0', marginTop:4 }}>
                      <button onClick={()=>setCoStageOpen(false)} style={{ fontSize:12, fontWeight:700, color:'var(--orange)', background:'none', border:'none', cursor:'pointer', padding:0 }}>Done</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCompany && (
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>TEAM SIZE</label>
                <select value={coTeam} onChange={e=>setCoTeam(e.target.value)} style={selStyle} onFocus={fo} onBlur={bl}>
                  <option value="">Select size</option>
                  {['1–5','6–15','16–30','31–60','61–100','100–250','250+'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>FOUNDED YEAR</label>
              <select value={coFounded} onChange={e=>setCoFounded(e.target.value)} style={selStyle} onFocus={fo} onBlur={bl}>
                <option value="">Select year</option>
                {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {isInvFirm && (
              <div className="settings-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div>
                  <label style={labelStyle}>AUM</label>
                  <input value={coAum} onChange={e=>setCoAum(e.target.value)} placeholder="$50M" style={inpStyle} onFocus={fo} onBlur={bl}/>
                </div>
                <div>
                  <label style={labelStyle}>PORTFOLIO COUNT</label>
                  <input type="number" min="0" value={coPortfolio} onChange={e=>setCoPortfolio(e.target.value)} placeholder="0" style={inpStyle} onFocus={fo} onBlur={bl}/>
                </div>
              </div>
            )}

            {coType === 'Accelerator/Incubator' && (
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>COHORT ALUMNI COUNT</label>
                <input type="number" min="0" value={coPortfolio} onChange={e=>setCoPortfolio(e.target.value)} placeholder="0" style={inpStyle} onFocus={fo} onBlur={bl}/>
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>ABOUT</label>
              <textarea value={coAbout} onChange={e=>setCoAbout(e.target.value)} rows={4}
                placeholder="Describe what your entity does, who it serves, and what makes it unique in the MENA market..."
                style={{ ...inpStyle, resize:'vertical', lineHeight:1.6 }}
                onFocus={fo} onBlur={bl}/>
            </div>

            {!isCompany && (
              <div style={{ marginBottom:20 }}>
                <label style={{ ...labelStyle, display:'flex', alignItems:'center', gap:6 }}>🎯 WHY THIS ENTITY?</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {coWhyReasons.map((reason, idx) => (
                    <div key={idx} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--orange)', color:'#fff', fontSize:12, fontWeight:900, display:'grid', placeItems:'center', flexShrink:0 }}>{idx+1}</div>
                      <input
                        value={reason}
                        onChange={e => { const next=[...coWhyReasons]; next[idx]=e.target.value; setCoWhyReasons(next); }}
                        placeholder={`Reason ${idx+1}...`}
                        style={{ ...inpStyle, flex:1 }} onFocus={fo} onBlur={bl}/>
                      {coWhyReasons.length > 1 && (
                        <button type="button" onClick={() => setCoWhyReasons(prev => prev.filter((_,i)=>i!==idx))}
                          style={{ width:26, height:26, borderRadius:'50%', border:'1.5px solid #e8e8e8', background:'#fff', color:'#aaa', fontSize:14, cursor:'pointer', display:'grid', placeItems:'center', flexShrink:0 }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {coWhyReasons.length < 5 && (
                    <button type="button" onClick={() => setCoWhyReasons(prev => [...prev, ''])}
                      style={{ alignSelf:'flex-start', padding:'7px 14px', borderRadius:10, border:'1.5px dashed #e8e8e8', background:'transparent', fontSize:13, fontWeight:600, color:'#aaa', cursor:'pointer' }}>
                      + Add reason
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>SOCIAL & WEB LINKS</label>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { icon:'🌐', label:'Website',   val:coWebsite,    set:setCoWebsite,   ph:'https://yourcompany.com' },
                  { icon:'💼', label:'LinkedIn',  val:coLinkedIn,   set:setCoLinkedIn,  ph:'https://linkedin.com/company/...' },
                  { icon:'𝕏',  label:'Twitter',   val:coTwitter,    set:setCoTwitter,   ph:'https://twitter.com/...' },
                  { icon:'♪',  label:'TikTok',    val:coTikTok,     set:setCoTikTok,    ph:'https://tiktok.com/@...' },
                  { icon:'📸', label:'Instagram', val:coInstagram,  set:setCoInstagram, ph:'https://instagram.com/...' },
                ].map(lk => (
                  <div key={lk.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'#f5f5f5', display:'grid', placeItems:'center', fontSize:16, flexShrink:0 }}>{lk.icon}</div>
                    <input value={lk.val} onChange={e=>lk.set(e.target.value)} placeholder={lk.ph}
                      style={{ ...inpStyle, flex:1 }} onFocus={fo} onBlur={bl}/>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleCoSubmit} disabled={coSaving || !coName.trim() || !coType}
              style={{ padding:'12px 28px', borderRadius:12, background:(coName.trim()&&coType)?'var(--orange)':'#e8e8e8', color:(coName.trim()&&coType)?'#fff':'#aaa', border:'none', fontSize:14, fontWeight:700, cursor:(coName.trim()&&coType)?'pointer':'not-allowed', transition:'all .15s' }}>
              {coSaving ? 'Submitting…' : 'Submit Entity for Review'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
