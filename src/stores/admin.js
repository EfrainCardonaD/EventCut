import { defineStore } from 'pinia'
import { getAdminApi } from '@/utils/getAdminApi'
import { getApiMessage, getApiPayload, mapApiCodeToUxAction, toApiErrorResult } from '@/utils/apiFactory'

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

const normalizeLimit = (value, fallback = 20) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(100, Math.trunc(parsed))
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    communities: [],
    communitiesTotal: 0,
    communitiesStatusFilter: 'PENDING',
    bannedUsers: [],
    bannedUsersTotal: 0,
    includeInactiveBans: false,
    isLoadingCommunities: false,
    isLoadingBans: false,
    isUpdatingCommunityStatus: false,
    isBanningUser: false,
    isUnbanningUser: false,
    error: null,
    lastTraceId: null,
  }),

  actions: {
    setCommunitiesStatusFilter(status) {
      this.communitiesStatusFilter = status || 'PENDING'
    },

    async fetchCommunities(params = {}) {
      this.isLoadingCommunities = true
      this.error = null

      try {
        const adminApi = await getAdminApi()
        const hasStatusParam = Object.prototype.hasOwnProperty.call(params, 'status')
        const resolvedStatus = hasStatusParam ? params.status : this.communitiesStatusFilter

        const response = await adminApi.get('/api/v1/admin/communities', {
          params: {
            ...(resolvedStatus ? { status: resolvedStatus } : {}),
            limit: normalizeLimit(params.limit, 20),
            offset: Number(params.offset || 0),
          },
        })

        const payload = getApiPayload(response)
        this.communities = Array.isArray(payload?.items) ? payload.items : []
        this.communitiesTotal = Number(payload?.total || this.communities.length)
        return { success: true }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudieron cargar las comunidades para moderacion.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoadingCommunities = false
      }
    },

    async updateCommunityStatus(communityId, payload) {
      if (!communityId) return { success: false, error: 'Comunidad invalida.' }
      const allowedActions = ['ACTIVATE', 'REJECT']
      if (!allowedActions.includes(payload?.action)) {
        return {
          success: false,
          error: 'Accion de estado no soportada por el backend. Usa ACTIVAR o RECHAZAR.',
        }
      }

      this.isUpdatingCommunityStatus = true
      this.error = null

      try {
        const adminApi = await getAdminApi()
        const response = await adminApi.patch(`/api/v1/admin/communities/${communityId}/status`, payload)
        const updated = getApiPayload(response)
        const nextStatusByAction = {
          ACTIVATE: 'ACTIVE',
          REJECT: 'REJECTED',
        }
        const inferredStatus = nextStatusByAction[payload?.action] || null

        this.communities = this.communities.map((community) => {
          if (community.id !== communityId) return community
          return {
            ...community,
            ...updated,
            status: updated?.status || inferredStatus || community.status,
            rejection_reason:
              payload?.action === 'REJECT'
                ? (updated?.rejection_reason || payload?.rejection_reason || community.rejection_reason || null)
                : payload?.action === 'ACTIVATE'
                  ? null
                  : community.rejection_reason,
          }
        })

        return {
          success: true,
          message: getApiMessage(response) || 'Estado de comunidad actualizado correctamente.',
          data: updated,
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo actualizar el estado de la comunidad.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isUpdatingCommunityStatus = false
      }
    },

    async fetchBannedUsers(params = {}) {
      this.isLoadingBans = true
      this.error = null

      try {
        const adminApi = await getAdminApi()
        const response = await adminApi.get('/api/v1/admin/users/banned', {
          params: {
            limit: normalizeLimit(params.limit, 20),
            offset: Number(params.offset || 0),
            include_inactive: Boolean(params.include_inactive ?? this.includeInactiveBans),
          },
        })

        const payload = getApiPayload(response)
        this.bannedUsers = Array.isArray(payload?.items) ? payload.items : []
        this.bannedUsersTotal = Number(payload?.total || this.bannedUsers.length)
        return { success: true }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo cargar el listado de usuarios baneados.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoadingBans = false
      }
    },

    async banUser(userId, reason) {
      if (!userId || !reason) {
        return { success: false, error: 'Debes indicar el usuario y la razon del baneo.' }
      }

      this.isBanningUser = true
      this.error = null

      try {
        const adminApi = await getAdminApi()
        const response = await adminApi.post(`/api/v1/admin/users/${userId}/ban`, { reason })
        return {
          success: true,
          message: getApiMessage(response) || 'Usuario baneado exitosamente.',
          data: getApiPayload(response),
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo banear al usuario.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isBanningUser = false
      }
    },

    async unbanUser(userId) {
      if (!userId) return { success: false, error: 'Debes indicar el usuario.' }

      this.isUnbanningUser = true
      this.error = null

      try {
        const adminApi = await getAdminApi()
        const response = await adminApi.delete(`/api/v1/admin/users/${userId}/ban`)
        this.bannedUsers = this.bannedUsers.filter((item) => item.user_id !== userId)
        this.bannedUsersTotal = this.bannedUsers.length

        return {
          success: true,
          message: getApiMessage(response) || 'Usuario desbaneado exitosamente.',
          data: getApiPayload(response),
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo desbanear al usuario.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isUnbanningUser = false
      }
    },

    async fetchUserBanStatus(userId) {
      if (!userId) return { success: false, error: 'Debes indicar el usuario.' }

      try {
        const adminApi = await getAdminApi()
        const response = await adminApi.get(`/api/v1/admin/users/${userId}/ban-status`)
        return { success: true, data: getApiPayload(response), message: getApiMessage(response) }
      } catch (error) {
        return toStoreErrorResult(error, 'No se pudo consultar el estado de baneo.')
      }
    },
  },
})

