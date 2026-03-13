const BASE = '/api';

function getToken() {
  return localStorage.getItem('tlmena_admin_token');
}

function setToken(t) {
  if (t) localStorage.setItem('tlmena_admin_token', t);
  else localStorage.removeItem('tlmena_admin_token');
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
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
  approveProduct: (id)      => req('POST', `/admin/products/${id}/approve`),
  rejectProduct:  (id, r)   => req('POST', `/admin/products/${id}/reject`, { reason: r }),
  featured:     (id)        => req('POST', `/admin/products/${id}/featured`),
  users:        (p={})      => req('GET',  '/admin/users?' + new URLSearchParams(p)),
  verifyUser:   (id)        => req('POST', `/admin/users/${id}/verify`),
  suspendUser:  (id)        => req('POST', `/admin/users/${id}/suspend`),
  reinstateUser:(id)        => req('POST', `/admin/users/${id}/reinstate`),
  entities:     (p={})      => req('GET',  '/admin/entities?' + new URLSearchParams(p)),
  verifyEntity: (id)        => req('POST', `/admin/entities/${id}/verify`),
  applications: ()          => req('GET',  '/admin/applications'),
  updateAccelApp: (id, body)=> req('PATCH', `/admin/applications/accelerator/${id}`, body),
  updatePitch:    (id, body)=> req('PATCH', `/admin/applications/pitches/${id}`, body),
  reports:      ()          => req('GET',  '/admin/reports'),
  settings:     ()          => req('GET',  '/admin/settings'),
  saveSettings: (body)      => req('PUT',  '/admin/settings', body),
  suggestions:  (p={})      => req('GET',  '/admin/suggestions?' + new URLSearchParams(p)),
  respondSuggestion:(id,r)  => req('POST', `/admin/suggestions/${id}/respond`, { response: r }),
};

export { getToken, setToken };
