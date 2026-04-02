<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAdminEventsStore } from '@/stores/adminEvents'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionModal from '@/components/admin/AdminActionModal.vue'

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
  isLoadingCategories,
  isUpdating,
  isDeleting,
} = storeToRefs(eventsStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const deleteModalOpen = ref(false)
const editModalOpen = ref(false)
const targetEvent = ref(null)
const editForm = ref({ title: '', description: '' })

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

const onOpenEditModal = (event) => {
  targetEvent.value = event
  editForm.value = {
    title: event.title,
    description: event.description || ''
  }
  editModalOpen.value = true
}

const onConfirmEdit = async () => {
  if (!targetEvent.value) return

  const result = await eventsStore.updateEvent(targetEvent.value.id, editForm.value)
  if (!result.success) {
    showToast('error', 'Error al actualizar', result.error)
    return
  }

  editModalOpen.value = false
  targetEvent.value = null
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

const navigateToUser = (userId) => {
  router.push({ path: '/app/admin/users', query: { search: userId } })
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || 'Sin categoría'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-MX', {
    month: 'short',
    day: 'numeric'
  })
}

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">Editar evento</h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Modifica los datos del evento para corregir errores menores.
          </p>
          
          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
              <input
                v-model="editForm.title"
                type="text"
                class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
              <textarea
                v-model="editForm.description"
                rows="4"
                class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              @click="editModalOpen = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              :disabled="isUpdating"
              @click="onConfirmEdit"
            >
              {{ isUpdating ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <AdminActionModal
      v-model="deleteModalOpen"
      title="Eliminar evento"
      :description="`¿Estás seguro de eliminar '${targetEvent?.title}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      :loading="isDeleting"
      @confirm="onConfirmDelete"
    />

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
    <div v-else class="space-y-4">
      <article
        v-for="event in events"
        :key="event.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <!-- Event Info -->
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-bold text-slate-900 dark:text-slate-100">{{ event.title }}</h3>
              <span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {{ getCategoryName(event.category_id) }}
              </span>
              <span v-if="event.score > 0" class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <svg class="h-3.5 w-3.5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {{ event.score }}
              </span>
            </div>

            <p v-if="event.description" class="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
              {{ event.description }}
            </p>

            <div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span class="flex items-center gap-1">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(event.start_datetime) }}
              </span>
              <span v-if="event.location" class="flex items-center gap-1">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ event.location }}
              </span>
              <button
                type="button"
                class="flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                @click="navigateToUser(event.owner_id)"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ver autor
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              @click="onOpenEditModal(event)"
            >
              Editar
            </button>
            <button
              type="button"
              class="rounded-xl bg-error-600 px-4 py-2 text-sm font-semibold text-white hover:bg-error-700"
              @click="onOpenDeleteModal(event)"
            >
              Eliminar
            </button>
          </div>
        </div>
      </article>
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
