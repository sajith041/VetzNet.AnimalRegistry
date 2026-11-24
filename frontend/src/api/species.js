import api from './client';

export const speciesApi = {
  list: () => api.get('/api/species').then((r) => r.data),
};