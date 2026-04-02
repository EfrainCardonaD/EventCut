import { defineStore } from 'pinia'
import communitiesApi from '@/utils/communitiesApi'
import { getApiMessage, getApiPayload, mapApiCodeToUxAction, toApiErrorResult } from '@/utils/apiFactory'
import { updateCommunityWithSignedImageUpload } from '@/utils/communityImageFactory'

const normalizeSocialLinks = (links) => {
  if (!links || typeof links !== 'object' || Array.isArray(links)) return null

  const normalized = {
    whatsapp: typeof links.whatsapp === 'string' ? links.whatsapp.trim() : '',
    facebook: typeof links.facebook === 'string' ? links.facebook.trim() : '',
    instagram: typeof links.instagram === 'string' ? links.instagram.trim() : '',
  }

  const hasAny = Object.values(normalized).some(Boolean)
  return hasAny ? normalized : null
}

const normalizeImageUrl = (source) => {
  if (!source || typeof source !== 'object') return null
  const candidates = [source.image_url, source.imageUrl, source.image, source.cover_url, source.coverUrl]
  const first = candidates.find((value) => typeof value === 'string' && value.trim())
  return first ? first.trim() : null
}

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeCommunity = (rawCommunity) => {
  const imageUrl = normalizeImageUrl(rawCommunity)
  return {
    ...rawCommunity,
    social_links: normalizeSocialLinks(rawCommunity?.social_links),
    image_url: imageUrl,
    category_id: toNullableNumber(rawCommunity?.category_id),
    events_count: Number(rawCommunity?.events_count || 0),
  }
}

const normalizeEvent = (rawEvent) => {
  const imageUrl = normalizeImageUrl(rawEvent)
  return {
    ...rawEvent,
    social_links: normalizeSocialLinks(rawEvent?.social_links),
    image_url: imageUrl,
    category_id: rawEvent?.category_id ? Number(rawEvent.category_id) : null,
    score: Number(rawEvent?.score || 0),
  }
}

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

export const useCommunityStore = defineStore('community', {
  state: () => ({
    activeList: [],
    activeTotal: 0,
    selectedCommunityId: '',
    myList: [],
    myTotal: 0,
    mySubscribedList: [],
    mySubscribedTotal: 0,
    detail: null,
    events: [],
    requests: [],
    requestsTotal: 0,
    isLoadingList: false,
    isLoadingMyList: false,
    isLoadingMySubscribedList: false,
    isLoadingDetail: false,
    isLoadingEvents: false,
    isLoadingRequests: false,
    isSavingCommunity: false,
    isUpdatingCommunity: false,
    isDeletingCommunity: false,
    isSendingRequest: false,
    isUpdatingRequest: false,
    subscribingCommunityIds: [],
    error: null,
    lastTraceId: null,
  }),

  getters: {
    selectedCommunity(state) {
      if (!state.selectedCommunityId) return null
      return state.activeList.find((item) => item.id === state.selectedCommunityId) || null
    },
    isSubscribed(state) {
      const subscribedIds = new Set((state.mySubscribedList || []).map((item) => item.id))
      return (communityId) => Boolean(communityId && subscribedIds.has(communityId))
    },
    isSubscriptionUpdating(state) {
      const pendingIds = new Set(state.subscribingCommunityIds || [])
      return (communityId) => Boolean(communityId && pendingIds.has(communityId))
    },
  },

  actions: {
    setSelectedCommunityId(communityId) {
      this.selectedCommunityId = communityId || ''
    },

    async fetchActiveCommunities(params = {}) {
      this.isLoadingList = true
      this.error = null

      try {
        const response = await communitiesApi.get('/api/v1/communities', {
          params: {
            search: params.search || undefined,
            category_id: toNullableNumber(params.category_id) || undefined,
            limit: Number(params.limit || 20),
            offset: Number(params.offset || 0),
          },
        })

        const payload = getApiPayload(response)
        const items = Array.isArray(payload?.items) ? payload.items : []
        this.activeList = items.map(normalizeCommunity)
        this.activeTotal = Number(payload?.total || this.activeList.length)

        if (!this.selectedCommunityId && this.activeList[0]?.id) {
          this.selectedCommunityId = this.activeList[0].id
        }

        return { success: true }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudieron cargar las comunidades.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoadingList = false
      }
    },

    async fetchMyCommunities(params = {}) {
      this.isLoadingMyList = true
      this.error = null

      try {
        const response = await communitiesApi.get('/api/v1/communities/my', {
          params: {
            limit: Number(params.limit || 20),
            offset: Number(params.offset || 0),
          },
        })

        const payload = getApiPayload(response)
        const items = Array.isArray(payload?.items) ? payload.items : []
        this.myList = items.map(normalizeCommunity)
        this.myTotal = Number(payload?.total || this.myList.length)
        return { success: true }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudieron cargar tus comunidades.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoadingMyList = false
      }
    },

    async fetchMySubscribedCommunities(params = {}) {
      this.isLoadingMySubscribedList = true
      this.error = null

      try {
        const response = await communitiesApi.get('/api/v1/communities/my/subscriptions', {
          params: {
            limit: Number(params.limit || 20),
            offset: Number(params.offset || 0),
          },
        })

        const payload = getApiPayload(response)
        const items = Array.isArray(payload?.items) ? payload.items : []
        this.mySubscribedList = items.map(normalizeCommunity)
        this.mySubscribedTotal = Number(payload?.total || this.mySubscribedList.length)
        return { success: true }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudieron cargar tus suscripciones.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoadingMySubscribedList = false
      }
    },

    async fetchCommunityDetail(communityId) {
      if (!communityId) return { success: false, error: 'Comunidad invalida.' }
      this.isLoadingDetail = true
      this.error = null

      try {
        const response = await communitiesApi.get(`/api/v1/communities/${communityId}`)
        this.detail = normalizeCommunity(getApiPayload(response))
        return { success: true }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo obtener el detalle de la comunidad.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoadingDetail = false
      }
    },

    async fetchCommunityEvents(communityId, params = {}) {
      if (!communityId) {
        this.events = []
        return { success: true }
      }

      this.isLoadingEvents = true
      this.error = null

      try {
        const response = await communitiesApi.get(`/api/v1/communities/${communityId}/events`, {
          params: {
            from: params.from || undefined,
            to: params.to || undefined,
            limit: Number(params.limit || 50),
            offset: Number(params.offset || 0),
          },
        })

        const payload = getApiPayload(response)
        const items = Array.isArray(payload?.items) ? payload.items : []
        this.events = items.map(normalizeEvent)
        return { success: true }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudieron cargar los eventos de la comunidad.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        this.events = []
        return result
      } finally {
        this.isLoadingEvents = false
      }
    },

    async createCommunity(payload) {
      this.isSavingCommunity = true
      this.error = null

      try {
        const response = await communitiesApi.post('/api/v1/communities', payload)
        const created = normalizeCommunity(getApiPayload(response))

        this.myList = [created, ...this.myList.filter((item) => item.id !== created.id)]
        this.myTotal = this.myList.length

        return {
          success: true,
          message: getApiMessage(response) || 'Comunidad enviada a revision',
          community: created,
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo crear la comunidad.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isSavingCommunity = false
      }
    },

    async updateCommunity(communityId, payload) {
      if (!communityId) return { success: false, error: 'Comunidad invalida.' }
      this.isUpdatingCommunity = true
      this.error = null

      try {
        const { response, updatedCommunity } = await updateCommunityWithSignedImageUpload(communityId, payload || {})
        const updatedPayload = updatedCommunity || getApiPayload(response)
        const fallbackPayload = { ...(payload || {}) }
        delete fallbackPayload.imageFile
        delete fallbackPayload.imageAction
        const fallbackCommunity = {
          id: communityId,
          ...fallbackPayload,
        }
        const updated = normalizeCommunity(updatedPayload?.id ? updatedPayload : fallbackCommunity)

        const mergeById = (item) => {
          if (item.id !== communityId) return item
          return normalizeCommunity({ ...item, ...updated })
        }

        this.activeList = this.activeList.map(mergeById)
        this.myList = this.myList.map(mergeById)
        this.mySubscribedList = this.mySubscribedList.map(mergeById)

        if (this.detail?.id === communityId) {
          this.detail = normalizeCommunity({ ...this.detail, ...updated })
        }

        return {
          success: true,
          message: getApiMessage(response) || 'Comunidad actualizada.',
          community: updated,
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo actualizar la comunidad.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isUpdatingCommunity = false
      }
    },

    async updateCommunityCategory(communityId, categoryId) {
      if (!communityId) return { success: false, error: 'Comunidad invalida.' }

      const parsedCategoryId = toNullableNumber(categoryId)
      if (!parsedCategoryId) return { success: false, error: 'Categoria invalida.' }

      const result = await this.updateCommunity(communityId, { category_id: parsedCategoryId })
      if (!result.success) {
        return {
          ...result,
          error: result.error || 'No se pudo actualizar la categoria de la comunidad.',
        }
      }

      return {
        ...result,
        message: result.message || 'Categoria actualizada.',
      }
    },

    async deleteCommunity(communityId) {
      if (!communityId) return { success: false, error: 'Comunidad invalida.' }

      this.isDeletingCommunity = true
      this.error = null

      try {
        await communitiesApi.delete(`/api/v1/communities/${communityId}`)

        this.activeList = this.activeList.filter((item) => item.id !== communityId)
        this.myList = this.myList.filter((item) => item.id !== communityId)
        this.mySubscribedList = this.mySubscribedList.filter((item) => item.id !== communityId)
        this.activeTotal = this.activeList.length
        this.myTotal = this.myList.length
        this.mySubscribedTotal = this.mySubscribedList.length

        if (this.selectedCommunityId === communityId) {
          this.selectedCommunityId = this.activeList[0]?.id || ''
        }

        if (this.detail?.id === communityId) {
          this.detail = null
          this.events = []
        }

        return {
          success: true,
          message: 'Comunidad eliminada.',
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo eliminar la comunidad.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isDeletingCommunity = false
      }
    },

    async subscribeToCommunity(communityId) {
      if (!communityId) return { success: false, error: 'Comunidad invalida.' }
      this.error = null

      if (!this.subscribingCommunityIds.includes(communityId)) {
        this.subscribingCommunityIds = [...this.subscribingCommunityIds, communityId]
      }

      try {
        const response = await communitiesApi.post(`/api/v1/communities/${communityId}/subscribe`)

        const foundInActive = this.activeList.find((item) => item.id === communityId)
        if (foundInActive && !this.mySubscribedList.some((item) => item.id === communityId)) {
          this.mySubscribedList = [foundInActive, ...this.mySubscribedList]
        }
        this.mySubscribedTotal = this.mySubscribedList.length

        return {
          success: true,
          message: getApiMessage(response) || 'Suscripcion registrada.',
          data: getApiPayload(response),
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo registrar la suscripcion.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.subscribingCommunityIds = this.subscribingCommunityIds.filter((id) => id !== communityId)
      }
    },

    async unsubscribeFromCommunity(communityId) {
      if (!communityId) return { success: false, error: 'Comunidad invalida.' }
      this.error = null

      if (!this.subscribingCommunityIds.includes(communityId)) {
        this.subscribingCommunityIds = [...this.subscribingCommunityIds, communityId]
      }

      try {
        await communitiesApi.delete(`/api/v1/communities/${communityId}/subscribe`)
        this.mySubscribedList = this.mySubscribedList.filter((item) => item.id !== communityId)
        this.mySubscribedTotal = this.mySubscribedList.length
        return {
          success: true,
          message: 'Suscripcion eliminada.',
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo eliminar la suscripcion.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.subscribingCommunityIds = this.subscribingCommunityIds.filter((id) => id !== communityId)
      }
    },

    async requestEventJoin(communityId, eventId) {
      if (!communityId || !eventId) {
        return { success: false, error: 'Datos incompletos para enviar la solicitud.' }
      }

      this.isSendingRequest = true
      this.error = null

      try {
        const response = await communitiesApi.post(`/api/v1/communities/${communityId}/events/${eventId}/request`)

        return {
          success: true,
          message: getApiMessage(response) || 'Solicitud enviada al dueno de la comunidad.',
          data: getApiPayload(response),
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo enviar la solicitud del evento.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isSendingRequest = false
      }
    },
  },
})

