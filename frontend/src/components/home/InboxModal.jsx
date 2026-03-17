import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

function Avatar({ name, avatarUrl, avatarColor, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const bg = avatarColor || '#FF6B35';
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'grid', placeItems: 'center', fontSize: size * 0.33, fontWeight: 900, flexShrink: 0 }}>{initials}</div>;
}

export default function InboxModal() {
  const { inboxOpen, setInboxOpen, inboxTarget, setInboxTarget, setUnreadMsgCount } = useUI();
  const { user } = useAuth();
  const [threads,       setThreads]       = useState([]);
  const [activeHandle,  setActiveHandle]  = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [msgText,       setMsgText]       = useState('');
  const [sending,       setSending]       = useState(false);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const scrollRef = useRef(null);
  const pollRef   = useRef(null);

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
    if (activeHandle) loadMessages(activeHandle);
  }, [activeHandle]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!inboxOpen || !activeHandle) return;
    pollRef.current = setInterval(() => {
      loadMessages(activeHandle);
      loadThreads();
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [inboxOpen, activeHandle, loadMessages, loadThreads]);

  if (!inboxOpen) return null;

  const handleClose = () => { setInboxOpen(false); setInboxTarget(null); clearInterval(pollRef.current); };
  const handleOverlay = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const handleSend = async () => {
    if (!msgText.trim() || !activeHandle || sending) return;
    const text = msgText.trim();
    setMsgText('');
    setSending(true);
    try {
      await api.post(`/messages/${activeHandle}`, { body: text });
      await loadMessages(activeHandle);
      await loadThreads();
    } catch { setMsgText(text); } finally { setSending(false); }
  };

  const selectThread = (handle) => {
    setActiveHandle(handle);
    setMessages([]);
    loadMessages(handle);
  };

  const activeThread = threads.find(t => t.handle === activeHandle);

  return (
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
                  <Avatar name={t.name} avatarUrl={t.avatar_url} avatarColor={t.avatar_color} size={36}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                      {t.name}
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
                ? <Avatar name={activeThread.name} avatarUrl={activeThread.avatar_url} avatarColor={activeThread.avatar_color} size={40}/>
                : <div style={{ width:40, height:40, borderRadius:'50%', background:'#e8e8e8' }}/>}
              <div>
                <div style={{ fontSize:14, fontWeight:800 }}>{activeThread?.name || activeHandle}</div>
                <div style={{ fontSize:11, color:'#aaa' }}>@{activeHandle} · {activeThread?.persona || 'Member'}</div>
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
                            {msg.body}
                            <div style={{ fontSize:10, opacity:.6, marginTop:4, textAlign:'right' }}>{time}</div>
                          </div>
                        </div>
                      );
                    })
              }
            </div>

            {/* Input */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid #f0f0f0', display:'flex', gap:10 }}>
              <input value={msgText} onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && handleSend()}
                placeholder={`Message ${activeThread?.name || activeHandle}…`}
                style={{ flex:1, padding:'10px 14px', borderRadius:12, border:'1.5px solid #e8e8e8', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }}
                onFocus={e => e.target.style.borderColor='var(--orange)'}
                onBlur={e => e.target.style.borderColor='#e8e8e8'}
                disabled={sending}/>
              <button onClick={handleSend} disabled={!msgText.trim() || sending}
                style={{ width:40, height:40, borderRadius:12, background:msgText.trim()&&!sending?'var(--orange)':'#e8e8e8', color:'#fff', border:'none', cursor:msgText.trim()&&!sending?'pointer':'default', display:'grid', placeItems:'center', flexShrink:0, transition:'background .15s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </>}
        </div>

      </div>
    </div>
  );
}
