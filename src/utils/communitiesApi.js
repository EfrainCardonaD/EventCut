import { createApiClient } from '@/utils/apiFactory'

const rawEventsBaseUrl = import.meta.env.VITE_EVENTS_API_BASE_URL
const eventsBaseUrl = rawEventsBaseUrl ? String(rawEventsBaseUrl).replace(/\/$/, '') : ''

const communitiesApi = createApiClient(eventsBaseUrl, {
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
})

export default communitiesApi

