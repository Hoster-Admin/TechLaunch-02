import React, { useState, useEffect, useRef } from 'react';
import { communityAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  {
    id: 'post',
    icon: '✍️',
    label: 'Post',
    desc: 'Share a quick thought, question, or update with the community',
    fields: ['body', 'tag'],
    bodyLabel: 'Your post',
    bodyPlaceholder: "What\u2019s on your mind? Share a question, insight, or update\u2026",
    bodyMin: 10,
    bodyMax: 1000,
  },
  {
    id: 'article',
    icon: '📰',
    label: 'Article',
    desc: 'Write an in-depth piece — tutorial, analysis, or deep-dive',
    fields: ['title', 'body', 'tag'],
    bodyLabel: 'Article content',
    bodyPlaceholder: 'Write your full article here. Share your insights, experiences, and knowledge…',
    bodyMin: 100,
    bodyMax: 10000,
  },
];

export default function SubmitPostModal({ onClose, editDraft = null, initialDraft = null, defaultType = null, onPublished, onSaved }) {
  const draft = initialDraft || editDraft;
  const initType = draft?.type || defaultType;
  const [step, setStep]       = useState(draft || defaultType ? 'write' : 'type');
  const [type, setType]       = useState(initType);
  const [title, setTitle]     = useState(draft?.title || '');
  const [body, setBody]       = useState(draft?.body || '');
  const [tagId, setTagId]     = useState(draft?.tag_id || '');
  const [tags, setTags]       = useState([]);
  const [saving, setSaving]   = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const bodyRef = useRef(null);

  const typeCfg = TYPE_OPTIONS.find(t => t.id === type);
  const isDirty = body.trim().length > 0 || title.trim().length > 0;

  useEffect(() => {
    communityAPI.tags().then(r => setTags(r.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 'write' && bodyRef.current) bodyRef.current.focus();
  }, [step]);

  const handleSelectType = (t) => {
    setType(t);
    setStep('write');
  };

  const handleClose = () => {
    if (isDirty && !draft) { setShowCloseConfirm(true); return; }
    onClose();
  };

  const saveDraft = async () => {
    if (!body.trim() && !title.trim()) { onClose(); return; }
    setSaving(true);
    try {
      const payload = { type, title: title.trim() || null, body: body.trim() || '', tag_id: tagId || null, status: 'draft' };
      let result;
      if (draft?.id) {
        result = await communityAPI.update(draft.id, payload);
      } else {
        result = await communityAPI.create(payload);
      }
      const saved = result?.data?.data || {};
      toast.success('Saved to drafts');
      if (onSaved) onSaved(saved);
      else onClose();
    } catch { toast.error('Failed to save draft'); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!body.trim()) { toast.error('Please write something first'); return; }
    if (type === 'article' && !title.trim()) { toast.error('Articles need a title'); return; }
    setSaving(true);
    try {
      const payload = { type, title: title.trim() || null, body: body.trim(), tag_id: tagId || null, status: 'published' };
      let result;
      if (draft?.id) {
        result = await communityAPI.update(draft.id, payload);
      } else {
        result = await communityAPI.create(payload);
      }
      const published = result?.data?.data || {};
      toast.success(type === 'article' ? 'Article published!' : 'Post published!');
      if (onPublished) onPublished(published);
      else onClose();
    } catch { toast.error('Failed to publish'); }
    finally { setSaving(false); }
  };

  const charCount = body.length;
  const charMax   = typeCfg?.bodyMax || 1000;
  const charOver  = charCount > charMax;

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid #e8e8e8', fontSize: 14, fontFamily: 'Inter,sans-serif',
    outline: 'none', boxSizing: 'border-box', color: '#0a0a0a',
  };

  return (
    <>
      <div onClick={showCloseConfirm ? undefined : handleClose}
        style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>

        <div onClick={e => e.stopPropagation()}
          style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth: step === 'type' ? 520 : 680, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.22)', animation:'modalIn .2s ease' }}>

          {/* Header */}
          <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#0a0a0a' }}>
                {step === 'type' ? 'What do you want to share?' : typeCfg?.id === 'article' ? 'Write an Article' : 'Write a Post'}
              </div>
              {step === 'write' && (
                <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>
                  {typeCfg?.desc}
                </div>
              )}
            </div>
            <button onClick={handleClose}
              style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f4f4f4', color:'#666', cursor:'pointer', display:'grid', placeItems:'center', fontSize:16 }}>
              ✕
            </button>
          </div>

          {/* Type selector */}
          {step === 'type' && (
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:12 }}>
              {TYPE_OPTIONS.map(t => (
                <button key={t.id} onClick={() => handleSelectType(t.id)}
                  style={{ display:'flex', alignItems:'flex-start', gap:16, padding:'20px 20px', borderRadius:16, border:'1.5px solid #e8e8e8', background:'#fff', cursor:'pointer', textAlign:'left', transition:'all .15s' }}
                  onMouseOver={e => { e.currentTarget.style.border='1.5px solid var(--orange)'; e.currentTarget.style.background='#fff8f6'; }}
                  onMouseOut={e => { e.currentTarget.style.border='1.5px solid #e8e8e8'; e.currentTarget.style.background='#fff'; }}>
                  <div style={{ fontSize:28, flexShrink:0 }}>{t.icon}</div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:'#0a0a0a', marginBottom:4 }}>{t.label}</div>
                    <div style={{ fontSize:13, color:'#888', lineHeight:1.5 }}>{t.desc}</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:18, color:'#ccc', alignSelf:'center' }}>→</div>
                </button>
              ))}
            </div>
          )}

          {/* Write form */}
          {step === 'write' && (
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

              {/* Title (articles only) */}
              {typeCfg?.fields.includes('title') && (
                <div>
                  <label style={{ fontSize:11, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'#aaa', display:'block', marginBottom:6 }}>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Give your article a compelling title…"
                    style={{ ...inp, fontSize:18, fontWeight:700 }}
                    onFocus={e => e.target.style.borderColor='var(--orange)'}
                    onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
                </div>
              )}

              {/* Body */}
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'#aaa', display:'block', marginBottom:6 }}>
                  {typeCfg?.bodyLabel || 'Content'} *
                </label>
                <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)}
                  placeholder={typeCfg?.bodyPlaceholder}
                  rows={type === 'article' ? 12 : 6}
                  style={{ ...inp, resize:'vertical', lineHeight:1.7, minHeight: type === 'article' ? 280 : 140 }}
                  onFocus={e => e.target.style.borderColor='var(--orange)'}
                  onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
                <div style={{ fontSize:11, color: charOver ? '#e11d48' : '#bbb', textAlign:'right', marginTop:4 }}>
                  {charCount}/{charMax} characters
                </div>
              </div>

              {/* Tag selector */}
              {tags.length > 0 && (
                <div>
                  <label style={{ fontSize:11, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'#aaa', display:'block', marginBottom:8 }}>Tag (optional — choose one)</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {tags.map(t => (
                      <button key={t.id} onClick={() => setTagId(tagId === t.id ? '' : t.id)}
                        style={{ padding:'6px 14px', borderRadius:99, border:`2px solid ${tagId === t.id ? t.color : '#e8e8e8'}`, background: tagId === t.id ? t.color : '#fff', color: tagId === t.id ? '#fff' : '#666', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          {step === 'write' && (
            <div style={{ padding:'16px 24px', borderTop:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:12 }}>
              <button onClick={() => setStep('type')} disabled={!!draft || !!defaultType}
                style={{ background:'none', border:'none', color:'#aaa', fontSize:13, fontWeight:600, cursor: (draft || defaultType) ? 'not-allowed' : 'pointer', opacity: (draft || defaultType) ? 0.4 : 1 }}>
                ← Change type
              </button>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={saveDraft} disabled={saving}
                  style={{ padding:'10px 20px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#fff', color:'#444', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button onClick={handlePublish} disabled={saving || charOver || !body.trim()}
                  style={{ padding:'10px 24px', borderRadius:12, border:'none', background: (!body.trim() || charOver) ? '#f0f0f0' : 'var(--orange)', color: (!body.trim() || charOver) ? '#bbb' : '#fff', fontSize:13, fontWeight:700, cursor: (!body.trim() || charOver) ? 'not-allowed' : 'pointer', transition:'all .15s' }}>
                  {saving ? 'Publishing…' : 'Publish →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close / save-to-draft confirmation */}
      {showCloseConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:4000, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'28px 28px', width:'100%', maxWidth:380, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontSize:28, marginBottom:12 }}>💾</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#0a0a0a', marginBottom:8 }}>Save to drafts?</div>
            <p style={{ fontSize:13, color:'#888', marginBottom:24, lineHeight:1.6 }}>
              You've started writing. Would you like to save this as a draft so you can come back to it later?
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowCloseConfirm(false); onClose(); }}
                style={{ flex:1, padding:'11px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#fff', color:'#666', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Discard
              </button>
              <button onClick={() => { setShowCloseConfirm(false); saveDraft(); }}
                style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:'var(--orange)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
