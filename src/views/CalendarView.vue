<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEventStore } from '@/stores/event'
import { useAuthStore } from '@/stores/auth'
import { parseDateOnlyLocal } from '@/utils/date'
import CalendarWidgetLarge from '@/components/events/CalendarWidgetLarge.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'

const authStore = useAuthStore()
const eventStore = useEventStore()
const { categories, favoriteUpcomingEvents, eventsByDate, selectedDate, monthKey, selectedDayEvents, isLoadingEvents, isUpdatingEvent, isDeletingEvent, error } = storeToRefs(eventStore)

const eventModalOpen = ref(false)
const activeEvent = ref(null)
const mobileScheduleOpen = ref(false)
const scheduleToastOpen = ref(false)

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

const selectedDayCount = computed(() => selectedDayEvents.value.length)
const daysWithEventsCount = computed(() => Object.keys(eventsByDate.value || {}).length)
const totalEventsLoaded = computed(() => {
  return Object.values(eventsByDate.value || {}).reduce((acc, dayEvents) => acc + dayEvents.length, 0)
})

const onChangeMonth = async (key) => {
  await eventStore.setMonthKey(key)
}

const onSelectDate = (dateKey) => {
  eventStore.setSelectedDate(dateKey)
}

const onToggleFavorite = async (event) => {
  await eventStore.toggleFavorite(event.id)
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

const isEventManageable = computed(() => {
  if (!activeEvent.value) return false

  const currentUserId = authStore.user?.id || authStore.user?.userId || authStore.user?.sub || null
  const isOwner = Boolean(currentUserId && activeEvent.value.owner_id === currentUserId)
  const isAdmin = authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN'])

  return isOwner || isAdmin
})

const onUpdateEvent = async (payload) => {
  const result = await eventStore.updateEvent(payload.eventId, payload)
  if (!result.success) return

  const refreshedEvent = eventStore.events.find((event) => event.id === payload.eventId) || eventStore.favoriteEventSnapshots.find((event) => event.id === payload.eventId)
  if (refreshedEvent) {
    activeEvent.value = refreshedEvent
  }
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
})
</script>

<template>
  <div class="min-h-screen overflow-y-auto bg-slate-50 px-4 pb-24 pt-24 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 md:h-[calc(100vh-5rem)] md:overflow-hidden md:px-8 md:pb-6 md:pt-20">
    <SpinnerOverlay :show="isLoadingEvents" text="Sincronizando calendario..." />

    <Alert
      v-model="toastVisible"
      toast
      position="top-right"
      type="error"
      title="No se pudo sincronizar"
      :message="error || 'Intenta nuevamente en unos segundos.'"
      :duration="5000"
    />

    <Alert
      v-model="scheduleToastOpen"
      toast
      position="top-right"
      type="info"
      title="Proximamente"
      message="La sincronizacion con Google Calendar estara disponible en una siguiente iteracion."
      :duration="4500"
    />

    <EventCardModal
      v-model="eventModalOpen"
      :event="activeEvent"
      :categories="categories"
      :can-manage="isEventManageable"
      :is-saving="isUpdatingEvent"
      :is-deleting="isDeletingEvent"
      @save="onUpdateEvent"
      @delete="onDeleteEvent"
    />

    <div class="mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] gap-4 md:gap-6">
      <header class="snap-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="font-headline text-2xl font-black tracking-tight sm:text-3xl">Calendario de eventos</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Consulta por mes, selecciona un dia y abre el detalle completo de cualquier evento.</p>
          </div>
          <RouterLink
            to="/app"
            class="inline-flex w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Volver al dashboard
          </RouterLink>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Seleccionado: {{ selectedDateLabel }}
          </span>
          <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
            {{ selectedDayCount }} eventos este dia
          </span>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
            {{ daysWithEventsCount }} dias con actividad
          </span>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
            {{ totalEventsLoaded }} eventos cargados
          </span>
        </div>
      </header>

      <div class="grid min-h-0 snap-y snap-proximity grid-cols-1 auto-rows-max gap-4 overflow-y-auto pb-2 md:gap-6 md:snap-none lg:grid-cols-[minmax(0,1fr)_minmax(21rem,24rem)] lg:auto-rows-fr lg:overflow-hidden lg:pb-0">
        <section class="snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:min-h-0">
          <div class="mx-auto w-full max-w-[760px] lg:flex lg:h-full lg:max-w-none lg:items-start lg:justify-center">
            <div class="w-full lg:h-full lg:w-auto lg:aspect-square lg:max-h-full">
              <CalendarWidgetLarge
                class="h-full min-h-[20rem] md:min-h-0"
                :month-key="monthKey"
                :selected-date="selectedDate"
                :events-by-date="eventsByDate"
                @change-month="onChangeMonth"
                @select-date="onSelectDate"
              />
            </div>
          </div>
        </section>

        <section class="grid min-h-0 snap-start gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:min-h-0">
            <h2 class="mb-4 font-headline text-lg font-extrabold capitalize">Eventos del {{ selectedDateLabel }}</h2>

            <div
              v-if="selectedDayEvents.length === 0"
              class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
              No hay eventos para este dia.
            </div>

            <div v-else class="space-y-3 lg:max-h-full lg:overflow-y-auto lg:pr-1">
              <EventCard
                v-for="event in selectedDayEvents"
                :key="event.id"
                :event="event"
                compact
                @select="openEventModal"
                @toggle-favorite="onToggleFavorite"
              />
            </div>
          </div>

          <div class="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
            <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModal" @sync="onSyncSchedule" />
          </div>
        </section>
      </div>
    </div>

    <nav
      class="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-slate-200 bg-white/90 px-4 pb-safe pt-2 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 md:hidden"
    >
      <RouterLink to="/app" class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300">
        <span class="mb-1 rounded-full px-4 py-1">
          <span class="material-symbols-outlined">event</span>
        </span>
        <span class="text-[10px] font-medium">Eventos</span>
      </RouterLink>

      <RouterLink to="/app/calendario" class="flex flex-col items-center justify-center p-2 text-sky-600 dark:text-sky-300">
        <span class="mb-1 rounded-full bg-sky-100 px-4 py-1 dark:bg-sky-500/20">
          <span class="material-symbols-outlined icon-filled">calendar_month</span>
        </span>
        <span class="text-[10px] font-medium">Calendario</span>
      </RouterLink>

      <button
        type="button"
        class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300"
        @click="mobileScheduleOpen = true"
      >
        <span class="mb-1 rounded-full px-4 py-1">
          <span class="material-symbols-outlined">schedule</span>
        </span>
        <span class="text-[10px] font-medium">Agenda</span>
      </button>
    </nav>

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
  </div>
</template>

