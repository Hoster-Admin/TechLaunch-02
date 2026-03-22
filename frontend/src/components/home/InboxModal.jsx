import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import PhotoViewer from './PhotoViewer';

function Avatar({ name, avatarUrl, avatarColor, size = 36, onClick }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const bg = avatarColor || '#FF6B35';
  const style = {
    width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
  };
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={style} onClick={onClick} />;
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%', background: bg, color: '#fff',
        display: 'grid', placeItems: 'center', fontSize: size * 0.33, fontWeight: 900,
        flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
      }}
    >{initials}</div>
  );
}

function ReceiptIcon({ isRead, isDelivered }) {
  if (isRead) {
    return (
      <svg width="14" height="10" viewBox="0 0 16 10" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }}>
        <path d="M1 5l3 3L9 2" stroke="#4fc3f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 5l3 3L13 2" stroke="#4fc3f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (isDelivered) {
    return (
      <svg width="14" height="10" viewBox="0 0 16 10" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }}>
        <path d="M1 5l3 3L9 2" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 5l3 3L13 2" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 12 10" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }}>
      <path d="M1 5l3 3L10 2" stroke="rgba(255,255,255,.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: '#f4f4f4', display: 'flex', alignItems: 'center', gap: 4 }}>
        <style>{`
          @keyframes typingDot {
            0%, 60%, 100% { opacity: .3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#aaa',
            animation: `typingDot 1.2s infinite ${i * 0.2}s`,
          }}/>
        ))}
      </div>
    </div>
  );
}

export default function InboxModal() {
  const { inboxOpen, setInboxOpen, inboxTarget, setInboxTarget, setUnreadMsgCount } = useUI();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads,       setThreads]       = useState([]);
  const [activeHandle,  setActiveHandle]  = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [msgText,       setMsgText]       = useState('');
  const [sending,       setSending]       = useState(false);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);

  const [attachment,    setAttachment]    = useState(null);
  const [attachPreview, setAttachPreview] = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  const [lightboxSrc, setLightboxSrc]   = useState(null);
  const [otherTyping, setOtherTyping]   = useState(false);
  const scrollRef = useRef(null);
  const pollRef   = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  const loadThreads = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/threads');
      if (data.success) {
        setThreads(data.data);
        const total = data.data.reduce((s, t) => s + (t.unread_count || 0), 0);
        setUnreadMsgCount(total);
      }
    } catch {}
  }, [setUnreadMsgCount]);

  const loadMessages = useCallback(async (handle) => {
    if (!handle) return;
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/messages/${handle}`);
      if (data.success) setMessages(data.data);
    } catch {} finally { setLoadingMsgs(false); }
  }, []);

  const checkTyping = useCallback(async (handle) => {
    if (!handle) return;
    try {
      const { data } = await api.get(`/messages/${handle}/typing`);
      if (data.success) setOtherTyping(data.data.typing);
    } catch {}
  }, []);

  useEffect(() => {
    if (!inboxOpen) return;
    loadThreads();
  }, [inboxOpen, loadThreads]);

  useEffect(() => {
    if (inboxTarget?.handle && inboxOpen) {
      const h = inboxTarget.handle.replace('@', '');
      setActiveHandle(h);
      loadMessages(h);
    }
  }, [inboxTarget, inboxOpen, loadMessages]);

  useEffect(() => {
    if (activeHandle) {
      loadMessages(activeHandle);
      setOtherTyping(false);
    }
  }, [activeHandle]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, otherTyping]);

  useEffect(() => {
    if (!inboxOpen || !activeHandle) return;
    pollRef.current = setInterval(() => {
      loadMessages(activeHandle);
      loadThreads();
      checkTyping(activeHandle);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [inboxOpen, activeHandle, loadMessages, loadThreads, checkTyping]);

  if (!inboxOpen) return null;

  const handleClose = () => { setInboxOpen(false); setInboxTarget(null); clearInterval(pollRef.current); };
  const handleOverlay = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const sendTypingSignal = () => {
    if (!activeHandle) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    api.post(`/messages/${activeHandle}/typing`).catch(() => {});
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10 MB'); return; }
    if (file.type.startsWith('image/')) {
      setAttachPreview(URL.createObjectURL(file));
    } else {
      setAttachPreview(null);
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload/message-attachment', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setAttachment({ url: data.data.url, type: data.data.type, filename: data.data.filename || file.name });
      }
    } catch { alert('Failed to upload file'); setAttachPreview(null); }
    finally { setUploading(false); }
    e.target.value = '';
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachPreview(null);
  };

  const handleSend = async () => {
    if ((!msgText.trim() && !attachment) || !activeHandle || sending) return;
    const text = msgText.trim();
    const att = attachment;
    setMsgText('');
    setAttachment(null);
    setAttachPreview(null);
    setSending(true);
    try {
      await api.post(`/messages/${activeHandle}`, {
        body: text,
        attachment_url: att?.url || undefined,
        attachment_type: att?.type || undefined,
        attachment_name: att?.filename || undefined,
      });
      await loadMessages(activeHandle);
      await loadThreads();
    } catch { setMsgText(text); setAttachment(att); } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setMsgText(e.target.value);
    autoResize();
    if (e.target.value.trim()) sendTypingSignal();
  };

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const selectThread = (handle) => {
    setActiveHandle(handle);
    setMessages([]);
    setOtherTyping(false);
    loadMessages(handle);
  };

  const goToProfile = (handle) => {
    handleClose();
    navigate(`/u/${handle}`);
  };

  const activeThread = threads.find(t => t.handle === activeHandle);

  return (
    <>
    {lightboxSrc && <PhotoViewer src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    <div onClick={handleOverlay} style={{ position:'fixed', inset:0, zIndex:2100, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:680, height:'80vh', maxHeight:600, display:'flex', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>

        {/* Sidebar */}
        <div style={{ width:220, borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:800 }}>Messages</div>
            <button onClick={handleClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#aaa' }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {!threads.length ? (
              <div style={{ padding:'24px 16px', fontSize:12, color:'#bbb', textAlign:'center' }}>No messages yet.<br/>Open someone's profile and hit Message.</div>
            ) : threads.map(t => (
              <div key={t.handle} onClick={() => selectThread(t.handle)}
                style={{ padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid #f8f8f8', background:activeHandle===t.handle?'#fff5f3':'transparent', transition:'background .1s', position:'relative' }}
                onMouseOver={e => { if(activeHandle!==t.handle) e.currentTarget.style.background='#f8f8f8'; }}
                onMouseOut={e => { if(activeHandle!==t.handle) e.currentTarget.style.background='transparent'; }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar
                    name={t.name} avatarUrl={t.avatar_url} avatarColor={t.avatar_color} size={36}
                    onClick={e => { e.stopPropagation(); if (t.avatar_url) setLightboxSrc(t.avatar_url); }}
                  />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                      <span
                        onClick={e => { e.stopPropagation(); goToProfile(t.handle); }}
                        style={{ cursor:'pointer', textDecoration:'none' }}
                        onMouseOver={e => e.currentTarget.style.color='var(--orange)'}
                        onMouseOut={e => e.currentTarget.style.color='#0a0a0a'}
                      >{t.name}</span>
                      {t.unread_count > 0 && <span style={{ width:16, height:16, borderRadius:'50%', background:'var(--orange)', color:'#fff', fontSize:9, fontWeight:900, display:'inline-grid', placeItems:'center', flexShrink:0 }}>{t.unread_count}</span>}
                    </div>
                    {t.last_message && <div style={{ fontSize:11, color:'#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.last_sender_id === user?.id ? 'You: ' : ''}{t.last_message}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {!activeHandle ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#bbb' }}>
              <div style={{ fontSize:36 }}>💬</div>
              <div style={{ fontSize:13, fontWeight:600 }}>Select a conversation</div>
            </div>
          ) : <>
            {/* Chat header */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:12 }}>
              {activeThread
                ? <Avatar
                    name={activeThread.name} avatarUrl={activeThread.avatar_url} avatarColor={activeThread.avatar_color} size={40}
                    onClick={() => { if (activeThread.avatar_url) setLightboxSrc(activeThread.avatar_url); }}
                  />
                : <div style={{ width:40, height:40, borderRadius:'50%', background:'#e8e8e8' }}/>}
              <div>
                <div
                  style={{ fontSize:14, fontWeight:800, cursor:'pointer' }}
                  onClick={() => goToProfile(activeHandle)}
                  onMouseOver={e => e.currentTarget.style.color='var(--orange)'}
                  onMouseOut={e => e.currentTarget.style.color='#0a0a0a'}
                >{activeThread?.name || activeHandle}</div>
                <div style={{ fontSize:11, color:'#aaa' }}>
                  @{activeHandle} · {activeThread?.persona || 'Member'}
                  {otherTyping && <span style={{ color: 'var(--orange)', fontWeight: 600, marginLeft: 6 }}>typing…</span>}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
              {loadingMsgs && !messages.length
                ? <div style={{ textAlign:'center', color:'#ccc', fontSize:12 }}>Loading…</div>
                : messages.length === 0
                  ? <div style={{ textAlign:'center', color:'#ccc', fontSize:12, marginTop:40 }}>No messages yet. Say hello! 👋</div>
                  : messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
                      return (
                        <div key={msg.id} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start' }}>
                          <div style={{ maxWidth:'70%', padding:'10px 14px', borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px', background:isMe?'var(--orange)':'#f4f4f4', color:isMe?'#fff':'#1a1a1a', fontSize:13, lineHeight:1.5 }}>
                            {msg.body && <div style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.body}</div>}
                            {msg.attachment_url && msg.attachment_type === 'image' && (
                              <div style={{ marginTop: msg.body ? 8 : 0 }}>
                                <img
                                  src={msg.attachment_url}
                                  alt="Attachment"
                                  onClick={() => setLightboxSrc(msg.attachment_url)}
                                  style={{ maxWidth:'100%', maxHeight:200, borderRadius:8, objectFit:'cover', display:'block', cursor:'zoom-in' }}
                                />
                              </div>
                            )}
                            {msg.attachment_url && msg.attachment_type !== 'image' && (
                              <div style={{ marginTop: msg.body ? 6 : 0 }}>
                                <a
                                  href={msg.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:8, background: isMe ? 'rgba(255,255,255,.2)' : '#e8e8e8', color: isMe ? '#fff' : '#444', textDecoration:'none', fontSize:12, fontWeight:600 }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                                  {msg.attachment_name || 'Download file'}
                                </a>
                              </div>
                            )}
                            <div style={{ fontSize:10, opacity:.6, marginTop:4, textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:2 }}>
                              {time}
                              {isMe && <ReceiptIcon isRead={msg.is_read} isDelivered={msg.is_delivered} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
              }
              {otherTyping && <TypingIndicator />}
            </div>

            {/* Attachment preview */}
            {(attachment || attachPreview || uploading) && (
              <div style={{ padding:'8px 16px 0', display:'flex', alignItems:'center', gap:8 }}>
                {uploading ? (
                  <div style={{ fontSize:12, color:'#aaa' }}>Uploading…</div>
                ) : attachment ? (
                  <>
                    {attachment.type === 'image' && attachPreview && (
                      <img src={attachPreview} alt="Preview" style={{ height:48, width:48, objectFit:'cover', borderRadius:8 }}/>
                    )}
                    {attachment.type !== 'image' && (
                      <div style={{ fontSize:12, color:'#555', fontWeight:600, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        📎 {attachment.filename}
                      </div>
                    )}
                    <button onClick={clearAttachment} style={{ background:'#e8e8e8', border:'none', borderRadius:'50%', width:20, height:20, cursor:'pointer', fontSize:12, display:'grid', placeItems:'center', flexShrink:0 }}>✕</button>
                  </>
                ) : null}
              </div>
            )}

            {/* Input */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid #f0f0f0', display:'flex', gap:10, alignItems:'flex-end' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt"
                style={{ display:'none' }}
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                disabled={sending || uploading}
                style={{ width:36, height:36, borderRadius:10, background:'#f4f4f4', border:'none', cursor:'pointer', display:'grid', placeItems:'center', flexShrink:0, color:'#888', transition:'background .15s' }}
                onMouseOver={e => e.currentTarget.style.background='#ebebeb'}
                onMouseOut={e => e.currentTarget.style.background='#f4f4f4'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <textarea
                ref={textareaRef}
                value={msgText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activeThread?.name || activeHandle}… (Shift+Enter for new line)`}
                rows={1}
                disabled={sending}
                style={{
                  flex:1, padding:'10px 14px', borderRadius:12, border:'1.5px solid #e8e8e8',
                  fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', resize:'none',
                  overflowY:'hidden', lineHeight:1.5, maxHeight:120,
                }}
                onFocus={e => e.target.style.borderColor='var(--orange)'}
                onBlur={e => e.target.style.borderColor='#e8e8e8'}
              />
              <button onClick={handleSend} disabled={(!msgText.trim() && !attachment) || sending || uploading}
                style={{ width:40, height:40, borderRadius:12, background:(msgText.trim()||attachment)&&!sending&&!uploading?'var(--orange)':'#e8e8e8', color:'#fff', border:'none', cursor:(msgText.trim()||attachment)&&!sending&&!uploading?'pointer':'default', display:'grid', placeItems:'center', flexShrink:0, transition:'background .15s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </>}
        </div>

      </div>
    </div>
    </>
  );
}
