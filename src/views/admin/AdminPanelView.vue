<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionCard from '@/components/admin/AdminActionCard.vue'
import AdminActionModal from '@/components/admin/AdminActionModal.vue'
import CommunitiesAcceptedFlowModal from '@/components/admin/CommunitiesAcceptedFlowModal.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const {
  communities,
  bannedUsers,
  isLoadingCommunities,
  isLoadingBans,
  isBanningUser,
  isUnbanningUser,
  error,
} = storeToRefs(adminStore)

const tab = ref('communities')
const toast = ref({ show: false, type: 'info', title: '', message: '' })

const pendingReviewModalOpen = ref(false)
const banModalOpen = ref(false)
const targetCommunity = ref(null)

const unbanModalOpen = ref(false)
const targetUserId = ref('')
const manualUserId = ref('')

const isAdminUser = computed(() => authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN']))

const avatarInitial = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''
  const fallback = authStore.username || authStore.user?.email || ''
  const source = `${firstName} ${lastName}`.trim() || fallback || 'U'
  return source.charAt(0).toUpperCase()
})

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const onHeaderCreateEvent = async () => {
  await router.push('/app')
}

const onHeaderLogout = async () => {
  await authStore.logout({ redirect: true })
}

const loadModeration = async () => {
  const result = await adminStore.fetchCommunities({ status: 'PENDING', limit: 50 })
  if (!result.success) {
    showToast('error', 'No se pudieron cargar pendientes', result.error)
  }
}

const loadBans = async () => {
  await adminStore.fetchBannedUsers({ limit: 50 })
}

const onOpenPendingReview = (community) => {
  if (!community?.id) return
  targetCommunity.value = community
  pendingReviewModalOpen.value = true
}

const onPendingReviewChange = (isOpen) => {
  pendingReviewModalOpen.value = isOpen
  if (!isOpen) {
    targetCommunity.value = null
  }
}

const onPendingUpdated = async (payload) => {
  const actionLabel = payload?.action === 'ACTIVATE' ? 'Comunidad activada' : 'Comunidad rechazada'
  showToast('success', actionLabel, payload?.message || 'Estado de comunidad actualizado correctamente.')
  pendingReviewModalOpen.value = false
  targetCommunity.value = null
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
  return communities.value.filter((community) => community.status === 'PENDING')
})

onMounted(async () => {
  await loadModeration()
  await loadBans()
})
</script>

<template>
  <AppHeader
      :is-admin-user="isAdminUser"
      :avatar-initial="avatarInitial"
      :show-search="false"
      @create-event="onHeaderCreateEvent"
      @logout="onHeaderLogout"
  />

  <div class="min-h-screen bg-slate-50 pb-20 pt-20 text-slate-900 dark:bg-slate-950 dark:text-slate-100  p-4 md:p-8 xl:p-16 xl:pr-[10rem] ">
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

    <CommunitiesAcceptedFlowModal
      :model-value="pendingReviewModalOpen"
      :community="targetCommunity"
      :is-loading="isLoadingCommunities"
      @update:model-value="onPendingReviewChange"
      @updated="onPendingUpdated"
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

    <div class="mx-auto w-full max-w-5xl px-4 md:px-8 md:pb-16 md:pt-20 pb-8 pt-8">
      <header class="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">Admin</p>
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
            :class="tab === 'communities' ? 'bg-primary-600 text-white' : 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'"
            @click="tab = 'communities'"
          >
            Moderacion de comunidades
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-bold"
            :class="tab === 'bans' ? 'bg-primary-600 text-white' : 'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'"
            @click="tab = 'bans'"
          >
            Gestion de baneos
          </button>
        </div>
      </header>

      <section v-if="tab === 'communities'" class="mt-6 space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Solicitudes pendientes: <span class="font-black text-slate-900 dark:text-slate-100">{{ pendingCommunities.length }}</span>
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
            class="cursor-pointer"
            @click="onOpenPendingReview(community)"
          >
            <template #meta>
              <p>Owner: {{ community.owner_id }}</p>
              <p>Creada: {{ new Date(community.created_at).toLocaleString('es-MX') }}</p>
            </template>
            <template #actions>
              <button
                type="button"
                class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                @click.stop="onOpenPendingReview(community)"
              >
                Revisar solicitud
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
            class="mt-3 rounded-full bg-error-600 px-4 py-2 text-sm font-bold text-white hover:bg-error-700"
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
                class="rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700"
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

    <Alert
      v-if="error"
      :model-value="Boolean(error)"
      toast
      position="bottom-right"
      type="error"
      title="Error"
      :message="error"
      :dismissible="false"
      :duration="0"
    />
  </div>
</template>


