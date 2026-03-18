import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAccessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('adminRefreshToken');
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken }, { withCredentials: true });
        const { accessToken, refreshToken: newRefresh } = data.data;
        if (accessToken) localStorage.setItem('adminAccessToken', accessToken);
        if (newRefresh)  localStorage.setItem('adminRefreshToken', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/admin/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  me: () => api.get('/auth/me'),
};

export const adminAPI = {
  dashboard:   ()       => api.get('/admin/dashboard'),
  products:    (p)      => api.get('/admin/products', { params: p }),
  approve:     (id)     => api.post(`/admin/products/${id}/approve`),
  reject:      (id, r)  => api.post(`/admin/products/${id}/reject`, { reason: r }),
  featured:    (id)     => api.post(`/admin/products/${id}/featured`),
  deleteProduct:(id)    => api.delete(`/products/${id}`),
  users:       (p)      => api.get('/admin/users', { params: p }),
  user:        (id)     => api.get(`/admin/users/${id}`),
  verifyUser:  (id)     => api.post(`/admin/users/${id}/verify`),
  suspendUser: (id)     => api.post(`/admin/users/${id}/suspend`),
  reinstate:   (id)     => api.post(`/admin/users/${id}/reinstate`),
  inviteUser:  (d)      => api.post('/admin/users/invite', d),
  entities:    (p)      => api.get('/admin/entities', { params: p }),
  verifyEntity:(id)     => api.post(`/admin/entities/${id}/verify`),
  applications:()       => api.get('/admin/applications'),
  settings:    ()       => api.get('/admin/settings'),
  saveSettings:(d)      => api.put('/admin/settings', d),
  team:        ()       => api.get('/admin/team'),
  addMember:   (d)      => api.post('/admin/team', d),
  removeMember:(id)     => api.delete(`/admin/team/${id}`),
  reports:     ()       => api.get('/admin/reports'),
  suggestions: (p)      => api.get('/admin/suggestions', { params: p }),
  respondSuggestion: (id, response) => api.post(`/admin/suggestions/${id}/respond`, { response }),
  emailSignups: ()      => api.get('/admin/email-signups'),
};

export const productsAPI = {
  create: (data) => api.post('/products', data),
};
