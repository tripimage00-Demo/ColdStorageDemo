import api from './api';

export const lotService = {
  getAll: async (params) => {
    const response = await api.get('/lots', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/lots/${id}`);
    return response.data;
  },
};
