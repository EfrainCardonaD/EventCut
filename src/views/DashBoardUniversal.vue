<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { parseDateOnlyLocal } from '@/utils/date'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import EventCardModalEdit from '@/components/events/EventCardModalEdit.vue'
import FeaturedEventsRail from '@/components/dashboard/FeaturedEventsRail.vue'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
import MobileScheduleDrawer from '@/components/dashboard/MobileScheduleDrawer.vue'
import MobileSearchPopup from '@/components/dashboard/MobileSearchPopup.vue'

const authStore = useAuthStore()
const eventStore = useEventStore()
const route = useRoute()

const { categories, filteredEvents, upcomingEvents, favoriteEvents, favoriteUpcomingEvents, eventsByDate, selectedDate, agendaEvents, monthKey, isLoadingEvents, isUpdatingEvent, isDeletingEvent, error } = storeToRefs(eventStore)

const mobileSearchOpen = ref(false)
const mobileScheduleOpen = ref(false)
const eventModalOpen = ref(false)
const eventEditModalOpen = ref(false)
const activeEvent = ref(null)
const hasEventModalHistoryEntry = ref(false)
const isClosingEventModalFromHistory = ref(false)
const toast = ref({ show: false, type: 'info', title: '', message: '' })
const updateSubmitError = ref('')
const updateFieldErrors = ref({})

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

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
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

const openEventModal = (event) => {
  eventEditModalOpen.value = false
  updateSubmitError.value = ''
  updateFieldErrors.value = {}

  activeEvent.value = event
  eventModalOpen.value = true
}

const onRequestEditEvent = () => {
  if (!activeEvent.value) return
  eventModalOpen.value = false
  eventEditModalOpen.value = true
}

const closeEventModal = () => {
  eventModalOpen.value = false
  activeEvent.value = null
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

const onSyncSchedule = () => {
  showToast('info', 'Proximamente', 'La sincronizacion con Google Calendar estara disponible en una siguiente iteracion.')
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

onMounted(async () => {
  await eventStore.fetchCategories()
  await eventStore.fetchEvents({ scope: 'all' })

  if (error.value) {
    showToast('error', 'Error al sincronizar eventos', error.value)
  }

  window.addEventListener('popstate', onEventModalPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onEventModalPopState)
})

watch(eventModalOpen, (isOpen) => {
  if (isOpen) {
    if (!hasEventModalHistoryEntry.value) {
      window.history.pushState({ modal: 'event-details' }, '')
      hasEventModalHistoryEntry.value = true
    }
    return
  }

  if (eventEditModalOpen.value) {
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
</script>

<template>
  <SpinnerOverlay :show="isLoadingEvents" text="Sincronizando eventos..." />

  <Alert
    v-model="toast.show"
    toast
    position="top-right"
    :type="toast.type"
    :title="toast.title"
    :message="toast.message"
    :duration="5000"
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
      <!-- Category filter -->
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
              :class="selectedCategory === category.id ? 'bg-primary-600! text-white! dark:bg-primary-500! dark:text-primary-950!' : ''"
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

      <!-- Featured Events -->
      <FeaturedEventsRail :events="featuredEvents" @select="openEventModal" />

      <!-- Favorites -->
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

      <!-- Upcoming Events -->
      <section class="mt-10">
        <div class="mb-6 flex items-end justify-between">
          <h2 class="font-headline text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">Proximos eventos</h2>
          <RouterLink to="/app/calendario" class="text-sm font-bold text-primary-600 transition-opacity hover:opacity-80 hover:underline dark:text-primary-400">Ver calendario</RouterLink>
        </div>

        <div v-if="upcomingEvents.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No hay eventos próximos para los filtros seleccionados.
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

  <!-- Dashboard Sidebar -->
  <DashboardSidebar
    :month-key="monthKey"
    :selected-date="selectedDate"
    :events-by-date="eventsByDate"
    :favorite-upcoming-events="favoriteUpcomingEvents"
    :agenda-events="agendaEvents"
    :selected-date-label="selectedDateLabel"
    @change-month="onChangeMonth"
    @select-date="onSelectDate"
    @select-event="openEventModal"
    @sync="onSyncSchedule"
  />

  <!-- Mobile-only: Search popup & Schedule drawer -->
  <MobileSearchPopup
    v-model="mobileSearchOpen"
    :search-query="searchQuery"
    :is-admin-user="isAdminUser"
    :is-communities-route="isCommunitiesRoute"
    @update:search-query="searchQuery = $event"
  />

  <MobileScheduleDrawer
    v-model="mobileScheduleOpen"
    :events="favoriteUpcomingEvents"
    @select-event="openEventModal"
    @sync="onSyncSchedule"
  />
</template>
