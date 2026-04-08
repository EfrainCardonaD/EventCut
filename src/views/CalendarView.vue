<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import CalendarWidgetCompact from '@/components/events/CalendarWidgetCompact.vue'
import CategoryFilter from '@/components/events/CategoryFilter.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import EventCardModalEdit from '@/components/events/EventCardModalEdit.vue'
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'
import Alert from '@/components/util/Alert.vue'
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
  isUpdatingEvent,
  isDeletingEvent,
  error,
} = storeToRefs(eventStore)

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

const selectedCategoryId = computed({
  get: () => eventStore.selectedCategoryId,
  set: (value) => eventStore.setCategory(value),
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

const hasMobilePanelHistoryEntry = ref(false)
const isClosingMobilePanelFromHistory = ref(false)

const onMobilePanelPopState = () => {
  if (!mobileScheduleOpen.value && !monthEventsDrawerOpen.value) {
    hasMobilePanelHistoryEntry.value = false
    return
  }

  isClosingMobilePanelFromHistory.value = true
  closeMobilePanels()
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

    if (hasMobilePanelHistoryEntry.value && !isClosingMobilePanelFromHistory.value) {
      hasMobilePanelHistoryEntry.value = false
      window.history.back()
    }

    isClosingMobilePanelFromHistory.value = false
  },
)

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
</script>

<template>
  <div class="flex min-h-screen flex-col pt-6 md-18">

    <SpinnerOverlay :show="isLoadingEvents" text="Sincronizando calendario..." />

    <Alert v-model="toastVisible" toast position="top-right" type="error" title="No se pudo sincronizar" :message="error || 'Intenta nuevamente en unos segundos.'" :duration="5000" />
    <Alert v-model="scheduleToastOpen" toast position="top-right" type="info" title="Proximamente" message="La sincronizacion con Google Calendar estara disponible en una siguiente iteracion." :duration="4500" />
    <Alert v-model="favoriteToast.show" toast position="top-right" :type="favoriteToast.type" :title="favoriteToast.title" :message="favoriteToast.message" :duration="3500" />

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

    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-24 pt-20 md:gap-5 md:px-8 md:pb-6 md:pt-24 lg:pb-8 lg:pt-40">
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

    <!-- Mobile-only context buttons (view-specific) -->
    <div class="fixed bottom-20 right-4 z-40 flex flex-col gap-2 md:hidden lg:hidden">
      <button type="button" class="flex size-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg active:scale-95 dark:bg-slate-200 dark:text-slate-900" @click="openMobileMonthEvents">
        <span class="material-symbols-outlined">view_list</span>
      </button>
      <button type="button" class="flex size-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg active:scale-95 dark:bg-slate-200 dark:text-slate-900" @click="openMobileSchedule">
        <span class="material-symbols-outlined">schedule</span>
      </button>
    </div>

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
