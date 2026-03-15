import React, { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { labelStyle, fieldWrap, inputStyle } from './settingsConstants';

export default function SecurityTab() {
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword,     setNewPassword]        = useState('');
  const [confirmPassword, setConfirmPassword]    = useState('');
  const [saving,          setSaving]             = useState(false);
  const [showCurrent,     setShowCurrent]        = useState(false);
  const [showNew,         setShowNew]            = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword) { toast.error('Current password is required'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/users/me/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, show, onToggle }) => (
    <div style={{ marginBottom:20 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ ...fieldWrap, paddingRight:0 }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button type="button" onClick={onToggle}
          style={{ padding:'10px 14px', background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:16, flexShrink:0 }}>
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:16, padding:'32px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#0a0a0a', marginBottom:6 }}>🔒 Change Password</div>
        <div style={{ fontSize:13, color:'#888' }}>
          Choose a strong password — at least 8 characters.
        </div>
      </div>

      <Field
        label="Current Password"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Your current password"
        show={showCurrent}
        onToggle={() => setShowCurrent(v => !v)}
      />
      <Field
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="At least 8 characters"
        show={showNew}
        onToggle={() => setShowNew(v => !v)}
      />
      <div style={{ marginBottom:28 }}>
        <label style={labelStyle}>Confirm New Password</label>
        <div style={fieldWrap}>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        {confirmPassword && newPassword && confirmPassword !== newPassword && (
          <div style={{ fontSize:11, color:'#dc2626', marginTop:4, fontWeight:500 }}>Passwords do not match</div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{ padding:'12px 28px', borderRadius:12, background:'var(--orange)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1, transition:'opacity .15s', fontFamily:'Inter,sans-serif' }}>
        {saving ? 'Saving…' : 'Update Password'}
      </button>

      <div style={{ marginTop:40, paddingTop:28, borderTop:'1px solid #f0f0f0' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#0a0a0a', marginBottom:8 }}>Account Activity</div>
        <div style={{ fontSize:13, color:'#888', lineHeight:1.6 }}>
          If you notice any suspicious activity on your account, change your password immediately and contact us.
        </div>
      </div>
    </div>
  );
}
