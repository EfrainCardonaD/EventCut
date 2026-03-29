import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const rawEventsBaseUrl = import.meta.env.VITE_EVENTS_API_BASE_URL || 'http://127.0.0.1:8001'
const eventsBaseUrl = rawEventsBaseUrl.replace(/\/$/, '')

const eventsApi = axios.create({
  baseURL: eventsBaseUrl,
  timeout: 12000,
  headers: {
    Accept: 'application/json',
    // Evita el warning/intercept de ngrok en entornos de desarrollo.
    'ngrok-skip-browser-warning': 'true',
  },
})

eventsApi.interceptors.request.use(async (config) => {
  const authStore = useAuthStore()
  const shouldSkipProactiveRefresh = Boolean(config._skipProactiveRefresh || config._skipAuthRefresh)

  if (!shouldSkipProactiveRefresh) {
    await authStore.ensureValidAccessToken({ minTtlSeconds: 60 })
  }

  if (authStore.token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  return config
})

eventsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const authStore = useAuthStore()

    const shouldTryRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh

    if (!shouldTryRefresh) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const refreshed = await authStore.refreshAccessToken()

    if (!refreshed || !authStore.token) {
      authStore.clearAuthData()

      if (!router.currentRoute.value.path.startsWith('/auth')) {
        await router.push({ path: '/auth/login', query: { reason: 'session-expired' } })
      }

      return Promise.reject(error)
    }

    originalRequest.headers = originalRequest.headers || {}
    originalRequest.headers.Authorization = `Bearer ${authStore.token}`
    return eventsApi(originalRequest)
  },
)

export default eventsApi

