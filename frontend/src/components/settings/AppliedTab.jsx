import React from 'react';

export default function AppliedTab() {
  return (
    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:18, padding:'40px', textAlign:'center' }}>
      <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No applications yet</div>
      <p style={{ color:'#888' }}>Programs and opportunities you apply to will appear here.</p>
    </div>
  );
}
