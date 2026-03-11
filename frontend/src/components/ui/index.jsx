import React from 'react';

// ── Button
export const Button = ({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) => {
  const cls = {
    primary:   'btn-primary',
    ghost:     'btn-ghost',
    secondary: 'btn-ghost',
    outline:   'btn-ghost',
    danger:    'btn-danger',
  }[variant] || 'btn-primary';

  const sizeCls = { sm: 'btn-sm', lg: 'btn-lg', icon: 'btn-icon', md: '' }[size] || '';

  return (
    <button
      className={`${cls} ${sizeCls} ${loading ? 'opacity-60 pointer-events-none' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
};

// ── Badge
export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const v = { green:'badge-green', amber:'badge-amber', blue:'badge-blue', red:'badge-red', purple:'badge-purple', gray:'badge-gray', brand:'badge-brand' }[variant] || 'badge-gray';
  return <span className={`badge ${v} ${className}`}>{children}</span>;
};

export const StatusBadge = ({ status }) => {
  const map = {
    live:      { label: '● Live',         variant: 'green'  },
    pending:   { label: '● Pending',      variant: 'amber'  },
    soon:      { label: '● Coming Soon',  variant: 'blue'   },
    rejected:  { label: '● Rejected',     variant: 'red'    },
    draft:     { label: '● Draft',        variant: 'gray'   },
    active:    { label: '● Active',       variant: 'green'  },
    suspended: { label: '🚫 Suspended',   variant: 'red'    },
  };
  const cfg = map[status] || { label: status, variant: 'gray' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

// ── Avatar
export const Avatar = ({ name, color, src, size = 8, className = '' }) => {
  const px = ({ 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 })[size] || 32;
  const fs = ({ 6: 10, 8: 12, 10: 13, 12: 16, 16: 20 })[size] || 12;
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  if (src) return <img src={src} alt={name} style={{ width: px, height: px, borderRadius: '50%', objectFit: 'cover' }} className={className}/>;
  return (
    <div className={`avatar ${className}`} style={{ width: px, height: px, background: color || '#E15033', fontSize: fs }}>
      {initials}
    </div>
  );
};

// ── Spinner
export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 16, md: 24, lg: 40 }[size] || 24;
  return (
    <svg className="animate-spin" width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ color: '#E15033' }}>
      <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
};

export const LoadingPage = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <Spinner size="lg"/>
  </div>
);

// ── Modal
export const Modal = ({ open, onClose, title, subtitle, children, size = 'md', className = '' }) => {
  const maxW = { sm: 400, md: 500, lg: 720, xl: 900 }[size] || 500;
  if (!open) return null;
  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-backdrop" onClick={onClose}/>
      <div className={`modal-box animate-slide-up ${className}`} style={{ maxWidth: maxW }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 0' }}>
          <div>
            {title    && <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', margin: 0 }}>{title}</h2>}
            {subtitle && <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#AAAAAA', marginLeft: 12, marginTop: -4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
};

// ── Input
export const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div style={{ width: '100%' }}>
    {label && <label className="label">{label}</label>}
    <input ref={ref} className={`input ${error ? 'input-error' : ''} ${className}`} {...props}/>
    {error && <p className="form-error">{error}</p>}
  </div>
));

// ── Select
export const Select = ({ label, error, children, className = '', ...props }) => (
  <div style={{ width: '100%' }}>
    {label && <label className="label">{label}</label>}
    <select className={`input ${error ? 'input-error' : ''} ${className}`} {...props}>{children}</select>
    {error && <p className="form-error">{error}</p>}
  </div>
);

// ── Textarea
export const Textarea = React.forwardRef(({ label, error, className = '', rows = 4, ...props }, ref) => (
  <div style={{ width: '100%' }}>
    {label && <label className="label">{label}</label>}
    <textarea ref={ref} rows={rows} className={`input ${error ? 'input-error' : ''} ${className}`} style={{ resize: 'none' }} {...props}/>
    {error && <p className="form-error">{error}</p>}
  </div>
));

// ── Empty State
export const EmptyState = ({ icon = '📭', title, subtitle, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0A0A0A', margin: '0 0 6px' }}>{title}</h3>
    {subtitle && <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px' }}>{subtitle}</p>}
    {action}
  </div>
);

// ── Confirm Dialog
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant={variant} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Modal>
);

// ── Toggle
export const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button" role="switch" aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    style={{
      position: 'relative', display: 'inline-flex', width: 44, height: 24,
      borderRadius: 100, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: checked ? '#E15033' : '#E8E8E8', transition: 'background .2s',
      opacity: disabled ? 0.5 : 1, flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: checked ? 22 : 2,
      width: 20, height: 20, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'left .2s',
    }}/>
  </button>
);

// ── Pagination
export const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 32 }}>
      <button className="btn-ghost btn-sm" onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ opacity: page <= 1 ? .4 : 1 }}>← Prev</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1;
        return (
          <button key={p} onClick={() => onPage(p)} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
            background: p === page ? '#E15033' : 'transparent',
            color: p === page ? '#fff' : '#666',
            cursor: 'pointer', transition: 'all .15s',
          }}
            onMouseEnter={e => { if (p !== page) e.currentTarget.style.background = '#F4F4F4'; }}
            onMouseLeave={e => { if (p !== page) e.currentTarget.style.background = 'transparent'; }}
          >{p}</button>
        );
      })}
      <button className="btn-ghost btn-sm" onClick={() => onPage(page + 1)} disabled={page >= pages} style={{ opacity: page >= pages ? .4 : 1 }}>Next →</button>
    </div>
  );
};
