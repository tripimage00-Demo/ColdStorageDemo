import api from './api';

export const searchService = {
  globalSearch: async (query) => {
    const response = await api.get('/search', { params: { query } });
    return response.data;
  },
};
