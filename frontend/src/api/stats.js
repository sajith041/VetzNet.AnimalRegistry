import api from './client';

export const statsApi = {
  dashboard: () => api.get('/api/stats/dashboard').then((r) => r.data),
};

export const reportsApi = {
  overdue: () => api.get('/api/reports/overdue').then((r) => r.data),
  chipCompliance: () =>
    api.get('/api/reports/chip-compliance').then((r) => r.data),
  coverage: () => api.get('/api/reports/coverage').then((r) => r.data),
  all: () => api.get('/api/reports/allAnimals').then((r) => r.data),
};