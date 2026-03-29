import { defineStore } from 'pinia'
import api from '../utils/api'
import router from '../router'
import { getFriendlyApiErrorMessage } from '../utils/apiFactory'

const DEFAULT_MIN_TTL_SECONDS = 60
let refreshInFlightPromise = null

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null

  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

const safeParseUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user_data') || 'null')
  } catch {
    localStorage.removeItem('user_data')
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('jwt_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    user: safeParseUser(),
    hasBootstrapped: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    username: (state) => state.user?.username || null,
    email: (state) => state.user?.email || null,
    role: (state) => state.user?.role || null,
    isEmailVerified: (state) => Boolean(state.user?.emailVerified),
    fullName: (state) => {
      if (!state.user) return null
      return `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim() || state.user.username || null
    },
  },

  actions: {
    normalizeRole(role) {
      if (!role || typeof role !== 'string') return null
      return role.replace(/^ROLE_/i, '').toUpperCase()
    },

    normalizeUser(user) {
      if (!user || typeof user !== 'object') return null
      return {
        ...user,
        role: this.normalizeRole(user.role),
      }
    },

    setAuthData(authData) {
      this.token = authData?.token || null
      this.refreshToken = authData?.refreshToken || null
      this.user = this.normalizeUser(authData?.user)

      if (this.token) localStorage.setItem('jwt_token', this.token)
      else localStorage.removeItem('jwt_token')

      if (this.refreshToken) localStorage.setItem('refresh_token', this.refreshToken)
      else localStorage.removeItem('refresh_token')

      if (this.user) localStorage.setItem('user_data', JSON.stringify(this.user))
      else localStorage.removeItem('user_data')
    },

    clearAuthData() {
      this.token = null
      this.refreshToken = null
      this.user = null

      localStorage.removeItem('jwt_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
    },

    async register(payload) {
      try {
        const response = await api.post('/api/auth/register', {
          username: payload.username,
          email: payload.email,
          password: payload.password,
          firstName: payload.firstName,
          lastName: payload.lastName,
        })

        if (response.status === 201 && response.data?.success) {
          return {
            success: true,
            message: response.data.message || 'Usuario registrado. Revisa tu correo para verificar tu cuenta.',
            data: response.data.data,
          }
        }

        return { success: false, error: 'No se pudo completar el registro.' }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo completar el registro.'),
        }
      }
    },

    async login(username, password) {
      try {
        const response = await api.post('/api/auth/login', { username, password })
        const authData = response.data?.data

        if (response.data?.success && authData?.token && authData?.refreshToken) {
          this.setAuthData(authData)
          return {
            success: true,
            user: this.user,
            message: response.data.message || 'Inicio de sesión exitoso',
          }
        }

        return { success: false, error: 'Respuesta inválida del servidor al iniciar sesión.' }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'Error al iniciar sesión. Verifica tus credenciales.'),
        }
      }
    },

    async fetchMe() {
      if (!this.token) {
        return { success: false, error: 'No hay sesión activa.' }
      }

      try {
        const response = await api.get('/api/auth/me')

        if (response.data?.success && response.data?.data) {
          this.user = this.normalizeUser(response.data.data)
          localStorage.setItem('user_data', JSON.stringify(this.user))
          return { success: true, data: this.user }
        }

        return { success: false, error: 'No se pudo recuperar el perfil del usuario.' }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo recuperar el perfil del usuario.'),
        }
      }
    },

    async bootstrapSession() {
      if (this.hasBootstrapped) return
      this.hasBootstrapped = true

      if (!this.token) return

      const hasValidSession = await this.ensureValidAccessToken()
      if (!hasValidSession) {
        this.clearAuthData()
        return
      }

      const profile = await this.fetchMe()
      if (!profile.success) {
        this.clearAuthData()
      }
    },

    async resendVerification(email) {
      try {
        const response = await api.post('/api/auth/verify/email/resend', null, { params: { email } })

        if (response.status >= 200 && response.status < 300) {
          return {
            success: true,
            message:
              response.data?.message ||
              'Si el correo existe y no está verificado, se ha enviado un nuevo enlace.',
          }
        }

        return { success: false, error: 'No se pudo reenviar el correo de verificación.' }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo reenviar el correo de verificación.'),
        }
      }
    },

    async confirmEmailVerification(token) {
      try {
        const response = await api.post('/api/auth/verify/email/confirm', { token })

        if (response.status >= 200 && response.status < 300 && response.data?.success) {
          return {
            success: true,
            message: response.data?.message || 'Email verificado exitosamente. Ya puedes iniciar sesión.',
          }
        }

        return {
          success: false,
          error: response.data?.message || 'No se pudo verificar el email con el token proporcionado.',
        }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo verificar el email con el token proporcionado.'),
        }
      }
    },

    async forgotPassword(email) {
      try {
        const response = await api.post('/api/auth/forgot', { email })

        if (response.status >= 200 && response.status < 300) {
          return {
            success: true,
            message:
              response.data?.message ||
              'Si el correo existe y está verificado, se ha enviado un enlace de restablecimiento.',
          }
        }

        return { success: false, error: 'No fue posible iniciar la recuperación de contraseña.' }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No fue posible iniciar la recuperación de contraseña.'),
        }
      }
    },

    async resetPassword(token, newPassword) {
      try {
        const response = await api.post('/api/auth/reset', { token, newPassword })

        if (response.status >= 200 && response.status < 300 && response.data?.success) {
          return {
            success: true,
            message: response.data?.message || 'Contraseña actualizada exitosamente.',
          }
        }

        return { success: false, error: 'No se pudo actualizar la contraseña.' }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo actualizar la contraseña.'),
        }
      }
    },

    async logout(options = { redirect: true }) {
      try {
        if (this.token) {
          await api.post('/api/auth/logout')
        }
      } catch (error) {
        console.warn('No se pudo cerrar sesión en backend, se limpia sesión local.', error)
      } finally {
        this.clearAuthData()
        if (options.redirect !== false) {
          await router.push('/auth/login')
        }
      }
    },

    getAccessTokenExpiryMs() {
      const payload = decodeJwtPayload(this.token)
      if (!payload?.exp) return null
      return Number(payload.exp) * 1000
    },

    isAccessTokenExpiringSoon(minTtlSeconds = DEFAULT_MIN_TTL_SECONDS) {
      if (!this.token) return true

      const expiryMs = this.getAccessTokenExpiryMs()
      if (!expiryMs) return false

      const nowMs = Date.now()
      const minTtlMs = Number(minTtlSeconds) * 1000
      return expiryMs - nowMs <= minTtlMs
    },

    async ensureValidAccessToken(options = {}) {
      if (!this.token) return false

      const minTtlSeconds = Number(options.minTtlSeconds || DEFAULT_MIN_TTL_SECONDS)
      const force = Boolean(options.force)

      if (!force && !this.isAccessTokenExpiringSoon(minTtlSeconds)) {
        return true
      }

      return this.refreshAccessToken()
    },

    async refreshAccessToken() {
      if (!this.refreshToken) return false

      if (refreshInFlightPromise) {
        return refreshInFlightPromise
      }

      refreshInFlightPromise = (async () => {
        try {
          const response = await api.post(
            '/api/auth/refresh',
            {},
            {
              headers: { Authorization: `Bearer ${this.refreshToken}` },
              _skipAuthRefresh: true,
              _skipProactiveRefresh: true,
            },
          )

          const authData = response.data?.data
          if (response.data?.success && authData?.token && authData?.refreshToken) {
            this.setAuthData(authData)
            return true
          }
        } catch {
          // Si el refresh falla, los interceptores se encargan de limpiar/redirect cuando aplique.
        } finally {
          refreshInFlightPromise = null
        }

        return false
      })()

      return refreshInFlightPromise
    },

    hasAnyRole(roles = []) {
      if (!Array.isArray(roles) || roles.length === 0) return true
      if (!this.role) return false

      const normalizedCurrent = this.normalizeRole(this.role)
      return roles.some((role) => normalizedCurrent === this.normalizeRole(role))
    },
  },
})