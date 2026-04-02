import { createApiClient } from '@/utils/apiFactory'

const rawEventsBaseUrl = import.meta.env.VITE_EVENTS_API_BASE_URL
const eventsBaseUrl = rawEventsBaseUrl ? String(rawEventsBaseUrl).replace(/\/$/, '') : ''

const adminApi = createApiClient(eventsBaseUrl, {
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
})

export default adminApi

