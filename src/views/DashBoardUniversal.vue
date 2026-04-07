<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { parseDateOnlyLocal } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Alert from '@/components/util/Alert.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import EventCardModalEdit from '@/components/events/EventCardModalEdit.vue'
import CalendarWidget from '@/components/events/CalendarWidget.vue'
import CreateEventModal from '@/components/events/CreateEventModal.vue'
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'
import RichTextRenderer from '@/components/util/RichTextRenderer.vue'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'

const authStore = useAuthStore()
const eventStore = useEventStore()
const route = useRoute()
const router = useRouter()

const { categories, filteredEvents, upcomingEvents, favoriteEvents, favoriteUpcomingEvents, eventsByDate, selectedDate, agendaEvents, monthKey, isLoadingEvents, isSavingEvent, isUpdatingEvent, isDeletingEvent, error } = storeToRefs(eventStore)

const isLoggingOut = ref(false)
const logoutModalOpen = ref(false)
const createModalOpen = ref(false)
const mobileSearchOpen = ref(false)
const mobileScheduleOpen = ref(false)
const eventModalOpen = ref(false)
const eventEditModalOpen = ref(false)
const activeEvent = ref(null)
const hasEventModalHistoryEntry = ref(false)
const isClosingEventModalFromHistory = ref(false)
const toast = ref({ show: false, type: 'info', title: '', message: '' })
const createSubmitError = ref('')
const createFieldErrors = ref({})
const updateSubmitError = ref('')
const updateFieldErrors = ref({})
const featuredRailRef = ref(null)
const featuredCanScroll = ref(false)
const featuredAtStart = ref(true)
const featuredAtEnd = ref(false)

const searchQuery = computed({
  get: () => eventStore.searchQuery,
  set: (value) => eventStore.setSearchQuery(value),
})

const selectedCategory = computed({
  get: () => eventStore.selectedCategoryId,
  set: (value) => eventStore.setCategory(value),
})

const isAdminUser = computed(() => authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN']))

const isCommunitiesRoute = computed(() => route.path.startsWith('/app/comunidades'))

const avatarInitial = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''
  const fallback = authStore.username || ''
  const source = `${firstName} ${lastName}`.trim() || fallback || 'U'
  return source.charAt(0).toUpperCase()
})

const selectedDateLabel = computed(() => {
  const parsed = parseDateOnlyLocal(selectedDate.value)
  if (!parsed) return 'agenda actual'

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(parsed)
})

const featuredEvents = computed(() => {
  const nowMs = Date.now()
  return [...filteredEvents.value]
    .filter((event) => {
      const startMs = new Date(event.start_datetime).getTime()
      return Number.isFinite(startMs) && startMs >= nowMs
    })
    .sort((a, b) => {
      const scoreDiff = Number(b.score || 0) - Number(a.score || 0)
      if (scoreDiff !== 0) return scoreDiff
      return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    })
    .slice(0, 8)
})

const formatFeaturedDateTime = (event) => {
  if (!event) return ''
  const start = new Date(event.start_datetime)
  const end = new Date(event.end_datetime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''

  const dayFormatter = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const hourFormatter = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${dayFormatter.format(start)} · ${hourFormatter.format(start)} - ${hourFormatter.format(end)}`
}

const syncFeaturedRailState = () => {
  const rail = featuredRailRef.value
  if (!rail) return
  featuredCanScroll.value = rail.scrollWidth - rail.clientWidth > 8
  featuredAtStart.value = rail.scrollLeft <= 8
  featuredAtEnd.value = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8
}

const scrollFeatured = (direction) => {
  const rail = featuredRailRef.value
  if (!rail) return
  rail.scrollBy({ left: direction * Math.max(280, rail.clientWidth * 0.8), behavior: 'smooth' })
}

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const onLogout = async () => {
  isLoggingOut.value = true
  try {
    await authStore.logout({ redirect: true })
  } catch {
    showToast('error', 'No se pudo cerrar sesion', 'Intenta nuevamente en unos segundos.')
  } finally {
    isLoggingOut.value = false
  }
}

const onChangeMonth = async (nextMonthKey) => {
  await eventStore.setMonthKey(nextMonthKey)
}

const onSelectDate = (dateKey) => {
  eventStore.setSelectedDate(dateKey)
}

const onToggleFavorite = async (event) => {
  const result = await eventStore.toggleFavorite(event.id)
  if (!result.success) {
    showToast('error', 'No se pudo guardar favorito', result.error)
    return
  }

  showToast('success', result.favorited ? 'Favorito guardado' : 'Favorito removido', result.message)
}

const onCreateEvent = async (payload) => {
  createSubmitError.value = ''
  createFieldErrors.value = {}

  const result = await eventStore.createEvent(payload)
  if (!result.success) {
    if (result.uxAction === 'SHOW_FIELD_ERRORS' || result.status === 422) {
      createSubmitError.value = result.error || ''
      createFieldErrors.value = normalizeFieldErrors(result.details)
    }
    showToast('error', 'No se pudo crear el evento', result.error)
    return
  }

  createSubmitError.value = ''
  createFieldErrors.value = {}
  createModalOpen.value = false
  showToast('success', 'Evento creado', 'Tu evento ya aparece en la cartelera del mes seleccionado.')
}

const onToggleMobileSearch = () => {
  mobileSearchOpen.value = !mobileSearchOpen.value
}

const openEventModal = (event) => {
  // Si el editor estaba abierto, cerrarlo y limpiar errores para evitar que “se quede pegado”
  // cuando seleccionas otra card.
  eventEditModalOpen.value = false
  updateSubmitError.value = ''
  updateFieldErrors.value = {}

  activeEvent.value = event
  eventModalOpen.value = true
}

const onRequestEditEvent = () => {
  if (!activeEvent.value) return
  // NO limpiamos activeEvent: el editor depende de este.
  eventModalOpen.value = false
  eventEditModalOpen.value = true
}

const closeEventModal = () => {
  eventModalOpen.value = false
  activeEvent.value = null
}

const openEventModalFromMobileSchedule = (event) => {
  mobileScheduleOpen.value = false
  openEventModal(event)
}

const isEventManageable = computed(() => {
  if (!activeEvent.value) return false

  const currentUserId = authStore.user?.id || authStore.user?.userId || authStore.user?.sub || null
  const isOwner = Boolean(currentUserId && activeEvent.value.owner_id === currentUserId)
  const isAdmin = authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN'])

  return isOwner || isAdmin
})

const onUpdateEvent = async (payload) => {
  updateSubmitError.value = ''
  updateFieldErrors.value = {}

  const result = await eventStore.updateEvent(payload.eventId, payload)
  if (!result.success) {
    if (result.uxAction === 'SHOW_FIELD_ERRORS' || result.status === 422) {
      updateSubmitError.value = result.error || ''
      updateFieldErrors.value = normalizeFieldErrors(result.details)
    }
    showToast('error', 'No se pudo actualizar', result.error)
    return
  }

  updateSubmitError.value = ''
  updateFieldErrors.value = {}
  const refreshedEvent = eventStore.events.find((event) => event.id === payload.eventId) || eventStore.favoriteEventSnapshots.find((event) => event.id === payload.eventId)
  if (refreshedEvent) activeEvent.value = refreshedEvent
  eventEditModalOpen.value = false
  showToast('success', 'Evento actualizado', 'Se guardaron los cambios del evento.')
}

const onDeleteEvent = async (eventId) => {
  const result = await eventStore.deleteEvent(eventId)
  if (!result.success) {
    showToast('error', 'No se pudo eliminar', result.error)
    return
  }

  eventModalOpen.value = false
  eventEditModalOpen.value = false
  activeEvent.value = null
  showToast('success', 'Evento eliminado', 'El evento fue retirado de la cartelera.')
}

const onEventModalPopState = () => {
  if (!eventModalOpen.value) {
    hasEventModalHistoryEntry.value = false
    return
  }

  isClosingEventModalFromHistory.value = true
  closeEventModal()
  hasEventModalHistoryEntry.value = false
}

const onSyncSchedule = () => {
  showToast('info', 'Proximamente', 'La sincronizacion con Google Calendar estara disponible en una siguiente iteracion.')
}

onMounted(async () => {
   await eventStore.fetchCategories()
   await eventStore.fetchEvents({ scope: 'all' })
   await nextTick()
   syncFeaturedRailState()

  if (error.value) {
    showToast('error', 'Error al sincronizar eventos', error.value)
  }

  window.addEventListener('resize', syncFeaturedRailState)
  window.addEventListener('popstate', onEventModalPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncFeaturedRailState)
  window.removeEventListener('popstate', onEventModalPopState)
})

watch(createModalOpen, (isOpen) => {
  if (isOpen) return
  createSubmitError.value = ''
  createFieldErrors.value = {}
})

watch(eventModalOpen, (isOpen) => {
  if (isOpen) {
    if (!hasEventModalHistoryEntry.value) {
      window.history.pushState({ modal: 'event-details' }, '')
      hasEventModalHistoryEntry.value = true
    }
    return
  }

  // Si estamos transicionando al modal de edición, NO borrar activeEvent.
  if (eventEditModalOpen.value) {
    // Limpieza mínima: history.
    if (hasEventModalHistoryEntry.value && !isClosingEventModalFromHistory.value) {
      hasEventModalHistoryEntry.value = false
      window.history.back()
    }
    isClosingEventModalFromHistory.value = false
    return
  }

  if (hasEventModalHistoryEntry.value && !isClosingEventModalFromHistory.value) {
    hasEventModalHistoryEntry.value = false
    window.history.back()
  }

  isClosingEventModalFromHistory.value = false
  activeEvent.value = null
  updateSubmitError.value = ''
  updateFieldErrors.value = {}
})

watch(eventEditModalOpen, (isOpen) => {
  if (isOpen) return
  updateSubmitError.value = ''
  updateFieldErrors.value = {}
})

watch(featuredEvents, async () => {
  await nextTick()
  syncFeaturedRailState()
})
</script>

<template>
  <AppHeader
      v-model="searchQuery"
      :is-admin-user="isAdminUser"
      :avatar-initial="avatarInitial"
      @create-event="createModalOpen = true"
      @logout="logoutModalOpen = true"
  />
  <div class="transition-colors duration-300 selection:bg-tertiary-400/30">
    <SpinnerOverlay :show="isLoggingOut || isLoadingEvents" :text="isLoggingOut ? 'Cerrando sesion...' : 'Sincronizando eventos...'" />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="5000"
    />

    <ConfirmModal
      v-model="logoutModalOpen"
      title-user="Cerrar sesion"
      message="Se cerrara tu sesion actual en EventCut."
      description="Si tienes cambios sin guardar en otra pestaña, podrian perderse."
      confirm-text="Si, cerrar sesion"
      cancel-text="Cancelar"
      :danger="false"
      @confirm="onLogout"
    />

    <CreateEventModal
      v-model="createModalOpen"
      :categories="categories"
      :is-saving="isSavingEvent"
      :submit-error="createSubmitError"
      :field-errors="createFieldErrors"
      @submit="onCreateEvent"
    />
    <EventCardModal
      v-model="eventModalOpen"
      :event="activeEvent"
      :categories="categories"
      :can-manage="isEventManageable"
      @edit="onRequestEditEvent"
      @toggle-favorite="onToggleFavorite"
    />

    <EventCardModalEdit
      v-model="eventEditModalOpen"
      :event="activeEvent"
      :categories="categories"
      :can-manage="isEventManageable"
      :is-saving="isUpdatingEvent"
      :is-deleting="isDeletingEvent"
      :submit-error="updateSubmitError"
      :field-errors="updateFieldErrors"
      @save="onUpdateEvent"
      @delete="onDeleteEvent"
    />


    <main class="min-h-screen pb-24 pt-14 sm:pt-16 md:pt-20 md:pb-8 xl:pr-[22rem]">
      <div class="p-4 md:p-8 lg:p-12">
        <div class="mb-4">
          <div class="relative -mx-4 md:mx-0">
            <div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950 md:hidden"></div>
            <div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-950 md:hidden"></div>

            <div class="flex items-center gap-2 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                class="snap-start whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold shadow-sm sm:px-5 sm:text-sm"
                :class="selectedCategory === null ? 'bg-primary-600 text-white dark:bg-primary-500 dark:text-primary-950' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'"
                @click="selectedCategory = null"
              >
                Todas
              </button>
              <button
                v-for="category in categories"
                :key="category.id"
                class="snap-start whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-200 sm:px-5 sm:text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                :class="selectedCategory === category.id ? '!bg-primary-600 !text-white dark:!bg-primary-500 dark:!text-primary-950' : ''"
                @click="selectedCategory = category.id"
              >
                {{ category.name }}
              </button>
            </div>
          </div>

          <p class="mt-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:hidden">
            <span class="material-symbols-outlined text-xs">swipe</span>
            Desliza para ver mas categorias
          </p>
        </div>

        <section class="mb-8" v-if="featuredEvents.length">
          <div class="mb-4 flex items-end justify-between">
            <h2 class="font-headline text-2xl font-extrabold tracking-tight md:text-3xl">Destacado</h2>

            <div v-if="featuredCanScroll" class="flex items-center gap-2">
              <button
                  type="button"
                  class="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  :disabled="featuredAtStart"
                  aria-label="Ver destacados anteriores"
                  @click="scrollFeatured(-1)"
              >
                <span class="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                  type="button"
                  class="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  :disabled="featuredAtEnd"
                  aria-label="Ver siguientes destacados"
                  @click="scrollFeatured(1)"
              >
                <span class="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>

          <div
              ref="featuredRailRef"
              class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              @scroll="syncFeaturedRailState"
          >
            <article
                v-for="(event, index) in featuredEvents"
                :key="`featured-${event.id}`"
                class="group relative h-[260px] w-[85%] shrink-0 snap-start cursor-pointer overflow-hidden rounded-3xl bg-neutral-900 shadow-xl sm:w-[calc(50%-0.5rem)] md:h-[250px] lg:h-[280px] lg:w-[calc(33.333%-0.66rem)]"
                @click="openEventModal(event)"
            >
              <img :src="event.image_url" :alt="event.title" loading="lazy" class="h-full w-full object-cover opacity-60 transition duration-300 group-hover:scale-105" />
              <div class="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent"></div>

              <div class="absolute inset-0 z-10 flex items-end p-5 md:p-6">
                <div>
                  <div class="mb-2 flex items-center gap-2 md:mb-3">
                    <span class="rounded-full bg-primary-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">Score {{ event.score }}</span>
                    <span class="text-[11px] font-semibold text-primary-100">{{ formatFeaturedDateTime(event) }}</span>
                  </div>
                  <h3 class="mb-2 line-clamp-2 font-headline text-xl font-black leading-tight text-white md:text-2xl">{{ event.title }}</h3>
                  <div class="line-clamp-2 max-w-md text-xs text-slate-200 md:text-sm">
                    <RichTextRenderer :content="event.description" :line-clamp="2" :enable-embeds="false" :hide-urls-and-media="true" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section>
          <div class="mb-6 flex items-end justify-between">
            <h2 class="font-headline text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">Mis favoritos</h2>
            <span class="rounded-full bg-tertiary-500/14 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-tertiary-700 dark:text-tertiary-300">{{ favoriteEvents.length }} guardados</span>
          </div>

          <div v-if="favoriteEvents.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aun no tienes eventos favoritos para los filtros actuales.
          </div>

          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <EventCard
              v-for="event in favoriteEvents"
              :key="`fav-${event.id}`"
              :event="{ ...event, category_name: categories.find((category) => category.id === event.category_id)?.name }"
              @select="openEventModal"
              @toggle-favorite="onToggleFavorite"
            />
          </div>
        </section>

        <section class="mt-10">
          <div class="mb-6 flex items-end justify-between">
            <h2 class="font-headline text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">Proximos eventos</h2>
            <RouterLink to="/app/calendario" class="text-sm font-bold text-primary-600 transition-opacity hover:opacity-80 hover:underline dark:text-primary-400">Ver calendario</RouterLink>
          </div>

          <div v-if="upcomingEvents.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No hay eventos proximos para los filtros seleccionados.
          </div>

          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <EventCard
              v-for="event in upcomingEvents.slice(0, 6)"
              :key="event.id"
              :event="{ ...event, category_name: categories.find((category) => category.id === event.category_id)?.name }"
              @select="openEventModal"
              @toggle-favorite="onToggleFavorite"
            />
          </div>
        </section>
      </div>
    </main>

    <aside
      class="fixed right-0 top-14 hidden h-[calc(100vh-3.5rem)] w-[22rem] flex-col overflow-y-auto overflow-x-hidden border-l border-slate-200 bg-slate-100 p-6 shadow-sm transition-colors duration-300 sm:top-16 sm:h-[calc(100vh-4rem)] md:top-20 md:h-[calc(100vh-5rem)] dark:border-slate-800/50 dark:bg-slate-900 dark:shadow-none xl:flex"
    >
      <CalendarWidget :month-key="monthKey" :selected-date="selectedDate" :events-by-date="eventsByDate" @change-month="onChangeMonth" @select-date="onSelectDate" />

      <div class="mt-4">
        <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModal" @sync="onSyncSchedule" />
      </div>

      <div class="mt-4 pr-2">
        <h4 class="mb-3 font-headline text-[11px] font-bold uppercase tracking-widest text-slate-500">Agenda de {{ selectedDateLabel }}</h4>

        <div v-if="agendaEvents.length === 0" class="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Sin eventos confirmados para este dia.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="event in agendaEvents"
            :key="event.id"
            class="cursor-pointer rounded-xl border-l-4 border-tertiary-400 bg-tertiary-500/8 p-3 transition-colors hover:bg-tertiary-500/14 dark:bg-tertiary-500/8 dark:hover:bg-tertiary-500/14"
            @click="openEventModal(event)"
          >
            <p class="mb-1 text-[10px] font-bold uppercase tracking-wider text-tertiary-700 dark:text-tertiary-300">
              {{ new Intl.DateTimeFormat('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(new Date(event.start_datetime)) }} / {{ new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(event.start_datetime)) }} - {{ new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(event.end_datetime)) }}
            </p>
            <h5 class="mb-0.5 text-sm font-bold leading-tight text-slate-800 dark:text-white">{{ event.title }}</h5>
            <p class="flex items-center gap-1 text-[11px] text-slate-500">
              <span class="material-symbols-outlined text-[12px]">location_on</span>
              {{ event.location }}
            </p>
          </div>
        </div>
      </div>
    </aside>

    <nav
      class="fixed bottom-0 left-0 z-50 flex h-[4.5rem] w-full items-center justify-around border-t border-slate-200 bg-white/90 px-4 pb-safe pt-1.5 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 md:hidden"
    >
      <RouterLink to="/app" class="flex flex-col items-center justify-center p-2 text-primary-600 dark:text-primary-300">
        <div class="mb-1 rounded-full bg-primary-100 px-4 py-1 dark:bg-primary-500/20">
          <span class="material-symbols-outlined icon-filled">event</span>
        </div>
        <span class="text-[10px] font-medium">Eventos</span>
      </RouterLink>

      <RouterLink
        to="/app/calendario"
        class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300"
      >
        <div class="mb-1 px-4 py-1">
          <span class="material-symbols-outlined">calendar_month</span>
        </div>
        <span class="text-[10px] font-medium">Calendario</span>
      </RouterLink>

      <RouterLink
        to="/app/comunidades"
        class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300"
      >
        <div class="mb-1 px-4 py-1">
          <span class="material-symbols-outlined">groups</span>
        </div>
        <span class="text-[10px] font-medium">Comunidades</span>
      </RouterLink>

      <button
        type="button"
        class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300"
        @click="onToggleMobileSearch"
      >
        <span class="mb-1 px-4 py-1">
          <span class="material-symbols-outlined">search</span>
        </span>
        <span class="text-[10px] font-medium">Buscar</span>
      </button>

      <button
        type="button"
        class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300"
        @click="mobileScheduleOpen = true"
      >
        <span class="mb-1 px-4 py-1">
          <span class="material-symbols-outlined">schedule</span>
        </span>
        <span class="text-[10px] font-medium">Agenda</span>
      </button>


    </nav>

    <div
      v-if="mobileSearchOpen"
      class="fixed bottom-24 left-3 right-3 z-50 rounded-2xl border border-slate-200 bg-slate-100/95 p-3 shadow-xl backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar eventos por titulo, descripcion o sede"
          class="w-full rounded-full border border-transparent bg-slate-100 px-5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-tertiary-500"
        />
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Cerrar buscador"
          @click="mobileSearchOpen = false"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-2 text-xs">
        <RouterLink
          to="/app/comunidades"
          class="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          @click="mobileSearchOpen = false"
        >
          Ir a comunidades
        </RouterLink>
        <RouterLink
          v-if="isAdminUser"
          to="/app/admin"
          class="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          @click="mobileSearchOpen = false"
        >
          Ir a panel admin
        </RouterLink>
        <p v-if="isCommunitiesRoute" class="rounded-xl bg-primary-50 px-3 py-2 text-[11px] font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
          En comunidades, el boton Crear permite seleccionar/usar comunidad para nuevos eventos.
        </p>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
    <div v-if="mobileScheduleOpen" class="fixed inset-0 z-[60] bg-slate-950/60 p-4 backdrop-blur-sm md:hidden">
      <div class="mx-auto flex h-full w-full max-w-md flex-col justify-center">
        <div class="mb-2 flex justify-end">
          <button
            type="button"
            class="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Cerrar agenda"
            @click="mobileScheduleOpen = false"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModalFromMobileSchedule" @sync="onSyncSchedule" />
      </div>
    </div>
    </Transition>


  </div>
</template>

