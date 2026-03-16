import React from 'react';
import { DRAFT_KEY } from './settingsConstants';
import SubmitProductForm from './SubmitProductForm';
import toast from 'react-hot-toast';

export default function ProductsTab({
  user,
  showSubmitForm, setShowSubmitForm,
  submitDraft, setSubmitDraft,
  localDraft, setLocalDraft,
  myProducts, myProductsLoading,
}) {
  return (
    <div>
      {showSubmitForm ? (
        <SubmitProductForm
          user={user}
          initialDraft={submitDraft}
          onSuccess={(name) => {
            toast.success(`${name} submitted!`);
            setLocalDraft(null);
            setShowSubmitForm(false);
            setSubmitDraft(null);
          }}
          onCancel={() => { setShowSubmitForm(false); setSubmitDraft(null); }}
        />
      ) : (
        <>
          {localDraft && localDraft.form?.name && (
            <div style={{ background:'#fff9f7', border:'1.5px solid #ffd6c2', borderRadius:16, padding:20, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                  {localDraft.form.logoEmoji || '🚀'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:2 }}>
                    <div style={{ fontSize:15, fontWeight:800 }}>{localDraft.form.name}</div>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#ffd6c2', color:'#c0600a' }}>DRAFT</span>
                  </div>
                  <div style={{ fontSize:12, color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{localDraft.form.tagline || 'No tagline yet'}</div>
                  {localDraft.savedAt && <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>Saved {new Date(localDraft.savedAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</div>}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <button onClick={() => { setSubmitDraft(localDraft); setShowSubmitForm(true); }}
                  style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', background:'var(--orange)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  Continue Draft →
                </button>
                <button onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch {} setLocalDraft(null); toast.success('Draft deleted'); }}
                  style={{ flexShrink:0, padding:'10px 16px', borderRadius:10, border:'1.5px solid #e8e8e8', background:'#fff', color:'#e63946', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          )}

          {myProductsLoading ? (
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'48px 40px', textAlign:'center', color:'#aaa', fontSize:14 }}>
              Loading your products…
            </div>
          ) : myProducts && myProducts.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[{key:'pending',bg:'#FEF3C7',color:'#92400E',label:'⏳ Under Review'},{key:'rejected',bg:'#FEE2E2',color:'#991B1B',label:'✕ Not Approved'},{key:'live',bg:'#DCFCE7',color:'#166534',label:'✓ Live'},{key:'soon',bg:'#DBEAFE',color:'#1e40af',label:'⏳ Coming Soon'}].map(({ key, bg, color, label }) => {
                const group = myProducts.filter(p => p.status === key);
                if (!group.length) return null;
                return group.map(p => (
                  <div key={p.id} style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:20, display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:'#f4f4f4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
                      {p.logo_emoji || '📦'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <div style={{ fontSize:15, fontWeight:800, color:'#0a0a0a' }}>{p.name}</div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:99, background:bg, color }}>{label}</span>
                      </div>
                      <div style={{ fontSize:13, color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.tagline}</div>
                      {p.status === 'rejected' && p.rejected_reason && (
                        <div style={{ fontSize:12, color:'#991B1B', marginTop:4, background:'#FEF2F2', borderRadius:6, padding:'4px 8px', display:'inline-block' }}>
                          Reason: {p.rejected_reason}
                        </div>
                      )}
                      {p.status === 'pending' && (
                        <div style={{ fontSize:11, color:'#92400E', marginTop:4 }}>Usually reviewed within 24 hours</div>
                      )}
                    </div>
                    {p.status === 'live' && (
                      <a href={`/products/${p.id}`} target="_blank" rel="noreferrer"
                        style={{ padding:'8px 16px', borderRadius:10, background:'var(--orange)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', textDecoration:'none', whiteSpace:'nowrap' }}>
                        View Live →
                      </a>
                    )}
                  </div>
                ));
              })}
              <button onClick={() => { setSubmitDraft(null); setShowSubmitForm(true); }}
                style={{ padding:'13px 0', borderRadius:12, background:'#f4f4f4', color:'#444', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', marginTop:4 }}>
                + Submit Another Product
              </button>
            </div>
          ) : (
            <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'48px 40px', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🚀</div>
              <div style={{ fontSize:19, fontWeight:800, marginBottom:8 }}>No products yet</div>
              <p style={{ color:'#888', marginBottom:24, lineHeight:1.6 }}>Ready to launch? Submit your product and get discovered by the MENA tech community.</p>
              <button onClick={() => { setSubmitDraft(null); setShowSubmitForm(true); }}
                style={{ padding:'13px 28px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:15, fontWeight:800, cursor:'pointer' }}>
                Submit a Product 🚀
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
