import api from './api';

export const commodityService = {
  getAll: async (params) => {
    const response = await api.get('/commodities', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/commodities/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/commodities', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/commodities/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/commodities/${id}`);
    return response.data;
  },
};
