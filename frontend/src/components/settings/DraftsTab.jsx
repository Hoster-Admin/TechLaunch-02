import React from 'react';
import toast from 'react-hot-toast';
import { communityAPI } from '../../utils/api';
import SubmitPostModal from '../home/SubmitPostModal';

export default function DraftsTab({
  myDrafts, setMyDrafts,
  draftsLoading,
  editDraft, setEditDraft,
}) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 }}>📝 My Drafts</div>
          <div style={{ fontSize:13, color:'#aaa' }}>Posts and articles you've saved but haven't published yet.</div>
        </div>
        <button onClick={() => setEditDraft({})}
          style={{ padding:'10px 18px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + New Post
        </button>
      </div>

      {draftsLoading ? (
        <div style={{ textAlign:'center', padding:60, color:'#ccc' }}>Loading drafts…</div>
      ) : !myDrafts || myDrafts.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>📝</div>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No drafts yet</div>
          <p style={{ color:'#888', marginBottom:24 }}>Start writing a post or article and save it as a draft.</p>
          <button onClick={() => setEditDraft({})}
            style={{ padding:'11px 24px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Write Something →
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {myDrafts.map(draft => (
            <div key={draft.id} style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'20px 24px', display:'flex', alignItems:'flex-start', gap:16 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', padding:'3px 8px', borderRadius:6, background: draft.type === 'article' ? '#f0f4ff' : '#fff3e8', color: draft.type === 'article' ? '#3366cc' : 'var(--orange)' }}>{draft.type}</span>
                  {draft.tag_name && <span style={{ fontSize:11, color:'#aaa', fontWeight:600 }}>{draft.tag_name}</span>}
                </div>
                {draft.title && <div style={{ fontSize:15, fontWeight:700, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{draft.title}</div>}
                <div style={{ fontSize:13, color:'#888', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{draft.body || <em style={{ color:'#ccc' }}>No content yet</em>}</div>
                <div style={{ fontSize:11, color:'#bbb', marginTop:8 }}>Saved {new Date(draft.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={() => setEditDraft(draft)}
                  style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', color:'#444' }}>
                  Edit
                </button>
                <button onClick={async () => {
                    if (!window.confirm('Delete this draft?')) return;
                    try {
                      await communityAPI.delete(draft.id);
                      setMyDrafts(prev => prev.filter(d => d.id !== draft.id));
                      toast.success('Draft deleted');
                    } catch { toast.error('Failed to delete'); }
                  }}
                  style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #fde8e8', background:'#fff8f8', fontSize:12, fontWeight:700, cursor:'pointer', color:'#e53e3e' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editDraft !== null && (
        <SubmitPostModal
          onClose={() => setEditDraft(null)}
          initialDraft={editDraft.id ? editDraft : undefined}
          defaultType={editDraft.type || 'post'}
          onPublished={(post) => {
            setMyDrafts(prev => prev ? prev.filter(d => d.id !== post.id) : prev);
            setEditDraft(null);
            toast.success('Published!');
          }}
          onSaved={(post) => {
            setMyDrafts(prev => prev ? prev.map(d => d.id === post.id ? post : d) : [post]);
            setEditDraft(null);
          }}
        />
      )}
    </div>
  );
}
