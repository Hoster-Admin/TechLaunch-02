import React, { useState, useEffect, useRef } from 'react';
import { launcherAPI, communityAPI, uploadAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import FormattingToolbar from './FormattingToolbar';

const TYPE_OPTIONS = [
  {
    id: 'post',
    icon: '✍️',
    label: 'Post',
    desc: 'Share a quick thought, question, or update with the community',
    fields: ['body', 'tag'],
    bodyLabel: 'Your post',
    bodyPlaceholder: "What's on your mind? Share a question, insight, or update…",
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

const ACCEPTED_IMG = 'image/jpeg,image/png,image/gif,image/webp';
const ACCEPTED_VID = 'video/mp4,video/webm,video/quicktime';

export default function SubmitPostModal({ onClose, editDraft = null, initialDraft = null, defaultType = null, onPublished, onSaved }) {
  const draft = initialDraft || editDraft;
  const initType = draft?.post_type || draft?.type || defaultType;
  const [step, setStep]       = useState(draft || defaultType ? 'write' : 'type');
  const [type, setType]       = useState(initType || 'post');
  const [title, setTitle]     = useState(draft?.title || '');
  const [body, setBody]       = useState(draft?.body || draft?.content || '');
  const [tagName, setTagName] = useState(draft?.tag || '');
  const [tags, setTags]       = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [mediaFile, setMediaFile]       = useState(null);
  const [mediaPreview, setMediaPreview] = useState(draft?.image_url || null);
  const [mediaType, setMediaType]       = useState(null);
  const [uploading, setUploading]       = useState(false);
  const mediaInputRef = useRef(null);
  const bodyRef = useRef(null);

  const typeCfg = TYPE_OPTIONS.find(t => t.id === type) || TYPE_OPTIONS[0];
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

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be under 50 MB'); return; }
    setMediaFile(file);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const uploadMediaIfNeeded = async () => {
    if (!mediaFile) return mediaPreview;
    setUploading(true);
    try {
      const res = await uploadAPI.postMedia(mediaFile);
      return res.data?.data?.url || null;
    } catch {
      toast.error('Media upload failed');
      return null;
    } finally { setUploading(false); }
  };

  const handlePublish = async () => {
    if (!body.trim()) { toast.error('Please write something first'); return; }
    if (charOver) { toast.error(`Too long — keep it under ${charMax} characters`); return; }
    if (type === 'article' && !title.trim()) { toast.error('Articles need a title'); return; }
    setPublishing(true);
    try {
      const imageUrl = await uploadMediaIfNeeded();
      const payload = {
        post_type: type,
        title: title.trim() || null,
        content: body.trim(),
        tag: tagName || null,
        image_url: imageUrl,
      };
      let result;
      if (draft?.id) {
        result = await launcherAPI.editPost(draft.id, payload);
      } else {
        result = await launcherAPI.createPost(payload);
      }
      const published = result?.data?.data || {};
      toast.success(type === 'article' ? 'Article published!' : 'Post published!');
      if (onPublished) onPublished(published);
      else onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to publish';
      toast.error(msg);
    } finally { setPublishing(false); }
  };

  const charCount = body.length;
  const charMax   = typeCfg?.bodyMax || 1000;
  const charOver  = charCount > charMax;
  const busy      = publishing || uploading;

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
                {step === 'type' ? 'What do you want to share?' : draft?.id ? `Edit ${type === 'article' ? 'Article' : 'Post'}` : type === 'article' ? 'Write an Article' : 'Write a Post'}
              </div>
              {step === 'write' && (
                <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{typeCfg?.desc}</div>
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
                <FormattingToolbar textareaRef={bodyRef} value={body} setValue={setBody} />
                <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)}
                  placeholder={typeCfg?.bodyPlaceholder}
                  rows={type === 'article' ? 10 : 5}
                  style={{ ...inp, resize:'vertical', lineHeight:1.7, minHeight: type === 'article' ? 220 : 120, borderColor: charOver ? '#e11d48' : undefined }}
                  onFocus={e => { if (!charOver) e.target.style.borderColor='var(--orange)'; }}
                  onBlur={e => { e.target.style.borderColor = charOver ? '#e11d48' : '#e8e8e8'; }}/>
                <div style={{ fontSize:11, color: charOver ? '#e11d48' : '#bbb', textAlign:'right', marginTop:4 }}>
                  {charCount}/{charMax} characters
                </div>
              </div>

              {/* Media upload */}
              <div>
                <label style={{ fontSize:11, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'#aaa', display:'block', marginBottom:8 }}>
                  {type === 'article' ? 'Cover Image (optional)' : 'Photo / Video (optional)'}
                </label>

                {mediaPreview ? (
                  <div style={{ position:'relative', borderRadius:12, overflow:'hidden', border:'1.5px solid #e8e8e8' }}>
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} controls style={{ width:'100%', maxHeight:240, objectFit:'cover', display:'block', background:'#000' }}/>
                    ) : (
                      <img src={mediaPreview} alt="preview" style={{ width:'100%', maxHeight:240, objectFit:'cover', display:'block' }}/>
                    )}
                    <button onClick={removeMedia}
                      style={{ position:'absolute', top:8, right:8, width:28, height:28, borderRadius:'50%', border:'none', background:'rgba(0,0,0,.6)', color:'#fff', fontSize:14, cursor:'pointer', display:'grid', placeItems:'center' }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => mediaInputRef.current?.click()}
                    style={{ width:'100%', padding:'20px', borderRadius:12, border:'2px dashed #e8e8e8', background:'#fafafa', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all .15s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.background='#fff8f6'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor='#e8e8e8'; e.currentTarget.style.background='#fafafa'; }}>
                    <div style={{ fontSize:28 }}>{type === 'article' ? '🖼️' : '📸'}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#555' }}>
                      {type === 'article' ? 'Upload cover image' : 'Upload photo or video'}
                    </div>
                    <div style={{ fontSize:11, color:'#bbb' }}>
                      {type === 'article' ? 'JPG, PNG, GIF, WebP — max 8 MB' : 'Images up to 8 MB · Videos up to 50 MB'}
                    </div>
                  </button>
                )}

                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={type === 'article' ? ACCEPTED_IMG : `${ACCEPTED_IMG},${ACCEPTED_VID}`}
                  onChange={handleMediaSelect}
                  style={{ display:'none' }}/>
              </div>

              {/* Tag selector */}
              {tags.length > 0 && (
                <div>
                  <label style={{ fontSize:11, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'#aaa', display:'block', marginBottom:8 }}>Tag (optional)</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {tags.map(t => (
                      <button key={t.id} onClick={() => setTagName(tagName === t.name ? '' : t.name)}
                        style={{ padding:'6px 14px', borderRadius:99, border:`2px solid ${tagName === t.name ? t.color : '#e8e8e8'}`, background: tagName === t.name ? t.color : '#fff', color: tagName === t.name ? '#fff' : '#666', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
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
                <button onClick={handlePublish} disabled={busy || charOver || !body.trim()}
                  style={{ padding:'10px 24px', borderRadius:12, border:'none', background: (!body.trim() || charOver) ? '#f0f0f0' : 'var(--orange)', color: (!body.trim() || charOver) ? '#bbb' : '#fff', fontSize:13, fontWeight:700, cursor: (!body.trim() || charOver) ? 'not-allowed' : 'pointer', transition:'all .15s', minWidth:130 }}>
                  {uploading ? 'Uploading…' : publishing ? (draft?.id ? 'Saving…' : 'Publishing…') : draft?.id ? 'Save Changes →' : 'Publish →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discard confirmation */}
      {showCloseConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:4000, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'28px 28px', width:'100%', maxWidth:380, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontSize:28, marginBottom:12 }}>✏️</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#0a0a0a', marginBottom:8 }}>Discard changes?</div>
            <p style={{ fontSize:13, color:'#888', marginBottom:24, lineHeight:1.6 }}>
              You've started writing. If you leave now, your changes won't be saved.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowCloseConfirm(false)}
                style={{ flex:1, padding:'11px', borderRadius:12, border:'1.5px solid #e8e8e8', background:'#fff', color:'#666', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Keep Editing
              </button>
              <button onClick={() => { setShowCloseConfirm(false); onClose(); }}
                style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:'#e11d48', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
