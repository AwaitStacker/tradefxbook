// src/services/api/tradesService.js
import apiClient from "./apiClient";

export const tradesService = {
  getAll: async (filters = {}) => {
    const { data } = await apiClient.get("/trades", { params: filters });
    return data.trades;
  },

  create: async (trade) => {
    const { data } = await apiClient.post("/trades", trade);
    return data.trade;
  },

  update: async (id, updates) => {
    // id can be MongoDB _id (cloud) or clientId fallback
    const { data } = await apiClient.patch(`/trades/${id}`, updates);
    return data.trade;
  },

  delete: async (id) => {
    await apiClient.delete(`/trades/${id}`);
  },

  // One-time migration: send all localStorage trades to the backend
  bulkImport: async (trades) => {
    const { data } = await apiClient.post("/trades/bulk", { trades });
    return data;
  },
};