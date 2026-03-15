import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, EmptyState } from './shared.jsx';
import { useAuth } from '../App.jsx';

function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.min(4, local.length - visible.length))}@${domain}`;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:28,width:440,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:800,color:'#0A0A0A'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#AAAAAA',lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5}}>{label}</label>
      {children}
    </div>
  );
}

const inputS = {width:'100%',border:'1px solid #E8E8E8',borderRadius:8,padding:'8px 10px',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:'#FAFAFA'};
const selectS = {...inputS,cursor:'pointer'};

function Toggle({ checked, onChange }) {
  return (
    <label style={{position:'relative',display:'inline-block',width:42,height:24,cursor:'pointer'}}>
      <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0}}/>
      <span style={{position:'absolute',inset:0,background:checked?'var(--orange)':'#E8E8E8',borderRadius:99,transition:'.2s'}}/>
      <span style={{position:'absolute',left:checked?20:2,top:2,width:20,height:20,background:'#fff',borderRadius:'50%',transition:'.2s',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}/>
    </label>
  );
}

// ─── TAG MANAGEMENT SECTION ──────────────────────────────────────────────────
const CATEGORIES = [
  { key:'role',    label:'Role Tags',    icon:'🎭', settingKey:'tags_role_enabled',    desc:'Automatically shown based on user role (Admin, Moderator, etc.)' },
  { key:'user',    label:'User Tags',    icon:'👤', settingKey:'tags_user_enabled',    desc:'Labels assigned to user profiles' },
  { key:'product', label:'Product Tags', icon:'🚀', settingKey:'tags_product_enabled', desc:'Labels assigned to product listings' },
  { key:'post',    label:'Post Tags',    icon:'✏️', settingKey:'tags_post_enabled',    desc:'Labels shown on posts in the launcher feed' },
  { key:'article', label:'Article Tags', icon:'📰', settingKey:'tags_article_enabled', desc:'Labels shown on articles and blog posts' },
];

const PRESET_COLORS = [
  { bg:'#FEF3C7', text:'#92400E' },
  { bg:'#FEE2E2', text:'#991B1B' },
  { bg:'#EDE9FE', text:'#5B21B6' },
  { bg:'#DBEAFE', text:'#1E40AF' },
  { bg:'#D1FAE5', text:'#065F46' },
  { bg:'#F3E8FF', text:'#6B21A8' },
  { bg:'#FCE7F3', text:'#9D174D' },
  { bg:'#E8E8E8', text:'#374151' },
  { bg:'#FED7AA', text:'#9A3412' },
  { bg:'#CCFBF1', text:'#0F766E' },
];

function TagPill({ tag }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 10px', borderRadius:20,
      background:tag.color||'#E8E8E8', color:tag.text_color||'#374151',
      fontSize:12, fontWeight:700, opacity:tag.is_active?1:0.4,
    }}>
      {tag.name}
    </span>
  );
}

function EditTagModal({ tag, onSave, onClose }) {
  const [form, setForm] = useState({ name: tag.name, color: tag.color || '#FEF3C7', text_color: tag.text_color || '#92400E' });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Tag name is required');
    setSaving(true);
    try { await onSave(tag.id, form); }
    finally { setSaving(false); }
  };
  return (
    <Modal title="Edit Tag" onClose={onClose}>
      <div style={{marginBottom:14}}>
        <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:5}}>Tag Name</label>
        <input style={inputS} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
          onKeyDown={e=>e.key==='Enter'&&handleSave()} autoFocus/>
      </div>
      <div style={{marginBottom:20}}>
        <label style={{display:'block',fontSize:11,fontWeight:700,color:'#666',marginBottom:8}}>Color</label>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
          {PRESET_COLORS.map((c,i) => (
            <button key={i} onClick={() => setForm(f=>({...f,color:c.bg,text_color:c.text}))}
              style={{width:22,height:22,borderRadius:6,background:c.bg,border:form.color===c.bg?'2px solid #0A0A0A':'1.5px solid rgba(0,0,0,.1)',cursor:'pointer',padding:0}}/>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:11,color:'#888'}}>Preview:</span>
          <TagPill tag={{name:form.name||'Tag',color:form.color,text_color:form.text_color,is_active:true}}/>
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={handleSave} disabled={saving}
          style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>
          {saving?'Saving…':'Save Changes'}
        </button>
        <button onClick={onClose}
          style={{padding:'10px 16px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

const USER_TAG_RULES = {
  'top creator': '50+ posts · 35+ comments · 5+ articles',
  'verified':    'Name, bio, headline, country, avatar & verified email',
};

function TagManagement({ settings, onSettingChange, isAdmin }) {
  const [activeTab, setActiveTab] = useState('role');
  const [tags, setTags]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newTag, setNewTag]       = useState({ name:'', color:'#FEF3C7', text_color:'#92400E' });
  const [saving, setSaving]       = useState(false);
  const [editTag, setEditTag]     = useState(null);
  const [assigning, setAssigning] = useState(false);

  const loadTags = useCallback(() => {
    adminAPI.tags()
      .then(r => setTags(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  const activeCat = CATEGORIES.find(c => c.key === activeTab);
  const catTags   = tags.filter(t => t.category === activeTab);

  const handleToggleTag = async (tag) => {
    if (!isAdmin) return toast.error('Admin only');
    const updated = tags.map(t => t.id === tag.id ? { ...t, is_active: !t.is_active } : t);
    setTags(updated);
    try {
      await adminAPI.updateTag(tag.id, { is_active: !tag.is_active });
    } catch(e) {
      setTags(tags);
      toast.error(e.message || 'Failed to update');
    }
  };

  const handleDeleteTag = async (tag) => {
    if (!isAdmin) return toast.error('Admin only');
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    setTags(t => t.filter(x => x.id !== tag.id));
    try {
      await adminAPI.deleteTag(tag.id);
      toast.success('Tag deleted');
    } catch(e) {
      loadTags();
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleEditSave = async (id, form) => {
    try {
      const { data: d } = await adminAPI.updateTag(id, { name: form.name, color: form.color, text_color: form.text_color });
      setTags(t => t.map(x => x.id === id ? d.data : x));
      setEditTag(null);
      toast.success('Tag updated');
    } catch(e) { toast.error(e.message || 'Failed to update tag'); }
  };

  const handleAddTag = async () => {
    if (!isAdmin) return toast.error('Admin only');
    if (!newTag.name.trim()) return toast.error('Tag name is required');
    setSaving(true);
    try {
      const { data: d } = await adminAPI.createTag({ ...newTag, category: activeTab });
      setTags(t => [...t, d.data]);
      setNewTag({ name:'', color:'#FEF3C7', text_color:'#92400E' });
      toast.success('Tag created');
    } catch(e) { toast.error(e.message || 'Failed to create tag'); }
    finally { setSaving(false); }
  };

  const handleAutoAssign = async () => {
    if (!isAdmin) return toast.error('Admin only');
    setAssigning(true);
    try {
      const { data: d } = await adminAPI.autoAssignUserTags();
      const r = d.data;
      toast.success(`Auto-assign complete — Top Creator: +${r.top_creator.assigned}/${r.top_creator.removed} removed · Verified: +${r.verified.assigned}/${r.verified.removed} removed`);
    } catch(e) { toast.error(e.message || 'Auto-assign failed'); }
    finally { setAssigning(false); }
  };

  return (
    <div>
      {editTag && (
        <EditTagModal tag={editTag} onSave={handleEditSave} onClose={() => setEditTag(null)}/>
      )}

      {/* Category Tabs */}
      <div style={{display:'flex',gap:4,padding:'0 20px',borderBottom:'1px solid #F4F4F4',marginBottom:0,flexWrap:'wrap'}}>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveTab(cat.key)}
            style={{
              padding:'10px 14px', border:'none', background:'none', cursor:'pointer',
              fontSize:12, fontWeight:700, fontFamily:'inherit',
              color:activeTab===cat.key?'var(--orange)':'#AAAAAA',
              borderBottom:activeTab===cat.key?'2px solid var(--orange)':'2px solid transparent',
              marginBottom:-1, transition:'color .15s',
            }}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{padding:'16px 20px'}}>
        {/* Category description + master toggle */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#F9F9F9',borderRadius:10,marginBottom:16,gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0A0A0A'}}>{activeCat?.label} on Public Site</div>
            <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{activeCat?.desc}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {activeTab === 'user' && isAdmin && (
              <button onClick={handleAutoAssign} disabled={assigning}
                style={{padding:'6px 13px',borderRadius:8,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',color:'#555',fontFamily:'inherit',whiteSpace:'nowrap',opacity:assigning?0.6:1}}>
                {assigning ? '⏳ Running…' : '⚡ Auto-assign'}
              </button>
            )}
            <div style={{opacity:isAdmin?1:0.45,pointerEvents:isAdmin?'auto':'none'}}>
              <Toggle
                checked={settings[activeCat?.settingKey] !== false}
                onChange={v => onSettingChange(activeCat.settingKey, v)}
              />
            </div>
          </div>
        </div>

        {/* User tag rules info box */}
        {activeTab === 'user' && (
          <div style={{background:'#F0F7FF',border:'1px solid #BFDBFE',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:11,color:'#1E40AF'}}>
            <div style={{fontWeight:700,marginBottom:6}}>🤖 Auto-assign rules (admin-controlled only):</div>
            {Object.entries(USER_TAG_RULES).map(([tag, rule]) => (
              <div key={tag} style={{marginBottom:2}}>
                <strong style={{textTransform:'capitalize'}}>{tag}</strong> — {rule}
              </div>
            ))}
            <div style={{marginTop:6,color:'#3B82F6'}}>Click "Auto-assign" above to run the rules now and sync all users.</div>
          </div>
        )}

        {/* Tags list */}
        {loading ? (
          <div style={{textAlign:'center',padding:'24px 0',color:'#AAAAAA',fontSize:13}}>Loading tags…</div>
        ) : catTags.length === 0 ? (
          <div style={{textAlign:'center',padding:'20px 0',color:'#AAAAAA',fontSize:13}}>No tags yet. Add one below.</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
            {catTags.map(tag => (
              <div key={tag.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#FAFAFA',borderRadius:10,border:'1px solid #F0F0F0'}}>
                <div style={{width:16,height:16,borderRadius:4,background:tag.color,border:'1px solid rgba(0,0,0,.08)',flexShrink:0}}/>
                <div style={{flex:1}}>
                  <TagPill tag={tag}/>
                </div>
                {activeTab === 'user' && USER_TAG_RULES[tag.name.toLowerCase()] && (
                  <div style={{fontSize:10,color:'#9CA3AF',maxWidth:160,textAlign:'right',lineHeight:1.3}}>
                    {USER_TAG_RULES[tag.name.toLowerCase()]}
                  </div>
                )}
                <div style={{fontSize:11,color:'#AAAAAA',marginRight:4}}>{tag.is_active?'Visible':'Hidden'}</div>
                <div style={{opacity:isAdmin?1:0.45,pointerEvents:isAdmin?'auto':'none',display:'flex',alignItems:'center',gap:6}}>
                  <Toggle checked={tag.is_active} onChange={() => handleToggleTag(tag)}/>
                  <button onClick={() => setEditTag(tag)} title="Edit tag"
                    style={{background:'none',border:'none',cursor:'pointer',color:'#AAAAAA',fontSize:13,lineHeight:1,padding:'2px 4px',borderRadius:4,transition:'color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#2563EB'}
                    onMouseLeave={e=>e.currentTarget.style.color='#AAAAAA'}>
                    ✎
                  </button>
                  <button onClick={() => handleDeleteTag(tag)}
                    style={{background:'none',border:'none',cursor:'pointer',color:'#CCCCCC',fontSize:14,lineHeight:1,padding:'2px',borderRadius:4,transition:'color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#EF4444'}
                    onMouseLeave={e=>e.currentTarget.style.color='#CCCCCC'}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new tag */}
        {isAdmin && (
          <div style={{borderTop:'1px solid #F4F4F4',paddingTop:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#AAAAAA',marginBottom:10,textTransform:'uppercase',letterSpacing:'.06em'}}>Add New Tag</div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <input
                value={newTag.name}
                onChange={e=>setNewTag(n=>({...n,name:e.target.value}))}
                onKeyDown={e=>e.key==='Enter'&&handleAddTag()}
                placeholder="Tag name…"
                style={{...inputS,flex:'1 1 140px',minWidth:100}}
              />
              {/* Color presets */}
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {PRESET_COLORS.map((c,i) => (
                  <button key={i} onClick={() => setNewTag(n=>({...n,color:c.bg,text_color:c.text}))}
                    title={c.bg}
                    style={{
                      width:20,height:20,borderRadius:6,background:c.bg,
                      border:newTag.color===c.bg?'2px solid #0A0A0A':'1.5px solid rgba(0,0,0,.1)',
                      cursor:'pointer',padding:0,transition:'transform .1s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.transform='scale(1.2)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                  />
                ))}
              </div>
              {/* Preview */}
              <TagPill tag={{name:newTag.name||'Preview',color:newTag.color,text_color:newTag.text_color,is_active:true}}/>
              <button onClick={handleAddTag} disabled={saving}
                style={{padding:'8px 16px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1,whiteSpace:'nowrap'}}>
                {saving?'Adding…':'+ Add Tag'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformProfileCard({ isAdmin }) {
  const [form, setForm]           = useState({ name:'', avatar_url:'' });
  const [loaded, setLoaded]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty]         = useState(false);
  const fileRef = React.useRef();

  useEffect(() => {
    adminAPI.platformProfile()
      .then(r => {
        const d = r.data?.data || {};
        setForm({ name: d.name || '', avatar_url: d.avatar_url || '' });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setDirty(true);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('tlmena_admin_token');
      const res = await fetch('/api/upload', { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      handleChange('avatar_url', data.url);
      toast.success('Logo uploaded');
    } catch(e) { toast.error(e.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!isAdmin) return toast.error('Admin only');
    setSaving(true);
    try {
      await adminAPI.savePlatformProfile({ name: form.name, avatar_url: form.avatar_url });
      setDirty(false);
      toast.success('Admin panel identity saved');
      window.dispatchEvent(new CustomEvent('panelProfileUpdated', { detail: { name: form.name, avatar_url: form.avatar_url } }));
    } catch(e) { toast.error(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (!loaded) return <div style={{padding:'20px',textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</div>;

  const avatarSrc = form.avatar_url;

  return (
    <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',gap:16,alignItems:'center'}}>
        <div style={{flexShrink:0,textAlign:'center'}}>
          <div style={{
            width:64, height:64, borderRadius:14,
            background: avatarSrc ? 'transparent' : '#E15033',
            border:'2px solid #F0F0F0', overflow:'hidden',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, fontWeight:800, color:'#fff',
          }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="Logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : 'TL'}
          </div>
          {isAdmin && (
            <>
              <input type="file" ref={fileRef} style={{display:'none'}} accept="image/*"
                onChange={e => handleUpload(e.target.files[0])}/>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{marginTop:6,background:'none',border:'1px solid #E8E8E8',borderRadius:7,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer',color:'#666',fontFamily:'inherit',opacity:uploading?0.6:1}}>
                {uploading ? 'Uploading…' : 'Change'}
              </button>
            </>
          )}
        </div>

        <div style={{flex:1}}>
          <Field label="Display Name">
            <input style={inputS} value={form.name} disabled={!isAdmin}
              onChange={e=>handleChange('name',e.target.value)} placeholder="TechLaunch MENA"/>
          </Field>
          <div style={{fontSize:11,color:'#AAAAAA',marginTop:5}}>
            Controls the logo and name shown in the admin panel sidebar.
          </div>
        </div>
      </div>

      {isAdmin && (
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button onClick={handleSave} disabled={saving||!dirty}
            style={{padding:'9px 22px',borderRadius:10,background: dirty ? 'var(--orange)':'#E8E8E8',
              color: dirty ? '#fff':'#AAAAAA',border:'none',fontWeight:700,fontSize:13,
              cursor: dirty ? 'pointer':'default', fontFamily:'inherit', transition:'all .15s'}}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);
  const [team, setTeam]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState({});
  const [form, setForm]         = useState({ name:'', email:'', role:'moderator' });
  const [editMember, setEditMember] = useState(null);
  const [editForm, setEditForm]     = useState({ name:'', email:'', role:'' });
  const [editSaving, setEditSaving] = useState(false);

  const loadTeam = useCallback(() => {
    adminAPI.team().then(r => setTeam(r.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    adminAPI.settings()
      .then(({ data: d }) => setSettings(d.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
    loadTeam();
  }, [loadTeam]);

  const invite = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSaving(true);
    try {
      const { data: d } = await adminAPI.createUser(form);
      toast.success(d.message || 'Invite sent — team member added!');
      setShowModal(false);
      setForm({ name:'', email:'', role:'moderator' });
      loadTeam();
    } catch(e) { toast.error(e.response?.data?.message || e.message || 'Failed to add team member'); }
    finally { setSaving(false); }
  };

  const openEdit = (m) => {
    setEditMember(m);
    setEditForm({ name: m.name || '', email: m.email || '', role: m.role || 'moderator' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) return toast.error('Name is required');
    if (!editForm.email.trim()) return toast.error('Email is required');
    setEditSaving(true);
    try {
      const { data: d } = await adminAPI.updateTeamMember(editMember.id, editForm);
      toast.success(d.message || 'Member updated');
      setTeam(t => t.map(m => m.id === editMember.id ? d.data : m));
      setEditMember(null);
    } catch(e) { toast.error(e.response?.data?.message || e.message || 'Failed to update member'); }
    finally { setEditSaving(false); }
  };

  const deleteMember = async (m) => {
    if (!window.confirm(`Remove ${m.name} from the team? This cannot be undone.`)) return;
    setDeleting(p => ({...p, [m.id]: true}));
    try {
      const { data: d } = await adminAPI.deleteTeamMember(m.id);
      toast.success(d.message || `${m.name} removed`);
      loadTeam();
    } catch(e) { toast.error(e.message || 'Failed to remove team member'); }
    finally { setDeleting(p => ({...p, [m.id]: false})); }
  };

  const save = async (key, value) => {
    if (!isAdmin) { toast.error('Only admins can change platform settings'); return; }
    setSettings(s=>({...s,[key]:value}));
    try { await adminAPI.saveSettings({ [key]: value }); toast.success('Setting saved'); }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed to save'); }
  };

  function SettingRow({ label, sub, settingKey, fallback=false }) {
    const val = settings[settingKey] !== undefined ? settings[settingKey] : fallback;
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid #F4F4F4'}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:isAdmin?'#0A0A0A':'#666'}}>{label}</div>
          {sub && <div style={{fontSize:11,color:'#AAAAAA',marginTop:2}}>{sub}</div>}
        </div>
        <div style={{opacity:isAdmin?1:0.45,pointerEvents:isAdmin?'auto':'none'}} title={isAdmin?undefined:'Admin access required'}>
          <Toggle checked={val} onChange={v=>save(settingKey,v)}/>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{textAlign:'center',padding:'60px 0',color:'#AAAAAA',fontSize:14}}>Loading settings…</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>

      {!isAdmin && (
        <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:10,padding:'10px 16px',fontSize:12,color:'#92400E',display:'flex',gap:8,alignItems:'center'}}>
          <span>🔒</span>
          <span>Settings are <strong>read-only</strong> for your role. Only admins can change platform configuration.</span>
        </div>
      )}

      {/* Invite Modal */}
      {showModal && (
        <Modal title="Invite Team Member" onClose={()=>setShowModal(false)}>
          <Field label="Full Name">
            <input style={inputS} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          </Field>
          <Field label="Email Address">
            <input style={inputS} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
          </Field>
          <Field label="Role">
            <select style={selectS} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="moderator">Moderator</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <div style={{fontSize:11,color:'#AAAAAA',marginBottom:14,padding:'8px 10px',background:'#F9F9F9',borderRadius:8}}>
            An activation email will be sent to the address above so they can set their own password.
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={invite} disabled={saving} style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>
              {saving ? 'Sending…' : 'Send Invite'}
            </button>
            <button onClick={()=>setShowModal(false)} style={{padding:'10px 16px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <Modal title={`Edit — ${editMember.name}`} onClose={()=>setEditMember(null)}>
          <Field label="Full Name">
            <input style={inputS} value={editForm.name}
              onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} autoFocus/>
          </Field>
          <Field label="Email Address">
            <input style={inputS} type="email" value={editForm.email}
              onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/>
          </Field>
          <Field label="Role">
            <select style={selectS} value={editForm.role}
              onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
              <option value="moderator">Moderator</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          {editMember.role === 'admin' && editForm.role !== 'admin' && (
            <div style={{fontSize:11,color:'#92400E',padding:'8px 10px',background:'#FFF7ED',borderRadius:8,marginBottom:12,border:'1px solid #FED7AA'}}>
              ⚠️ You are demoting an admin account. Make sure another admin exists before saving.
            </div>
          )}
          <div style={{display:'flex',gap:8}}>
            <button onClick={saveEdit} disabled={editSaving}
              style={{flex:1,background:'var(--orange)',color:'#fff',border:'none',borderRadius:10,padding:'10px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:editSaving?0.6:1}}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={()=>setEditMember(null)}
              style={{padding:'10px 16px',borderRadius:10,border:'1px solid #E8E8E8',background:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Platform Profile */}
      <SCard
        title="Public Profile"
        sub="Admin panel identity — logo and display name shown in the sidebar"
      >
        <PlatformProfileCard isAdmin={isAdmin}/>
      </SCard>

      {/* Team Members */}
      <SCard
        title="Team Members"
        sub={`${team.length} admin & moderator account${team.length!==1?'s':''}`}
        action={<button onClick={()=>setShowModal(true)} style={{padding:'7px 14px',borderRadius:9,background:'var(--orange)',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Invite Member</button>}
      >
        {team.length === 0
          ? <EmptyState icon="👋" title="No team members yet" sub="Invite your first team member above"/>
          : <Tbl heads={['Member','Email','Role','Status','Joined',...(isAdmin?['Actions']:[]) ]}>
              {team.map(m => {
                const isSelf    = m.id === user?.id;
                const canEdit   = isAdmin && !isSelf;
                const canDelete = isAdmin && !isSelf && m.role !== 'admin';
                return (
                  <tr key={m.id} style={{borderBottom:'1px solid #F4F4F4'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'10px 16px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:34,height:34,borderRadius:10,background:m.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',flexShrink:0}}>
                          {(m.name||'T').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>
                          {m.name}
                          {isSelf && <span style={{fontSize:10,fontWeight:600,color:'#AAAAAA',marginLeft:6}}>(you)</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'10px 16px',fontSize:12,color:'#666',fontFamily:'DM Mono,monospace'}}>{maskEmail(m.email)}</td>
                    <td style={{padding:'10px 16px'}}>
                      <Badge variant={{admin:'orange',moderator:'blue',editor:'purple'}[m.role]||'gray'}>{m.role}</Badge>
                    </td>
                    <td style={{padding:'10px 16px'}}>
                      <Badge variant={m.status==='active'?'green':'red'}>{m.status}</Badge>
                    </td>
                    <td style={{padding:'10px 16px',fontSize:11,color:'#AAAAAA'}}>{new Date(m.created_at).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td style={{padding:'10px 16px'}}>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          {canEdit && (
                            <button
                              onClick={()=>openEdit(m)}
                              title="Edit member"
                              style={{background:'none',border:'1px solid #E8E8E8',borderRadius:7,padding:'4px 9px',cursor:'pointer',color:'#555',fontSize:12,fontWeight:600,lineHeight:1,display:'flex',alignItems:'center',gap:4,transition:'border-color .12s,color .12s'}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563EB';e.currentTarget.style.color='#2563EB';}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor='#E8E8E8';e.currentTarget.style.color='#555';}}>
                              ✎ Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={()=>deleteMember(m)}
                              disabled={deleting[m.id]}
                              title="Remove from team"
                              style={{background:'none',border:'1px solid #FECACA',borderRadius:7,padding:'4px 9px',cursor:'pointer',color:'#DC2626',fontSize:12,fontWeight:600,opacity:deleting[m.id]?0.5:1,lineHeight:1,display:'flex',alignItems:'center',gap:4}}>
                              {deleting[m.id] ? '…' : '🗑 Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </Tbl>
        }
      </SCard>

      {/* Tag Management — full width */}
      <SCard
        title="Tag Management"
        sub="Create and manage tags that appear on the public site"
      >
        <TagManagement settings={settings} onSettingChange={save} isAdmin={isAdmin}/>
      </SCard>

      <div className="resp-grid-2">
        <SCard title="Moderation" sub="Control how content is reviewed">
          <div style={{padding:'0 20px 8px'}}>
            <SettingRow label="Auto-approve Products" sub="Skip manual review for trusted submitters" settingKey="auto_approve"/>
            <SettingRow label="Spam Filter"            sub="Auto-flag suspicious activity"            settingKey="spam_filter" fallback={true}/>
          </div>
        </SCard>

        <SCard title="Platform" sub="Global platform controls">
          <div style={{padding:'0 20px 8px'}}>
            <SettingRow label="Maintenance Mode"     sub="Take site offline for updates"                 settingKey="maintenance_mode"/>
            <SettingRow label="Allow New Signups"    sub="Open registration to the public"               settingKey="allow_signups" fallback={true}/>
            <SettingRow label="Show Waitlist Widget" sub="Display waitlist on coming-soon products"      settingKey="show_waitlist" fallback={true}/>
          </div>
        </SCard>

        <SCard title="Notifications" sub="Admin alert preferences">
          <div style={{padding:'0 20px 8px'}}>
            <SettingRow label="New Product Submissions" sub="Email when a product is submitted"     settingKey="notify_new_product" fallback={true}/>
            <SettingRow label="New User Signups"        sub="Daily digest of new registrations"    settingKey="notify_new_user"    fallback={true}/>
            <SettingRow label="Flagged Content"         sub="Immediate alert for spam/violations"  settingKey="notify_flagged"     fallback={true}/>
          </div>
        </SCard>

        <SCard title="Integrations" sub="Connected services and third-party tools">
          <div style={{padding:'0 20px 8px'}}>
            {[
              {icon:'📧',name:'Resend',         desc:'Transactional email delivery',       color:'#0A0A0A', status:'connected'},
              {icon:'📊',name:'Mixpanel',        desc:'Product analytics & funnels',        color:'#7c3aed', status:'disconnected'},
              {icon:'🗄️',name:'Neon DB',         desc:'PostgreSQL database (production)',   color:'#16a34a', status:'connected'},
              {icon:'🪣',name:'Cloudflare R2',   desc:'Object storage for media',           color:'#d97706', status:'disconnected'},
            ].map((intg,i,arr)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:i<arr.length-1?'1px solid #F4F4F4':'none'}}>
                <div style={{width:36,height:36,borderRadius:10,background:intg.status==='connected'?`${intg.color}12`:'#F4F4F4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{intg.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{intg.name}</div>
                  <div style={{fontSize:11,color:'#AAAAAA'}}>{intg.desc}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,background:intg.status==='connected'?'#DCFCE7':'#F4F4F4',color:intg.status==='connected'?'#166534':'#666'}}>
                  {intg.status==='connected'?'● Connected':'○ Not connected'}
                </span>
              </div>
            ))}
          </div>
        </SCard>
      </div>

      <div style={{marginTop:20}}>
        <SCard title="Danger Zone" sub="Irreversible actions — proceed with caution">
          <div style={{padding:'16px 20px',display:'flex',gap:10,flexWrap:'wrap'}}>
            <button onClick={()=>toast.error('Cannot delete — contact system admin')} style={{background:'#FEE2E2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>🗑️ Clear All Pending Products</button>
            <button onClick={()=>toast.error('Disabled in this environment')}          style={{background:'#FEE2E2',color:'#991B1B',border:'1px solid #FECACA',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>⚠️ Reset Platform Data</button>
            <button onClick={()=>toast.success('Export started — check your email')}   style={{background:'#F4F4F4',color:'#0A0A0A',border:'1px solid #E8E8E8',borderRadius:10,padding:'10px 16px',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>📤 Export All Data (CSV)</button>
          </div>
        </SCard>
      </div>
    </div>
  );
}
