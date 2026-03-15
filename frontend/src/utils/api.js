import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Request interceptor: attach token from localStorage (hybrid with HttpOnly cookie)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// ── Response interceptor: handle 401, refresh token
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

      const refreshToken = localStorage.getItem('refreshToken');

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken }, { withCredentials: true });
        const { accessToken, refreshToken: newRefresh } = data.data;
        if (accessToken) localStorage.setItem('accessToken',  accessToken);
        if (newRefresh)  localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Convenience methods
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  logout:   (data)  => api.post('/auth/logout', data),
  me:       ()      => api.get('/auth/me'),
};

export const productsAPI = {
  list:       (params) => api.get('/products', { params }),
  get:        (id)     => api.get(`/products/${id}`),
  create:     (data)   => api.post('/products', data),
  update:     (id, d)  => api.put(`/products/${id}`, d),
  delete:     (id)     => api.delete(`/products/${id}`),
  upvote:     (id)     => api.post(`/products/${id}/upvote`),
  bookmark:   (id)     => api.post(`/products/${id}/bookmark`),
  waitlist:        (id, email, name) => api.post(`/products/${id}/waitlist`, { email, name }),
  discountSignup:  (id, email, name) => api.post(`/products/${id}/discount-signup`, { email, name }),
  comments:   (id)     => api.get(`/products/${id}/comments`),
  addComment: (id, b)  => api.post(`/products/${id}/comments`, { body: b }),
};

export const entitiesAPI = {
  list:    (params) => api.get('/entities', { params }),
  get:     (slug)   => api.get(`/entities/${slug}`),
  create:  (data)   => api.post('/entities', data),
  apply:   (id, d)  => api.post(`/entities/${id}/apply`, d),
  pitch:   (id, d)  => api.post(`/entities/${id}/pitch`, d),
};

export const usersAPI = {
  profile:       (handle) => api.get(`/users/${handle}`),
  updateProfile: (data)   => api.put('/users/me', data),
  changePassword:(data)   => api.post('/users/me/change-password', data),
  follow:        (id)     => api.post(`/users/${id}/follow`),
  bookmarks:     ()       => api.get('/users/me/bookmarks'),
  myProducts:    ()       => api.get('/users/me/products'),
  notifications: ()       => api.get('/users/me/notifications'),
  markRead:      ()       => api.put('/users/me/notifications/read'),
  upvoted:       (handle) => api.get(`/users/${handle}/upvoted`),
  activity:      (handle) => api.get(`/users/${handle}/activity`),
  followers:     (handle) => api.get(`/users/${handle}/followers`),
  following:     (handle) => api.get(`/users/${handle}/following`),
  people:        (params) => api.get('/users/people', { params }),
  deleteProduct: (id)     => api.delete(`/products/${id}`),
};

export const adminAPI = {
  dashboard:   ()       => api.get('/admin/dashboard'),
  // Products
  products:    (p)      => api.get('/admin/products', { params: p }),
  approve:     (id)     => api.post(`/admin/products/${id}/approve`),
  reject:      (id, r)  => api.post(`/admin/products/${id}/reject`, { reason: r }),
  featured:    (id)     => api.post(`/admin/products/${id}/featured`),
  deleteProduct:(id)    => api.delete(`/products/${id}`),
  // Users
  users:       (p)      => api.get('/admin/users', { params: p }),
  user:        (id)     => api.get(`/admin/users/${id}`),
  verifyUser:  (id)     => api.post(`/admin/users/${id}/verify`),
  suspendUser: (id)     => api.post(`/admin/users/${id}/suspend`),
  reinstate:   (id)     => api.post(`/admin/users/${id}/reinstate`),
  inviteUser:  (d)      => api.post('/admin/users/invite', d),
  // Entities
  entities:    (p)      => api.get('/admin/entities', { params: p }),
  verifyEntity:(id)     => api.post(`/admin/entities/${id}/verify`),
  // Applications
  applications:()       => api.get('/admin/applications'),
  // Settings & Team
  settings:    ()       => api.get('/admin/settings'),
  saveSettings:(d)      => api.put('/admin/settings', d),
  team:        ()       => api.get('/admin/team'),
  addMember:   (d)      => api.post('/admin/team', d),
  removeMember:(id)     => api.delete(`/admin/team/${id}`),
  // Reports
  reports:     ()       => api.get('/admin/reports'),
  // Posts
  posts:       ()       => api.get('/admin/posts'),
  createPost:  (d)      => api.post('/admin/posts', d),
  deletePost:  (id)     => api.delete(`/admin/posts/${id}`),
  // Suggestions
  suggestions: (p)      => api.get('/admin/suggestions', { params: p }),
  respondSuggestion: (id, response) => api.post(`/admin/suggestions/${id}/respond`, { response }),
  // Email signups
  emailSignups: () => api.get('/admin/email-signups'),
};

export const suggestionsAPI = {
  submit: (body) => api.post('/suggestions', { body }),
};

export const uploadAPI = {
  postImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/post-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const launcherAPI = {
  posts:           ()        => api.get('/launcher'),
  getPost:         (id)      => api.get(`/launcher/${id}`),
  createPost:      (data)    => api.post('/launcher', data),
  like:            (id)      => api.post(`/launcher/${id}/like`),
  deletePost:      (id)      => api.delete(`/launcher/${id}`),
  comments:        (id)      => api.get(`/launcher/${id}/comments`),
  addComment:      (id, b, parentId = null) => api.post(`/launcher/${id}/comments`, { body: b, parent_id: parentId || undefined }),
  likeComment:     (cid)     => api.post(`/launcher/comments/${cid}/like`),
};

export const statsAPI = {
  summary:   () => api.get('/stats/summary'),
  directory: () => api.get('/stats/directory'),
};

export const communityAPI = {
  tags:        ()         => api.get('/community-posts/tags'),
  posts:       (params)   => api.get('/community-posts', { params }),
  getPost:     (id)       => api.get(`/community-posts/${id}`),
  myDrafts:    ()         => api.get('/community-posts/my-drafts'),
  create:      (data)     => api.post('/community-posts', data),
  update:      (id, data) => api.put(`/community-posts/${id}`, data),
  delete:      (id)       => api.delete(`/community-posts/${id}`),
  adminTags:   ()         => api.get('/admin/community-tags'),
  createTag:   (data)     => api.post('/admin/community-tags', data),
  deleteTag:   (id)       => api.delete(`/admin/community-tags/${id}`),
};
