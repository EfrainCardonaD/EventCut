<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { useCommunityStore } from '@/stores/community'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'
import AppHeader from '@/components/layout/AppHeader.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import Alert from '@/components/util/Alert.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import CreateEventModal from '@/components/events/CreateEventModal.vue'

const authStore = useAuthStore()
const eventStore = useEventStore()
const communityStore = useCommunityStore()

const { categories, isSavingEvent } = storeToRefs(eventStore)
const { activeList: communities } = storeToRefs(communityStore)

const isLoggingOut = ref(false)
const logoutModalOpen = ref(false)
const createModalOpen = ref(false)
const toast = ref({ show: false, type: 'info', title: '', message: '' })
const createSubmitError = ref('')
const createFieldErrors = ref({})

const searchQuery = computed({
  get: () => eventStore.searchQuery,
  set: (value) => eventStore.setSearchQuery(value),
})

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

const onCreateEvent = async (payload) => {
  createSubmitError.value = ''
  createFieldErrors.value = {}

  const result = await eventStore.createEvent(payload)
  if (!result.success) {
    if (result.uxAction === 'SHOW_FIELD_ERRORS' || result.status === 422) {
      createSubmitError.value = result.error || ''
      createFieldErrors.value = normalizeFieldErrors(result.details)
    }
    showToast('error', 'No se pudo crear el evento', result.error)
    return
  }

  createSubmitError.value = ''
  createFieldErrors.value = {}
  createModalOpen.value = false
  showToast('success', 'Evento creado', 'Tu evento ya aparece en la cartelera del mes seleccionado.')
}

watch(createModalOpen, (isOpen) => {
  if (isOpen) return
  createSubmitError.value = ''
  createFieldErrors.value = {}
})

// Expose showToast for child views via provide/inject if needed
defineExpose({ showToast })
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-700 transition-colors duration-300 selection:bg-tertiary-400/30 dark:bg-slate-950 dark:text-slate-100">
    <SpinnerOverlay :show="isLoggingOut" text="Cerrando sesion..." />

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

    <CreateEventModal
      v-model="createModalOpen"
      :categories="categories"
      :communities="communities"
      :allow-community-selection="true"
      :is-saving="isSavingEvent"
      :submit-error="createSubmitError"
      :field-errors="createFieldErrors"
      @submit="onCreateEvent"
    />

    <AppHeader
      v-model="searchQuery"
      :is-admin-user="isAdminUser"
      :avatar-initial="avatarInitial"
      @create-event="createModalOpen = true"
      @logout="logoutModalOpen = true"
    />

    <slot />

    <MobileBottomNav />
  </div>
</template>
