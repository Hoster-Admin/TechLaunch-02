const BASE = '/api';

function getToken() {
  return localStorage.getItem('tlmena_admin_token');
}

function setToken(t) {
  if (t) localStorage.setItem('tlmena_admin_token', t);
  else localStorage.removeItem('tlmena_admin_token');
}

async function req(method, path, body, isFormData = false, responseType = 'json') {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (responseType === 'blob') {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: await res.blob(), status: res.status };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return { data, status: res.status };
}

export const authAPI = {
  login:  (body) => req('POST', '/auth/login', body),
  me:     ()     => req('GET',  '/auth/me'),
};

export const adminAPI = {
  dashboard:    ()          => req('GET',  '/admin/dashboard'),
  products:     (p={})      => req('GET',  '/admin/products?' + new URLSearchParams(p)),
  approveProduct: (id, note) => req('POST', `/admin/products/${id}/approve`, { note: note || null }),
  rejectProduct:  (id, r)   => req('POST', `/admin/products/${id}/reject`, { reason: r }),
  featured:     (id)        => req('POST', `/admin/products/${id}/featured`),
  users:        (p={})      => req('GET',  '/admin/users?' + new URLSearchParams(p)),
  createUser:   (body)      => req('POST', '/admin/users', body),
  team:             ()          => req('GET',  '/admin/users/team'),
  updateTeamMember: (id, body)  => req('PUT',  `/admin/users/team/${id}`, body),
  verifyUser:   (id)        => req('POST', `/admin/users/${id}/verify`),
  suspendUser:  (id)        => req('POST', `/admin/users/${id}/suspend`),
  reinstateUser:(id)        => req('POST', `/admin/users/${id}/reinstate`),
  deleteTeamMember:(id)     => req('DELETE', `/admin/users/${id}`),
  entities:           (p={})  => req('GET',  '/admin/entities?' + new URLSearchParams(p)),
  createEntity:       (body)  => req('POST', '/admin/entities', body),
  verifyEntity:       (id)    => req('POST', `/admin/entities/${id}/verify`),
  bulkImportEntities: (file)  => {
    const fd = new FormData(); fd.append('file', file);
    return req('POST', '/admin/entities/bulk-import', fd, true);
  },
  downloadEntityTemplate: () => req('GET', '/admin/entities/csv-template', null, false, 'blob'),
  applications: ()          => req('GET',  '/admin/applications'),
  updateAccelApp: (id, body)=> req('PATCH', `/admin/applications/accelerator/${id}`, body),
  updatePitch:    (id, body)=> req('PATCH', `/admin/applications/pitches/${id}`, body),
  bulkProducts: (body)      => req('POST', '/admin/products/bulk', body),
  bulkUsers:    (body)      => req('POST', '/admin/users/bulk', body),
  activityLog:  (p={})       => req('GET',  '/admin/activity-log?' + new URLSearchParams(p)),
  activityLogActions: ()     => req('GET',  '/admin/activity-log/actions'),
  saveBanner:         (body) => req('PUT',  '/admin/platform/banner', body),
  saveEditorsPick:    (body) => req('PUT',  '/admin/platform/editors-pick', body),
  changePassword:     (body) => req('POST', '/admin/auth/change-password', body),
  updateMe:           (body) => req('PUT',  '/admin/me', body),
  exportCSV:    (type, p={}) => {
    const token = getToken();
    const qs = new URLSearchParams(p).toString();
    const url = `/api/admin/export/${type}${qs?'?'+qs:''}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    const headers = new Headers({ 'Authorization': `Bearer ${token}` });
    return fetch(url, { headers }).then(r => {
      const cd = r.headers.get('Content-Disposition') || '';
      const fn = cd.match(/filename="([^"]+)"/)?.[1] || `${type}.csv`;
      return r.blob().then(b => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(b);
        link.download = fn;
        link.click();
      });
    });
  },
  reports:          (p={})   => req('GET',  '/admin/reports?' + new URLSearchParams(p)),
  settings:         ()       => req('GET',  '/admin/settings'),
  saveSettings:     (body)   => req('PUT',  '/admin/settings', body),
  publicProfile:         ()       => req('GET',  '/admin/public-profile'),
  savePublicProfile:     (body)   => req('PUT',  '/admin/public-profile', body),
  platformProfile:       ()       => req('GET',  '/admin/platform-profile'),
  savePlatformProfile:   (body)   => req('PUT',  '/admin/platform-profile', body),
  platformActivity:      (type='all') => req('GET', `/admin/platform-profile/activity?type=${type}`),
  platformPost:          (body)   => req('POST', '/admin/platform-profile/post', body),
  platformDeletePost:    (id)     => req('DELETE', `/admin/platform-profile/post/${id}`),
  platformProductSearch: (q='')   => req('GET', `/admin/platform-profile/products/search?q=${encodeURIComponent(q)}`),
  platformComment:       (body)   => req('POST', '/admin/platform-profile/comment', body),
  platformDeleteComment: (id)     => req('DELETE', `/admin/platform-profile/comment/${id}`),
  platformUpvote:        (productId) => req('POST', `/admin/platform-profile/upvote/${productId}`),
  getProduct:   (id)        => req('GET',  `/admin/products/${id}`),
  getUser:      (id)        => req('GET',  `/admin/users/${id}`),
  deleteUser:   (id)        => req('DELETE', `/admin/users/${id}`),
  warnUserWithReason: (id, reason) => req('POST', `/admin/users/${id}/warn`, { reason }),
  getUserWarnings:    (id)        => req('GET',  `/admin/users/${id}/warnings`),
  launcherActivity: (p={})  => req('GET',  '/admin/launcher-activity?' + new URLSearchParams(p)),
  deleteActivityComment: (id) => req('DELETE', `/admin/launcher-activity/comment/${id}`),
  deleteActivityPost:    (id) => req('DELETE', `/admin/launcher-activity/post/${id}`),
  warnUser:     (userId, note) => req('POST', `/admin/launcher-activity/warn/${userId}`, { note }),
  suggestions:  (p={})      => req('GET',  '/admin/suggestions?' + new URLSearchParams(p)),
  respondSuggestion:(id,r)  => req('POST', `/admin/suggestions/${id}/respond`, { response: r }),
  tags:                ()          => req('GET',  '/admin/tags'),
  createTag:           (body)      => req('POST', '/admin/tags', body),
  updateTag:           (id, body)  => req('PUT',  `/admin/tags/${id}`, body),
  deleteTag:           (id)        => req('DELETE',`/admin/tags/${id}`),
  assignTag:           (id, body)  => req('POST', `/admin/tags/${id}/assign`, body),
  unassignTag:         (id, body)  => req('DELETE',`/admin/tags/${id}/assign`, body),
  autoAssignUserTags:  ()          => req('POST', '/admin/tags/auto-assign-user-tags'),
};

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export { getToken, setToken };
