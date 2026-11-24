import api from './client';

export const vetsApi = {
  list: () => api.get('/api/vets').then((r) => r.data),
  create: (data) => api.post('/api/vets', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/vets/${id}`, data).then((r) => r.data),
};