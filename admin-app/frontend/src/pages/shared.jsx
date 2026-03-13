import React from 'react';

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

export function Tbl({ heads, children }) {
  return (
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead>
        <tr style={{borderBottom:'1px solid #F4F4F4'}}>
          {heads.map(h=><th key={h} style={{padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#AAAAAA',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap'}}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const ACTION_STYLES = {
  approve: {bg:'#DCFCE7',color:'#166534',hbg:'#BBF7D0'},
  reject:  {bg:'#FEE2E2',color:'#991B1B',hbg:'#FECACA'},
  verify:  {bg:'#DBEAFE',color:'#1e40af',hbg:'#BFDBFE'},
  suspend: {bg:'#FEF3C7',color:'#92400E',hbg:'#FDE68A'},
  reinstate:{bg:'#DCFCE7',color:'#166534',hbg:'#BBF7D0'},
  edit:    {bg:'#F4F4F4',color:'#0A0A0A',hbg:'#E8E8E8'},
  delete:  {bg:'#FEE2E2',color:'#991B1B',hbg:'#FECACA'},
};

export function ActionBtn({ variant='edit', onClick, children, loading }) {
  const s = ACTION_STYLES[variant]||ACTION_STYLES.edit;
  return (
    <button onClick={onClick} disabled={loading}
      style={{padding:'5px 10px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',border:'none',background:s.bg,color:s.color,whiteSpace:'nowrap',fontFamily:'inherit',opacity:loading?0.5:1}}>
      {loading?'…':children}
    </button>
  );
}

export function EmptyState({ icon='📦', title, sub }) {
  return (
    <div style={{padding:'48px 20px',textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:700,color:'#0A0A0A'}}>{title}</div>
      {sub && <div style={{fontSize:12,color:'#AAAAAA',marginTop:4}}>{sub}</div>}
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
