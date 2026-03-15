import React from 'react';

export default function MessagesTab({
  threads, activeThread, setActiveThread,
  user, settingsMsgs,
  msgInput, setMsgInput, sendMsg, settingsSending,
  settingsMsgScrollRef, currentThread,
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const showThreads = !activeThread || !isMobile;
  const showChat    = !!activeThread;

  return (
    <div>
      <style>{`
        .msg-mobile-back { display:none; }
        @media(max-width:768px){
          .adm-msg-wrap {
            display:flex !important;
            flex-direction:column !important;
            min-height:0 !important;
            border-radius:14px !important;
          }
          .adm-threads { max-height:none !important; border-right:none !important; }
          .adm-threads-panel { display:block; }
          .adm-threads-panel.hidden { display:none !important; }
          .adm-chat-panel { display:flex; flex-direction:column; flex:1; }
          .adm-chat-panel.hidden { display:none !important; }
          .msg-mobile-back {
            display:flex !important; align-items:center; gap:8px;
            padding:10px 14px 0; font-size:13px; font-weight:700;
            color:var(--orange); background:none; border:none; cursor:pointer;
            font-family:'DM Sans',sans-serif;
          }
          .adm-chat-area { flex:1; }
        }
      `}</style>
      <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>💬 Messages</div>
      <div style={{ fontSize:13, color:'#aaa', marginBottom:20 }}>Your conversations.</div>
      <div className="adm-msg-wrap">

        {/* Thread list — hidden on mobile when a chat is open */}
        <div className={`adm-threads adm-threads-panel${(activeThread && isMobile) ? ' hidden' : ''}`}>
          <div className="adm-threads-hd">Conversations</div>
          {threads.length === 0
            ? <div style={{ padding:'24px 16px', fontSize:13, color:'#ccc' }}>No conversations yet.<br/>Visit someone's profile and hit Message.</div>
            : threads.map(t => {
                const initials = (t.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
                return (
                  <div key={t.handle} className={`adm-thread${activeThread===t.handle?' sel':''}`} onClick={()=>setActiveThread(t.handle)}>
                    {t.avatar_url
                      ? <img src={t.avatar_url} alt={t.name} style={{ width:36,height:36,borderRadius:'50%',objectFit:'cover',flexShrink:0 }}/>
                      : <div className="adm-thread-av" style={{ background:t.avatar_color||'var(--orange)' }}>{initials}</div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="adm-thread-name" style={{ display:'flex', alignItems:'center', gap:4 }}>
                        {t.name}
                        {t.unread_count > 0 && <span style={{ width:16,height:16,borderRadius:'50%',background:'var(--orange)',color:'#fff',fontSize:9,fontWeight:900,display:'inline-grid',placeItems:'center' }}>{t.unread_count}</span>}
                      </div>
                      <div className="adm-thread-prev">{t.last_sender_id===user?.id?'You: ':''}{t.last_message||''}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Chat area — hidden on mobile when no thread selected */}
        <div className={`adm-chat-panel${(!activeThread && isMobile) ? ' hidden' : ''}`} style={{ display:'flex', flexDirection:'column', flex:1, minWidth:0 }}>
          {/* Mobile back button */}
          {activeThread && (
            <button className="msg-mobile-back" onClick={() => setActiveThread(null)}>
              ← Back to conversations
            </button>
          )}
          <div className="adm-chat-area" style={{ flex:1, display:'flex', flexDirection:'column' }}>
            {!activeThread ? (
              <div className="adm-chat-empty">
                <div>
                  <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#ccc' }}>Select a conversation</div>
                </div>
              </div>
            ) : (
              <>
                <div className="adm-chat-hd">{currentThread?.name || activeThread}</div>
                <div className="adm-bubbles" ref={settingsMsgScrollRef}>
                  {settingsMsgs.length === 0
                    ? <div style={{ textAlign:'center', color:'#ccc', fontSize:12, margin:'auto' }}>No messages yet. Say hello! 👋</div>
                    : settingsMsgs.map(m => {
                        const isMe = m.sender_id === user?.id;
                        const time = new Date(m.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
                        return (
                          <div key={m.id} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', marginBottom:6 }}>
                            <div className={`adm-bubble ${isMe?'mine':'theirs'}`}>
                              {m.body}
                              <div style={{ fontSize:10, opacity:.5, marginTop:3, textAlign:'right' }}>{time}</div>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
                <div className="adm-composer">
                  <input className="adm-compose-input" value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                    placeholder="Type a message…" onKeyDown={e=>e.key==='Enter'&&sendMsg()} disabled={settingsSending}/>
                  <button className="adm-compose-send" onClick={sendMsg} disabled={settingsSending}>↑</button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
