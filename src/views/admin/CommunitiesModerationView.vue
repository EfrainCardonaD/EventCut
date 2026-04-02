<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/admin'
import { useCommunityStore } from '@/stores/community'
import { useAdminEventsStore } from '@/stores/adminEvents'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionCard from '@/components/admin/AdminActionCard.vue'
import CommunityManageModal from '@/components/communities/CommunityManageModal.vue'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'

const adminStore = useAdminStore()
const communityStore = useCommunityStore()
const adminEventsStore = useAdminEventsStore()

const {
  communities,
  communitiesStatusFilter,
  isLoadingCommunities,
} = storeToRefs(adminStore)

const { categories, isLoadingCategories } = storeToRefs(adminEventsStore)
const { isUpdatingCommunity, isDeletingCommunity } = storeToRefs(communityStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })

const manageModalOpen = ref(false)
const targetCommunity = ref(null)
const manageSubmitError = ref('')
const manageFieldErrors = ref({})

const statusOptions = ['PENDING', 'ACTIVE', 'REJECTED']

const statusLabels = {
  PENDING: 'Pendientes',
  ACTIVE: 'Activas',
  REJECTED: 'Rechazadas',
}

const statusCounters = computed(() => {
  return {
    PENDING: communities.value.filter((community) => community.status === 'PENDING').length,
    ACTIVE: communities.value.filter((community) => community.status === 'ACTIVE').length,
    REJECTED: communities.value.filter((community) => community.status === 'REJECTED').length,
  }
})

const filteredCommunities = computed(() => {
  if (!communitiesStatusFilter.value) return communities.value
  return communities.value.filter((community) => community.status === communitiesStatusFilter.value)
})

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const loadModeration = async () => {
  const communitiesResult = await adminStore.fetchCommunities({ status: null, limit: 100 })
  if (!communitiesResult.success) {
    showToast('error', 'No se pudieron cargar comunidades', communitiesResult.error)
  }
}

const onSetFilter = (status) => {
  adminStore.setCommunitiesStatusFilter(status)
}

const onOpenManage = (community) => {
  targetCommunity.value = community
  manageSubmitError.value = ''
  manageFieldErrors.value = {}
  manageModalOpen.value = true
}

const onSaveCommunity = async (payload) => {
  if (!targetCommunity.value?.id) return

  manageSubmitError.value = ''
  manageFieldErrors.value = {}

  const result = await communityStore.updateCommunity(targetCommunity.value.id, payload)
  if (!result.success) {
    if (result.uxAction === 'SHOW_FIELD_ERRORS' || result.status === 422) {
      manageSubmitError.value = result.error || ''
      manageFieldErrors.value = normalizeFieldErrors(result.details)
    }
    showToast('error', 'No se pudo actualizar comunidad', result.error)
    return
  }

  manageModalOpen.value = false
  targetCommunity.value = null
  showToast('success', 'Comunidad actualizada', result.message || 'Cambios guardados correctamente.')
  await loadModeration()
}

const onDeleteCommunity = async () => {
  if (!targetCommunity.value?.id) return

  const result = await communityStore.deleteCommunity(targetCommunity.value.id)
  if (!result.success) {
    showToast('error', 'No se pudo eliminar comunidad', result.error)
    return
  }

  manageModalOpen.value = false
  targetCommunity.value = null
  showToast('success', 'Comunidad eliminada', result.message || 'La comunidad fue eliminada correctamente.')
  await loadModeration()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await Promise.all([
    loadModeration(),
    adminEventsStore.fetchCategories(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <SpinnerOverlay :show="isLoadingCommunities || isLoadingCategories" text="Cargando comunidades..." />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="4500"
    />

    <CommunityManageModal
      v-model="manageModalOpen"
      :community="targetCommunity"
      :categories="categories"
      :is-saving="isUpdatingCommunity"
      :is-deleting="isDeletingCommunity"
      :submit-error="manageSubmitError"
      :field-errors="manageFieldErrors"
      @save="onSaveCommunity"
      @delete="onDeleteCommunity"
    />

    <header>
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
        Contenido y Moderacion
      </p>
      <h1 class="mt-1 font-headline text-2xl font-black">Solicitudes de Comunidades</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Gestiona comunidades, edita sus datos y elimina cuando sea necesario.
      </p>
    </header>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="status in statusOptions"
        :key="status"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-bold transition-colors"
        :class="communitiesStatusFilter === status
          ? 'bg-primary-600 text-white'
          : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'"
        @click="onSetFilter(status)"
      >
        {{ statusLabels[status] }}
        <span class="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
          {{ statusCounters[status] }}
        </span>
      </button>
    </div>

    <div
      v-if="filteredCommunities.length === 0 && !isLoadingCommunities"
      class="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700"
    >
      <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <h3 class="mt-4 font-semibold text-slate-900 dark:text-slate-100">
        No hay comunidades {{ statusLabels[communitiesStatusFilter].toLowerCase() }}
      </h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        No se encontraron comunidades con este estado.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AdminActionCard
        v-for="community in filteredCommunities"
        :key="community.id"
        :title="community.name"
        :subtitle="community.contact_email"
        :status="community.status"
        class="cursor-pointer"
        @click="onOpenManage(community)"
      >
        <template #meta>
          <p class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Owner: <span class="font-mono text-xs">{{ community.owner_id?.slice(0, 8) }}...</span>
          </p>
          <p class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatDate(community.created_at) }}
          </p>
          <p v-if="community.rejection_reason" class="mt-2 rounded-lg bg-error-50 p-2 text-xs text-error-700 dark:bg-error-900/20 dark:text-error-400">
            <strong>Motivo de rechazo:</strong> {{ community.rejection_reason }}
          </p>
        </template>

        <template #actions>

          <button
            type="button"
            class="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            @click.stop="onOpenManage(community)"
          >
            Gestionar
          </button>
        </template>
      </AdminActionCard>
    </div>
  </div>
</template>
