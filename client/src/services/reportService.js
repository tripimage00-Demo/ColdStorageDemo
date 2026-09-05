import api from './api';

export const reportService = {
  getStockReports: async (params) => {
    const response = await api.get('/reports/stock', { params });
    return response.data;
  },
  getFinancialReports: async (params) => {
    const response = await api.get('/reports/financial', { params });
    return response.data;
  },
  getCapacityReports: async (params) => {
    const response = await api.get('/reports/capacity', { params });
    return response.data;
  },
};
