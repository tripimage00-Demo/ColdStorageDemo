import api from './api';

export const chamberService = {
  getAll: async (params) => {
    const response = await api.get('/chambers', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/chambers/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/chambers', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/chambers/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/chambers/${id}`);
    return response.data;
  },
};
