<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { toggleTheme } from '@/utils/theme'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { parseDateOnlyLocal } from '@/utils/date'
import Alert from '@/components/util/Alert.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import CalendarWidget from '@/components/events/CalendarWidget.vue'
import CreateEventModal from '@/components/events/CreateEventModal.vue'
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'

const authStore = useAuthStore()
const eventStore = useEventStore()

const { categories, upcomingEvents, favoriteEvents, favoriteUpcomingEvents, featuredEvent, eventsByDate, selectedDate, agendaEvents, monthKey, isLoadingEvents, isSavingEvent, isUpdatingEvent, isDeletingEvent, error } = storeToRefs(eventStore)

const themeIcon = ref('light_mode')
const isLoggingOut = ref(false)
const logoutModalOpen = ref(false)
const createModalOpen = ref(false)
const mobileSearchOpen = ref(false)
const mobileScheduleOpen = ref(false)
const eventModalOpen = ref(false)
const activeEvent = ref(null)
const toast = ref({ show: false, type: 'info', title: '', message: '' })

const searchQuery = computed({
  get: () => eventStore.searchQuery,
  set: (value) => eventStore.setSearchQuery(value),
})

const selectedCategory = computed({
  get: () => eventStore.selectedCategoryId,
  set: (value) => eventStore.setCategory(value),
})

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

const featuredDateTime = computed(() => {
  if (!featuredEvent.value) return ''
  const start = new Date(featuredEvent.value.start_datetime)
  const end = new Date(featuredEvent.value.end_datetime)
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
})

const syncIcon = () => {
  themeIcon.value = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'
}

const onToggleTheme = () => {
  toggleTheme()
  syncIcon()
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
  }
}

const onCreateEvent = async (payload) => {
  const result = await eventStore.createEvent(payload)
  if (!result.success) {
    showToast('error', 'No se pudo crear el evento', result.error)
    return
  }

  createModalOpen.value = false
  showToast('success', 'Evento creado', 'Tu evento ya aparece en la cartelera del mes seleccionado.')
}

const onToggleMobileSearch = () => {
  mobileSearchOpen.value = !mobileSearchOpen.value
}

const openEventModal = (event) => {
  activeEvent.value = event
  eventModalOpen.value = true
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
  const result = await eventStore.updateEvent(payload.eventId, payload)
  if (!result.success) {
    showToast('error', 'No se pudo actualizar', result.error)
    return
  }

  const refreshedEvent = eventStore.events.find((event) => event.id === payload.eventId) || eventStore.favoriteEventSnapshots.find((event) => event.id === payload.eventId)
  if (refreshedEvent) activeEvent.value = refreshedEvent
  showToast('success', 'Evento actualizado', 'Se guardaron los cambios del evento.')
}

const onDeleteEvent = async (eventId) => {
  const result = await eventStore.deleteEvent(eventId)
  if (!result.success) {
    showToast('error', 'No se pudo eliminar', result.error)
    return
  }

  eventModalOpen.value = false
  activeEvent.value = null
  showToast('success', 'Evento eliminado', 'El evento fue retirado de la cartelera.')
}

const onSyncSchedule = () => {
  showToast('info', 'Proximamente', 'La sincronizacion con Google Calendar estara disponible en una siguiente iteracion.')
}

onMounted(async () => {
  syncIcon()
  await eventStore.fetchCategories()
  await eventStore.fetchEvents({ scope: 'all' })

  if (error.value) {
    showToast('error', 'Error al sincronizar eventos', error.value)
  }
})
</script>

<template>
  <div class="bg-slate-50 text-slate-900 transition-colors duration-300 selection:bg-tertiary-400/30 dark:bg-slate-950 dark:text-slate-100">
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

    <CreateEventModal v-model="createModalOpen" :categories="categories" :is-saving="isSavingEvent" @submit="onCreateEvent" />
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

    <header
      class="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/80 dark:shadow-none md:h-20 md:px-8"
    >
      <div class="flex items-center gap-3 md:gap-8">
        <div class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-400">
          <span class="material-symbols-outlined">event</span>
        </div>
        <span class="hidden text-sm font-semibold uppercase tracking-[0.25em] text-sky-600 dark:text-sky-500 sm:block md:text-2xl">EVENTCUT</span>

        <nav class="ml-4 hidden gap-6 text-sm font-bold tracking-tight md:flex lg:text-base">
          <RouterLink to="/app" class="border-b-2 border-sky-600 pb-1 text-sky-600 dark:border-sky-500 dark:text-sky-300">Eventos</RouterLink>
          <RouterLink
            to="/app/calendario"
            class="pb-1 text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Calendario
          </RouterLink>
        </nav>
      </div>

      <div class="flex items-center gap-2 md:gap-4">
        <div class="relative mr-2 hidden lg:block">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar eventos por titulo, descripcion o sede"
            class="w-80 rounded-full border border-transparent bg-slate-100 px-5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-tertiary-500"
          />
          <span class="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">search</span>
        </div>

        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-white/5"
          aria-label="Toggle Theme"
          @click="onToggleTheme"
        >
          <span class="material-symbols-outlined text-[22px] leading-none">{{ themeIcon }}</span>
        </button>

        <div class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-200 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          {{ avatarInitial }}
        </div>
      </div>
    </header>

    <aside
      class="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-64 flex-col gap-4 border-r border-slate-200 bg-slate-50 py-6 transition-colors duration-300 dark:border-slate-800/50 dark:bg-slate-900 md:flex"
    >
      <div class="px-6 mb-2">
        <h2 class="font-headline font-bold text-slate-800 dark:text-slate-200">Mi Panel</h2>
        <p class="text-[10px] uppercase tracking-tighter text-slate-500">{{ authStore.fullName || authStore.username || 'Usuario' }}</p>
      </div>

      <div class="px-4">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3.5 font-bold text-white shadow-md transition-all hover:bg-sky-700 active:scale-95 dark:bg-sky-500 dark:text-sky-950 dark:hover:bg-sky-400"
          @click="createModalOpen = true"
        >
          <span class="material-symbols-outlined">add</span>
          Crear evento
        </button>
      </div>

      <div class="mt-auto border-t border-slate-200 px-3 pt-4 dark:border-slate-800">
        <button
          type="button"
          class="flex items-center gap-3 px-4 py-2 text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-300"
          @click="logoutModalOpen = true"
        >
          <span class="material-symbols-outlined text-xl">logout</span>
          <span class="text-sm">Cerrar sesion</span>
        </button>
      </div>
    </aside>

    <main class="min-h-screen pb-24 pt-20 md:pb-8 md:pl-64 xl:pr-[22rem]">
      <div class="p-4 md:p-8">
        <div class="mb-4">
          <div class="relative -mx-4 md:mx-0">
            <div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950 md:hidden"></div>
            <div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-950 md:hidden"></div>

            <div class="flex items-center gap-2 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                class="snap-start whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold shadow-sm sm:px-5 sm:text-sm"
                :class="selectedCategory === null ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-sky-950' : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'"
                @click="selectedCategory = null"
              >
                Todas
              </button>
              <button
                v-for="category in categories"
                :key="category.id"
                class="snap-start whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 sm:px-5 sm:text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                :class="selectedCategory === category.id ? '!bg-sky-600 !text-white dark:!bg-sky-500 dark:!text-sky-950' : ''"
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

        <section class="mb-8" v-if="featuredEvent">
          <div class="mb-4 flex items-end justify-between">
            <h2 class="font-headline text-2xl font-extrabold tracking-tight md:text-3xl">Destacado</h2>
          </div>

          <article class="relative cursor-pointer overflow-hidden rounded-3xl bg-slate-900 shadow-xl" @click="openEventModal(featuredEvent)">
            <img :src="featuredEvent.image_url" :alt="featuredEvent.title" class="h-[420px] w-full object-cover opacity-60" />
            <div class="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>

            <div class="absolute inset-0 z-10 flex items-end p-6 md:w-2/3 md:items-center md:p-12">
              <div>
                <div class="mb-3 flex items-center gap-3 md:mb-4">
                  <span class="rounded-full bg-sky-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">Score {{ featuredEvent.score }}</span>
                  <span class="text-xs font-semibold text-sky-200">{{ featuredDateTime }}</span>
                </div>
                <h3 class="mb-3 font-headline text-3xl font-black leading-tight text-white md:text-5xl">{{ featuredEvent.title }}</h3>
                <p class="mb-6 max-w-md text-sm text-slate-300 md:text-base">{{ featuredEvent.description }}</p>
              </div>
            </div>
          </article>
        </section>

        <section>
          <div class="mb-6 flex items-end justify-between">
            <h2 class="font-headline text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">Proximos eventos</h2>
            <RouterLink to="/app/calendario" class="micro-accent-link text-sm font-bold text-sky-600 hover:underline dark:text-sky-400">Ver calendario</RouterLink>
          </div>

          <div v-if="upcomingEvents.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No hay eventos proximos para los filtros seleccionados.
          </div>

          <div v-else class="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
            <EventCard
              v-for="event in upcomingEvents.slice(0, 8)"
              :key="event.id"
              :event="{ ...event, category_name: categories.find((category) => category.id === event.category_id)?.name }"
              @select="openEventModal"
              @toggle-favorite="onToggleFavorite"
            />
          </div>
        </section>

        <section class="mt-10">
          <div class="mb-6 flex items-end justify-between">
            <h2 class="font-headline text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-2xl">Mis favoritos</h2>
            <span class="micro-accent-chip rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider">{{ favoriteEvents.length }} guardados</span>
          </div>

          <div v-if="favoriteEvents.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aun no tienes eventos favoritos para los filtros actuales.
          </div>

          <div v-else class="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
            <EventCard
              v-for="event in favoriteEvents"
              :key="`fav-${event.id}`"
              :event="{ ...event, category_name: categories.find((category) => category.id === event.category_id)?.name }"
              @select="openEventModal"
              @toggle-favorite="onToggleFavorite"
            />
          </div>
        </section>
      </div>
    </main>

    <aside
      class="fixed right-0 top-20 hidden h-[calc(100vh-5rem)] w-[22rem] flex-col border-l border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800/50 dark:bg-slate-950 dark:shadow-none xl:flex"
    >
      <CalendarWidget :month-key="monthKey" :selected-date="selectedDate" :events-by-date="eventsByDate" @change-month="onChangeMonth" @select-date="onSelectDate" />

      <div class="mt-4">
        <MyScheduleTimelineCard :events="favoriteUpcomingEvents" @select="openEventModal" @sync="onSyncSchedule" />
      </div>

      <div class="mt-4 flex-grow overflow-y-auto pr-2">
        <h4 class="mb-3 font-headline text-[11px] font-bold uppercase tracking-widest text-slate-500">Agenda de {{ selectedDateLabel }}</h4>

        <div v-if="agendaEvents.length === 0" class="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Sin eventos confirmados para este dia.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="event in agendaEvents"
            :key="event.id"
            class="micro-accent-surface cursor-pointer rounded-xl border-l-4 border-tertiary-400 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
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
      class="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-slate-200 bg-white/90 px-4 pb-safe pt-2 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 md:hidden"
    >
      <RouterLink to="/app" class="flex flex-col items-center justify-center p-2 text-sky-600 dark:text-sky-300">
        <div class="mb-1 rounded-full bg-sky-100 px-4 py-1 dark:bg-sky-500/20">
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

      <button
        type="button"
        class="flex flex-col items-center justify-center p-2 text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300"
        @click="createModalOpen = true"
      >
        <span class="mb-1 px-4 py-1">
          <span class="material-symbols-outlined">add</span>
        </span>
        <span class="text-[10px] font-medium">Crear</span>
      </button>
    </nav>

    <div
      v-if="mobileSearchOpen"
      class="fixed bottom-24 left-3 right-3 z-50 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95"
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
    </div>

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

