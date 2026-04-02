<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/admin'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionCard from '@/components/admin/AdminActionCard.vue'
import AdminActionModal from '@/components/admin/AdminActionModal.vue'

const adminStore = useAdminStore()
const {
  bannedUsers,
  isLoadingBans,
  isBanningUser,
  isUnbanningUser,
} = storeToRefs(adminStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const banModalOpen = ref(false)
const unbanModalOpen = ref(false)
const targetUserId = ref('')
const manualUserId = ref('')
const searchQuery = ref('')

const filteredBans = computed(() => {
  if (!searchQuery.value.trim()) {
    return bannedUsers.value
  }
  const query = searchQuery.value.toLowerCase()
  return bannedUsers.value.filter(ban => 
    ban.user_id.toLowerCase().includes(query) ||
    ban.reason?.toLowerCase().includes(query) ||
    ban.banned_by?.toLowerCase().includes(query)
  )
})

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const loadBans = async () => {
  await adminStore.fetchBannedUsers({ limit: 100 })
}

const onOpenBan = () => {
  banModalOpen.value = true
}

const onConfirmBan = async (reason) => {
  const userId = manualUserId.value.trim()
  if (!userId) {
    showToast('error', 'Error', 'Debes ingresar un ID de usuario válido.')
    return
  }

  const result = await adminStore.banUser(userId, reason)
  if (!result.success) {
    showToast('error', 'No se pudo banear', result.error)
    return
  }

  banModalOpen.value = false
  manualUserId.value = ''
  showToast('success', 'Usuario baneado', result.message)
  await loadBans()
}

const onOpenUnban = (userId) => {
  targetUserId.value = userId
  unbanModalOpen.value = true
}

const onConfirmUnban = async () => {
  const result = await adminStore.unbanUser(targetUserId.value)
  if (!result.success) {
    showToast('error', 'No se pudo desbanear', result.error)
    return
  }

  unbanModalOpen.value = false
  targetUserId.value = ''
  showToast('success', 'Usuario desbaneado', result.message)
  await loadBans()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await loadBans()
})
</script>

<template>
  <div class="space-y-6">
    <SpinnerOverlay :show="isLoadingBans" text="Cargando sanciones..." />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="4500"
    />

    <AdminActionModal
      v-model="banModalOpen"
      title="Banear usuario"
      description="Esta acción bloqueará las mutaciones del usuario en eventos y comunidades."
      confirm-text="Banear"
      :loading="isBanningUser"
      :require-reason="true"
      reason-label="Motivo del baneo"
      reason-placeholder="Violación de términos y condiciones..."
      @confirm="onConfirmBan"
    />

    <AdminActionModal
      v-model="unbanModalOpen"
      title="Desbanear usuario"
      description="El usuario recuperará permisos para crear y editar contenido en la plataforma."
      confirm-text="Desbanear"
      :loading="isUnbanningUser"
      @confirm="onConfirmUnban"
    />

    <!-- Header -->
    <header>
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
        Usuarios y Accesos
      </p>
      <h1 class="mt-1 font-headline text-2xl font-black">Registro de Sanciones</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Gestiona los usuarios baneados de la plataforma.
      </p>
    </header>

    <!-- Ban User Form -->
    <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 class="mb-3 font-semibold text-slate-900 dark:text-slate-100">Banear nuevo usuario</h2>
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex-1">
          <label class="sr-only" for="user-id-input">ID de usuario</label>
          <input
            id="user-id-input"
            v-model="manualUserId"
            type="text"
            class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950"
            placeholder="UUID del usuario a banear"
          />
        </div>
        <button
          type="button"
          class="rounded-xl bg-error-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-error-700 disabled:opacity-50"
          :disabled="isBanningUser || !manualUserId.trim()"
          @click="onOpenBan"
        >
          Banear usuario
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Buscar por ID, razón o administrador..."
        />
      </div>
      <span class="text-sm text-slate-500 dark:text-slate-400">
        {{ filteredBans.length }} de {{ bannedUsers.length }} registros
      </span>
    </div>

    <!-- Empty State -->
    <div 
      v-if="filteredBans.length === 0 && !isLoadingBans" 
      class="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700"
    >
      <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      <h3 class="mt-4 font-semibold text-slate-900 dark:text-slate-100">
        {{ searchQuery ? 'Sin resultados' : 'Sin usuarios baneados' }}
      </h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {{ searchQuery 
          ? 'No se encontraron registros que coincidan con tu búsqueda.' 
          : 'Actualmente no hay usuarios baneados en la plataforma.' }}
      </p>
    </div>

    <!-- Bans Grid -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AdminActionCard
        v-for="ban in filteredBans"
        :key="ban.user_id"
        :title="ban.user_id"
        :subtitle="ban.reason"
        :status="ban.is_active ? 'ACTIVE' : 'INACTIVE'"
      >
        <template #meta>
          <p class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Baneado por: <span class="font-mono text-xs">{{ ban.banned_by?.slice(0, 8) }}...</span>
          </p>
          <p class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatDate(ban.banned_at) }}
          </p>
        </template>
        <template #actions>
          <button
            type="button"
            class="rounded-full bg-primary-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50"
            :disabled="isUnbanningUser"
            @click="onOpenUnban(ban.user_id)"
          >
            Desbanear
          </button>
        </template>
      </AdminActionCard>
    </div>
  </div>
</template>
