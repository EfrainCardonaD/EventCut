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
  communities,
  communitiesStatusFilter,
  bannedUsers,
  isLoadingCommunities,
  isLoadingBans,
  isUpdatingCommunityStatus,
  isBanningUser,
  isUnbanningUser,
  error,
} = storeToRefs(adminStore)

const tab = ref('communities')
const toast = ref({ show: false, type: 'info', title: '', message: '' })

const rejectModalOpen = ref(false)
const banModalOpen = ref(false)
const targetCommunityId = ref('')

const unbanModalOpen = ref(false)
const targetUserId = ref('')
const manualUserId = ref('')

const statusOptions = ['PENDING', 'ACTIVE', 'REJECTED']

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const loadModeration = async () => {
  await adminStore.fetchCommunities({ status: communitiesStatusFilter.value, limit: 50 })
}

const loadBans = async () => {
  await adminStore.fetchBannedUsers({ limit: 50 })
}

const onApprove = async (communityId) => {
  const result = await adminStore.updateCommunityStatus(communityId, { action: 'ACTIVATE' })
  if (!result.success) {
    showToast('error', 'No se pudo aprobar', result.error)
    return
  }

  showToast('success', 'Comunidad activada', result.message)
  await loadModeration()
}

const onOpenReject = (communityId) => {
  targetCommunityId.value = communityId
  rejectModalOpen.value = true
}

const onConfirmReject = async (reason) => {
  const result = await adminStore.updateCommunityStatus(targetCommunityId.value, {
    action: 'REJECT',
    rejection_reason: reason,
  })

  if (!result.success) {
    showToast('error', 'No se pudo rechazar', result.error)
    return
  }

  rejectModalOpen.value = false
  targetCommunityId.value = ''
  showToast('success', 'Comunidad rechazada', result.message)
  await loadModeration()
}

const onOpenBan = () => {
  banModalOpen.value = true
}

const onConfirmBan = async (reason) => {
  const userId = manualUserId.value.trim()
  const result = await adminStore.banUser(userId, reason)
  if (!result.success) {
    showToast('error', 'No se pudo banear', result.error)
    return
  }

  banModalOpen.value = false
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

const pendingCommunities = computed(() => {
  return communities.value.filter((community) => community.status === 'PENDING' || communitiesStatusFilter.value !== 'PENDING')
})

onMounted(async () => {
  await loadModeration()
  await loadBans()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-20 pt-20 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:pb-8">
    <SpinnerOverlay :show="isLoadingCommunities || isLoadingBans" text="Cargando panel administrativo..." />

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
      v-model="rejectModalOpen"
      title="Rechazar comunidad"
      description="Debes especificar el motivo del rechazo para auditoria y soporte."
      confirm-text="Rechazar"
      :loading="isUpdatingCommunityStatus"
      :require-reason="true"
      reason-label="Motivo de rechazo"
      reason-placeholder="No cumple politicas de contenido"
      @confirm="onConfirmReject"
    />

    <AdminActionModal
      v-model="banModalOpen"
      title="Banear usuario"
      description="Esta accion bloquea mutaciones del usuario en eventos y comunidades."
      confirm-text="Banear"
      :loading="isBanningUser"
      :require-reason="true"
      reason-label="Motivo del baneo"
      reason-placeholder="Violacion de terminos"
      @confirm="onConfirmBan"
    >
    </AdminActionModal>

    <AdminActionModal
      v-model="unbanModalOpen"
      title="Desbanear usuario"
      description="El usuario recuperara permisos de mutacion protegida."
      confirm-text="Desbanear"
      :loading="isUnbanningUser"
      @confirm="onConfirmUnban"
    />

    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <header class="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Admin</p>
            <h1 class="mt-1 font-headline text-2xl font-black">Panel de administracion</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Moderacion de comunidades y gestion de baneos en un solo lugar.</p>
          </div>
          <RouterLink to="/app/comunidades" class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            Volver a comunidades
          </RouterLink>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-bold"
            :class="tab === 'communities' ? 'bg-sky-600 text-white' : 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'"
            @click="tab = 'communities'"
          >
            Moderacion de comunidades
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-bold"
            :class="tab === 'bans' ? 'bg-sky-600 text-white' : 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'"
            @click="tab = 'bans'"
          >
            Gestion de baneos
          </button>
        </div>
      </header>

      <section v-if="tab === 'communities'" class="mt-6 space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Estado</label>
          <select
            v-model="communitiesStatusFilter"
            class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
            @change="loadModeration"
          >
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>

        <div v-if="pendingCommunities.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No hay comunidades para el filtro seleccionado.
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <AdminActionCard
            v-for="community in pendingCommunities"
            :key="community.id"
            :title="community.name"
            :subtitle="community.contact_email"
            :status="community.status"
          >
            <template #meta>
              <p>Owner: {{ community.owner_id }}</p>
              <p>Creada: {{ new Date(community.created_at).toLocaleString('es-MX') }}</p>
            </template>
            <template #actions>
              <button
                v-if="community.status === 'PENDING'"
                type="button"
                class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                :disabled="isUpdatingCommunityStatus"
                @click="onApprove(community.id)"
              >
                Aprobar
              </button>
              <button
                v-if="community.status === 'PENDING'"
                type="button"
                class="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                :disabled="isUpdatingCommunityStatus"
                @click="onOpenReject(community.id)"
              >
                Rechazar
              </button>
            </template>
          </AdminActionCard>
        </div>
      </section>

      <section v-else class="mt-6 space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900">
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            ID de usuario para banear
            <input
              v-model="manualUserId"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
              placeholder="uuid del usuario"
            />
          </label>
          <button
            type="button"
            class="mt-3 rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
            :disabled="isBanningUser || !manualUserId.trim()"
            @click="onOpenBan"
          >
            Banear usuario
          </button>
        </div>

        <div v-if="bannedUsers.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No hay usuarios baneados actualmente.
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <AdminActionCard
            v-for="user in bannedUsers"
            :key="user.user_id"
            :title="user.user_id"
            :subtitle="user.reason"
            :status="user.is_active ? 'ACTIVE' : 'INACTIVE'"
          >
            <template #meta>
              <p>Baneado por: {{ user.banned_by }}</p>
              <p>Fecha: {{ new Date(user.banned_at).toLocaleString('es-MX') }}</p>
            </template>
            <template #actions>
              <button
                type="button"
                class="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                :disabled="isUnbanningUser"
                @click="onOpenUnban(user.user_id)"
              >
                Desbanear
              </button>
            </template>
          </AdminActionCard>
        </div>
      </section>
    </div>

    <div v-if="error" class="fixed bottom-24 right-4 z-[75] hidden max-w-sm rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-md dark:border-rose-900/40 dark:bg-rose-950/50 dark:text-rose-200 md:block">
      {{ error }}
    </div>
  </div>
</template>


