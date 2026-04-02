import { defineStore } from 'pinia'
import eventsApi from '@/utils/eventsApi'
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

export const useAdminEventsStore = defineStore('adminEvents', {
  state: () => ({
    events: [],
    eventsTotal: 0,
    categories: [],
    pagination: {
      limit: 20,
      offset: 0
    },
    filters: {
      category_id: null,
      month: null,
      sort_by: 'start_datetime',
      owner_id: null
    },
    selectedEvent: null,
    isLoading: false,
    isLoadingCategories: false,
    isSavingCategory: false,
    isDeletingCategory: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    lastTraceId: null,
  }),

  getters: {
    currentPage: (state) => Math.floor(state.pagination.offset / state.pagination.limit) + 1,
    totalPages: (state) => Math.ceil(state.eventsTotal / state.pagination.limit),
    hasNextPage: (state) => state.pagination.offset + state.pagination.limit < state.eventsTotal,
    hasPrevPage: (state) => state.pagination.offset > 0,
  },

  actions: {
    async fetchEvents(params = {}) {
      this.isLoading = true
      this.error = null

      try {
        const queryParams = {
          limit: params.limit || this.pagination.limit,
          offset: params.offset ?? this.pagination.offset,
          ...(this.filters.category_id && { category_id: this.filters.category_id }),
          ...(this.filters.month && { month: this.filters.month }),
          ...(this.filters.sort_by && { sort_by: this.filters.sort_by }),
          ...(this.filters.owner_id && { owner_id: this.filters.owner_id }),
        }

        const response = await eventsApi.get('/api/v1/events', { params: queryParams })
        const payload = getApiPayload(response)

        this.events = Array.isArray(payload?.items) ? payload.items : []
        this.eventsTotal = Number(payload?.total || this.events.length)

        if (params.offset !== undefined) {
          this.pagination.offset = params.offset
        }
        if (params.limit !== undefined) {
          this.pagination.limit = params.limit
        }

        return { success: true, data: this.events }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudieron cargar los eventos.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isLoading = false
      }
    },

    async fetchCategories(options = {}) {
      const force = Boolean(options?.force)
      if (!force && this.categories.length > 0) return { success: true, data: this.categories }

      this.isLoadingCategories = true

      try {
        const response = await eventsApi.get('/api/v1/categories')
        const payload = getApiPayload(response)
        this.categories = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : [])
        return { success: true, data: this.categories }
      } catch (error) {
        return toStoreErrorResult(error, 'No se pudieron cargar las categorías.')
      } finally {
        this.isLoadingCategories = false
      }
    },

    async createCategory(payload) {
      const name = String(payload?.name || '').trim()
      const slug = String(payload?.slug || '').trim()

      if (!name || !slug) {
        return { success: false, error: 'Nombre y slug son requeridos.' }
      }

      this.isSavingCategory = true
      this.error = null

      try {
        const response = await eventsApi.post('/api/v1/categories', { name, slug })
        const created = getApiPayload(response)
        this.categories = [...this.categories, created].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))

        return {
          success: true,
          message: getApiMessage(response) || 'Categoria creada correctamente.',
          data: created,
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo crear la categoria.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isSavingCategory = false
      }
    },

    async updateCategory(categoryId, payload) {
      if (!categoryId) return { success: false, error: 'Categoria invalida.' }

      const name = String(payload?.name || '').trim()
      const slug = String(payload?.slug || '').trim()
      if (!name) return { success: false, error: 'El nombre es requerido.' }

      this.isSavingCategory = true
      this.error = null

      try {
        const response = await eventsApi.patch(`/api/v1/categories/${categoryId}`, {
          name,
          ...(slug && { slug }),
        })
        const updated = getApiPayload(response)

        this.categories = this.categories
          .map((category) => (category.id === categoryId ? { ...category, ...updated } : category))
          .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))

        return {
          success: true,
          message: getApiMessage(response) || 'Categoria actualizada correctamente.',
          data: updated,
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo actualizar la categoria.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isSavingCategory = false
      }
    },

    async deleteCategory(categoryId) {
      if (!categoryId) return { success: false, error: 'Categoria invalida.' }

      this.isDeletingCategory = true
      this.error = null

      try {
        const response = await eventsApi.delete(`/api/v1/categories/${categoryId}`)
        this.categories = this.categories.filter((category) => category.id !== categoryId)

        return {
          success: true,
          message: getApiMessage(response) || 'Categoria eliminada correctamente.',
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo eliminar la categoria.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isDeletingCategory = false
      }
    },

    async updateEvent(eventId, payload) {
      if (!eventId) return { success: false, error: 'Evento inválido.' }

      this.isUpdating = true
      this.error = null

      try {
        const response = await eventsApi.patch(`/api/v1/events/${eventId}`, payload)
        const updated = getApiPayload(response)

        this.events = this.events.map((event) => {
          if (event.id !== eventId) return event
          return { ...event, ...updated }
        })

        return {
          success: true,
          message: getApiMessage(response) || 'Evento actualizado correctamente.',
          data: updated,
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo actualizar el evento.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isUpdating = false
      }
    },

    async deleteEvent(eventId) {
      if (!eventId) return { success: false, error: 'Evento inválido.' }

      this.isDeleting = true
      this.error = null

      try {
        await eventsApi.delete(`/api/v1/events/${eventId}`)

        this.events = this.events.filter((event) => event.id !== eventId)
        this.eventsTotal = Math.max(0, this.eventsTotal - 1)

        return {
          success: true,
          message: 'Evento eliminado correctamente.',
        }
      } catch (error) {
        const result = toStoreErrorResult(error, 'No se pudo eliminar el evento.')
        this.error = result.error
        this.lastTraceId = result.traceId || null
        return result
      } finally {
        this.isDeleting = false
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.offset = 0
    },

    clearFilters() {
      this.filters = {
        category_id: null,
        month: null,
        sort_by: 'start_datetime',
        owner_id: null
      }
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

    selectEvent(event) {
      this.selectedEvent = event
    },

    clearSelection() {
      this.selectedEvent = null
    },

    clearError() {
      this.error = null
      this.lastTraceId = null
    },
  },
})
