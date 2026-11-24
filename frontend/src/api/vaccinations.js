import api from './client';

export const vaccinationsApi = {
  list: (params = {}) => api.get('/api/vaccinations', { params }).then((r) => r.data),
  get: (id) => api.get(`/api/vaccinations/${id}`).then((r) => r.data),
  create: (data) => api.post('/api/vaccinations', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/vaccinations/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/vaccinations/${id}`).then((r) => r.data),

  uploadCertificate: (id, file) => {
    const fd = new FormData();
    fd.append('certificate', file);
    return api
      .post(`/api/vaccinations/${id}/certificate`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};