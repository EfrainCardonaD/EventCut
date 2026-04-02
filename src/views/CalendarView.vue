<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import CalendarWidgetLarge from '@/components/events/CalendarWidgetLarge.vue'
import CategoryFilter from '@/components/events/CategoryFilter.vue'
import CreateEventModal from '@/components/events/CreateEventModal.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'
import Alert from '@/components/util/Alert.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { parseDateOnlyLocal } from '@/utils/date'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'

const authStore = useAuthStore()
const eventStore = useEventStore()
const router = useRouter()
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
const scheduleToastOpen = ref(false)
const updateSubmitError = ref('')
const updateFieldErrors = ref({})
const favoriteToast = ref({ show: false, type: 'info', title: '', message: '' })

const monthListRef = ref(null)
const firstMonthCardRef = ref(null)
const monthListMaxHeight = ref(null)

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

const syncMonthListHeight = async () => {
  await nextTick()
  if (monthEvents.value.length <= 4) {
    monthListMaxHeight.value = null
    return
  }

  const firstCard = firstMonthCardRef.value
  const listElement = monthListRef.value
  if (!firstCard || !listElement) return

  const cardHeight = firstCard.getBoundingClientRect().height
  const gap = 12
  monthListMaxHeight.value = Math.round(cardHeight * 4 + gap * 3)
}

const setMonthCardRef = (el, index) => {
  if (index === 0) {
    firstMonthCardRef.value = el
  }
}

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
  mobileScheduleOpen.value = false
  openEventModal(event)
}

const onSyncSchedule = () => {
  scheduleToastOpen.value = true
}

const onRequestCreateCommunity = async () => {
  createModalOpen.value = false
  await router.push('/app/comunidades')
  showFavoriteToast('info', 'Crear comunidad', 'Desde comunidades puedes registrar una nueva comunidad.')
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
  await syncMonthListHeight()
  window.addEventListener('resize', syncMonthListHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncMonthListHeight)
})

watch(eventModalOpen, (isOpen) => {
  if (isOpen) return
  updateSubmitError.value = ''
  updateFieldErrors.value = {}
})

watch(createModalOpen, (isOpen) => {
  if (isOpen) return
  createSubmitError.value = ''
  createFieldErrors.value = {}
})

watch(monthEvents, () => {
  syncMonthListHeight()
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 lg:h-screen lg:overflow-hidden">

    <SpinnerOverlay :show="isLoadingEvents || isLoggingOut" :text="isLoggingOut ? 'Cerrando sesion...' : 'Sincronizando calendario...'" />

    <Alert v-model="toastVisible" toast position="top-right" type="error" title="No se pudo sincronizar" :message="error || 'Intenta nuevamente en unos segundos.'" :duration="5000" />
    <Alert v-model="scheduleToastOpen" toast position="top-right" type="info" title="Proximamente" message="La sincronizacion con Google Calendar estara disponible en una siguiente iteracion." :duration="4500" />
    <Alert v-model="favoriteToast.show" toast position="top-right" :type="favoriteToast.type" :title="favoriteToast.title" :message="favoriteToast.message" :duration="3500" />

    <ConfirmModal v-model="logoutModalOpen" title-user="Cerrar sesion" message="Se cerrara tu sesion actual en EventCut." description="Si tienes cambios sin guardar en otra pestaña, podrian perderse." confirm-text="Si, cerrar sesion" cancel-text="Cancelar" :danger="false" @confirm="onLogout" />
    <CreateEventModal v-model="createModalOpen" :categories="categories" :is-saving="isSavingEvent" :submit-error="createSubmitError" :field-errors="createFieldErrors" @submit="onCreateEvent" @request-create-community="onRequestCreateCommunity" />
    <EventCardModal v-model="eventModalOpen" :event="activeEvent" :categories="categories" :can-manage="isEventManageable" :is-saving="isUpdatingEvent" :is-deleting="isDeletingEvent" :submit-error="updateSubmitError" :field-errors="updateFieldErrors" @save="onUpdateEvent" @delete="onDeleteEvent" />

    <AppHeader
      v-model="searchQuery"
      :is-admin-user="isAdminUser"
      :avatar-initial="avatarInitial"
      @create-event="createModalOpen = true"
      @logout="logoutModalOpen = true"
    />

    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-24 pt-20 md:gap-6 md:px-8 md:pb-6 md:pt-24 lg:min-h-0 lg:pb-8">

      <header class="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="font-headline text-2xl font-black tracking-tight sm:text-3xl">Calendario de eventos</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Consulta por mes, selecciona un dia y abre el detalle completo de cualquier evento.</p>
          </div>
          <RouterLink to="/app" class="micro-accent-surface inline-flex w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Volver al dashboard
          </RouterLink>
        </div>

        <div class="mt-4">
          <CategoryFilter :categories="categories" :modelValue="selectedCategoryId" @update:modelValue="eventStore.setCategory" />
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Seleccionado: {{ selectedDateLabel }}</span>
          <span class="micro-accent-chip rounded-full px-3 py-1 text-xs font-semibold">{{ selectedDayCount }} eventos este dia</span>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">{{ daysWithEventsCount }} dias con actividad</span>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">{{ totalEventsLoaded }} eventos cargados</span>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">{{ monthEventsCount }} eventos este mes</span>
        </div>
      </header>

      <main class="grid grid-cols-1 gap-6 lg:min-h-0 lg:grid-cols-12 lg:gap-8">

        <section class="flex flex-col rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:col-span-7 lg:min-h-0 xl:col-span-8">
          <div class="h-full w-full overflow-auto custom-scrollbar">
            <CalendarWidgetLarge
                class="h-full w-full"
                :month-key="monthKey"
                :selected-date="selectedDate"
                :events-by-date="eventsByDate"
                @change-month="onChangeMonth"
                @select-date="onSelectDate"
            />
          </div>
        </section>

        <section class="flex flex-col gap-6 lg:col-span-5 lg:min-h-0 xl:col-span-4">

          <div class="flex flex-col rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:min-h-0">
            <h2 class="mb-4 font-headline text-lg font-extrabold capitalize text-slate-900 dark:text-white">
              Eventos de {{ monthLabel }}
            </h2>

            <div v-if="monthEvents.length === 0" class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No hay eventos para este mes.
            </div>

            <div v-else class="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <EventCard
                  v-for="event in monthEvents"
                  :key="event.id"
                  :event="event"
                  compact
                  @select="openEventModal"
                  @toggle-favorite="onToggleFavorite"
              />
            </div>
          </div>

          <div class="hidden rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
            <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModal" @sync="onSyncSchedule" />
          </div>

        </section>

      </main>
    </div>

    <nav class="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-slate-200 bg-white/90 px-4 pb-safe pt-2 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
      <RouterLink to="/app" class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300">
        <span class="mb-1 rounded-full px-4 py-1"><span class="material-symbols-outlined">event</span></span>
        <span class="text-[10px] font-medium">Eventos</span>
      </RouterLink>
      <RouterLink to="/app/calendario" class="flex flex-col items-center justify-center p-2 text-primary-600 dark:text-primary-300">
        <span class="mb-1 rounded-full bg-primary-100 px-4 py-1 dark:bg-primary-500/20"><span class="material-symbols-outlined icon-filled">calendar_month</span></span>
        <span class="text-[10px] font-medium">Calendario</span>
      </RouterLink>
      <button type="button" class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300" @click="mobileScheduleOpen = true">
        <span class="mb-1 rounded-full px-4 py-1"><span class="material-symbols-outlined">schedule</span></span>
        <span class="text-[10px] font-medium">Agenda</span>
      </button>
    </nav>

    <div v-if="mobileScheduleOpen" class="fixed inset-0 z-[60] bg-slate-950/60 p-4 backdrop-blur-sm md:hidden">
      <div class="mx-auto flex h-full w-full max-w-md flex-col justify-center">
        <div class="mb-2 flex justify-end">
          <button type="button" class="rounded-full bg-white/10 p-2 text-white hover:bg-tertiary-500/30" aria-label="Cerrar agenda" @click="mobileScheduleOpen = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModalFromMobileSchedule" @sync="onSyncSchedule" />
      </div>
    </div>
  </div>
</template>

