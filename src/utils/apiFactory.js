import axios from 'axios';
import { useAuthStore } from '../stores/auth'; // Ajusta a tu ruta real
import router from '../router'; // Ajusta a tu ruta real

const AUTH_PREFIX = '/api/auth';

// --- Helpers de red (backend caído / CORS / timeout) ---
// Nota: Axios cuando no hay respuesta (server down / CORS) deja error.response undefined.
export const isNetworkOrConnectionError = (error) => {
    if (!error) return false;
    // Axios v1: error.code puede venir como 'ECONNABORTED' en timeout
    const code = error.code;
    if (code === 'ECONNABORTED') return true;

    const message = (error.message || '').toLowerCase();
    // 'Network Error' es común cuando hay CORS o conexión rechazada
    if (message.includes('network error')) return true;
    if (message.includes('connection refused')) return true;
    if (message.includes('err_connection_refused')) return true;

    // Si no existe response, casi siempre es un problema de red/conectividad
    if (!error.response) return true;

    return false;
};

export const getFriendlyApiErrorMessage = (error, fallbackMessage) => {
    if (isNetworkOrConnectionError(error)) {
        return 'No se pudo conectar con el servidor. Verifica que el backend esté activo e inténtalo de nuevo.';
    }

    // Respuesta HTTP con body
    const backendMsg = error?.response?.data?.message;
    if (backendMsg) return backendMsg;

    return fallbackMessage || 'Ocurrió un error inesperado.';
};

export const createApiClient = (baseURL) => {
    const api = axios.create({
        baseURL,
        withCredentials: true,
        // Evita que la UI se quede “colgada” cuando el backend está caído
        timeout: 12000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
        failedQueue.forEach(prom => {
            if (error) prom.reject(error);
            else prom.resolve(token);
        });
        failedQueue = [];
    };

    // Interceptor de Solicitud: Inyectar Token desde Pinia
    api.interceptors.request.use(
        (config) => {
            const authStore = useAuthStore();
            const token = authStore.token;

            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Interceptor de Respuesta: Manejo de Errores y Refresh Token
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            const authStore = useAuthStore();

            // Evitar interceptar errores 401 en las propias rutas de autenticación
            const isAuthRoute = originalRequest.url?.includes(AUTH_PREFIX);

            if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    }).catch(err => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = authStore.refreshToken;
                    if (!refreshToken) throw new Error('No refresh token available');

                    // Llamada limpia a Axios para evitar loops infinitos, apuntando al nuevo endpoint
                    const response = await axios.post(`${baseURL}${AUTH_PREFIX}/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    });

                    // Mapeo adaptado al nuevo contrato: { success: true, data: { token, refreshToken, user } }
                    if (response.data.success && response.data.data?.token) {
                        const newAuthData = response.data.data;

                        // Centralizamos la actualización a través de la acción de Pinia
                        authStore.setAuthData(newAuthData);

                        api.defaults.headers.common['Authorization'] = `Bearer ${newAuthData.token}`;
                        originalRequest.headers['Authorization'] = `Bearer ${newAuthData.token}`;

                        processQueue(null, newAuthData.token);
                        return api(originalRequest);
                    } else {
                        throw new Error('Refresh fallido: formato de respuesta inesperado');
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    // Limpieza centralizada y redirección SPA
                    authStore.clearAuthData();
                    router.push('/login');
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );

    return api;
};