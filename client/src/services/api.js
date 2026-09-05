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

// Client-side in-memory cache for ultra-fast instant page transitions
const memoryCache = new Map();
const CACHE_TTL_MS = 25000; // 25 seconds default TTL

export const clearApiCache = () => {
  memoryCache.clear();
};

const getCacheKey = (config) => {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.method?.toLowerCase()}:${url}?${params}`;
};

// Request interceptor: add auth token & check cache for GET requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('coldstorage_token') || localStorage.getItem('transport_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Invalidate cache on mutations (POST, PUT, DELETE, PATCH)
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get') {
      memoryCache.clear();
      return config;
    }

    // Check GET cache
    if (!config.skipCache) {
      const key = getCacheKey(config);
      const cached = memoryCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        // Return synthetic response from cache
        config.adapter = () =>
          Promise.resolve({
            data: JSON.parse(JSON.stringify(cached.data)),
            status: 200,
            statusText: 'OK',
            headers: cached.headers,
            config,
            request: {},
          });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: cache successful GET responses & handle auth errors
api.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'get').toLowerCase();
    if (method === 'get' && !response.config.skipCache && response.status === 200) {
      const key = getCacheKey(response.config);
      memoryCache.set(key, {
        timestamp: Date.now(),
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('coldstorage_token');
        localStorage.removeItem('coldstorage_user');
        localStorage.removeItem('transport_token');
        localStorage.removeItem('transport_user');
        memoryCache.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
