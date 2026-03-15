import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'all',      label: 'All Activity' },
  { key: 'comments', label: 'Comments' },
  { key: 'posts',    label: 'Posts' },
];

const KIND_BADGE = {
  comment: { label: 'Comment', color: '#2563eb', bg: '#eff6ff', icon: '💬' },
  post:    { label: 'Post',    color: '#7c3aed', bg: '#f5f3ff', icon: '📢' },
};

const POST_TYPE_LABEL = {
  update:    'Update',
  milestone: 'Milestone',
  feature:   'Feature',
  news:      'News',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ item }) {
  if (item.avatar_url) {
    return <img src={item.avatar_url} alt={item.user_name} style={{width:38,height:38,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
  }
  const colors = ['#E15033','#2563eb','#7c3aed','#16a34a','#d97706','#0891b2'];
  const bg = item.avatar_color || colors[(item.user_handle?.charCodeAt(0) || 0) % colors.length];
  const initials = (item.user_name || item.user_handle || '?').slice(0,2).toUpperCase();
  return (
    <div style={{width:38,height:38,borderRadius:'50%',background:bg,color:'#fff',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {initials}
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:18,padding:28,width:360,boxShadow:'0 20px 60px rgba(0,0,0,.18)'}}>
        <div style={{fontSize:17,fontWeight:700,color:'#0A0A0A',marginBottom:8}}>{title}</div>
        <div style={{fontSize:13,color:'#666',marginBottom:24,lineHeight:1.5}}>{message}</div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'8px 18px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#555'}}>Cancel</button>
          <button onClick={onConfirm} style={{padding:'8px 18px',borderRadius:9,border:'none',background:'#dc2626',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function WarnModal({ item, onSend, onCancel }) {
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const textRef = useRef(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const handleSend = async () => {
    if (!note.trim()) return toast.error('Please write a warning message');
    setSending(true);
    await onSend(note.trim());
    setSending(false);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:18,padding:28,width:440,boxShadow:'0 20px 60px rgba(0,0,0,.18)'}}>
        <div style={{fontSize:17,fontWeight:700,color:'#0A0A0A',marginBottom:4}}>⚠️ Send Warning</div>
        <div style={{fontSize:13,color:'#888',marginBottom:18}}>
          To <strong style={{color:'#0A0A0A'}}>@{item.user_handle}</strong> — this message will appear in their inbox and as a notification.
        </div>
        <textarea
          ref={textRef}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Write your warning message here…"
          rows={5}
          style={{width:'100%',borderRadius:10,border:'1.5px solid #E8E8E8',padding:'10px 12px',fontSize:13,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box',lineHeight:1.5}}
        />
        <div style={{fontSize:11,color:'#aaa',textAlign:'right',marginTop:4}}>{note.length}/2000</div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
          <button onClick={onCancel} style={{padding:'8px 18px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#555'}}>Cancel</button>
          <button onClick={handleSend} disabled={sending || !note.trim()} style={{padding:'8px 20px',borderRadius:9,border:'none',background:'#E15033',color:'#fff',fontSize:13,fontWeight:700,cursor:sending?'not-allowed':'pointer',opacity:sending||!note.trim()?0.6:1}}>
            {sending ? 'Sending…' : '↗ Send Warning'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LauncherActivity() {
  const [tab,     setTab]     = useState('all');
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page,    setPage]    = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [warnTarget,   setWarnTarget]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.launcherActivity({ type: tab, search, page })
      .then(r => {
        setItems(r.data.data.items || []);
        setTotal(r.data.data.total || 0);
      })
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setLoading(false));
  }, [tab, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleTabChange = (k) => { setTab(k); setPage(1); };
  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === 'comment') await adminAPI.deleteActivityComment(deleteTarget.id);
      else await adminAPI.deleteActivityPost(deleteTarget.id);
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      load();
    } catch(e) { toast.error(e.message || 'Delete failed'); }
  };

  const sendWarn = async (note) => {
    try {
      await adminAPI.warnUser(warnTarget.user_id, note);
      toast.success(`Warning sent to @${warnTarget.user_handle}`);
      setWarnTarget(null);
    } catch(e) { toast.error(e.message || 'Failed to send warning'); }
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Header controls */}
      <div style={{background:'#fff',borderRadius:16,border:'1.5px solid #E8E8E8',padding:'16px 20px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        {/* Tabs */}
        <div style={{display:'flex',gap:4,background:'#F5F5F5',borderRadius:10,padding:3}}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              style={{padding:'6px 14px',borderRadius:8,border:'none',background:tab===t.key?'#fff':'transparent',fontSize:12,fontWeight:tab===t.key?700:500,color:tab===t.key?'#0A0A0A':'#888',cursor:'pointer',boxShadow:tab===t.key?'0 1px 4px rgba(0,0,0,.08)':'none',transition:'all .15s'}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:200}}>
          <div style={{display:'flex',alignItems:'center',gap:8,border:'1.5px solid #E8E8E8',borderRadius:10,padding:'7px 12px',background:'#FAFAFA',flex:1}}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{color:'#aaa',flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by user, content, product…"
              style={{border:'none',background:'none',outline:'none',fontSize:12,fontFamily:'inherit',color:'#0A0A0A',width:'100%'}}/>
          </div>
          {(search || searchInput) && (
            <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              style={{padding:'7px 10px',borderRadius:8,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:11,color:'#888',cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>
              ✕ Clear
            </button>
          )}
        </form>

        <div style={{fontSize:12,color:'#aaa',fontWeight:500,whiteSpace:'nowrap'}}>{total.toLocaleString()} item{total!==1?'s':''}</div>
      </div>

      {/* Activity feed */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'60px 0',color:'#aaa',fontSize:14}}>Loading activity…</div>
        ) : items.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 0',color:'#aaa',fontSize:14}}>No activity found</div>
        ) : (
          items.map(item => {
            const badge = KIND_BADGE[item.kind] || KIND_BADGE.comment;
            return (
              <div key={`${item.kind}-${item.id}`}
                style={{background:'#fff',borderRadius:14,border:'1.5px solid #E8E8E8',padding:'16px 20px',display:'flex',gap:14,alignItems:'flex-start',transition:'box-shadow .15s'}}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                <Avatar item={item}/>
                <div style={{flex:1,minWidth:0}}>
                  {/* Row 1: name + badges + time */}
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#0A0A0A'}}>{item.user_name || item.user_handle}</span>
                    {item.verified && <span style={{fontSize:10,background:'#fffbeb',color:'#d97706',border:'1px solid #fde68a',borderRadius:5,padding:'1px 5px',fontWeight:700}}>✓ Verified</span>}
                    <span style={{fontSize:11,color:'#aaa'}}>@{item.user_handle}</span>
                    <span style={{flex:1}}/>
                    <span style={{fontSize:11,background:badge.bg,color:badge.color,borderRadius:6,padding:'2px 8px',fontWeight:700}}>{badge.icon} {badge.label}{item.post_type ? ` · ${POST_TYPE_LABEL[item.post_type]||item.post_type}` : ''}</span>
                    <span style={{fontSize:11,color:'#bbb'}} title={new Date(item.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}>
                      {timeAgo(item.created_at)}
                    </span>
                  </div>

                  {/* Row 2: content */}
                  <div style={{fontSize:13,color:'#444',lineHeight:1.55,marginBottom:8,wordBreak:'break-word'}}>
                    {item.body?.length > 300 ? item.body.slice(0,300)+'…' : item.body}
                  </div>

                  {/* Row 3: product link (comments only) + likes + actions */}
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    {item.kind === 'comment' && item.product_name && (
                      <span style={{fontSize:11,color:'#666',background:'#F5F5F5',borderRadius:6,padding:'3px 8px',fontWeight:500}}>
                        📦 {item.product_name}
                      </span>
                    )}
                    <span style={{fontSize:11,color:'#bbb'}}>❤️ {item.likes}</span>
                    <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                      <button
                        onClick={() => setWarnTarget(item)}
                        style={{padding:'5px 12px',borderRadius:8,border:'1.5px solid #fed7aa',background:'#fff7ed',fontSize:11,color:'#c2410c',cursor:'pointer',fontWeight:600,transition:'background .12s'}}
                        onMouseEnter={e => e.currentTarget.style.background='#ffedd5'}
                        onMouseLeave={e => e.currentTarget.style.background='#fff7ed'}>
                        ⚠️ Warn User
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        style={{padding:'5px 12px',borderRadius:8,border:'1.5px solid #fecaca',background:'#fff5f5',fontSize:11,color:'#dc2626',cursor:'pointer',fontWeight:600,transition:'background .12s'}}
                        onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background='#fff5f5'}>
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{display:'flex',justifyContent:'center',gap:8,paddingBottom:8}}>
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}
            style={{padding:'7px 16px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,color:page<=1?'#ccc':'#0A0A0A',cursor:page<=1?'not-allowed':'pointer'}}>
            ← Prev
          </button>
          <span style={{padding:'7px 14px',fontSize:12,color:'#888',fontWeight:500}}>Page {page} of {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}
            style={{padding:'7px 16px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,color:page>=totalPages?'#ccc':'#0A0A0A',cursor:page>=totalPages?'not-allowed':'pointer'}}>
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete this content?"
          message={`This will permanently remove this ${deleteTarget.kind} from the platform. This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {warnTarget && (
        <WarnModal
          item={warnTarget}
          onSend={sendWarn}
          onCancel={() => setWarnTarget(null)}
        />
      )}
    </div>
  );
}
