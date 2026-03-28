import { defineStore } from 'pinia'
import api from '../utils/api' // Debe estar configurado con baseURL apuntando al API Gateway (:8080)
import router from '../router'
import { getFriendlyApiErrorMessage } from '../utils/apiFactory'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('jwt_token') || null,
        refreshToken: localStorage.getItem('refresh_token') || null,
        user: JSON.parse(localStorage.getItem('user_data')) || null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        username: (state) => state.user?.username || null,
        email: (state) => state.user?.email || null,
        role: (state) => state.user?.role || null, // Ej: 'USER', 'ADMIN', 'OPERATOR'
        isEmailVerified: (state) => state.user?.emailVerified || false,
    },

    actions: {
        // Almacena el payload estructurado dentro de 'data'
        setAuthData(authData) {
            this.token = authData.token
            this.refreshToken = authData.refreshToken
            this.user = authData.user

            localStorage.setItem('jwt_token', authData.token)
            localStorage.setItem('refresh_token', authData.refreshToken)
            localStorage.setItem('user_data', JSON.stringify(authData.user))
        },

        clearAuthData() {
            this.token = null
            this.refreshToken = null
            this.user = null

            localStorage.removeItem('jwt_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user_data')
        },

        async login(username, password) {
            try {
                // Endpoint actualizado al API Gateway
                // Nota negocio: algunos frontends mandan email. El gateway puede mapearlo a username.
                const response = await api.post('/api/auth/login', { username, password })

                if (response.data.success && response.data.data?.token) {
                    this.setAuthData(response.data.data)
                    return { success: true, user: response.data.data.user, message: response.data.message }
                }

                return { success: false, error: 'Respuesta inválida del servidor' }
            } catch (error) {
                // Si hay error de conectividad, no mostrar mensaje de credenciales
                const fallback = 'Error al iniciar sesión. Verifica tus credenciales.'
                return {
                    success: false,
                    error: getFriendlyApiErrorMessage(error, fallback)
                }
            }
        },

        async forgotPassword(email) {
            try {
                const response = await api.post('/api/auth/forgot', { email })

                // Regla defensiva: muchos backends responden 200 siempre (anti-enumeración)
                if (response.status >= 200 && response.status < 300) {
                    return {
                        success: true,
                        message: response.data?.message || 'Proceso iniciado. Si el correo existe, recibirás instrucciones en breve.'
                    }
                }

                return { success: false, error: 'Ha ocurrido un error inesperado al solicitar el restablecimiento.' }
            } catch (error) {
                return {
                    success: false,
                    error: getFriendlyApiErrorMessage(error, 'El servicio de recuperación se encuentra inactivo.')
                }
            }
        },

        async register(userData) {
            try {
                // Adaptado al nuevo payload del Auth Service
                const payload = {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    firstName: userData.firstName,
                    lastName: userData.lastName
                }

                const response = await api.post('/api/auth/register', payload)

                if (response.status === 201 && response.data.success) {
                    return { success: true, message: response.data.message, data: response.data.data }
                }
                return { success: false, error: 'Error en el registro' }
            } catch (error) {
                return {
                    success: false,
                    error: getFriendlyApiErrorMessage(error, 'Error inesperado durante el registro')
                }
            }
        },

        async resendVerification(email) {
            try {
                const response = await api.post('/api/auth/verify/email/resend', null, {
                    params: { email }
                })

                if (response.status >= 200 && response.status < 300) {
                    return {
                        success: true,
                        message: response.data?.message || 'Si el correo existe y no está verificado, enviamos un nuevo enlace.'
                    }
                }

                return { success: false, error: 'No se pudo reenviar el correo de verificación.' }
            } catch (error) {
                return {
                    success: false,
                    error: getFriendlyApiErrorMessage(error, 'El servicio de verificación no está disponible en este momento.')
                }
            }
        },

        async confirmEmailVerification(token) {
            try {
                const response = await api.post('/api/auth/verify/email/confirm', { token })

                if (response.status >= 200 && response.status < 300 && response.data?.success) {
                    return {
                        success: true,
                        message: response.data?.message || 'Email verificado exitosamente. Ya puedes iniciar sesión.'
                    }
                }

                return {
                    success: false,
                    error: response.data?.message || 'No se pudo verificar el correo. El enlace puede ser inválido o haber expirado.'
                }
            } catch (error) {
                return {
                    success: false,
                    error: getFriendlyApiErrorMessage(error, 'El servicio de verificación no está disponible en este momento.')
                }
            }
        },

        async logout() {
            try {
                if (this.token) {
                    // Revocación del token actual en el backend
                    await api.post('/api/auth/logout', {}, {
                        headers: { Authorization: `Bearer ${this.token}` }
                    })
                }
            } catch (error) {
                console.warn('Logout en servidor falló, forzando limpieza local', error)
            } finally {
                this.clearAuthData()
                router.push('/login')
            }
        },

        async refreshAccessToken() {
            try {
                if (!this.refreshToken) throw new Error('No refresh token')

                // El backend exige el refresh token en el header Authorization
                const response = await api.post('/api/auth/refresh', {}, {
                    headers: { Authorization: `Bearer ${this.refreshToken}` }
                })

                if (response.data.success && response.data.data?.token) {
                    this.setAuthData(response.data.data)
                    return true
                }
                return false
            } catch (error) {
                this.clearAuthData()
                router.push('/login')
                return false
            }
        },

        // Reemplazo de fetchUserResumen para usar la ruta centralizada del User Service
        async fetchUserData() {
            try {
                if (!this.isAuthenticated) return

                // Consumo a través del Gateway hacia user-service
                const response = await api.get('/api/users/me', {
                    headers: { Authorization: `Bearer ${this.token}` }
                })

                if (response.data?.success && response.data.data) {
                    this.user = { ...this.user, ...response.data.data }
                    localStorage.setItem('user_data', JSON.stringify(this.user))
                }
            } catch (e) {
                console.error('Error sincronizando perfil de usuario', e)
            }
        }
    }
})