import api from './api';

export const stockService = {
  createInward: async (data) => {
    const response = await api.post('/stock/inward', data);
    return response.data;
  },
  getInwardEntries: async (params) => {
    const response = await api.get('/stock/inward', { params });
    return response.data;
  },
  previewCharges: async (data) => {
    const response = await api.post('/stock/preview-charges', data);
    return response.data;
  },
  createRelease: async (data) => {
    const response = await api.post('/stock/outward', data);
    return response.data;
  },
  getReleases: async (params) => {
    const response = await api.get('/stock/outward', { params });
    return response.data;
  },
};
