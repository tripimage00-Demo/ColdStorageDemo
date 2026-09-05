import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('coldstorage_token') || localStorage.getItem('transport_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('coldstorage_token');
        localStorage.removeItem('coldstorage_user');
        localStorage.removeItem('transport_token');
        localStorage.removeItem('transport_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
