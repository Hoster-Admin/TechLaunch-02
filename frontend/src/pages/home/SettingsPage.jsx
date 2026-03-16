import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/home/Footer';
import { useAuth } from '../../context/AuthContext';
import { productsAPI, entitiesAPI, communityAPI, usersAPI } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { NAV_ITEMS, PERSONAS, WORLD_DIALS, WORLD_COUNTRIES, MENA_COUNTRIES_LIST, DRAFT_KEY } from '../../components/settings/settingsConstants';
import SecurityTab from '../../components/settings/SecurityTab';
import ProfileTab  from '../../components/settings/ProfileTab';
import ProductsTab from '../../components/settings/ProductsTab';
import DraftsTab   from '../../components/settings/DraftsTab';
import AppliedTab  from '../../components/settings/AppliedTab';
import MessagesTab from '../../components/settings/MessagesTab';
import CompanyTab  from '../../components/settings/CompanyTab';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab,         setActiveTab]         = useState('profile');
  const [copied,            setCopied]            = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [showSubmitForm,    setShowSubmitForm]    = useState(false);
  const [submitDraft,       setSubmitDraft]       = useState(null);
  const [myProducts,        setMyProducts]        = useState(null);
  const [myProductsLoading, setMyProductsLoading] = useState(false);
  const [localDraft,        setLocalDraft]        = useState(() => {
    try { const d = localStorage.getItem(DRAFT_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
  });

  const [name,     setName]     = useState(user?.name      || '');
  const [handle,   setHandle]   = useState((user?.handle || '').replace('@',''));
  const [headline, setHeadline] = useState(user?.headline  || '');
  const [bio,      setBio]      = useState(user?.bio       || '');
  const [phone,    setPhone]    = useState(user?.phone     || '');
  const [dialCode, setDialCode] = useState(WORLD_DIALS.find(x=>x.c==='sa') || WORLD_DIALS[0]);
  const [countryVal, setCountryVal] = useState('');
  const [cityVal,    setCityVal]    = useState('');
  const [persona,    setPersona]    = useState(user?.persona || 'Founder');
  const [website,    setWebsite]    = useState(user?.website  || '');
  const [twitter,    setTwitter]    = useState(user?.twitter  || '');
  const [linkedin,   setLinkedin]   = useState(user?.linkedin || '');
  const [github,     setGithub]     = useState(user?.github   || '');

  const [activeThread,    setActiveThread]    = useState(null);
  const [msgInput,        setMsgInput]        = useState('');
  const [threads,         setThreads]         = useState([]);
  const [settingsMsgs,    setSettingsMsgs]    = useState([]);
  const [settingsSending, setSettingsSending] = useState(false);
  const [myDrafts,        setMyDrafts]        = useState(null);
  const [draftsLoading,   setDraftsLoading]   = useState(false);
  const [editDraft,       setEditDraft]       = useState(null);

  const [bmSaved,        setBmSaved]        = useState(null);
  const [bmLoading,      setBmLoading]      = useState(false);
  const [activeBmTab,    setActiveBmTab]    = useState('saved');
  const settingsMsgScrollRef = useRef(null);

  const [assocQ,        setAssocQ]        = useState('');
  const [assocResults,  setAssocResults]  = useState([]);
  const [assocSelected, setAssocSelected] = useState(null);
  const [assocSaving,   setAssocSaving]   = useState(false);
  const [assocCurrent,  setAssocCurrent]  = useState(user?.entity_name || null);

  const fileInputRef = useRef(null);
  const cropImgRef   = useRef(null);
  const [avatarImg,     setAvatarImg]     = useState(() => {
    try { return user?.avatar_url || localStorage.getItem(`tlm_avatar_${user?.id}`) || null; } catch { return user?.avatar_url || null; }
  });
  const [cropSrc,       setCropSrc]       = useState(null);
  const [crop,          setCrop]          = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [cropSaving,    setCropSaving]    = useState(false);

  const [coType,       setCoType]       = useState('');
  const [coName,       setCoName]       = useState('');
  const [coLogoImg,    setCoLogoImg]    = useState(null);
  const [coIndustry,   setCoIndustry]   = useState('');
  const [coCountry,    setCoCountry]    = useState([]);
  const [coCountryOpen,setCoCountryOpen]= useState(false);
  const [coStages,     setCoStages]     = useState([]);
  const [coAbout,      setCoAbout]      = useState('');
  const [coWebsite,    setCoWebsite]    = useState('');
  const [coLinkedIn,   setCoLinkedIn]   = useState('');
  const [coTwitter,    setCoTwitter]    = useState('');
  const [coTikTok,     setCoTikTok]     = useState('');
  const [coInstagram,  setCoInstagram]  = useState('');
  const [coTeam,       setCoTeam]       = useState('');
  const [coFounded,    setCoFounded]    = useState('');
  const [coAum,        setCoAum]        = useState('');
  const [coPortfolio,  setCoPortfolio]  = useState('');
  const [coWhyReasons, setCoWhyReasons] = useState(['']);
  const [coStageOpen,  setCoStageOpen]  = useState(false);
  const [coSubmitted,  setCoSubmitted]  = useState(false);
  const [coSaving,     setCoSaving]     = useState(false);

  const getToken = () => { try { return localStorage.getItem('accessToken'); } catch { return null; } };

  const searchAssocEntities = async (q) => {
    setAssocQ(q);
    if (!q.trim()) { setAssocResults([]); return; }
    try {
      const r = await fetch(`/api/entities?search=${encodeURIComponent(q)}&limit=8`);
      const d = await r.json();
      if (d.success) setAssocResults(d.data || []);
    } catch {}
  };

  const saveEntityAssoc = async () => {
    if (!assocSelected) return;
    setAssocSaving(true);
    try {
      const r = await fetch('/api/users/me/entity', {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${getToken()}` },
        body: JSON.stringify({ entity_name: assocSelected.name }),
      });
      const d = await r.json();
      if (d.success) { setAssocCurrent(assocSelected.name); setAssocSelected(null); setAssocQ(''); setAssocResults([]); toast.success('Entity linked to your profile!'); }
      else toast.error(d.message || 'Could not link entity');
    } catch { toast.error('Something went wrong'); }
    finally { setAssocSaving(false); }
  };

  const removeEntityAssoc = async () => {
    setAssocSaving(true);
    try {
      const r = await fetch('/api/users/me/entity', {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${getToken()}` },
        body: JSON.stringify({ entity_name: '' }),
      });
      const d = await r.json();
      if (d.success) { setAssocCurrent(null); toast.success('Entity unlinked'); }
    } catch {}
    finally { setAssocSaving(false); }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setCropSrc(ev.target.result); setCrop(undefined); setCompletedCrop(null); };
    reader.readAsDataURL(file);
  };

  const onCropImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const c = centerCrop(makeAspectCrop({ unit:'%', width:80 }, 1, w, h), w, h);
    setCrop(c);
  };

  const saveCroppedAvatar = async () => {
    if (!completedCrop || !cropImgRef.current) return;
    setCropSaving(true);
    try {
      const img    = cropImgRef.current;
      const scaleX = img.naturalWidth  / img.width;
      const scaleY = img.naturalHeight / img.height;
      const canvas = document.createElement('canvas');
      const size   = 400;
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, size, size);
      const base64 = canvas.toDataURL('image/jpeg', 0.88);
      setAvatarImg(base64);
      setCropSrc(null);
      try { localStorage.setItem(`tlm_avatar_${user.id}`, base64); } catch {}
      const res = await api.put('/users/me', { avatar_url: base64 });
      if (res.data?.success) { updateUser({ avatar_url: base64 }); toast.success('Profile photo updated!'); }
    } catch { toast.error('Failed to save photo. Please try again.'); }
    finally { setCropSaving(false); }
  };

  const handleCoLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setCoLogoImg(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const toggleCoStage   = (s) => setCoStages  (prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s]);
  const toggleCoCountry = (v) => setCoCountry (prev => prev.includes(v) ? prev.filter(x=>x!==v) : [...prev, v]);

  const handleCoSubmit = async () => {
    if (!coType) { toast.error('Please select an entity type'); return; }
    if (!coName.trim()) { toast.error('Entity name is required'); return; }
    setCoSaving(true);
    try {
      const typeMap = { 'Company':'startup', 'Accelerator/Incubator':'accelerator', 'Venture Studio':'venture_studio', 'Investment Firm':'investor' };
      const countryLabel = coCountry.length > 0 ? (MENA_COUNTRIES_LIST.find(c => c.v === coCountry[0])?.l?.replace(/^[\S]+ /,'') || coCountry[0]) : null;
      const filledReasons = coWhyReasons.map(r=>r.trim()).filter(Boolean);
      await entitiesAPI.create({
        name: coName.trim(), type: typeMap[coType] || 'startup', description: coAbout || null,
        website: coWebsite || null, country: countryLabel, industry: coIndustry || null,
        stage: coStages.length > 0 ? coStages.join(', ') : null, employees: coTeam || null,
        founded_year: coFounded ? parseInt(coFounded) : null, focus: null, logo_emoji: '🏢',
        logo_url: coLogoImg || null, linkedin: coLinkedIn || null, twitter: coTwitter || null,
        why_us: filledReasons.length ? JSON.stringify(filledReasons) : null,
        aum: coAum || null, portfolio_count: coPortfolio ? parseInt(coPortfolio) : null,
      });
      setCoSaving(false);
      setCoSubmitted(true);
      toast.success('Entity submitted for review!');
    } catch (err) {
      setCoSaving(false);
      toast.error(err?.response?.data?.message || 'Something went wrong, please try again.');
    }
  };

  if (!user) { navigate('/login'); return null; }

  const initials    = user.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
  const personaObj  = PERSONAS.find(p=>p.v===persona) || PERSONAS[0];
  const handleClean = handle.replace('@','');

  const handleCopy = () => {
    navigator.clipboard?.writeText(`tlmena.com/${handleClean}`).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 1800);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r=>setTimeout(r,600));
      updateUser({ name, headline, bio, website, twitter, linkedin, github, persona, country:countryVal, city:cityVal });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const handleTabNav = (key) => {
    setActiveTab(key);
  };

  const loadSettingsThreads = useCallback(async () => {
    try {
      const res = await api.get('/messages/threads');
      if (res.data?.success) setThreads(res.data.data);
    } catch {}
  }, []);

  const loadSettingsMessages = useCallback(async (handle) => {
    if (!handle) return;
    try {
      const res = await api.get(`/messages/${handle}`);
      if (res.data?.success) setSettingsMsgs(res.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') loadSettingsThreads();
  }, [activeTab, loadSettingsThreads]);

  useEffect(() => {
    if ((activeTab === 'products' || activeTab === 'bookmarks') && user?.id && myProducts === null) {
      setMyProductsLoading(true);
      productsAPI.list({ submitter: user.id, status: 'all', limit: 50 })
        .then(({ data: d }) => setMyProducts(Array.isArray(d.data) ? d.data : []))
        .catch(() => setMyProducts([]))
        .finally(() => setMyProductsLoading(false));
    }
  }, [activeTab, user, myProducts]);

  useEffect(() => {
    if (activeTab === 'drafts' && myDrafts === null) {
      setDraftsLoading(true);
      communityAPI.myDrafts()
        .then(({ data: d }) => setMyDrafts(Array.isArray(d.data) ? d.data : []))
        .catch(() => setMyDrafts([]))
        .finally(() => setDraftsLoading(false));
    }
  }, [activeTab, myDrafts]);

  useEffect(() => {
    if (activeTab === 'bookmarks' && bmSaved === null) {
      setBmLoading(true);
      usersAPI.bookmarks()
        .then(r => setBmSaved(r.data?.data || r.data || []))
        .catch(() => setBmSaved([]))
        .finally(() => setBmLoading(false));
    }
  }, [activeTab, bmSaved]);

  useEffect(() => {
    if (activeThread) loadSettingsMessages(activeThread);
  }, [activeThread, loadSettingsMessages]);

  useEffect(() => {
    if (settingsMsgScrollRef.current) settingsMsgScrollRef.current.scrollTop = settingsMsgScrollRef.current.scrollHeight;
  }, [settingsMsgs]);

  const sendMsg = async () => {
    if (!msgInput.trim() || !activeThread || settingsSending) return;
    const text = msgInput.trim(); setMsgInput('');
    setSettingsSending(true);
    try {
      await api.post(`/messages/${activeThread}`, { body: text });
      await loadSettingsMessages(activeThread);
      await loadSettingsThreads();
    } catch { setMsgInput(text); } finally { setSettingsSending(false); }
  };

  const currentThread = threads.find(t => t.handle === activeThread);

  return (
    <>
      <Navbar/>
      <style>{`
        .settings-form-grid { grid-template-columns: repeat(2,1fr); }
        .settings-persona-grid { grid-template-columns: repeat(3,1fr); }
        @media(max-width:768px){
          .settings-form-grid { grid-template-columns:1fr !important; }
          .settings-persona-grid { grid-template-columns:repeat(2,1fr) !important; }
        }
        @media(max-width:480px){
          .settings-persona-grid { grid-template-columns:repeat(2,1fr) !important; }
        }
      `}</style>
      <div style={{ paddingTop:'var(--nav-h)', minHeight:'100vh', background:'#f8f8f8' }}>
        <div className="settings-layout" style={{ maxWidth:1000, margin:'0 auto', padding:'32px 32px 80px', display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* Sidebar nav */}
          <div className="settings-sidebar" style={{ width:190, flexShrink:0, background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, overflow:'hidden', position:'sticky', top:'calc(var(--nav-h) + 20px)' }}>
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={()=>handleTabNav(item.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'13px 16px', border:'none', borderBottom:'1px solid #f4f4f4', background:activeTab===item.key?'var(--orange-light)':'#fff', color:activeTab===item.key?'var(--orange)':'#444', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'DM Sans,sans-serif', transition:'background .12s,color .12s' }}>
                <span style={{ fontSize:16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="settings-content-wrap" style={{ flex:1, minWidth:0 }}>
            {activeTab === 'profile' && (
              <ProfileTab
                user={user} navigate={navigate} initials={initials} personaObj={personaObj} handleClean={handleClean}
                avatarImg={avatarImg} fileInputRef={fileInputRef} cropImgRef={cropImgRef}
                cropSrc={cropSrc} crop={crop} completedCrop={completedCrop} cropSaving={cropSaving}
                setCropSrc={setCropSrc} setCrop={setCrop} setCompletedCrop={setCompletedCrop}
                handleAvatarUpload={handleAvatarUpload} onCropImageLoad={onCropImageLoad} saveCroppedAvatar={saveCroppedAvatar}
                copied={copied} handleCopy={handleCopy}
                name={name} setName={setName} handle={handle} setHandle={setHandle}
                headline={headline} setHeadline={setHeadline} bio={bio} setBio={setBio}
                phone={phone} setPhone={setPhone} dialCode={dialCode} setDialCode={setDialCode}
                countryVal={countryVal} setCountryVal={setCountryVal} cityVal={cityVal} setCityVal={setCityVal}
                persona={persona} setPersona={setPersona}
                website={website} setWebsite={setWebsite} twitter={twitter} setTwitter={setTwitter}
                linkedin={linkedin} setLinkedin={setLinkedin} github={github} setGithub={setGithub}
                handleSave={handleSave} saving={saving}
              />
            )}

            {activeTab === 'products' && (
              <ProductsTab
                user={user}
                showSubmitForm={showSubmitForm} setShowSubmitForm={setShowSubmitForm}
                submitDraft={submitDraft} setSubmitDraft={setSubmitDraft}
                localDraft={localDraft} setLocalDraft={setLocalDraft}
                myProducts={myProducts} myProductsLoading={myProductsLoading}
              />
            )}

            {activeTab === 'drafts' && (
              <DraftsTab
                myDrafts={myDrafts} setMyDrafts={setMyDrafts}
                draftsLoading={draftsLoading}
                editDraft={editDraft} setEditDraft={setEditDraft}
              />
            )}

            {activeTab === 'applied' && <AppliedTab/>}

            {activeTab === 'messages' && (
              <MessagesTab
                threads={threads} activeThread={activeThread} setActiveThread={setActiveThread}
                user={user} settingsMsgs={settingsMsgs}
                msgInput={msgInput} setMsgInput={setMsgInput}
                sendMsg={sendMsg} settingsSending={settingsSending}
                settingsMsgScrollRef={settingsMsgScrollRef} currentThread={currentThread}
              />
            )}

            {activeTab === 'bookmarks' && (
              <div>
                <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16, color:'#111' }}>Bookmarks</h2>
                <div style={{ display:'flex', gap:0, borderBottom:'2px solid #f0f0f0', marginBottom:20, overflowX:'auto' }}>
                  {[{key:'saved',label:'Products Saved'},{key:'applied',label:'Applied'},{key:'myproducts',label:'My Products'}].map(t=>(
                    <button key={t.key} onClick={()=>setActiveBmTab(t.key)}
                      style={{ padding:'10px 18px', background:'none', border:'none', borderBottom: activeBmTab===t.key ? '2px solid var(--orange)' : '2px solid transparent', color: activeBmTab===t.key ? 'var(--orange)' : '#555', fontWeight:600, fontSize:13, cursor:'pointer', whiteSpace:'nowrap', marginBottom:'-2px', fontFamily:'DM Sans,sans-serif' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {activeBmTab === 'saved' && (
                  bmLoading ? <div style={{textAlign:'center',padding:40,color:'#999'}}>Loading…</div> :
                  !bmSaved || bmSaved.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'40px 20px' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>🔖</div>
                      <div style={{ fontWeight:600, color:'#333', marginBottom:6 }}>No saved products yet</div>
                      <div style={{ color:'#888', fontSize:13 }}>Browse products and click the bookmark icon to save them here.</div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {bmSaved.map(p => (
                        <div key={p.id} onClick={()=>navigate(`/products/${p.slug||p.id}`)}
                          style={{ display:'flex', gap:14, alignItems:'center', background:'#fff', border:'1px solid #eee', borderRadius:12, padding:'12px 16px', cursor:'pointer', transition:'box-shadow .15s' }}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.08)'}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                          <img src={p.logo_url||p.icon_url||'/placeholder.png'} alt={p.name}
                            style={{ width:44, height:44, borderRadius:10, objectFit:'cover', border:'1px solid #eee' }}
                            onError={e=>{e.target.src='/placeholder.png';}}/>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:'#111', marginBottom:2 }}>{p.name}</div>
                            <div style={{ fontSize:12, color:'#666', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.tagline||p.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
                {activeBmTab === 'applied' && <AppliedTab/>}
                {activeBmTab === 'myproducts' && (
                  myProductsLoading ? <div style={{textAlign:'center',padding:40,color:'#999'}}>Loading…</div> :
                  !myProducts || myProducts.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'40px 20px' }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>🚀</div>
                      <div style={{ fontWeight:600, color:'#333', marginBottom:6 }}>No products yet</div>
                      <div style={{ color:'#888', fontSize:13 }}>Products you submit will appear here.</div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {myProducts.map(p => (
                        <div key={p.id} onClick={()=>navigate(`/products/${p.slug||p.id}`)}
                          style={{ display:'flex', gap:14, alignItems:'center', background:'#fff', border:'1px solid #eee', borderRadius:12, padding:'12px 16px', cursor:'pointer', transition:'box-shadow .15s' }}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.08)'}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                          <img src={p.logo_url||p.icon_url||'/placeholder.png'} alt={p.name}
                            style={{ width:44, height:44, borderRadius:10, objectFit:'cover', border:'1px solid #eee' }}
                            onError={e=>{e.target.src='/placeholder.png';}}/>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:'#111', marginBottom:2 }}>{p.name}</div>
                            <div style={{ fontSize:12, color:'#666', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.tagline||p.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'security' && <SecurityTab/>}

            {activeTab === 'company' && (
              <CompanyTab
                assocQ={assocQ} assocResults={assocResults} assocSelected={assocSelected}
                assocCurrent={assocCurrent} assocSaving={assocSaving}
                searchAssocEntities={searchAssocEntities} saveEntityAssoc={saveEntityAssoc}
                removeEntityAssoc={removeEntityAssoc}
                setAssocSelected={setAssocSelected} setAssocQ={setAssocQ} setAssocResults={setAssocResults}
                coType={coType} setCoType={setCoType} coName={coName} setCoName={setCoName}
                coLogoImg={coLogoImg} setCoLogoImg={setCoLogoImg}
                coIndustry={coIndustry} setCoIndustry={setCoIndustry}
                coCountry={coCountry} setCoCountry={setCoCountry}
                coCountryOpen={coCountryOpen} setCoCountryOpen={setCoCountryOpen}
                coStages={coStages} setCoStages={setCoStages}
                coAbout={coAbout} setCoAbout={setCoAbout}
                coWebsite={coWebsite} setCoWebsite={setCoWebsite}
                coLinkedIn={coLinkedIn} setCoLinkedIn={setCoLinkedIn}
                coTwitter={coTwitter} setCoTwitter={setCoTwitter}
                coTikTok={coTikTok} setCoTikTok={setCoTikTok}
                coInstagram={coInstagram} setCoInstagram={setCoInstagram}
                coTeam={coTeam} setCoTeam={setCoTeam}
                coFounded={coFounded} setCoFounded={setCoFounded}
                coAum={coAum} setCoAum={setCoAum}
                coPortfolio={coPortfolio} setCoPortfolio={setCoPortfolio}
                coWhyReasons={coWhyReasons} setCoWhyReasons={setCoWhyReasons}
                coStageOpen={coStageOpen} setCoStageOpen={setCoStageOpen}
                coSubmitted={coSubmitted} setCoSubmitted={setCoSubmitted}
                coSaving={coSaving}
                handleCoLogoUpload={handleCoLogoUpload}
                toggleCoStage={toggleCoStage} toggleCoCountry={toggleCoCountry}
                handleCoSubmit={handleCoSubmit}
              />
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
