import { createApiClient } from './apiFactory';

// import.meta.env es de solo lectura en runtime/build. No se debe mutar.
const baseURL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`;

const api = createApiClient(baseURL);

export default api;