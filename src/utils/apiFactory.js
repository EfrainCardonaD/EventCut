import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import router from '../router';

const NON_REFRESHABLE_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot',
  '/api/auth/reset',
  '/api/auth/verify/email/confirm',
  '/api/auth/verify/email/resend',
];

const isExcludedFromRefresh = (url = '') => {
  const normalizedUrl = String(url).toLowerCase();
  return NON_REFRESHABLE_PATHS.some((path) => normalizedUrl.includes(path));
};

const extractBackendMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.detail && typeof error.response.data.detail === 'string') {
    return error.response.data.detail;
  }
  return null;
};

// Axios deja `error.response` undefined cuando hay problemas de red/CORS/timeout.
export const isNetworkOrConnectionError = (error) => {
  if (!error) return false;
  const code = error.code;
  if (code === 'ECONNABORTED' || code === 'ERR_NETWORK') return true;

  const message = (error.message || '').toLowerCase();
  if (message.includes('network error')) return true;
  if (message.includes('connection refused')) return true;
  if (message.includes('err_connection_refused')) return true;

  return !error.response;
};

export const getFriendlyApiErrorMessage = (error, fallbackMessage) => {
  if (isNetworkOrConnectionError(error)) {
    return 'No se pudo conectar con el servidor. Verifica que el backend esté activo e inténtalo de nuevo.';
  }

  const backendMessage = extractBackendMessage(error);
  if (backendMessage) return backendMessage;

  return fallbackMessage || 'Ocurrió un error inesperado.';
};

export const createApiClient = (baseURL) => {
  const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 12000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach((promiseController) => {
      if (error) promiseController.reject(error);
      else promiseController.resolve(token);
    });
    failedQueue = [];
  };

  api.interceptors.request.use(
    async (config) => {
      const authStore = useAuthStore();
      const requestPath = config.url || '';

      const shouldSkipProactiveRefresh =
        Boolean(config._skipProactiveRefresh || config._skipAuthRefresh) || isExcludedFromRefresh(requestPath);

      if (!shouldSkipProactiveRefresh) {
        await authStore.ensureValidAccessToken({ minTtlSeconds: 60 });
      }

      const accessToken = authStore.token;
      config.headers = config.headers || {};

      if (accessToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config || {};
      const authStore = useAuthStore();
      const requestPath = originalRequest.url || '';

      const shouldTryRefresh =
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest._skipAuthRefresh &&
        !isExcludedFromRefresh(requestPath);

      if (!shouldTryRefresh) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshed = await authStore.refreshAccessToken();
        if (!refreshed || !authStore.token) {
          throw new Error('Refresh fallido');
        }

        api.defaults.headers.common.Authorization = `Bearer ${authStore.token}`;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`;

        processQueue(null, authStore.token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStore.clearAuthData();

        if (!router.currentRoute.value.path.startsWith('/auth')) {
          await router.push({ path: '/auth/login', query: { reason: 'session-expired' } });
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return api;
};