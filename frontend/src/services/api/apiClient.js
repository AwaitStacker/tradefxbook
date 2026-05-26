// src/services/api/apiClient.js
// Central Axios instance — used by ALL service files.
// Automatically attaches Authorization header and handles token refresh.

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15 second timeout
});

// ── Request interceptor: attach access token ──────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tfb_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh expired tokens ─────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) { prom.reject(error); }
    else       { prom.resolve(token); }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue other failed requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("tfb_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        localStorage.setItem("tfb_access_token",  data.accessToken);
        localStorage.setItem("tfb_refresh_token", data.refreshToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem("tfb_access_token");
        localStorage.removeItem("tfb_refresh_token");
        localStorage.removeItem("tfb_user");
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;