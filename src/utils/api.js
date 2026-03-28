import { createApiClient } from './apiFactory';

import.meta.env.VITE_API_BASE_URL = 'http://localhost:8080';
const baseURL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`;

const api = createApiClient(baseURL);

export default api;