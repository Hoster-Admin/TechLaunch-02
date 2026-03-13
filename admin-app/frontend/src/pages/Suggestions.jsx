import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { EmptyState } from './shared.jsx';

const FILTERS = [
  {key:'all',label:'All'},
  {key:'open',label:'Open'},
  {key:'responded',label:'Responded'},
];

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
    } catch(e) { toast.error(e.message || 'Failed'); }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Suggestions & Feedback</span>
        <span style={{fontSize:12,color:'var(--gray-400)'}}>{suggestions.length} items</span>
      </div>

      <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'12px 20px',borderBottom:'1px solid var(--gray-100)'}}>
        {FILTERS.map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'5px 14px',borderRadius:99,fontSize:12,fontWeight:filter===f.key?700:500,cursor:'pointer',border:'1.5px solid',borderColor:filter===f.key?'var(--orange)':'var(--gray-200)',background:filter===f.key?'var(--orange)':'#fff',color:filter===f.key?'#fff':'var(--gray-500)',fontFamily:'inherit'}}>
            {f.label}
          </button>
        ))}
      </div>

      <div>
        {loading
          ? <div style={{padding:40,textAlign:'center',color:'var(--gray-400)',fontSize:13}}>Loading…</div>
          : suggestions.length===0
            ? <EmptyState icon="💡" title="No suggestions yet" sub="User feedback will appear here"/>
            : suggestions.map(s => (
              <div key={s.id} style={{padding:'16px 20px',borderBottom:'1px solid var(--gray-100)'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:s.avatar_color||'var(--orange)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
                    {(s.user_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:700,color:'var(--ink)'}}>{s.user_name||'Anonymous'}</span>
                      {s.user_handle && <span style={{fontSize:11,color:'var(--gray-400)'}}>@{s.user_handle}</span>}
                      {s.status==='responded'
                        ? <span className="badge badge-green">✓ Responded</span>
                        : <span className="badge badge-blue">● Open</span>}
                    </div>
                    <div style={{fontSize:13,color:'var(--ink)',lineHeight:1.5}}>{s.body}</div>
                    {s.admin_response && (
                      <div style={{marginTop:10,padding:'10px 14px',background:'var(--orange-light)',border:'1px solid var(--orange-mid)',borderRadius:10}}>
                        <div style={{fontSize:11,fontWeight:700,color:'var(--orange)',marginBottom:4}}>Admin Response</div>
                        <div style={{fontSize:12,color:'var(--gray-600)'}}>{s.admin_response}</div>
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8,flexShrink:0}}>
                    <span style={{fontSize:11,color:'var(--gray-400)'}}>{new Date(s.created_at).toLocaleDateString()}</span>
                    {s.status!=='responded' && (
                      <button onClick={()=>{setReplying(replying===s.id?null:s.id);setReplyText('');}}
                        style={{padding:'5px 12px',borderRadius:8,border:'1.5px solid var(--gray-200)',background:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'var(--ink)'}}>
                        {replying===s.id ? 'Cancel' : 'Reply'}
                      </button>
                    )}
                  </div>
                </div>
                {replying===s.id && (
                  <div style={{marginLeft:44,marginTop:12}}>
                    <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={3}
                      placeholder="Write your response to the user…"
                      style={{width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'10px 14px',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}
                      onFocus={e=>e.target.style.borderColor='var(--orange)'}
                      onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      <button onClick={()=>sendReply(s.id)} className="btn-primary">Send Reply</button>
                      <button onClick={()=>setReplying(null)} className="btn-ghost">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
