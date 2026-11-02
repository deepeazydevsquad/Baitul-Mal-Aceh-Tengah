import axios from 'axios';

// Gunakan variabel lingkungan dari .env
import { API_URL } from '@/config/config';
import {
  clearAccessToken,
  getAccessToken as getStoredAccessToken,
  setAccessToken,
} from '@/service/auth_token_store';

const API_BASE_URL = API_URL;
// Base URL API
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAccessToken = () => getStoredAccessToken('administrator');

// Tambahkan interceptor untuk menyisipkan token di setiap request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor untuk response: refresh token jika expired
let isRefreshing = false;
type RetryCallback = (token: string | null) => void;
let failedRequestsQueue: RetryCallback[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const errorCode = error.response?.data?.code;
    const shouldRefresh =
      error.response?.status === 401 ||
      (error.response?.status === 403 &&
        ['INVALID_TOKEN', 'SESSION_EXPIRED', 'TOKEN_MISSING'].includes(errorCode));

    if (shouldRefresh && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push((token: string | null) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/administrator/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = response.data.access_token;
        if (!newAccessToken) throw new Error('Access token tidak tersedia');
        setAccessToken('administrator', newAccessToken);

        // Jalankan semua request yang tertunda
        failedRequestsQueue.forEach((cb) => cb(newAccessToken));
        failedRequestsQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token gagal, harap login ulang');
        failedRequestsQueue.forEach((cb) => cb(null));
        failedRequestsQueue = [];
        clearAccessToken('administrator');
        window.location.href = '/login-admin';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
