import { createApiClient } from '@/utils/apiFactory'

// Si no se define `VITE_EVENTS_API_BASE_URL`, usamos baseURL relativa para que Vite (dev) pueda
// proxyear `/api/*` y evitar problemas de CORS entre `localhost` y `127.0.0.1`.
const rawEventsBaseUrl = import.meta.env.VITE_EVENTS_API_BASE_URL
const eventsBaseUrl = rawEventsBaseUrl ? String(rawEventsBaseUrl).replace(/\/$/, '') : ''

const eventsApi = createApiClient(eventsBaseUrl, {
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
})

export default eventsApi

