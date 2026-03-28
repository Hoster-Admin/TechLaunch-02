import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../utils/api.js';
import toast from 'react-hot-toast';
import { SCard, Badge, Tbl, ActionBtn, EmptyState, SkeletonRows, Pagination } from './shared.jsx';

const STATUS_TABS = [
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all',      label: 'All' },
];

const STATUS_BADGE = {
  pending:  'amber',
  approved: 'green',
  rejected: 'red',
};

const TYPE_LABELS = {
  startup:       'Company',
  accelerator:   'Accelerator',
  investor:      'Investor',
  venture_studio: 'Venture Studio',
};

function Avatar({ name, avatarUrl, color, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color || '#E15033', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 20;

export default function EntityClaims() {
  const [claims, setClaims]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [tab, setTab]         = useState('pending');
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.entityClaims({ status: tab, page, limit: PAGE_SIZE })
      .then(({ data: d }) => {
        setClaims(d.data || []);
        setTotal(d.pagination?.total || 0);
      })
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (claim) => {
    setActing(p => ({ ...p, [claim.id]: 'approve' }));
    try {
      await adminAPI.approveEntityClaim(claim.id);
      toast.success(`Approved: ${claim.user_name} → ${claim.entity_name}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to approve claim');
    } finally {
      setActing(p => ({ ...p, [claim.id]: null }));
    }
  };

  const handleReject = async (claim) => {
    setActing(p => ({ ...p, [claim.id]: 'reject' }));
    try {
      await adminAPI.rejectEntityClaim(claim.id);
      toast.success(`Rejected claim from ${claim.user_name}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to reject claim');
    } finally {
      setActing(p => ({ ...p, [claim.id]: null }));
    }
  };

  return (
    <>
      <SCard
        title="Entity Claims"
        sub="Users requesting to be associated with an entity"
        action={
          <div style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>
            {total} {tab === 'all' ? 'total' : tab} claim{total !== 1 ? 's' : ''}
          </div>
        }
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid #F4F4F4', overflowX: 'auto' }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                background: tab === t.key ? 'var(--orange)' : '#F4F4F4',
                color: tab === t.key ? '#fff' : '#555',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Tbl heads={['User', 'Entity', 'Status', 'Submitted', 'Actions']}>
          {loading ? (
            <SkeletonRows cols={5} rows={6} />
          ) : claims.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState icon="🏢" title="No claims found" sub={`No ${tab === 'all' ? '' : tab + ' '}entity claims at this time`} />
              </td>
            </tr>
          ) : (
            claims.map(claim => (
              <tr key={claim.id} style={{ borderBottom: '1px solid #F4F4F4' }}>
                {/* User */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={claim.user_name} avatarUrl={claim.user_avatar_url} color={claim.user_avatar_color} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{claim.user_name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>@{claim.user_handle}</div>
                    </div>
                  </div>
                </td>

                {/* Entity */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {claim.entity_logo_url
                      ? <img src={claim.entity_logo_url} alt={claim.entity_name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{claim.entity_logo_emoji || '🏢'}</div>
                    }
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{claim.entity_name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{TYPE_LABELS[claim.entity_type] || claim.entity_type}{claim.entity_country ? ` · ${claim.entity_country}` : ''}</div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant={STATUS_BADGE[claim.status] || 'gray'}>
                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </Badge>
                </td>

                {/* Date */}
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                  {fmtDate(claim.created_at)}
                  {claim.reviewed_by_name && (
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                      By {claim.reviewed_by_name}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td style={{ padding: '12px 16px' }}>
                  {claim.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn
                        variant="approve"
                        loading={acting[claim.id] === 'approve'}
                        disabled={!!acting[claim.id]}
                        onClick={() => handleApprove(claim)}
                      >
                        Approve
                      </ActionBtn>
                      <ActionBtn
                        variant="reject"
                        loading={acting[claim.id] === 'reject'}
                        disabled={!!acting[claim.id]}
                        onClick={() => handleReject(claim)}
                      >
                        Reject
                      </ActionBtn>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#bbb' }}>
                      {claim.reviewed_at ? fmtDate(claim.reviewed_at) : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </Tbl>

        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
      </SCard>
    </>
  );
}
