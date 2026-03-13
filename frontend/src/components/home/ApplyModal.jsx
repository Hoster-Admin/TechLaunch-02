import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

const STAGES = ['Pre-Idea','Idea','MVP','Pre-Seed','Seed','Series A','Series B+'];

export default function ApplyModal() {
  const { applyModal, setApplyModal, setAuthModal } = useUI();
  const { user, token } = useAuth();

  const [form, setForm]   = useState({ startup_name:'', stage:'', pitch:'', ask_amount:'', pitch_deck:'', description:'' });
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);
  const [err,  setErr]    = useState('');

  if (!applyModal) return null;

  const isInvestor = applyModal.mode === 'pitch';
  const entity     = applyModal.entity;

  const handleOverlay = ev => { if (ev.target === ev.currentTarget) setApplyModal(null); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setErr('');
    if (!user) { setApplyModal(null); setAuthModal('gate'); return; }

    if (isInvestor) {
      if (!form.ask_amount.trim() || !form.description.trim()) { setErr('Please fill in all required fields.'); return; }
    } else {
      if (!form.startup_name.trim() || !form.stage || !form.pitch.trim()) { setErr('Please fill in all required fields.'); return; }
    }

    setBusy(true);
    try {
      const endpoint = isInvestor ? '/api/pitches' : '/api/applications';
      const body     = isInvestor
        ? { entity_name: entity.name, ask_amount: form.ask_amount, pitch_deck: form.pitch_deck, description: form.description }
        : { entity_name: entity.name, startup_name: form.startup_name, stage: form.stage, pitch: form.pitch };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Submission failed');
      setDone(true);
    } catch(e) {
      setErr(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const tc = isInvestor
    ? { bg:'#eff6ff', color:'#2563eb' }
    : applyModal.typeColor || { bg:'#f5f3ff', color:'#7c3aed' };

  return (
    <div onClick={handleOverlay} style={{
      position:'fixed', inset:0, zIndex:2300,
      background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px',
    }}>
      <div style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:520,
        boxShadow:'0 24px 80px rgba(0,0,0,.22)',
        animation:'modalIn .2s ease', overflow:'hidden',
      }}>

        {/* Header */}
        <div style={{ padding:'28px 28px 24px', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:tc.bg, display:'grid', placeItems:'center', fontSize:20 }}>
                {entity.logo_emoji || entity.icon || '🏢'}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#0a0a0a' }}>{entity.name}</div>
                <div style={{ fontSize:12, color:'#aaa', fontWeight:600 }}>{entity.type} · {entity.country || 'MENA'}</div>
              </div>
            </div>
            <button onClick={() => setApplyModal(null)}
              style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #e8e8e8', background:'#f9f9f9', cursor:'pointer', fontSize:18, color:'#888', display:'grid', placeItems:'center' }}>
              ×
            </button>
          </div>
          <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:'-.03em', margin:'12px 0 4px' }}>
            {isInvestor ? '💼 Pitch to ' : '🚀 Apply to '}{entity.name}
          </h2>
          <p style={{ fontSize:13, color:'#888', margin:0 }}>
            {isInvestor
              ? 'Tell the team about your company and what you are raising.'
              : 'Share your startup story and why this program is the right fit.'}
          </p>
        </div>

        {done ? (
          <div style={{ padding:'48px 28px', textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>
              {isInvestor ? 'Pitch Sent!' : 'Application Submitted!'}
            </div>
            <div style={{ fontSize:14, color:'#777', marginBottom:28, lineHeight:1.6 }}>
              {isInvestor
                ? `The team at ${entity.name} will review your pitch and be in touch within 2–4 weeks.`
                : `${entity.name} will review your application and reach out through your registered email.`}
            </div>
            <button onClick={() => setApplyModal(null)}
              style={{ padding:'12px 32px', borderRadius:12, background:'var(--orange)', color:'#fff', border:'none', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <div style={{ padding:'24px 28px 28px' }}>
            {!isInvestor ? (
              <>
                <Label>Startup Name *</Label>
                <Input
                  placeholder="e.g. Nowly"
                  value={form.startup_name}
                  onChange={v => set('startup_name', v)}
                />
                <Label>Current Stage *</Label>
                <select
                  value={form.stage}
                  onChange={e => set('stage', e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:14, fontWeight:600, color: form.stage ? '#0a0a0a' : '#aaa', marginBottom:16, outline:'none', background:'#fff', cursor:'pointer' }}>
                  <option value="" disabled>Select your stage…</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Label>Your Pitch *</Label>
                <textarea
                  placeholder={`What problem are you solving, who is your customer, and why is ${entity.name} the right partner?`}
                  value={form.pitch}
                  onChange={e => set('pitch', e.target.value)}
                  rows={5}
                  style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:14, lineHeight:1.6, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:16 }}
                />
              </>
            ) : (
              <>
                <Label>Funding Ask *</Label>
                <Input
                  placeholder="e.g. $500K for 8% equity"
                  value={form.ask_amount}
                  onChange={v => set('ask_amount', v)}
                />
                <Label>Pitch Deck URL</Label>
                <Input
                  placeholder="https://docsend.com/your-deck (optional)"
                  value={form.pitch_deck}
                  onChange={v => set('pitch_deck', v)}
                />
                <Label>Tell Us About Your Startup *</Label>
                <textarea
                  placeholder={`What are you building, what traction do you have, and why ${entity.name}?`}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={5}
                  style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:14, lineHeight:1.6, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:16 }}
                />
              </>
            )}

            {err && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'#fff1f0', border:'1px solid #ffccc7', color:'#cf1322', fontSize:13, fontWeight:600, marginBottom:16 }}>
                {err}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={busy}
              style={{ width:'100%', padding:'14px', borderRadius:12, background: busy ? '#ddd' : 'var(--orange)', color:'#fff', border:'none', fontSize:15, fontWeight:800, cursor: busy ? 'not-allowed' : 'pointer', transition:'opacity .15s' }}>
              {busy ? 'Submitting…' : isInvestor ? '💼 Send Pitch' : '🚀 Submit Application'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'#888', marginBottom:6 }}>
      {children}
    </div>
  );
}

function Input({ placeholder, value, onChange }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:14, fontWeight:600, outline:'none', marginBottom:16, boxSizing:'border-box' }}
    />
  );
}
