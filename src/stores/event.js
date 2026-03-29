import { defineStore } from 'pinia'
import eventsApi from '@/utils/eventsApi'
import { getFriendlyApiErrorMessage } from '@/utils/apiFactory'

const FAVORITES_CACHE_KEY = 'eventcut.favoriteEventIds'

const readFavoriteIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_CACHE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id) => typeof id === 'string')
  } catch {
    localStorage.removeItem(FAVORITES_CACHE_KEY)
    return []
  }
}

const saveFavoriteIds = (favoriteIds) => {
  localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favoriteIds))
}

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toMonthKey = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

const parseEventDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const localDateKeyFromIso = (isoDateTime) => {
  const date = parseEventDate(isoDateTime)
  return date ? toIsoDate(date) : null
}

const normalizeEvent = (rawEvent, favoriteIdsSet) => {
  const serverFavoriteFlag = rawEvent?.favorited ?? rawEvent?.is_favorite ?? rawEvent?.isFavorite

  return {
    ...rawEvent,
    score: Number(rawEvent?.score || 0),
    category_id: rawEvent?.category_id ? Number(rawEvent.category_id) : null,
    isFavorite: typeof serverFavoriteFlag === 'boolean' ? serverFavoriteFlag : favoriteIdsSet.has(rawEvent?.id),
  }
}

export const useEventStore = defineStore('event', {
  state: () => {
    const now = new Date()

    return {
      categories: [],
      events: [],
      total: 0,
      selectedCategoryId: null,
      searchQuery: '',
      selectedDate: toIsoDate(now),
      monthKey: toMonthKey(now),
      eventsScope: 'all',
      isLoadingCategories: false,
      isLoadingEvents: false,
      isSavingEvent: false,
      isUpdatingEvent: false,
      isDeletingEvent: false,
      error: null,
      lastEventsQuery: null,
      favoriteEventIds: readFavoriteIds(),
      favoriteEventSnapshots: [],
    }
  },

  getters: {
    categoriesById: (state) => {
      return state.categories.reduce((acc, category) => {
        acc[category.id] = category
        return acc
      }, {})
    },

    filteredEvents(state) {
      const normalizedSearch = state.searchQuery.trim().toLowerCase()

      return state.events
        .filter((event) => {
          if (state.selectedCategoryId && event.category_id !== state.selectedCategoryId) return false

          if (!normalizedSearch) return true

          const searchableText = [event.title, event.description, event.location]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableText.includes(normalizedSearch)
        })
        .sort((a, b) => {
          const aTime = parseEventDate(a.start_datetime)?.getTime() || 0
          const bTime = parseEventDate(b.start_datetime)?.getTime() || 0
          return aTime - bTime
        })
    },

    upcomingEvents() {
      const nowMs = Date.now()
      return this.filteredEvents.filter((event) => {
        const startMs = parseEventDate(event.start_datetime)?.getTime() || 0
        return startMs >= nowMs
      })
    },

    featuredEvent() {
      if (this.upcomingEvents.length === 0) return null

      return [...this.upcomingEvents].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score

        const aTime = parseEventDate(a.start_datetime)?.getTime() || 0
        const bTime = parseEventDate(b.start_datetime)?.getTime() || 0
        return aTime - bTime
      })[0]
    },

    eventsByDate() {
      return this.filteredEvents.reduce((acc, event) => {
        const key = localDateKeyFromIso(event.start_datetime)
        if (!key) return acc

        if (!acc[key]) acc[key] = []
        acc[key].push(event)
        return acc
      }, {})
    },

    selectedDayEvents() {
      return this.eventsByDate[this.selectedDate] || []
    },

    agendaEvents() {
      // La agenda del sidebar debe reflejar solo el dia seleccionado en calendario.
      return this.selectedDayEvents.slice(0, 5)
    },

    favoriteEvents() {
      const byId = new Map()

      this.favoriteEventSnapshots.forEach((event) => {
        byId.set(event.id, event)
      })

      this.events.forEach((event) => {
        if (event.isFavorite) byId.set(event.id, event)
      })

      return [...byId.values()]
        .filter((event) => {
          if (this.selectedCategoryId && event.category_id !== this.selectedCategoryId) return false

          const normalizedSearch = this.searchQuery.trim().toLowerCase()
          if (!normalizedSearch) return true

          const searchableText = [event.title, event.description, event.location]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableText.includes(normalizedSearch)
        })
        .sort((a, b) => {
          const aTime = parseEventDate(a.start_datetime)?.getTime() || 0
          const bTime = parseEventDate(b.start_datetime)?.getTime() || 0
          return aTime - bTime
        })
    },

    favoriteUpcomingEvents() {
      const nowMs = Date.now()
      return this.favoriteEvents.filter((event) => {
        const startMs = parseEventDate(event.start_datetime)?.getTime() || 0
        return startMs >= nowMs
      })
    },
  },

  actions: {
    upsertEventInCollections(eventToUpsert) {
      this.events = this.events.map((event) => (event.id === eventToUpsert.id ? { ...event, ...eventToUpsert } : event))

      const snapshotIndex = this.favoriteEventSnapshots.findIndex((event) => event.id === eventToUpsert.id)
      if (snapshotIndex >= 0) {
        const copy = [...this.favoriteEventSnapshots]
        copy[snapshotIndex] = { ...copy[snapshotIndex], ...eventToUpsert }
        this.favoriteEventSnapshots = copy
      }

      if (eventToUpsert.isFavorite && snapshotIndex < 0) {
        this.favoriteEventSnapshots = [...this.favoriteEventSnapshots, eventToUpsert]
      }
    },

    removeEventFromCollections(eventId) {
      this.events = this.events.filter((event) => event.id !== eventId)
      this.favoriteEventSnapshots = this.favoriteEventSnapshots.filter((event) => event.id !== eventId)

      this.favoriteEventIds = this.favoriteEventIds.filter((id) => id !== eventId)
      saveFavoriteIds(this.favoriteEventIds)
    },

    setCategory(categoryId) {
      this.selectedCategoryId = categoryId ? Number(categoryId) : null
    },

    setSearchQuery(value) {
      this.searchQuery = value || ''
    },

    setSelectedDate(isoDate) {
      if (!isoDate) return
      this.selectedDate = isoDate
    },

    async setMonthKey(monthKey) {
      if (!monthKey || monthKey === this.monthKey) return
      this.monthKey = monthKey

      // En modo global, el cambio de mes solo afecta la vista/calendario, no el dataset cargado.
      if (this.eventsScope !== 'all') {
        await this.fetchEvents({ month: monthKey, scope: 'month' })
      }
    },

    async fetchCategories() {
      this.isLoadingCategories = true
      this.error = null

      try {
        const response = await eventsApi.get('/api/v1/categories')
        this.categories = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        this.error = getFriendlyApiErrorMessage(error, 'No se pudieron cargar las categorias.')
      } finally {
        this.isLoadingCategories = false
      }
    },

    async fetchEvents(params = {}) {
      this.isLoadingEvents = true
      this.error = null

      const scope = params.scope || this.eventsScope || 'all'
      this.eventsScope = scope

      const limit = Math.min(Math.max(Number(params.limit || 100), 1), 100)

      const baseQuery = {
        sort_by: params.sort_by || 'start_datetime',
      }

      if (scope === 'month') {
        baseQuery.month = params.month || this.monthKey
      }

      if (params.from && params.to) {
        baseQuery.from = params.from
        baseQuery.to = params.to
      }

      this.lastEventsQuery = { ...baseQuery, scope, limit }

      try {
        const collectedItems = []
        let offset = 0
        let total = Number.POSITIVE_INFINITY

        while (collectedItems.length < total) {
          const response = await eventsApi.get('/api/v1/events', {
            params: {
              ...baseQuery,
              limit,
              offset,
            },
          })

          const items = Array.isArray(response.data?.items) ? response.data.items : []
          total = Number(response.data?.total ?? collectedItems.length + items.length)

          if (!items.length) break

          collectedItems.push(...items)
          offset += items.length

          if (items.length < limit) break
          if (offset >= total) break

          // Salvaguarda para evitar loops largos en datasets inesperados.
          if (offset > 5000) break
        }

        const favoriteIdsSet = new Set(this.favoriteEventIds)
        this.events = collectedItems.map((item) => {
          const explicitFlag = item?.favorited ?? item?.is_favorite ?? item?.isFavorite
          const normalized = normalizeEvent(item, favoriteIdsSet)

          if (typeof explicitFlag === 'boolean' && normalized.id) {
            if (explicitFlag) favoriteIdsSet.add(normalized.id)
            else favoriteIdsSet.delete(normalized.id)
            normalized.isFavorite = explicitFlag
          }

          return normalized
        })

        this.favoriteEventIds = [...favoriteIdsSet]
        saveFavoriteIds(this.favoriteEventIds)
        this.total = this.events.length
        await this.hydrateFavoriteEvents()
      } catch (error) {
        this.error = getFriendlyApiErrorMessage(error, 'No se pudieron cargar los eventos.')
      } finally {
        this.isLoadingEvents = false
      }
    },

    async toggleFavorite(eventId) {
      try {
        const response = await eventsApi.post(`/api/v1/events/${eventId}/favorite`)
        const favorited = Boolean(response.data?.favorited)

        const favoriteIds = new Set(this.favoriteEventIds)
        if (favorited) favoriteIds.add(eventId)
        else favoriteIds.delete(eventId)
        this.favoriteEventIds = [...favoriteIds]
        saveFavoriteIds(this.favoriteEventIds)

        this.events = this.events.map((event) => {
          if (event.id !== eventId) return event
          const scoreDelta = favorited ? 1 : -1
          return {
            ...event,
            score: Math.max(0, Number(event.score || 0) + scoreDelta),
            isFavorite: favorited,
          }
        })

        if (!favorited) {
          this.favoriteEventSnapshots = this.favoriteEventSnapshots.filter((event) => event.id !== eventId)
        }

        if (favorited) {
          await this.hydrateFavoriteEvents()
        }

        return { success: true, favorited }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo actualizar tu favorito.'),
        }
      }
    },

    async hydrateFavoriteEvents() {
      if (!this.favoriteEventIds.length) {
        this.favoriteEventSnapshots = []
        return
      }

      const loadedIds = new Set([
        ...this.events.map((event) => event.id),
        ...this.favoriteEventSnapshots.map((event) => event.id),
      ])

      const missingIds = this.favoriteEventIds.filter((id) => !loadedIds.has(id))
      if (!missingIds.length) return

      const fetched = await Promise.all(
        missingIds.map(async (eventId) => {
          try {
            const response = await eventsApi.get(`/api/v1/events/${eventId}`)
            const raw = response.data?.data || response.data?.item || response.data
            if (!raw?.id) return null
            return {
              ...normalizeEvent(raw, new Set(this.favoriteEventIds)),
              isFavorite: true,
            }
          } catch {
            return null
          }
        }),
      )

      const validFetched = fetched.filter(Boolean)
      if (!validFetched.length) return

      const byId = new Map(this.favoriteEventSnapshots.map((event) => [event.id, event]))
      validFetched.forEach((event) => byId.set(event.id, event))
      this.favoriteEventSnapshots = [...byId.values()]
    },

    async uploadEventImage(file) {
      if (!file) return { success: true, imageUrl: null }

      const uploadPath = import.meta.env.VITE_EVENTS_UPLOAD_PATH || '/api/v1/uploads/images'
      const payload = new FormData()
      payload.append('file', file)

      try {
        const response = await eventsApi.post(uploadPath, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        const imageUrl =
          response.data?.data?.url ||
          response.data?.data?.image_url ||
          response.data?.url ||
          response.data?.image_url ||
          null

        if (!imageUrl) {
          return {
            success: false,
            error: 'El servicio devolvio una respuesta de upload sin URL de imagen.',
          }
        }

        return { success: true, imageUrl }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo subir la imagen del evento.'),
        }
      }
    },

    async createEvent(payload) {
      this.isSavingEvent = true

      try {
        const uploadResult = await this.uploadEventImage(payload.imageFile)
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error }
        }

        const requestBody = {
          title: payload.title,
          description: payload.description,
          location: payload.location,
          category_id: Number(payload.category_id),
          start_datetime: payload.start_datetime,
          end_datetime: payload.end_datetime,
          image_url: uploadResult.imageUrl,
        }

        const response = await eventsApi.post('/api/v1/events', requestBody)

        if (response.status === 201 || response.status === 200) {
          await this.fetchEvents(this.lastEventsQuery || { scope: this.eventsScope })
          return { success: true }
        }

        return { success: false, error: 'No se pudo crear el evento.' }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo crear el evento.'),
        }
      } finally {
        this.isSavingEvent = false
      }
    },

    async updateEvent(eventId, payload) {
      this.isUpdatingEvent = true

      try {
        let imageUrl
        if (payload.imageFile) {
          const uploadResult = await this.uploadEventImage(payload.imageFile)
          if (!uploadResult.success) {
            return { success: false, error: uploadResult.error }
          }
          imageUrl = uploadResult.imageUrl
        }

        const requestBody = {
          title: payload.title,
          description: payload.description,
          location: payload.location,
          category_id: Number(payload.category_id),
          start_datetime: payload.start_datetime,
          end_datetime: payload.end_datetime,
        }

        if (imageUrl) requestBody.image_url = imageUrl

        const response = await eventsApi.patch(`/api/v1/events/${eventId}`, requestBody)
        const normalized = normalizeEvent(response.data?.data || response.data || {}, new Set(this.favoriteEventIds))
        if (normalized?.id) {
          this.upsertEventInCollections(normalized)
        } else {
          await this.fetchEvents({ month: this.monthKey })
        }

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo actualizar el evento.'),
        }
      } finally {
        this.isUpdatingEvent = false
      }
    },

    async deleteEvent(eventId) {
      this.isDeletingEvent = true

      try {
        await eventsApi.delete(`/api/v1/events/${eventId}`)
        this.removeEventFromCollections(eventId)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: getFriendlyApiErrorMessage(error, 'No se pudo eliminar el evento.'),
        }
      } finally {
        this.isDeletingEvent = false
      }
    },
  },
})

