import api from './client';

export const animalsApi = {
  list: (params = {}) => api.get('/api/animals', { params }).then((r) => r.data),
  get: (id) => api.get(`/api/animals/${id}`).then((r) => r.data),
  create: (data) => api.post('/api/animals', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/animals/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/animals/${id}`).then((r) => r.data),
  updateMicrochip: (id, chipNumber) =>
    api.put(`/api/animals/${id}/microchip`, { chipNumber }).then((r) => r.data),

  attachMicrochip: (id, data) =>
    api.post(`/api/animals/${id}/microchip`, data).then((r) => r.data),

  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api
      .post(`/api/animals/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};