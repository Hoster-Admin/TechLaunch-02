import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function Avatar({ name, color, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color || '#E8621A', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 800, color: '#fff' }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    open:      { bg: '#DBEAFE', color: '#1e40af', label: 'Open' },
    responded: { bg: '#DCFCE7', color: '#166534', label: 'Responded' },
  };
  const s = map[status] || map.open;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
      {s.label}
    </span>
  );
}

function RespondModal({ suggestion, onClose, onSuccess }) {
  const [text, setText] = useState(suggestion.admin_response || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim()) { toast.error('Please write a response'); return; }
    setLoading(true);
    try {
      await adminAPI.respondSuggestion(suggestion.id, text.trim());
      toast.success('Response saved');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to save response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} onClick={onClose}/>
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(0,0,0,.18)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20, lineHeight: 1 }}>✕</button>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, letterSpacing: '-.02em' }}>Respond to suggestion</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 14px', background: '#f8f8f8', borderRadius: 10 }}>
          <Avatar name={suggestion.user_name} color={suggestion.avatar_color} size={30}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{suggestion.user_name || 'Unknown'}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>@{suggestion.user_handle} · {timeAgo(suggestion.created_at)}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.7, marginBottom: 20, padding: '14px', background: '#FFFBF7', border: '1px solid rgba(232,98,26,.15)', borderRadius: 10 }}>
          {suggestion.body}
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>Your response (internal note)</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            placeholder="Write your response or internal note about this suggestion…"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 14, fontFamily: "'DM Sans',sans-serif", resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = '#e8e8e8'}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'var(--orange)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: loading ? 0.75 : 1 }}>
              {loading ? 'Saving…' : 'Save Response'}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: '12px 20px', borderRadius: 12, background: '#f4f4f4', color: '#555', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [responding, setResponding] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.suggestions({ status: filter });
      setSuggestions(res.data?.data?.suggestions || []);
    } catch {
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'open',      label: 'Open' },
    { key: 'responded', label: 'Responded' },
  ];

  const openCount = suggestions.filter(s => s.status === 'open').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            {openCount > 0 && ` · ${openCount} open`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: filter === f.key ? 700 : 500,
                cursor: 'pointer', border: '1.5px solid', fontFamily: "'DM Sans',sans-serif",
                borderColor: filter === f.key ? 'var(--orange)' : '#E8E8E8',
                background: filter === f.key ? 'var(--orange)' : '#fff',
                color: filter === f.key ? '#fff' : '#666' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14 }}>Loading…</div>
      ) : suggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 6 }}>No suggestions yet</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Suggestions from members will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {suggestions.map(s => (
            <div key={s.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar name={s.user_name} color={s.avatar_color}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{s.user_name || 'Unknown user'}</span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>@{s.user_handle}</span>
                    <span style={{ fontSize: 11, color: '#ccc' }}>·</span>
                    <span style={{ fontSize: 12, color: '#bbb' }}>{timeAgo(s.created_at)}</span>
                    <StatusBadge status={s.status}/>
                  </div>
                  <p style={{ fontSize: 14, color: '#333', lineHeight: 1.75, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
                    {s.body}
                  </p>

                  {s.admin_response && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                        Response from {s.responder_name || 'Admin'} · {s.responded_at ? timeAgo(s.responded_at) : ''}
                      </div>
                      <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {s.admin_response}
                      </p>
                    </div>
                  )}

                  <button onClick={() => setResponding(s)}
                    style={{ padding: '7px 18px', borderRadius: 9, background: s.admin_response ? '#f4f4f4' : 'var(--orange)',
                      color: s.admin_response ? '#555' : '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                    {s.admin_response ? 'Edit response' : 'Respond'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {responding && (
        <RespondModal
          suggestion={responding}
          onClose={() => setResponding(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
