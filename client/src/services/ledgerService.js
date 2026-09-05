import api from './api';

export const ledgerService = {
  getCustomerLedger: async (customerId, params) => {
    const response = await api.get(`/ledger/${customerId}`, { params });
    return response.data;
  },
  createAdjustment: async (data) => {
    const response = await api.post('/ledger/adjustment', data);
    return response.data;
  },
};
