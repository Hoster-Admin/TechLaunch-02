import React from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { SearchDD, GlobeIcon, XIcon, LinkedInIcon, GitHubIcon, IconBox } from './SettingsShared';
import { WORLD_DIALS, WORLD_COUNTRIES, PERSONAS, labelStyle, inputStyle } from './settingsConstants';

export default function ProfileTab({
  user, navigate, initials, personaObj, handleClean,
  avatarImg, fileInputRef, cropImgRef, cropSrc, crop, completedCrop, cropSaving,
  setCropSrc, setCrop, setCompletedCrop, handleAvatarUpload, onCropImageLoad, saveCroppedAvatar,
  copied, handleCopy,
  name, setName, handle, setHandle, headline, setHeadline, bio, setBio,
  phone, setPhone, dialCode, setDialCode,
  countryVal, setCountryVal, cityVal, setCityVal,
  persona, setPersona,
  website, setWebsite, twitter, setTwitter, linkedin, setLinkedin, github, setGithub,
  handleSave, saving,
}) {
  return (
    <>
      {/* Profile preview card */}
      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, overflow:'hidden', marginBottom:20 }}>
        <div style={{ height:110, background:'linear-gradient(135deg,#0a0a0a 0%,#E15033 100%)', position:'relative' }}>
          <button onClick={()=>navigate(`/u/${handleClean}`)}
            style={{ position:'absolute', top:14, right:14, padding:'7px 14px', borderRadius:10, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview Profile
          </button>
        </div>
        <div style={{ padding:'0 24px 24px', position:'relative' }}>
          <div style={{ position:'relative', display:'inline-block', marginTop:-36, marginBottom:10 }}>
            {avatarImg ? (
              <img src={avatarImg} alt="avatar" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,.15)', display:'block' }}/>
            ) : (
              <div style={{ width:72, height:72, borderRadius:'50%', background:user.avatar_color||'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:22, fontWeight:900, border:'4px solid #fff', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>{initials}</div>
            )}
            <button onClick={() => fileInputRef.current?.click()} style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'#fff', border:'2px solid #e8e8e8', display:'grid', placeItems:'center', cursor:'pointer' }} title="Upload photo">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarUpload}/>
          </div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:3 }}>{user.name}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:13, color:'var(--orange)', fontWeight:600 }}>tlmena.com/{handleClean}</span>
            <button onClick={handleCopy} style={{ padding:'2px 8px', borderRadius:6, background:'#f4f4f4', border:'none', cursor:'pointer', fontSize:11, fontWeight:700, color:'#555', display:'flex', alignItems:'center', gap:4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {headline && <div style={{ fontSize:13, color:'#666', marginBottom:10 }}>{headline}</div>}
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--orange-light)', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, color:'var(--orange)' }}>
            {personaObj.icon} {personaObj.v.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>🪪 Identity</div>
        <div className="settings-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={labelStyle}>FULL NAME</label>
            <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex' }}
              onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="Your full name"/>
            </div>
          </div>
          <div>
            <label style={labelStyle}>HANDLE</label>
            <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex', alignItems:'center', overflow:'hidden' }}
              onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
              <span style={{ padding:'10px 10px 10px 14px', fontSize:13, color:'#aaa', background:'#fafafa', borderRight:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>tlmena.com/</span>
              <input type="text" value={handleClean} onChange={e=>setHandle(e.target.value.replace(/[^a-z0-9_]/gi,'').toLowerCase())} style={inputStyle} placeholder="yourhandle"/>
            </div>
          </div>
        </div>
        <div className="settings-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={labelStyle}>PHONE NUMBER</label>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flexShrink:0 }}>
                <SearchDD value={dialCode?.c}
                  onChange={item => setDialCode(item)}
                  items={WORLD_DIALS}
                  matchFn={(item, q) => item.n.toLowerCase().includes(q.toLowerCase()) || item.d.includes(q)}
                  renderTrigger={() => dialCode ? `${dialCode.f} ${dialCode.d}` : '🌐'}
                  renderItem={item => `${item.f} ${item.d}  ${item.n}`}/>
              </div>
              <div style={{ flex:1, border:'1.5px solid #e8e8e8', borderRadius:10, display:'flex' }}>
                <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="5X XXX XXXX" style={inputStyle}/>
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>EMAIL</label>
            <div style={{ border:'1.5px solid #f0f0f0', borderRadius:10, background:'#fafafa', display:'flex' }}>
              <input type="email" value={user.email||''} disabled style={{ ...inputStyle, color:'#aaa', cursor:'not-allowed' }}/>
            </div>
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>HEADLINE</label>
          <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex' }}
            onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
            <input type="text" value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="e.g. Founder @ Tabby · Fintech · UAE" style={inputStyle}/>
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>BIO</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value)}
            placeholder="Passionate about connecting builders, investors and innovators across the Arab world."
            rows={4}
            style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e8e8e8', borderRadius:10, fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', color:'#0a0a0a', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }}
            onFocus={e=>e.target.style.borderColor='var(--orange)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
        </div>
        <div className="settings-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={labelStyle}>PERSONA</label>
            <SearchDD value={persona}
              onChange={item => setPersona(item.v)}
              items={PERSONAS}
              matchFn={(item, q) => item.v.toLowerCase().includes(q.toLowerCase())}
              renderTrigger={(val) => {
                const p = PERSONAS.find(x=>x.v===val);
                return p ? `${p.icon} ${p.v}` : 'Select persona…';
              }}
              renderItem={item => `${item.icon} ${item.v}`}/>
          </div>
          <div>
            <label style={labelStyle}>COUNTRY</label>
            <SearchDD value={countryVal}
              onChange={item => setCountryVal(item.v)}
              items={WORLD_COUNTRIES}
              matchFn={(item, q) => item.l.toLowerCase().includes(q.toLowerCase())}
              renderTrigger={(val) => {
                const c = WORLD_COUNTRIES.find(x=>x.v===val);
                return c ? c.l : 'Select country…';
              }}
              renderItem={item => item.l}/>
          </div>
        </div>
        <div>
          <label style={labelStyle}>CITY</label>
          <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, background:'#fff', display:'flex' }}
            onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'} tabIndex={-1}>
            <input type="text" value={cityVal} onChange={e=>setCityVal(e.target.value)} placeholder="e.g. Dubai, Cairo, Riyadh…" style={inputStyle}
              onFocus={e=>e.currentTarget.parentElement.style.borderColor='var(--orange)'}
              onBlur={e=>e.currentTarget.parentElement.style.borderColor='#e8e8e8'}/>
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'24px 28px', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, marginBottom:20, color:'#0a0a0a' }}>🔗 Links</div>
        <div style={{ display:'grid', gap:14 }}>
          {[
            { label:'WEBSITE',    value:website,  setter:setWebsite,  placeholder:'https://yoursite.com', Icon:GlobeIcon },
            { label:'TWITTER / X',value:twitter,  setter:setTwitter,  placeholder:'@handle',              Icon:XIcon },
            { label:'LINKEDIN',   value:linkedin, setter:setLinkedin, placeholder:'linkedin.com/in/handle',Icon:LinkedInIcon },
            { label:'GITHUB',     value:github,   setter:setGithub,   placeholder:'github.com/username',  Icon:GitHubIcon },
          ].map(field => (
            <div key={field.label}>
              <label style={labelStyle}>{field.label}</label>
              <div style={{ border:'1.5px solid #e8e8e8', borderRadius:10, display:'flex', alignItems:'center', overflow:'hidden' }}
                onFocus={e=>e.currentTarget.style.borderColor='var(--orange)'}
                onBlur={e=>e.currentTarget.style.borderColor='#e8e8e8'}
                tabIndex={-1}>
                <IconBox><field.Icon/></IconBox>
                <input type="text" value={field.value} onChange={e=>field.setter(e.target.value)} placeholder={field.placeholder}
                  style={inputStyle} onFocus={e=>e.currentTarget.parentElement.style.borderColor='var(--orange)'} onBlur={e=>e.currentTarget.parentElement.style.borderColor='#e8e8e8'}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
        <button onClick={()=>navigate(`/u/${handleClean}`)} style={{ padding:'11px 22px', borderRadius:12, background:'#fff', border:'1.5px solid #e8e8e8', color:'#555', fontSize:14, fontWeight:700, cursor:'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding:'11px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Avatar Crop Modal */}
      {cropSrc && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setCropSrc(null); }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, maxWidth:520, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.4)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800 }}>Crop your photo</div>
                <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>Drag and resize the circle to crop</div>
              </div>
              <button onClick={() => setCropSrc(null)}
                style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f4f4f4', cursor:'pointer', fontSize:16, display:'grid', placeItems:'center' }}>✕</button>
            </div>
            <div style={{ display:'flex', justifyContent:'center', maxHeight:400, overflow:'auto' }}>
              <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop style={{ maxWidth:'100%' }}>
                <img ref={cropImgRef} src={cropSrc} onLoad={onCropImageLoad} style={{ maxWidth:'100%', maxHeight:360, display:'block' }} alt="crop preview"/>
              </ReactCrop>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setCropSrc(null)}
                style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', color:'#555' }}>
                Cancel
              </button>
              <button onClick={saveCroppedAvatar} disabled={!completedCrop || cropSaving}
                style={{ padding:'10px 24px', borderRadius:10, border:'none', background:completedCrop&&!cropSaving?'var(--orange)':'#ccc', color:'#fff', fontSize:13, fontWeight:700, cursor:completedCrop&&!cropSaving?'pointer':'not-allowed' }}>
                {cropSaving ? 'Saving…' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
