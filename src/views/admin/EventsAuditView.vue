<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAdminEventsStore } from '@/stores/adminEvents'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionModal from '@/components/admin/AdminActionModal.vue'
import EventCard from '@/components/events/EventCard.vue'
import EventCardModalEdit from '@/components/events/EventCardModalEdit.vue'
import AdminUserManageModal from '@/components/admin/AdminUserManageModal.vue'

const route = useRoute()
const router = useRouter()
const eventsStore = useAdminEventsStore()

const {
  events,
  eventsTotal,
  categories,
  pagination,
  filters,
  isLoading,
  isUpdating,
  isDeleting,
  owner_first_name,
    owner_last_name
} = storeToRefs(eventsStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const deleteModalOpen = ref(false)
const targetEvent = ref(null)
const activeEvent = ref(null)

const authorPopoverForId = ref(null)
const manageUserModalOpen = ref(false)
const manageUserId = ref('')



const sortOptions = [
  { value: 'start_datetime', label: 'Fecha de inicio' },
  { value: 'score', label: 'Popularidad (score)' }
]

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const loadEvents = async () => {
  await eventsStore.fetchEvents()
}

const onFilterCategory = (categoryId) => {
  eventsStore.setFilters({ category_id: categoryId || null })
  loadEvents()
}

const onFilterMonth = (month) => {
  eventsStore.setFilters({ month: month || null })
  loadEvents()
}

const onFilterSort = (sortBy) => {
  eventsStore.setFilters({ sort_by: sortBy })
  loadEvents()
}

const onClearFilters = () => {
  eventsStore.clearFilters()
  loadEvents()
}

const onPageChange = (page) => {
  eventsStore.setPage(page)
  loadEvents()
}

const MODAL_PARAM = 'modal'
const STEP_PARAM = 'step'
const EVENT_ID_PARAM = 'eventId'

const omitModalKeys = (query) => {
  const next = { ...query }
  delete next[MODAL_PARAM]
  delete next[STEP_PARAM]
  delete next[EVENT_ID_PARAM]
  return next
}

const closeRoutedModal = () => {
  router.push({ query: omitModalKeys(route.query || {}) })
}

const eventModalOpen = computed({
  get: () => {
    const key = route.query?.[MODAL_PARAM]
    return key === 'event-details' || key === 'edit-event'
  },
  set: (isOpen) => {
    if (isOpen) return
    closeRoutedModal()
  },
})

const openEventModal = (event) => {
  if (!event?.id) return
  activeEvent.value = event
  router.push({
    query: {
      ...route.query,
      [MODAL_PARAM]: 'event-details',
      [EVENT_ID_PARAM]: String(event.id),
    },
  })
}

const openEditEventModal = (eventId) => {
  if (!eventId) return
  const id = String(eventId)
  router.push({
    query: {
      ...route.query,
      [MODAL_PARAM]: 'edit-event',
      [EVENT_ID_PARAM]: id,
      [STEP_PARAM]: '1',
    },
  })
}

const onUpdateEvent = async (payload) => {
  if (!payload?.eventId) return

  const result = await eventsStore.updateEvent(payload.eventId, payload)
  if (!result.success) {
    showToast('error', 'Error al actualizar', result.error)
    return
  }

  // Refresca referencia local para que el modal vea los cambios
  const refreshed = eventsStore.events.find((event) => event.id === payload.eventId) || null
  if (refreshed) activeEvent.value = refreshed

  showToast('success', 'Evento actualizado', result.message)
}

const onOpenDeleteModal = (event) => {
  targetEvent.value = event
  deleteModalOpen.value = true
}

const onConfirmDelete = async () => {
  if (!targetEvent.value) return

  const result = await eventsStore.deleteEvent(targetEvent.value.id)
  if (!result.success) {
    showToast('error', 'Error al eliminar', result.error)
    return
  }

  deleteModalOpen.value = false
  targetEvent.value = null
  showToast('success', 'Evento eliminado', result.message)
}

watch(eventModalOpen, (isOpen) => {
  if (isOpen) return
  activeEvent.value = null
})

watch(
  () => [route.query?.[MODAL_PARAM], route.query?.[EVENT_ID_PARAM], events.value.length],
  () => {
    const modalKey = route.query?.[MODAL_PARAM]
    const eventId = route.query?.[EVENT_ID_PARAM]
    if (modalKey !== 'event-details' && modalKey !== 'edit-event') return
    if (!eventId) return

    const id = String(eventId)
    const found = eventsStore.events.find((evt) => String(evt.id) === id) || null
    if (found) activeEvent.value = found
  },
  { immediate: true },
)

const getAuthorSnapshot = (event) => {
  const owner = event?.owner || event?.author || event?.user || null
  const ownerId = owner?.id || event?.owner_id || event?.ownerId || null
  const username = owner?.username || owner?.handle || owner?.email || ''

  const fallbackFirstName = event?.owner_first_name || event?.ownerFirstName || ''
  const fallbackLastName = event?.owner_last_name || event?.ownerLastName || ''

  const fullName =
    owner?.fullName ||
    owner?.name ||
    [owner?.firstName, owner?.lastName].filter(Boolean).join(' ') ||
    [fallbackFirstName, fallbackLastName].filter(Boolean).join(' ') ||
    ''

  const email = owner?.email || event?.owner_email || ''
  return { ownerId, username, fullName, email }
}

const toggleAuthorPopover = (eventId) => {
  authorPopoverForId.value = authorPopoverForId.value === eventId ? null : eventId
}

const openManageUser = (event) => {
  const snapshot = getAuthorSnapshot(event)
  if (!snapshot?.ownerId) return
  manageUserId.value = String(snapshot.ownerId)
  manageUserModalOpen.value = true
  authorPopoverForId.value = null
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || 'Sin categoría'
}



const monthOptions = computed(() => {
  const options = []
  const now = new Date()
  for (let i = -3; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
})



const paginationPages = computed(() => {
  const current = eventsStore.currentPage
  const total = eventsStore.totalPages
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }
  
  return pages
})

watch(() => route.query.owner, (newOwner) => {
  if (newOwner) {
    eventsStore.setFilters({ owner_id: newOwner })
    loadEvents()
  }
}, { immediate: true })

onMounted(async () => {
  await eventsStore.fetchCategories()
  if (!route.query.owner) {
    await loadEvents()
  }
})
</script>

<template>
  <div class="space-y-6">
    <SpinnerOverlay :show="isLoading" text="Cargando eventos..." />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="4500"
    />

    <EventCardModalEdit
      v-model="eventModalOpen"
      :event="activeEvent"
      :categories="categories"
      :can-manage="true"
      :is-saving="isUpdating"
      :is-deleting="isDeleting"
      submit-error=""
      :field-errors="{}"
      @save="onUpdateEvent"
      @delete="(eventId) => onOpenDeleteModal({ id: eventId, title: activeEvent?.title || '' })"
      @enter-edit="openEditEventModal"
    />

    <AdminActionModal
      v-model="deleteModalOpen"
      title="Eliminar evento"
      :description="`¿Estás seguro de eliminar '${targetEvent?.title}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      :loading="isDeleting"
      @confirm="onConfirmDelete"
    />

    <AdminUserManageModal v-model="manageUserModalOpen" :user-id="manageUserId" />

    <!-- Header -->
    <header>
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
        Contenido y Moderación
      </p>
      <h1 class="mt-1 font-headline text-2xl font-black">Auditoría de Eventos</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Revisa, edita y modera eventos publicados en la plataforma.
      </p>
    </header>

    <!-- Owner Filter Banner -->
    <div v-if="filters.owner_id" class="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 dark:bg-primary-900/20">
      <p class="text-sm text-primary-700 dark:text-primary-300">
        Mostrando eventos del usuario: <span class="font-mono">{{ filters.owner_id.slice(0, 8) }}...</span>
      </p>
      <button
        type="button"
        class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        @click="eventsStore.setFilters({ owner_id: null }); router.replace({ query: {} }); loadEvents()"
      >
        Quitar filtro
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- Category Filter -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-500 dark:text-slate-400">Categoría:</label>
        <select
          :value="filters.category_id || ''"
          class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
          @change="onFilterCategory($event.target.value)"
        >
          <option value="">Todas</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Month Filter -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-500 dark:text-slate-400">Mes:</label>
        <select
          :value="filters.month || ''"
          class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
          @change="onFilterMonth($event.target.value)"
        >
          <option value="">Todos</option>
          <option v-for="opt in monthOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Sort -->
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-500 dark:text-slate-400">Ordenar:</label>
        <select
          :value="filters.sort_by"
          class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
          @change="onFilterSort($event.target.value)"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Clear Filters -->
      <button
        v-if="filters.category_id || filters.month"
        type="button"
        class="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        @click="onClearFilters"
      >
        Limpiar filtros
      </button>

      <!-- Results count -->
      <span class="ml-auto text-sm text-slate-500 dark:text-slate-400">
        {{ eventsTotal }} eventos
      </span>
    </div>

    <!-- Empty State -->
    <div 
      v-if="events.length === 0 && !isLoading" 
      class="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700"
    >
      <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="mt-4 font-semibold text-slate-900 dark:text-slate-100">Sin eventos</h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        No se encontraron eventos con los filtros seleccionados.
      </p>
    </div>

    <!-- Events List -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="event in events" :key="event.id" class="relative min-w-0">
        <EventCard
          :event="{ ...event, category_name: getCategoryName(event.category_id) }"
          @select="openEventModal"
        />

        <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:flex-nowrap">
          <div class="relative">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 sm:w-auto"
              @click.stop="toggleAuthorPopover(event.id)"
            >
              <span class="material-symbols-outlined text-[16px]">person</span>
              Autor
            </button>

            <div
              v-if="authorPopoverForId === event.id"
              class="absolute left-0 right-0 top-full z-20 mt-2 w-64 max-w-[90vw] rounded-2xl border border-slate-200 bg-white/75 p-3 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/75 sm:right-auto"
              @click.stop
            >
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Autor</p>
              <p class="mt-1 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {{ getAuthorSnapshot(event).fullName || getAuthorSnapshot(event).username || 'Usuario' }}
              </p>
              <p v-if="getAuthorSnapshot(event).email" class="mt-0.5 truncate text-[12px] text-slate-600 dark:text-slate-300">
                {{ getAuthorSnapshot(event).email }}
              </p>
              <p v-if="getAuthorSnapshot(event).ownerId" class="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {{ String(getAuthorSnapshot(event).ownerId).slice(0, 10) }}…
              </p>

              <button
                v-if="getAuthorSnapshot(event).ownerId"
                type="button"
                class="mt-2 w-full rounded-xl bg-primary-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-700"
                @click.stop="openManageUser(event)"
              >
                Gestionar
              </button>
              <button
                type="button"
                class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                @click.stop="authorPopoverForId = null"
              >
                Cerrar
              </button>
            </div>
          </div>

          <button
            type="button"
            class="w-full rounded-xl bg-error-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-error-700 sm:w-auto"
            @click.stop="onOpenDeleteModal(event)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="eventsTotal > pagination.limit" class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Mostrando {{ pagination.offset + 1 }} - {{ Math.min(pagination.offset + pagination.limit, eventsTotal) }} de {{ eventsTotal }}
      </p>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          :disabled="!eventsStore.hasPrevPage"
          @click="eventsStore.prevPage(); loadEvents()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          v-for="page in paginationPages"
          :key="page"
          type="button"
          class="min-w-[2rem] rounded-lg px-2 py-1 text-sm font-medium"
          :class="page === eventsStore.currentPage
            ? 'bg-primary-600 text-white'
            : page === '...'
              ? 'cursor-default'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'"
          :disabled="page === '...'"
          @click="page !== '...' && onPageChange(page)"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          :disabled="!eventsStore.hasNextPage"
          @click="eventsStore.nextPage(); loadEvents()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
