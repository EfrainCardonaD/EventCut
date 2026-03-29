import { createApiClient } from './apiFactory';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const baseURL = rawBaseURL.replace(/\/$/, '');

const api = createApiClient(baseURL);

export default api;