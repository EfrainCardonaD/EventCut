<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAdminUsersStore } from '@/stores/adminUsers'
import { useAdminStore } from '@/stores/admin'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionModal from '@/components/admin/AdminActionModal.vue'

const router = useRouter()
const usersStore = useAdminUsersStore()
const adminStore = useAdminStore()

const {
  users,
  usersTotal,
  pagination,
  filters,
  userBanStatuses,
  isLoading,
  isUpdatingRole,
} = storeToRefs(usersStore)

const { isBanningUser, isUnbanningUser } = storeToRefs(adminStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const roleModalOpen = ref(false)
const banModalOpen = ref(false)
const unbanModalOpen = ref(false)
const targetUser = ref(null)
const selectedRole = ref('')
const searchInput = ref('')

const roleOptions = [
  { value: 'ROLE_USER', label: 'Usuario', color: 'slate' },
  { value: 'ROLE_SECURITY_ADMIN', label: 'Security Admin', color: 'warning' },
  { value: 'ROLE_ADMIN', label: 'Administrador', color: 'error' }
]

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const loadUsers = async () => {
  const result = await usersStore.fetchUsers()
  if (result.success && users.value.length > 0) {
    const userIds = users.value.map(u => u.id)
    await usersStore.fetchBanStatusesForUsers(userIds)
  }
}

const onSearch = () => {
  usersStore.setFilters({ search: searchInput.value })
  loadUsers()
}

const onClearSearch = () => {
  searchInput.value = ''
  usersStore.setFilters({ search: '' })
  loadUsers()
}

const onFilterRole = (role) => {
  usersStore.setFilters({ role: role || null })
  loadUsers()
}

const onPageChange = (page) => {
  usersStore.setPage(page)
  loadUsers()
}

const getUserBanStatus = (userId) => {
  return userBanStatuses.value[userId]?.is_banned || false
}

const getRoleColor = (role) => {
  const option = roleOptions.find(r => r.value === role)
  return option?.color || 'slate'
}

const getRoleLabel = (role) => {
  const option = roleOptions.find(r => r.value === role)
  return option?.label || role?.replace('ROLE_', '') || 'Usuario'
}

const onOpenRoleModal = (user) => {
  targetUser.value = user
  selectedRole.value = user.role || 'ROLE_USER'
  roleModalOpen.value = true
}

const onConfirmRole = async () => {
  if (!targetUser.value || !selectedRole.value) return

  const result = await usersStore.updateUserRole(targetUser.value.id, selectedRole.value)
  if (!result.success) {
    showToast('error', 'Error al cambiar rol', result.error)
    return
  }

  roleModalOpen.value = false
  targetUser.value = null
  showToast('success', 'Rol actualizado', result.message)
}

const onOpenBanModal = (user) => {
  targetUser.value = user
  banModalOpen.value = true
}

const onConfirmBan = async (reason) => {
  if (!targetUser.value) return

  const result = await adminStore.banUser(targetUser.value.id, reason)
  if (!result.success) {
    showToast('error', 'Error al banear', result.error)
    return
  }

  banModalOpen.value = false
  await usersStore.fetchUserBanStatus(targetUser.value.id)
  targetUser.value = null
  showToast('success', 'Usuario baneado', result.message)
}

const onOpenUnbanModal = (user) => {
  targetUser.value = user
  unbanModalOpen.value = true
}

const onConfirmUnban = async () => {
  if (!targetUser.value) return

  const result = await adminStore.unbanUser(targetUser.value.id)
  if (!result.success) {
    showToast('error', 'Error al desbanear', result.error)
    return
  }

  unbanModalOpen.value = false
  await usersStore.fetchUserBanStatus(targetUser.value.id)
  targetUser.value = null
  showToast('success', 'Usuario desbaneado', result.message)
}

const navigateToUserEvents = (userId) => {
  router.push({ path: '/app/admin/events', query: { owner: userId } })
}

const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha de registro'
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const paginationPages = computed(() => {
  const current = usersStore.currentPage
  const total = usersStore.totalPages
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

onMounted(async () => {
  await loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <SpinnerOverlay :show="isLoading" text="Cargando usuarios..." />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="4500"
    />

    <!-- Role Modal -->
    <Teleport to="body">
      <div v-if="roleModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">Cambiar rol de usuario</h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Selecciona el nuevo rol para {{ targetUser?.username || targetUser?.email }}.
          </p>
          
          <div class="mt-4 space-y-2">
            <label
              v-for="option in roleOptions"
              :key="option.value"
              class="flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
              :class="selectedRole === option.value
                ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'"
            >
              <input
                v-model="selectedRole"
                type="radio"
                :value="option.value"
                class="h-4 w-4 text-primary-600"
              />
              <span class="font-medium text-slate-900 dark:text-slate-100">{{ option.label }}</span>
            </label>
          </div>

          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 sm:w-auto"
              @click="roleModalOpen = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="w-full rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 sm:w-auto"
              :disabled="isUpdatingRole"
              @click="onConfirmRole"
            >
              {{ isUpdatingRole ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <AdminActionModal
      v-model="banModalOpen"
      title="Banear usuario"
      :description="`Esta acción bloqueará a ${targetUser?.username || 'este usuario'} de realizar mutaciones en la plataforma.`"
      confirm-text="Banear"
      :loading="isBanningUser"
      :require-reason="true"
      reason-label="Motivo del baneo"
      reason-placeholder="Violación de términos..."
      @confirm="onConfirmBan"
    />

    <AdminActionModal
      v-model="unbanModalOpen"
      title="Desbanear usuario"
      :description="`${targetUser?.username || 'Este usuario'} recuperará los permisos de creación y edición.`"
      confirm-text="Desbanear"
      :loading="isUnbanningUser"
      @confirm="onConfirmUnban"
    />

    <!-- Header -->
    <header>
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
        Usuarios y Accesos
      </p>
      <h1 class="mt-1 font-headline text-2xl font-black">Directorio de Usuarios</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Vista 360° de usuarios: información de identidad, roles y estado en plataforma.
      </p>
    </header>

    <!-- Filters -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <!-- Search -->
      <div class="flex flex-1 flex-col gap-2 sm:flex-row">
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchInput"
            type="text"
            class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Buscar por nombre o email..."
            @keyup.enter="onSearch"
          />
        </div>
        <button
          type="button"
          class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 sm:w-auto"
          @click="onSearch"
        >
          Buscar
        </button>
        <button
          v-if="filters.search"
          type="button"
          class="rounded-xl border border-slate-300 px-3 py-2.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 sm:w-auto"
          @click="onClearSearch"
        >
          Limpiar
        </button>
      </div>

      <!-- Role Filter -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-500 dark:text-slate-400">Filtrar por rol:</span>
        <select
          :value="filters.role || ''"
          class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
          @change="onFilterRole($event.target.value)"
        >
          <option value="">Todos</option>
          <option v-for="option in roleOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Users (Mobile Cards) -->
    <div class="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
      <div
        v-if="users.length === 0 && !isLoading"
        class="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:col-span-2"
      >
        No se encontraron usuarios.
      </div>

      <article
        v-for="user in users"
        :key="`mobile-${user.id}`"
        class="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {{ (user.firstName || user.username || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {{ user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username }}
              </p>
              <p class="truncate text-xs text-slate-500 dark:text-slate-400">@{{ user.username }}</p>
              <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ user.email }}</p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Cambiar rol"
            @click="onOpenRoleModal(user)"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span
            class="rounded-full px-2.5 py-1 text-xs font-bold"
            :class="{
              'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400': getRoleColor(user.role) === 'error',
              'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400': getRoleColor(user.role) === 'warning',
              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': getRoleColor(user.role) === 'slate'
            }"
          >
            {{ getRoleLabel(user.role) }}
          </span>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-bold"
            :class="getUserBanStatus(user.id)
              ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
              : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'"
          >
            {{ getUserBanStatus(user.id) ? 'Baneado' : 'Activo' }}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">Registro: {{ formatDate(user.created_at ?? user.createdAt ?? user.updated_at ?? user.updatedAt) }}</span>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <button
            v-if="!getUserBanStatus(user.id)"
            type="button"
            class="rounded-xl border border-error-300 px-3 py-2 text-xs font-semibold text-error-700 hover:bg-error-50 dark:border-error-700 dark:text-error-400 dark:hover:bg-error-900/20"
            @click="onOpenBanModal(user)"
          >
            Banear
          </button>
          <button
            v-else
            type="button"
            class="rounded-xl border border-success-300 px-3 py-2 text-xs font-semibold text-success-700 hover:bg-success-50 dark:border-success-700 dark:text-success-400 dark:hover:bg-success-900/20"
            @click="onOpenUnbanModal(user)"
          >
            Desbanear
          </button>
          <button
            type="button"
            class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            @click="onOpenRoleModal(user)"
          >
            Rol
          </button>
          <button
            type="button"
            class="rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            @click="navigateToUserEvents(user.id)"
          >
            Eventos
          </button>
        </div>
      </article>
    </div>

    <!-- Users Table (Tablet/Desktop) -->
    <div class="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 xl:block">
      <div class="overflow-x-auto">
        <table class="min-w-[760px] w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Usuario</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rol</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registro</th>
              <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr v-if="users.length === 0 && !isLoading">
              <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No se encontraron usuarios.
              </td>
            </tr>
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    {{ (user.firstName || user.username || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-slate-100">
                      {{ user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username }}
                    </p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">@{{ user.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                {{ user.email }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="{
                    'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400': getRoleColor(user.role) === 'error',
                    'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400': getRoleColor(user.role) === 'warning',
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300': getRoleColor(user.role) === 'slate'
                  }"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="getUserBanStatus(user.id)
                    ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                    : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'"
                >
                  {{ getUserBanStatus(user.id) ? 'Baneado' : 'Activo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                {{ formatDate(user.created_at ?? user.createdAt ?? user.updated_at ?? user.updatedAt) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    title="Cambiar rol"
                    @click="onOpenRoleModal(user)"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    v-if="!getUserBanStatus(user.id)"
                    type="button"
                    class="rounded-lg p-1.5 text-error-500 hover:bg-error-50 hover:text-error-700 dark:hover:bg-error-900/20"
                    title="Banear usuario"
                    @click="onOpenBanModal(user)"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                  <button
                    v-else
                    type="button"
                    class="rounded-lg p-1.5 text-success-500 hover:bg-success-50 hover:text-success-700 dark:hover:bg-success-900/20"
                    title="Desbanear usuario"
                    @click="onOpenUnbanModal(user)"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    title="Ver eventos del usuario"
                    @click="navigateToUserEvents(user.id)"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="usersTotal > pagination.limit" class="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Mostrando {{ pagination.offset + 1 }} - {{ Math.min(pagination.offset + pagination.limit, usersTotal) }} de {{ usersTotal }}
        </p>
        <div class="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            class="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
            :disabled="!usersStore.hasPrevPage"
            @click="usersStore.prevPage(); loadUsers()"
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
            :class="page === usersStore.currentPage
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
            :disabled="!usersStore.hasNextPage"
            @click="usersStore.nextPage(); loadUsers()"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
