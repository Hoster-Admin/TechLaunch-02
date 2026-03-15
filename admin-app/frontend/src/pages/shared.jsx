import React, { useEffect } from 'react';

// ─── Date Formatter ──────────────────────────────────────────────────────────
export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─── SCard ───────────────────────────────────────────────────────────────────
export function SCard({ title, sub, children, action }) {
  if (!title) return (
    <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden',marginBottom:20}}>{children}</div>
  );
  return (
    <div style={{background:'#fff',borderRadius:16,border:'1px solid #E8E8E8',overflow:'hidden',marginBottom:20}}>
      <div style={{padding:'16px 20px',borderBottom:'1px solid #F4F4F4',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:'#0A0A0A'}}>{title}</div>
          {sub && <div style={{fontSize:11,color:'#AAAAAA'}}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant='gray' }) {
  const map = {
    green:  {bg:'#DCFCE7',color:'#166534'}, blue:  {bg:'#DBEAFE',color:'#1e40af'},
    amber:  {bg:'#FEF3C7',color:'#92400E'}, red:   {bg:'#FEE2E2',color:'#991B1B'},
    purple: {bg:'#F3E8FF',color:'#6b21a8'}, orange:{bg:'#FCEEE9',color:'var(--orange)'},
    gray:   {bg:'#F4F4F4',color:'#666'},
  };
  const s = map[variant]||map.gray;
  return <span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,whiteSpace:'nowrap'}}>{children}</span>;
}

// ─── Tbl ──────────────────────────────────────────────────────────────────────
export function Tbl({ heads, children }) {
  return (
    <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
      <table style={{width:'100%',borderCollapse:'collapse',minWidth:480}}>
        <thead>
          <tr style={{borderBottom:'1px solid #F4F4F4'}}>
            {heads.map((h,i)=><th key={i} style={{padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap'}}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
const ACTION_STYLES = {
  approve:  {bg:'#DCFCE7',color:'#166534',hbg:'#BBF7D0'},
  reject:   {bg:'#FEE2E2',color:'#991B1B',hbg:'#FECACA'},
  verify:   {bg:'#DBEAFE',color:'#1e40af',hbg:'#BFDBFE'},
  warn:     {bg:'#F4F4F4',color:'#374151',hbg:'#E5E7EB'},
  suspend:  {bg:'#FEF3C7',color:'#92400E',hbg:'#FDE68A'},
  reinstate:{bg:'#DCFCE7',color:'#166534',hbg:'#BBF7D0'},
  edit:     {bg:'#F4F4F4',color:'#0A0A0A',hbg:'#E8E8E8'},
  delete:   {bg:'#FEE2E2',color:'#991B1B',hbg:'#FECACA'},
};

export function ActionBtn({ variant='edit', onClick, children, loading, disabled }) {
  const s = ACTION_STYLES[variant]||ACTION_STYLES.edit;
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{padding:'5px 10px',borderRadius:8,fontSize:11,fontWeight:700,cursor:(loading||disabled)?'not-allowed':'pointer',border:'none',background:s.bg,color:s.color,whiteSpace:'nowrap',fontFamily:'inherit',opacity:(loading||disabled)?0.5:1,transition:'background .1s'}}
      onMouseEnter={e=>{ if(!loading&&!disabled) e.currentTarget.style.background=s.hbg; }}
      onMouseLeave={e=>{ e.currentTarget.style.background=s.bg; }}>
      {loading?'…':children}
    </button>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon='📦', title, sub }) {
  return (
    <div style={{padding:'48px 20px',textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:700,color:'#0A0A0A'}}>{title}</div>
      {sub && <div style={{fontSize:12,color:'#AAAAAA',marginTop:4}}>{sub}</div>}
    </div>
  );
}

// ─── SkeletonRows ─────────────────────────────────────────────────────────────
export function SkeletonRows({ cols=5, rows=6 }) {
  return (
    <>
      {[...Array(rows)].map((_,i) => (
        <tr key={i}>
          {[...Array(cols)].map((_,j) => (
            <td key={j} style={{padding:'13px 16px'}}>
              <div style={{height:12,borderRadius:6,background:'#F0F0F0',animation:'pulse 1.4s ease-in-out infinite',width:j===0?'40%':j===1?'70%':'55%'}}/>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderTop:'1px solid #F4F4F4',fontSize:12,color:'#888'}}>
      <span>Showing <strong style={{color:'#0A0A0A'}}>{from}–{to}</strong> of <strong style={{color:'#0A0A0A'}}>{total.toLocaleString()}</strong></span>
      <div style={{display:'flex',gap:6}}>
        <button disabled={page<=1} onClick={()=>onChange(page-1)}
          style={{padding:'5px 12px',borderRadius:8,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,color:page<=1?'#ccc':'#0A0A0A',cursor:page<=1?'not-allowed':'pointer'}}>
          ← Prev
        </button>
        <span style={{padding:'5px 10px',fontSize:12,color:'#888'}}>Page {page} of {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=>onChange(page+1)}
          style={{padding:'5px 12px',borderRadius:8,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:12,fontWeight:600,color:page>=totalPages?'#ccc':'#0A0A0A',cursor:page>=totalPages?'not-allowed':'pointer'}}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
export function ConfirmModal({ title, message, confirmLabel='Confirm', danger=true, onConfirm, onCancel, loading=false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onCancel}>
      <div style={{background:'#fff',borderRadius:18,padding:28,width:400,maxWidth:'90vw',boxShadow:'0 24px 64px rgba(0,0,0,.22)'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,color:'#0A0A0A',marginBottom:8}}>{title}</div>
        <div style={{fontSize:13,color:'#555',marginBottom:24,lineHeight:1.55}}>{message}</div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'9px 20px',borderRadius:9,border:'1.5px solid #E8E8E8',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'#555',fontFamily:'inherit'}}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{padding:'9px 20px',borderRadius:9,border:'none',background:danger?'#dc2626':'var(--orange)',color:'#fff',fontSize:13,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?0.6:1}}>
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Drawer (side panel) ──────────────────────────────────────────────────────
export function Drawer({ title, subtitle, onClose, children, width=480 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:800}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,bottom:0,width,maxWidth:'95vw',background:'#fff',zIndex:801,display:'flex',flexDirection:'column',boxShadow:'-8px 0 40px rgba(0,0,0,.15)',animation:'slideInRight .2s ease-out'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #F0F0F0',display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:'#0A0A0A'}}>{title}</div>
            {subtitle && <div style={{fontSize:12,color:'#888',marginTop:2}}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{background:'#F4F4F4',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',fontSize:14,color:'#555',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:12}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── DrawerField ──────────────────────────────────────────────────────────────
export function DrawerField({ label, children }) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>{label}</div>
      <div style={{fontSize:13,color:'#0A0A0A',lineHeight:1.5}}>{children || <span style={{color:'#ccc'}}>—</span>}</div>
    </div>
  );
}

export const STATUS_MAP = {
  live:       {v:'green', l:'Live'},
  pending:    {v:'amber', l:'Pending'},
  soon:       {v:'blue',  l:'Coming Soon'},
  rejected:   {v:'red',   l:'Rejected'},
  accepted:   {v:'green', l:'Accepted'},
  reviewing:  {v:'blue',  l:'Reviewing'},
  interested: {v:'green', l:'Interested'},
  'follow-up':{v:'blue',  l:'Follow-up'},
  sent:       {v:'amber', l:'Sent'},
  responded:  {v:'green', l:'Responded'},
  open:       {v:'blue',  l:'Open'},
  closed:     {v:'gray',  l:'Closed'},
};
