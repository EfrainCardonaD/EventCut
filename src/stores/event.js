import { defineStore } from 'pinia'
import eventsApi from '@/utils/eventsApi'
import { getApiMessage, getApiPayload, mapApiCodeToUxAction, toApiErrorResult } from '@/utils/apiFactory'
import { createEventWithSignedImageUpload, updateEventWithSignedImageUpload } from '@/utils/eventCreateFactory'

const FAVORITES_CACHE_PREFIX = 'eventcut.favoriteEventIds'
// TTL para evitar quedarnos con favoritos viejos cuando el usuario cambió de dispositivo.
// Ajustable según necesidad de negocio.
const FAVORITES_CACHE_TTL_MS = 1000 * 60 * 5

const buildFavoritesCacheKey = (userScopedKey = 'anon') => `${FAVORITES_CACHE_PREFIX}:${userScopedKey}`

const readFavoriteIds = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []

    // Nuevo formato: { ids: string[], updatedAt: number }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Backward compatible: formato legacy era solo array.
      return parsed.filter((id) => typeof id === 'string')
    }

    const ids = Array.isArray(parsed?.ids) ? parsed.ids : []
    const updatedAt = typeof parsed?.updatedAt === 'number' ? parsed.updatedAt : 0
    const isFresh = Date.now() - updatedAt <= FAVORITES_CACHE_TTL_MS

    if (!isFresh) return []
    return ids.filter((id) => typeof id === 'string')
  } catch {
    localStorage.removeItem(key)
    return []
  }
}

const saveFavoriteIds = (key, favoriteIds) => {
  localStorage.setItem(
    key,
    JSON.stringify({ ids: favoriteIds, updatedAt: Date.now() }),
  )
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

  const ownerFirstName = rawEvent?.owner_first_name ?? rawEvent?.ownerFirstName ?? ''
  const ownerLastName = rawEvent?.owner_last_name ?? rawEvent?.ownerLastName ?? ''
  const ownerFullName = [ownerFirstName, ownerLastName].map((part) => String(part || '').trim()).filter(Boolean).join(' ')

  const cleanFirstName = String(ownerFirstName || '').trim()
  const cleanLastName = String(ownerLastName || '').trim()
  const lastInitial = cleanLastName ? `${cleanLastName[0].toUpperCase()}.` : ''
  const ownerDisplayName = [cleanFirstName, lastInitial].filter(Boolean).join(' ')

  const socialLinks = rawEvent?.social_links && typeof rawEvent.social_links === 'object'
    ? {
        whatsapp: String(rawEvent.social_links.whatsapp || '').trim(),
        facebook: String(rawEvent.social_links.facebook || '').trim(),
        instagram: String(rawEvent.social_links.instagram || '').trim(),
      }
    : null

  const hasSocialLinks = socialLinks ? Object.values(socialLinks).some(Boolean) : false

  return {
    ...rawEvent,
    score: Number(rawEvent?.score || 0),
    category_id: rawEvent?.category_id ? Number(rawEvent.category_id) : null,
    owner_name: rawEvent?.owner_name || rawEvent?.ownerName || ownerFullName || '',
    owner_display_name:
      rawEvent?.owner_display_name ||
      rawEvent?.ownerDisplayName ||
      ownerDisplayName ||
      rawEvent?.owner_name ||
      rawEvent?.ownerName ||
      ownerFullName ||
      '',
    social_links: hasSocialLinks ? socialLinks : null,
    community_id: rawEvent?.community_id || null,
    isFavorite: typeof serverFavoriteFlag === 'boolean' ? serverFavoriteFlag : favoriteIdsSet.has(rawEvent?.id),
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
      // Se inicializa como vacío y se hidrata cuando sabemos el usuario (o anon).
      favoriteEventIds: [],
      favoriteEventSnapshots: [],

      // Internos para cache y refresco.
      favoritesCacheKey: buildFavoritesCacheKey('anon'),
      lastFavoritesRefreshAt: 0,
      isRefreshingFavorites: false,
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
      return this.filteredEvents
        .filter((event) => {
        const startMs = parseEventDate(event.start_datetime)?.getTime() || 0
        return startMs >= nowMs
        })
        .slice(0, 4)
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
    /**
     * Debe llamarse cuando cambia la sesión (login/logout/refresh) para scopear el cache por usuario.
     * userScopedKey típico: authStore.user?.id || authStore.user?.email || 'anon'
     */
    setFavoritesUserScope(userScopedKey) {
      const nextKey = buildFavoritesCacheKey(userScopedKey || 'anon')
      this.favoritesCacheKey = nextKey

      // Rehidrata desde cache (solo si está fresco por TTL).
      this.favoriteEventIds = readFavoriteIds(nextKey)
      // Mantener snapshots coherentes: si ya no están en IDs, se limpian.
      const valid = new Set(this.favoriteEventIds)
      this.favoriteEventSnapshots = this.favoriteEventSnapshots.filter((e) => valid.has(e.id))
    },

    clearFavoritesCache() {
      try {
        localStorage.removeItem(this.favoritesCacheKey)
      } catch {
        // noop
      }
      this.favoriteEventIds = []
      this.favoriteEventSnapshots = []
      this.lastFavoritesRefreshAt = 0
    },

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
      saveFavoriteIds(this.favoritesCacheKey, this.favoriteEventIds)
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
        const payload = getApiPayload(response)
        this.categories = Array.isArray(payload) ? payload : []
      } catch (error) {
        const apiError = toStoreErrorResult(error, 'No se pudieron cargar las categorias.')
        this.error = apiError.error
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

          const payload = getApiPayload(response)

          const items = Array.isArray(payload?.items) ? payload.items : []
          total = Number(payload?.total ?? collectedItems.length + items.length)

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
        saveFavoriteIds(this.favoritesCacheKey, this.favoriteEventIds)
        this.total = this.events.length
        await this.hydrateFavoriteEvents()
      } catch (error) {
        const apiError = toStoreErrorResult(error, 'No se pudieron cargar los eventos.')
        this.error = apiError.error
      } finally {
        this.isLoadingEvents = false
      }
    },

    async toggleFavorite(eventId) {
      try {
        const response = await eventsApi.post(`/api/v1/events/${eventId}/favorite`)
        const payload = getApiPayload(response)
        const favorited = Boolean(payload?.favorited)

        const favoriteIds = new Set(this.favoriteEventIds)
        if (favorited) favoriteIds.add(eventId)
        else favoriteIds.delete(eventId)
        this.favoriteEventIds = [...favoriteIds]
        saveFavoriteIds(this.favoritesCacheKey, this.favoriteEventIds)

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

        const backendMessage = getApiMessage(response)
        const message =
          backendMessage ||
          (favorited ? 'Evento guardado en favoritos.' : 'Evento eliminado de favoritos.')

        return { success: true, favorited, message }
      } catch (error) {
        return toStoreErrorResult(error, 'No se pudo actualizar tu favorito.')
      }
    },

    /**
     * Refresca favoritos desde el backend para evitar “cache” en multi-dispositivo.
     *
     * Estrategia:
     * - Usa el endpoint dedicado: `GET /api/v1/events/my/favorites` (paginado).
     * - Si falla (p.ej. backend viejo), cae en `fetchEvents()` y reconstruye desde flags `favorited`.
     *
     * Nota: Si el backend pagina o limita resultados, el endpoint dedicado es la opción robusta.
     */
    async refreshFavoritesFromServer(options = {}) {
      const minIntervalMs = typeof options.minIntervalMs === 'number' ? options.minIntervalMs : 15_000
      const force = Boolean(options.force)

      if (!force && Date.now() - this.lastFavoritesRefreshAt < minIntervalMs) return
      if (this.isRefreshingFavorites) return

      this.isRefreshingFavorites = true
      try {
        // 1) Endpoint dedicado (paginado): /api/v1/events/my/favorites
        try {
          const limit = Math.min(Math.max(Number(options.limit ?? 100), 1), 100)
          const collected = []
          let offset = 0
          let total = Number.POSITIVE_INFINITY

          while (collected.length < total) {
            const response = await eventsApi.get('/api/v1/events/my/favorites', {
              params: { limit, offset },
            })

            const payload = getApiPayload(response)
            const data = payload?.data ?? payload
            const pageItems = Array.isArray(data?.items) ? data.items : []
            total = Number(data?.total ?? collected.length + pageItems.length)

            if (!pageItems.length) break
            collected.push(...pageItems)
            offset += pageItems.length

            if (pageItems.length < limit) break
            if (offset >= total) break
            if (offset > 5000) break
          }

          const ids = collected.map((e) => e?.id).filter((id) => typeof id === 'string')
          this.favoriteEventIds = [...new Set(ids)]
          saveFavoriteIds(this.favoritesCacheKey, this.favoriteEventIds)

          // Actualiza snapshots para que el UI tenga data aunque no estén en el listado principal.
          const normalizedItems = collected
            .filter((e) => e?.id)
            .map((e) => ({ ...normalizeEvent(e, new Set(this.favoriteEventIds)), isFavorite: true }))

          const byId = new Map(this.favoriteEventSnapshots.map((e) => [e.id, e]))
          normalizedItems.forEach((e) => byId.set(e.id, e))
          this.favoriteEventSnapshots = [...byId.values()]

          // También patcha la colección principal si ya está cargada.
          const favoritesSet = new Set(this.favoriteEventIds)
          this.events = this.events.map((event) => ({
            ...event,
            isFavorite: favoritesSet.has(event.id),
          }))

          this.lastFavoritesRefreshAt = Date.now()
          return
        } catch {
          // Si falla, caemos al fallback.
        }

        // 2) Fallback: recargar eventos y dejar que los flags del backend (si están) reconstruyan el set.
        // Si el backend no envía flags de favorito, no hay forma de sincronizar sin endpoint dedicado.
        await this.fetchEvents(this.lastEventsQuery || { scope: this.eventsScope || 'all' })
        this.lastFavoritesRefreshAt = Date.now()
      } finally {
        this.isRefreshingFavorites = false
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
            const raw = getApiPayload(response)
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

    async createEvent(payload) {
      this.isSavingEvent = true

      try {
        const { response } = await createEventWithSignedImageUpload(payload)

        if (response.status === 201 || response.status === 200) {
          await this.fetchEvents(this.lastEventsQuery || { scope: this.eventsScope })
          return { success: true }
        }

        return { success: false, error: 'No se pudo crear el evento.' }
      } catch (error) {
        const fallbackMessage = error instanceof Error && error.message ? error.message : 'No se pudo crear el evento.'
        return toStoreErrorResult(error, fallbackMessage)
      } finally {
        this.isSavingEvent = false
      }
    },

    async updateEvent(eventId, payload) {
      this.isUpdatingEvent = true

      try {
        const { response } = await updateEventWithSignedImageUpload(eventId, payload)
        const normalized = normalizeEvent(getApiPayload(response) || {}, new Set(this.favoriteEventIds))
        if (normalized?.id) {
          this.upsertEventInCollections(normalized)
        } else {
          await this.fetchEvents({ month: this.monthKey })
        }

        return { success: true }
      } catch (error) {
        return toStoreErrorResult(error, 'No se pudo actualizar el evento.')
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
        return toStoreErrorResult(error, 'No se pudo eliminar el evento.')
      } finally {
        this.isDeletingEvent = false
      }
    },
  },
})

