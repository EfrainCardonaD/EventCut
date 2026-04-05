<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/layout/AppHeader.vue'
import CalendarWidgetCompact from '@/components/events/CalendarWidgetCompact.vue'
import CategoryFilter from '@/components/events/CategoryFilter.vue'
import CreateEventModal from '@/components/events/CreateEventModal.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import EventCardModalEdit from '@/components/events/EventCardModalEdit.vue'
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'
import Alert from '@/components/util/Alert.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import MobileDrawer from '@/components/util/MobileDrawer.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { parseDateOnlyLocal } from '@/utils/date'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'

const authStore = useAuthStore()
const eventStore = useEventStore()
const {
  categories,
  filteredEvents,
  favoriteUpcomingEvents,
  eventsByDate,
  selectedDate,
  monthKey,
  selectedDayEvents,
  isLoadingEvents,
  isSavingEvent,
  isUpdatingEvent,
  isDeletingEvent,
  error,
} = storeToRefs(eventStore)

const isLoggingOut = ref(false)
const logoutModalOpen = ref(false)
const createModalOpen = ref(false)
const createSubmitError = ref('')
const createFieldErrors = ref({})

const eventModalOpen = ref(false)
const activeEvent = ref(null)
const mobileScheduleOpen = ref(false)
const monthEventsDrawerOpen = ref(false)
const scheduleToastOpen = ref(false)
const updateSubmitError = ref('')
const updateFieldErrors = ref({})

const eventEditModalOpen = ref(false)
const favoriteToast = ref({ show: false, type: 'info', title: '', message: '' })

const showFavoriteToast = (type, title, message) => {
  favoriteToast.value = { show: true, type, title, message }
}

const searchQuery = computed({
  get: () => eventStore.searchQuery,
  set: (value) => eventStore.setSearchQuery(value),
})

const selectedCategoryId = computed({
  get: () => eventStore.selectedCategoryId,
  set: (value) => eventStore.setCategory(value),
})

const isAdminUser = computed(() => authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN']))

const avatarInitial = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''
  const fallback = authStore.username || ''
  const source = `${firstName} ${lastName}`.trim() || fallback || 'U'
  return source.charAt(0).toUpperCase()
})

const toastVisible = computed({
  get: () => Boolean(error.value),
  set: () => {
    eventStore.error = null
  },
})

const selectedDateLabel = computed(() => {
  const parsed = parseDateOnlyLocal(selectedDate.value)
  if (!parsed) return 'dia seleccionado'

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
})

const monthLabel = computed(() => {
  const [year, month] = monthKey.value.split('-').map(Number)
  const monthDate = new Date(year, (month || 1) - 1, 1)
  if (Number.isNaN(monthDate.getTime())) return ''
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(monthDate)
})

const monthEvents = computed(() => {
  const [year, month] = monthKey.value.split('-').map(Number)
  if (!year || !month) return []

  return filteredEvents.value.filter((event) => {
    const start = new Date(event.start_datetime)
    return !Number.isNaN(start.getTime()) && start.getFullYear() === year && start.getMonth() + 1 === month
  })
})

const monthEventsCount = computed(() => monthEvents.value.length)
const selectedDayCount = computed(() => selectedDayEvents.value.length)
const daysWithEventsCount = computed(() => Object.keys(eventsByDate.value || {}).length)
const totalEventsLoaded = computed(() => {
  return Object.values(eventsByDate.value || {}).reduce((acc, dayEvents) => acc + dayEvents.length, 0)
})

const closeMobilePanels = () => {
  mobileScheduleOpen.value = false
  monthEventsDrawerOpen.value = false
}

// History/back: en mobile el gesto Atrás debe cerrar el drawer abierto (agenda o mes).
const hasMobilePanelHistoryEntry = ref(false)
const isClosingMobilePanelFromHistory = ref(false)

const onMobilePanelPopState = () => {
  if (!mobileScheduleOpen.value && !monthEventsDrawerOpen.value) {
    hasMobilePanelHistoryEntry.value = false
    return
  }

  isClosingMobilePanelFromHistory.value = true
  closeMobilePanels()

  // Si el usuario dio back, consumimos esta entrada.
  hasMobilePanelHistoryEntry.value = false
}

const openMobileSchedule = () => {
  monthEventsDrawerOpen.value = false
  mobileScheduleOpen.value = true
}

const openMobileMonthEvents = () => {
  mobileScheduleOpen.value = false
  monthEventsDrawerOpen.value = true
}

watch(
  () => [mobileScheduleOpen.value, monthEventsDrawerOpen.value],
  ([scheduleOpen, monthOpen]) => {
    const anyOpen = scheduleOpen || monthOpen

    if (anyOpen) {
      if (!hasMobilePanelHistoryEntry.value) {
        window.history.pushState({ modal: 'calendar-mobile-panel' }, '')
        hasMobilePanelHistoryEntry.value = true
      }
      return
    }

    // Si cerramos por UI (no por popstate), revertimos la entrada en history.
    if (hasMobilePanelHistoryEntry.value && !isClosingMobilePanelFromHistory.value) {
      hasMobilePanelHistoryEntry.value = false
      window.history.back()
    }

    isClosingMobilePanelFromHistory.value = false
  },
)

const onLogout = async () => {
  isLoggingOut.value = true
  try {
    await authStore.logout({ redirect: true })
  } finally {
    isLoggingOut.value = false
  }
}

const onChangeMonth = async (key) => {
  await eventStore.setMonthKey(key)
}

const onSelectDate = (dateKey) => {
  eventStore.setSelectedDate(dateKey)
}

const onToggleFavorite = async (event) => {
  const result = await eventStore.toggleFavorite(event.id)
  if (!result.success) {
    showFavoriteToast('error', 'No se pudo guardar favorito', result.error)
    return
  }

  showFavoriteToast('success', result.favorited ? 'Favorito guardado' : 'Favorito removido', result.message)
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
    showFavoriteToast('error', 'No se pudo crear el evento', result.error)
    return
  }

  createModalOpen.value = false
}

const openEventModal = (event) => {
  activeEvent.value = event
  eventModalOpen.value = true
}

const openEventModalFromMobileSchedule = (event) => {
  closeMobilePanels()
  openEventModal(event)
}

const openEventModalFromMobileMonthEvents = (event) => {
  closeMobilePanels()
  openEventModal(event)
}

const onSyncSchedule = () => {
  scheduleToastOpen.value = true
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
    return
  }

  updateSubmitError.value = ''
  updateFieldErrors.value = {}
  const refreshedEvent = eventStore.events.find((event) => event.id === payload.eventId) || eventStore.favoriteEventSnapshots.find((event) => event.id === payload.eventId)
  if (refreshedEvent) {
    activeEvent.value = refreshedEvent
  }
  eventModalOpen.value = false
}

const onDeleteEvent = async (eventId) => {
  const result = await eventStore.deleteEvent(eventId)
  if (!result.success) return

  activeEvent.value = null
  eventModalOpen.value = false
}

onMounted(async () => {
  if (!eventStore.categories.length) {
    await eventStore.fetchCategories()
  }

  await eventStore.fetchEvents({ scope: 'all' })
  closeMobilePanels()

  window.addEventListener('popstate', onMobilePanelPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onMobilePanelPopState)
})

watch(eventModalOpen, (isOpen) => {
  if (isOpen) return
  updateSubmitError.value = ''
  updateFieldErrors.value = {}
})

watch(eventEditModalOpen, (isOpen) => {
  if (isOpen) return
  updateSubmitError.value = ''
  updateFieldErrors.value = {}
})

watch(createModalOpen, (isOpen) => {
  if (isOpen) return
  createSubmitError.value = ''
  createFieldErrors.value = {}
})

</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-700 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">

    <SpinnerOverlay :show="isLoadingEvents || isLoggingOut" :text="isLoggingOut ? 'Cerrando sesion...' : 'Sincronizando calendario...'" />

    <Alert v-model="toastVisible" toast position="top-right" type="error" title="No se pudo sincronizar" :message="error || 'Intenta nuevamente en unos segundos.'" :duration="5000" />
    <Alert v-model="scheduleToastOpen" toast position="top-right" type="info" title="Proximamente" message="La sincronizacion con Google Calendar estara disponible en una siguiente iteracion." :duration="4500" />
    <Alert v-model="favoriteToast.show" toast position="top-right" :type="favoriteToast.type" :title="favoriteToast.title" :message="favoriteToast.message" :duration="3500" />

    <ConfirmModal v-model="logoutModalOpen" title-user="Cerrar sesion" message="Se cerrara tu sesion actual en EventCut." description="Si tienes cambios sin guardar en otra pestaña, podrian perderse." confirm-text="Si, cerrar sesion" cancel-text="Cancelar" :danger="false" @confirm="onLogout" />
    <CreateEventModal v-model="createModalOpen" :categories="categories" :is-saving="isSavingEvent" :submit-error="createSubmitError" :field-errors="createFieldErrors" @submit="onCreateEvent" />
    <EventCardModal
      v-model="eventModalOpen"
      :event="activeEvent"
      :categories="categories"
      :can-manage="isEventManageable"
      @edit="() => { eventModalOpen = false; eventEditModalOpen = true }"
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

    <AppHeader
      v-model="searchQuery"
      :is-admin-user="isAdminUser"
      :avatar-initial="avatarInitial"
      @create-event="createModalOpen = true"
      @logout="logoutModalOpen = true"
    />

    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-24 pt-20 md:gap-5 md:px-8 md:pb-6 md:pt-24 lg:pb-8">
      <main class="grid grid-cols-1 gap-4 overflow-x-hidden lg:grid-cols-12 lg:items-start lg:gap-5">
        <aside class="hidden min-w-0 lg:col-span-3 lg:block">
          <div class="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
            <section class="rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 class="font-headline text-lg font-extrabold text-slate-900 dark:text-white">Agenda</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Favoritos proximos y acceso rapido.</p>
              <div class="mt-4">
                <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModal" @sync="onSyncSchedule" />
              </div>
            </section>
          </div>
        </aside>

        <section class="min-w-0 rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:col-span-6">
          <div class="mb-4 flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="font-headline text-xl font-black tracking-tight sm:text-2xl">Calendario</h1>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ monthEventsCount }} eventos del mes</span>
              <span class="micro-accent-chip rounded-full px-3 py-1 text-xs font-semibold">{{ selectedDayCount }} en el dia</span>
            </div>
            <CategoryFilter :categories="categories" :modelValue="selectedCategoryId" @update:modelValue="eventStore.setCategory" />
          </div>

          <div class="mx-auto w-full max-w-[540px] xl:max-w-[560px]">
            <div class="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800/70 dark:bg-slate-950">
              <CalendarWidgetCompact
                class="w-full"
                :month-key="monthKey"
                :selected-date="selectedDate"
                :events-by-date="eventsByDate"
                @change-month="onChangeMonth"
                @select-date="onSelectDate"
              />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">Seleccionado: {{ selectedDateLabel }}</span>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">{{ daysWithEventsCount }} dias con actividad</span>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">{{ totalEventsLoaded }} cargados</span>
          </div>
        </section>

        <aside class="hidden min-w-0 lg:col-span-3 lg:block">
          <div class="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
            <section class="min-w-0 overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 class="mb-4 font-headline text-lg font-extrabold capitalize text-slate-900 dark:text-white">Eventos de {{ monthLabel }}</h2>

              <div v-if="monthEvents.length === 0" class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No hay eventos para este mes.
              </div>

              <div v-else class="space-y-2.5">
                <EventCard
                  v-for="event in monthEvents"
                  :key="event.id"
                  :event="event"
                  compact
                  @select="openEventModal"
                  @toggle-favorite="onToggleFavorite"
                />
              </div>
            </section>
          </div>
        </aside>
      </main>
    </div>

    <nav class="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-between border-t border-slate-200 bg-white/90 px-4 pb-safe pt-2 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
      <RouterLink to="/app" class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300">
        <span class="mb-1 rounded-full px-4 py-1"><span class="material-symbols-outlined">event</span></span>
        <span class="text-[10px] font-medium">Eventos</span>
      </RouterLink>
      <RouterLink to="/app/calendario" class="flex flex-col items-center justify-center p-2 text-primary-600 dark:text-primary-300">
        <span class="mb-1 rounded-full bg-primary-100 px-4 py-1 dark:bg-primary-500/20"><span class="material-symbols-outlined icon-filled">calendar_month</span></span>
        <span class="text-[10px] font-medium">Calendario</span>
      </RouterLink>
      <RouterLink
        to="/app/comunidades"
        class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300"
      >
        <span class="mb-1 rounded-full px-4 py-1"><span class="material-symbols-outlined">groups</span></span>
        <span class="text-[10px] font-medium">Comunidades</span>
      </RouterLink>
      <button type="button" class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300" @click="openMobileMonthEvents">
        <span class="mb-1 rounded-full px-4 py-1"><span class="material-symbols-outlined">view_list</span></span>
        <span class="text-[10px] font-medium">Mes</span>
      </button>
      <button type="button" class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300" @click="openMobileSchedule">
        <span class="mb-1 rounded-full px-4 py-1"><span class="material-symbols-outlined">schedule</span></span>
        <span class="text-[10px] font-medium">Agenda</span>
      </button>
    </nav>

    <MobileDrawer v-model="monthEventsDrawerOpen" title="Eventos del mes" subtitle="Explora y abre el detalle de cada evento" class="lg:hidden">
      <div v-if="monthEvents.length === 0" class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No hay eventos para {{ monthLabel }}.
      </div>
      <div v-else class="space-y-2.5">
        <EventCard
          v-for="event in monthEvents"
          :key="`mobile-month-${event.id}`"
          :event="event"
          compact
          @select="openEventModalFromMobileMonthEvents"
          @toggle-favorite="onToggleFavorite"
        />
      </div>
    </MobileDrawer>

    <MobileDrawer v-model="mobileScheduleOpen" title="Tu agenda" subtitle="Tus proximos favoritos" class="lg:hidden">
      <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModalFromMobileSchedule" @sync="onSyncSchedule" />
    </MobileDrawer>
  </div>
</template>

