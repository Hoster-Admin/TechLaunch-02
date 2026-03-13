import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, EmptyState, STATUS_MAP } from './shared.jsx';

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.suggestions({ status: filter })
      .then(({ data: d }) => setSuggestions(d.data?.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const sendReply = async id => {
    if (!replyText.trim()) { toast.error('Response required'); return; }
    try {
      await adminAPI.respondSuggestion(id, replyText);
      toast.success('Response sent!');
      setReplying(null);
      setReplyText('');
      load();
    } catch(e) { toast.error(e.message||'Failed'); }
  };

  const typeColor = { bug:'red', feature:'blue', general:'gray', feedback:'purple' };
  const FILTERS = [{key:'all',label:'All'},{key:'open',label:'Open'},{key:'responded',label:'Responded'},{key:'closed',label:'Closed'}];

  return (
    <SCard title="Suggestions & Feedback" sub={`${suggestions.length} items`}>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'14px 20px',borderBottom:'1px solid #F4F4F4'}}>
        {FILTERS.map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:filter===f.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:filter===f.key?'var(--orange)':'#E8E8E8',background:filter===f.key?'var(--orange)':'#fff',color:filter===f.key?'#fff':'#666'}}>{f.label}</button>
        ))}
      </div>
      <div>
        {loading ? <div style={{padding:40,textAlign:'center',color:'#AAAAAA',fontSize:13}}>Loading…</div>
        : suggestions.length===0 ? <EmptyState icon="💡" title="No suggestions yet" sub="User feedback will appear here"/>
        : suggestions.map(s=>(
          <div key={s.id} style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
              <div style={{width:32,height:32,borderRadius:9,background:s.avatar_color||'#E15033',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
                {(s.user_name||'U').split(' ').map(w=>w[0]).join('').slice(0,2)}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{s.user_name||'Anonymous'}</span>
                  {s.user_handle && <span style={{fontSize:11,color:'#AAAAAA'}}>@{s.user_handle}</span>}
                  <Badge variant={typeColor[s.type]||'gray'}>{s.type||'general'}</Badge>
                  {s.status==='responded' && <Badge variant="green">✓ Responded</Badge>}
                </div>
                <div style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{s.title}</div>
                <div style={{fontSize:13,color:'#666',marginTop:4}}>{s.body}</div>
                {s.admin_response && (
                  <div style={{marginTop:8,padding:'10px 14px',background:'#FFF8F6',border:'1px solid #FCE5DE',borderRadius:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--orange)',marginBottom:4}}>Admin Response</div>
                    <div style={{fontSize:12,color:'#666'}}>{s.admin_response}</div>
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <span style={{fontSize:11,color:'#AAAAAA'}}>{new Date(s.created_at).toLocaleDateString()}</span>
                {s.status!=='responded' && (
                  <button onClick={()=>{setReplying(s.id);setReplyText('');}} style={{padding:'5px 12px',borderRadius:8,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',color:'#0A0A0A'}}>Reply</button>
                )}
              </div>
            </div>
            {replying===s.id && (
              <div style={{marginLeft:44,marginTop:8}}>
                <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={3} placeholder="Type your response…"
                  style={{width:'100%',border:'1.5px solid #E8E8E8',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button onClick={()=>sendReply(s.id)} style={{padding:'8px 16px',borderRadius:9,border:'none',background:'var(--orange)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Send Reply</button>
                  <button onClick={()=>setReplying(null)} style={{padding:'8px 16px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#666'}}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </SCard>
  );
}
