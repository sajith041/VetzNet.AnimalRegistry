import api from './client';

export const ownersApi = {
  list: (params = {}) => api.get('/api/owners', { params }).then((r) => r.data),
  get: (id) => api.get(`/api/owners/${id}`).then((r) => r.data),
  create: (data) => api.post('/api/owners', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/owners/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/owners/${id}`).then((r) => r.data),
};