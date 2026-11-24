import api from './client';

export const transfersApi = {
  transfer: (animalId, data) =>
    api.post(`/api/animals/${animalId}/transfer`, data).then((r) => r.data),
  history: (animalId) =>
    api.get(`/api/animals/${animalId}/history`).then((r) => r.data),
};