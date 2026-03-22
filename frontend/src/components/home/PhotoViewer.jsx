import React, { useEffect } from 'react';

export default function PhotoViewer({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, cursor: 'zoom-out',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 18, right: 22,
          background: 'rgba(255,255,255,.15)', border: 'none',
          borderRadius: '50%', width: 38, height: 38, cursor: 'pointer',
          color: '#fff', fontSize: 20, display: 'grid', placeItems: 'center',
          lineHeight: 1, zIndex: 1,
        }}
        aria-label="Close"
      >✕</button>
      <img
        src={src}
        alt={alt || 'Photo'}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          borderRadius: 12, objectFit: 'contain',
          boxShadow: '0 24px 80px rgba(0,0,0,.5)',
          cursor: 'default',
        }}
      />
    </div>
  );
}
