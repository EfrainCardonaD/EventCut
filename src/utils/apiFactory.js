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

const TRACE_HEADER_KEY = 'X-Trace-Id';

const createTraceId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `trace-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const toHeaderLookupMap = (headers = {}) => {
  return Object.entries(headers || {}).reduce((acc, [key, value]) => {
    acc[String(key).toLowerCase()] = value;
    return acc;
  }, {});
};

export const extractTraceIdFromHeaders = (headers = {}) => {
  const map = toHeaderLookupMap(headers);
  const value = map['x-trace-id'];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const isEnvelopeLike = (payload) => {
  return Boolean(payload && typeof payload === 'object' && typeof payload.success === 'boolean');
};

export const getApiPayload = (response) => {
  if (response?.status === 204) return null;

  const payload = response?.data;
  if (isEnvelopeLike(payload) && 'data' in payload) {
    return payload.data;
  }

  return payload;
};

export const getApiMessage = (response) => {
  const payload = response?.data;
  if (isEnvelopeLike(payload) && typeof payload.message === 'string') {
    return payload.message;
  }

  return null;
};

const getTraceIdFromErrorData = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return null;
  return responseData?.data?.trace_id || responseData?.trace_id || null;
};

const getCodeFromErrorData = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return null;
  return responseData?.data?.code || responseData?.code || null;
};

const getDetailsFromErrorData = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return null;
  return responseData?.data?.details ?? responseData?.details ?? null;
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
  return normalizeApiError(error, fallbackMessage).message;
};

export const normalizeApiError = (error, fallbackMessage) => {
  const networkFailure = isNetworkOrConnectionError(error);
  const responseData = error?.response?.data;
  const status = Number(error?.response?.status || 0) || null;
  const code = getCodeFromErrorData(responseData);
  const traceId =
    getTraceIdFromErrorData(responseData) ||
    extractTraceIdFromHeaders(error?.response?.headers) ||
    error?.config?.headers?.[TRACE_HEADER_KEY] ||
    null;

  const backendMessage = extractBackendMessage(error);
  const conciseValidationMessage = code === 'VALIDATION_ERROR'
    ? 'Revisa los campos marcados e intenta nuevamente.'
    : null;

  const message = networkFailure
    ? 'No se pudo conectar con el servidor. Verifica que el backend esté activo e inténtalo de nuevo.'
    : conciseValidationMessage || backendMessage || fallbackMessage || 'Ocurrió un error inesperado.';

  return {
    message,
    code,
    details: getDetailsFromErrorData(responseData),
    traceId,
    status,
    isNetworkError: networkFailure,
  };
};

export const toApiErrorResult = (error, fallbackMessage) => {
  const normalized = error?.apiError || normalizeApiError(error, fallbackMessage);

  return {
    success: false,
    // El traceId se conserva para telemetria/soporte, pero no se expone al usuario final.
    error: normalized.message,
    code: normalized.code,
    details: normalized.details,
    traceId: normalized.traceId,
    status: normalized.status,
  };
};

export const mapApiCodeToUxAction = (code) => {
  switch (code) {
    case 'TOKEN_EXPIRED':
      return { action: 'REDIRECT_LOGIN', message: 'Tu sesión expiró. Inicia sesión nuevamente.' };
    case 'TOKEN_INVALID':
      return { action: 'CLEAR_SESSION_LOGIN', message: 'Tu sesión ya no es válida. Inicia sesión nuevamente.' };
    case 'FORBIDDEN':
      return { action: 'SHOW_TOAST', message: 'No tienes permisos para esta acción.' };
    case 'AUTH_UNAVAILABLE':
      return { action: 'RETRY_AVAILABLE', message: 'Servicio de autenticación no disponible. Intenta de nuevo.' };
    case 'VALIDATION_ERROR':
      return { action: 'SHOW_FIELD_ERRORS', message: 'Corrige los campos marcados e intenta nuevamente.' };
    case 'EVENT_NOT_FOUND':
      return { action: 'GO_TO_LIST', message: 'El evento ya no existe o fue removido.' };
    case 'USER_BANNED':
      return { action: 'SHOW_TOAST', message: 'Tu cuenta esta temporalmente bloqueada para realizar esta accion.' };
    case 'COMMUNITY_NOT_FOUND':
      return { action: 'SHOW_TOAST', message: 'La comunidad no existe o ya no esta disponible.' };
    case 'COMMUNITY_NOT_ACTIVE':
      return { action: 'SHOW_TOAST', message: 'La comunidad aun no esta activa para esta operacion.' };
    case 'NOT_COMMUNITY_OWNER':
      return { action: 'SHOW_TOAST', message: 'Solo el propietario de la comunidad puede realizar esta accion.' };
    case 'NOT_EVENT_OWNER':
      return { action: 'SHOW_TOAST', message: 'Solo el propietario del evento puede realizar esta accion.' };
    case 'EVENT_ALREADY_REQUESTED':
      return { action: 'SHOW_TOAST', message: 'Este evento ya tiene una solicitud pendiente para la comunidad.' };
    case 'DUPLICATE_COMMUNITY_NAME':
      return { action: 'SHOW_FIELD_ERRORS', message: 'Ya existe una comunidad activa con ese nombre.' };
    case 'TERMS_NOT_ACCEPTED':
      return { action: 'SHOW_FIELD_ERRORS', message: 'Debes aceptar terminos y condiciones para continuar.' };
    case 'REQUEST_NOT_FOUND':
      return { action: 'SHOW_TOAST', message: 'La solicitud seleccionada ya no existe.' };
    default:
      return null;
  }
};

export const createApiClient = (baseURL, options = {}) => {
  const api = axios.create({
    baseURL,
    withCredentials: options.withCredentials ?? true,
    timeout: options.timeout ?? 12000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Evita el warning/intercept de ngrok en entornos de desarrollo.
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
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

      if (!config.headers[TRACE_HEADER_KEY]) {
        config.headers[TRACE_HEADER_KEY] = createTraceId();
      }

      if (accessToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => {
      response.traceId =
        extractTraceIdFromHeaders(response.headers) ||
        response?.config?.headers?.[TRACE_HEADER_KEY] ||
        null;
      response.payload = getApiPayload(response);
      response.apiMessage = getApiMessage(response);
      return response;
    },
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
        error.apiError = normalizeApiError(error);
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
        refreshError.apiError = normalizeApiError(refreshError, 'Tu sesión expiró. Inicia sesión nuevamente.');
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