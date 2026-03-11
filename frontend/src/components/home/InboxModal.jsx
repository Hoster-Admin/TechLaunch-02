import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

export default function InboxModal() {
  const { inboxOpen, setInboxOpen, inboxTarget, setInboxTarget, dmThreads, openDM, sendDM, profiles } = useUI();
  const { user } = useAuth();
  const [activeHandle, setActiveHandle] = useState(null);
  const [msgText, setMsgText] = useState('');
  const scrollRef = useRef(null);

  const myHandle = '@' + (user?.handle || '').replace('@', '');

  useEffect(() => {
    if (inboxTarget && inboxOpen) setActiveHandle(inboxTarget.handle);
  }, [inboxTarget, inboxOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [dmThreads, activeHandle, inboxOpen]);

  if (!inboxOpen) return null;

  const allHandles = Object.keys(dmThreads);
  const activeThread = activeHandle ? (dmThreads[activeHandle] || []) : [];
  const activeProfile = activeHandle ? (profiles[activeHandle] || { handle:activeHandle, name:activeHandle, avatar:activeHandle.slice(1,3).toUpperCase() }) : null;

  const handleClose = () => { setInboxOpen(false); setInboxTarget(null); };
  const handleOverlay = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const handleSend = () => {
    if (!msgText.trim() || !activeHandle) return;
    sendDM(activeHandle, msgText.trim(), myHandle);
    setMsgText('');
  };

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
            {!allHandles.length ? (
              <div style={{ padding:'24px 16px', fontSize:12, color:'#bbb', textAlign:'center' }}>No messages yet</div>
            ) : allHandles.map(h => {
              const p = profiles[h] || { handle:h, name:h, avatar:h.slice(1,3).toUpperCase() };
              const lastMsg = dmThreads[h]?.slice(-1)[0];
              return (
                <div key={h} onClick={() => setActiveHandle(h)}
                  style={{ padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid #f8f8f8', background:activeHandle===h?'#fff5f3':'transparent', transition:'background .1s' }}
                  onMouseOver={e => { if(activeHandle!==h) e.currentTarget.style.background='#f8f8f8'; }}
                  onMouseOut={e => { if(activeHandle!==h) e.currentTarget.style.background='transparent'; }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:12, fontWeight:900, flexShrink:0 }}>{p.avatar}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0a0a0a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      {lastMsg && <div style={{ fontSize:11, color:'#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lastMsg.text}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {!activeHandle ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#bbb' }}>
              <div style={{ fontSize:36 }}>💬</div>
              <div style={{ fontSize:13, fontWeight:600 }}>Select a conversation</div>
            </div>
          ) : <>
            {/* Chat header */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--orange)', color:'#fff', display:'grid', placeItems:'center', fontSize:14, fontWeight:900 }}>{activeProfile?.avatar}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800 }}>{activeProfile?.name}</div>
                <div style={{ fontSize:11, color:'#aaa' }}>{activeHandle} · {activeProfile?.persona || 'Member'}</div>
              </div>
            </div>
            {/* Messages */}
            <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
              {activeThread.map((msg, i) => {
                const isMe = msg.from === myHandle || msg.from === 'me';
                return (
                  <div key={i} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start' }}>
                    <div style={{ maxWidth:'70%', padding:'10px 14px', borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px', background:isMe?'var(--orange)':'#f4f4f4', color:isMe?'#fff':'#1a1a1a', fontSize:13, lineHeight:1.5 }}>
                      {msg.text}
                      <div style={{ fontSize:10, opacity:.6, marginTop:4, textAlign:'right' }}>{msg.ts}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Input */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid #f0f0f0', display:'flex', gap:10 }}>
              <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key==='Enter' && !e.shiftKey && handleSend()} placeholder={`Message ${activeProfile?.name}…`}
                style={{ flex:1, padding:'10px 14px', borderRadius:12, border:'1.5px solid #e8e8e8', fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }}
                onFocus={e => e.target.style.borderColor='var(--orange)'} onBlur={e => e.target.style.borderColor='#e8e8e8'}/>
              <button onClick={handleSend} disabled={!msgText.trim()}
                style={{ width:40, height:40, borderRadius:12, background: msgText.trim()?'var(--orange)':'#e8e8e8', color:'#fff', border:'none', cursor: msgText.trim()?'pointer':'default', display:'grid', placeItems:'center', flexShrink:0, transition:'background .15s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
