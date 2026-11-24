import axios from 'axios';
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';
export const fileUrl = (path) => (path ? `${API_ORIGIN}${path}` : '');

// Base URL for the backend API
// Later we'll move this to an environment variable for the cloud
// const API_BASE_URL =
//   import.meta.env.VITE_API_URL ||
//   `http://${window.location.hostname}:4000`;

const API_BASE_URL = API_ORIGIN;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT token to every request once login is implemented
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;