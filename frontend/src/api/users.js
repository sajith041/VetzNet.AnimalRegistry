import api from './client';

export const usersApi = {
  list: (params = {}) => api.get('/api/users', { params }).then((r) => r.data),
  get: (id) => api.get(`/api/users/${id}`).then((r) => r.data),
  create: (data) => api.post('/api/users', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/users/${id}`, data).then((r) => r.data),
  resetPassword: (id, password) =>
    api.post(`/api/users/${id}/reset-password`, { password }).then((r) => r.data),
};