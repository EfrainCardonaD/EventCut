import { defineStore } from 'pinia'
import api from '@/utils/api'
import { getApiMessage, getApiPayload, toApiErrorResult, mapApiCodeToUxAction } from '@/utils/apiFactory'

const toStoreErrorResult = (error, fallbackMessage) => {
  const baseResult = toApiErrorResult(error, fallbackMessage)
  const ux = mapApiCodeToUxAction(baseResult.code)

  if (!ux && baseResult.status === 422) {
    return {
      ...baseResult,
      uxAction: 'SHOW_FIELD_ERRORS',
      uxMessage: 'Corrige los campos marcados e intenta nuevamente.',
    }
  }

  if (!ux) return baseResult

  return {
    ...baseResult,
    uxAction: ux.action,
    uxMessage: ux.message,
  }
}

export const useAdminUsersStore = defineStore('adminUsers', {
  state: () => ({
    users: [],
    usersTotal: 0,
    pagination: {
      limit: 20,
      offset: 0
    },
    filters: {
      search: '',
      role: null
    },
    selectedUser: null,
    userBanStatuses: {},
    isLoading: false,
    isUpdatingRole: false,
    isFetchingBanStatus: false,
    error: null,
    lastTraceId: null,
  }),

  getters: {
    currentPage: (state) => Math.floor(state.pagination.offset / state.pagination.limit) + 1,
    totalPages: (state) => Math.ceil(state.usersTotal / state.pagination.limit),
    hasNextPage: (state) => state.pagination.offset + state.pagination.limit < state.usersTotal,
    hasPrevPage: (state) => state.pagination.offset > 0,
  },

  actions: {
    async fetchUserById(userId) {
      if (!userId) return { success: false, error: 'Usuario requerido.' }

      // Nota: mantenemos api (no adminApi) porque el resto del store usa /api/users
      // y este endpoint solicitado es /api/users/{user_id}.
      try {
        const response = await api.get(`/api/users/${userId}`)
        const payload = getApiPayload(response)
        return {
          success: true,
          message: getApiMessage(response) || 'Usuario cargado correctamente.',
          data: payload,
        }
      } catch (error) {
        return toStoreErrorResult(error, 'No se pudo cargar el detalle del usuario.')
      }
    },
    async fetchUsers(params = {}) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/api/users', {
          params: {
            limit: params.limit || this.pagination.limit,
            offset: params.offset ?? this.pagination.offset,
            ...(this.filters.search && { search: this.filters.search }),
            ...(this.filters.role && { role: this.filters.role }),
          }
        })

        const payload = getApiPayload(response)
        this.users = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : [])
        this.usersTotal = Number(payload?.total || this.users.length)

        if (params.offset !== undefined) {
          this.pagination.offset = params.offset
        }
        if (params.limit !== undefined) {
          this.pagination.limit = params.limit
        }

        return { success: true, data: this.users }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo cargar el listado de usuarios.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoading = false
      }
    },

    async updateUserRole(userId, role) {
      if (!userId || !role) {
        return { success: false, error: 'Usuario y rol son requeridos.' }
      }

      this.isUpdatingRole = true
      this.error = null

      try {
        const response = await api.patch(`/api/users/${userId}/role`, { role })
        const updated = getApiPayload(response)

        this.users = this.users.map((user) => {
          if (user.id !== userId) return user
          return { ...user, role: updated?.role || role }
        })

        return {
          success: true,
          message: getApiMessage(response) || 'Rol actualizado correctamente.',
          data: updated,
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo actualizar el rol del usuario.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isUpdatingRole = false
      }
    },

    async fetchUserBanStatus(userId) {
      if (!userId) return { success: false, error: 'Usuario requerido.' }

      this.isFetchingBanStatus = true

      try {
        // Import adminApi for Events Service endpoint
        const adminApi = (await import('@/utils/adminApi')).default
        const response = await adminApi.get(`/api/v1/admin/users/${userId}/ban-status`)
        const payload = getApiPayload(response)

        this.userBanStatuses[userId] = payload

        return { success: true, data: payload }
      } catch (error) {
        if (error.response?.status === 404) {
          this.userBanStatuses[userId] = { is_banned: false }
          return { success: true, data: { is_banned: false } }
        }
        return toStoreErrorResult(error, 'No se pudo verificar el estado de baneo.')
      } finally {
        this.isFetchingBanStatus = false
      }
    },

    async fetchBanStatusesForUsers(userIds) {
      const promises = userIds.map(id => this.fetchUserBanStatus(id))
      await Promise.allSettled(promises)
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.offset = 0
    },

    setPage(page) {
      this.pagination.offset = (page - 1) * this.pagination.limit
    },

    nextPage() {
      if (this.hasNextPage) {
        this.pagination.offset += this.pagination.limit
      }
    },

    prevPage() {
      if (this.hasPrevPage) {
        this.pagination.offset = Math.max(0, this.pagination.offset - this.pagination.limit)
      }
    },

    selectUser(user) {
      this.selectedUser = user
    },

    clearSelection() {
      this.selectedUser = null
    },

    clearError() {
      this.error = null
      this.lastTraceId = null
    },
  },
})
