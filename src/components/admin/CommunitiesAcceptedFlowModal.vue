<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useScrollLock } from '@vueuse/core'
import { useAdminStore } from '@/stores/admin'
import { useAdminUsersStore } from '@/stores/adminUsers'
import RichTextRenderer from '@/components/util/RichTextRenderer.vue'
import Alert from '@/components/util/Alert.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  community: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'updated'])

const adminStore = useAdminStore()
const adminUsersStore = useAdminUsersStore()
const { isUpdatingCommunityStatus } = storeToRefs(adminStore)

const ownerUser = ref(null)
const ownerLoadError = ref('')
const isLoadingOwner = ref(false)
const localError = ref('')
const rejectMode = ref(false)
const rejectionReason = ref('')
const imageLoadError = ref(false)
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const statusLabelByValue = {
  PENDING: 'Pendiente',
  ACTIVE: 'Activa',
  REJECTED: 'Rechazada',
}

const knownOwnerKeys = new Set([
  'id',
  'user_id',
  'firstName',
  'lastName',
  'name',
  'full_name',
  'email',
  'username',
  'role',
  'created_at',
  'updated_at',
])

const busy = computed(() => props.isLoading || props.isSaving || isUpdatingCommunityStatus.value)

const ownerDisplayName = computed(() => {
  const firstName = ownerUser.value?.firstName || ownerUser.value?.first_name || ''
  const lastName = ownerUser.value?.lastName || ownerUser.value?.last_name || ''
  const fullFromNames = `${firstName} ${lastName}`.trim()
  return fullFromNames || ownerUser.value?.name || ownerUser.value?.full_name || ownerUser.value?.username || 'No disponible'
})

const ownerEmail = computed(() => {
  return ownerUser.value?.email || ownerUser.value?.contact_email || 'No disponible'
})

const ownerId = computed(() => {
  return props.community?.owner_id || ownerUser.value?.id || ownerUser.value?.user_id || 'No disponible'
})

const communitySocialLinks = computed(() => {
  const links = props.community?.social_links
  if (!links || typeof links !== 'object' || Array.isArray(links)) return []

  return Object.entries(links)
    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    .filter(([, value]) => Boolean(value))
})

const communityImageUrl = computed(() => {
  const value = props.community?.image_url
  return typeof value === 'string' && value.trim() ? value.trim() : ''
})

const ownerExtraEntries = computed(() => {
  if (!ownerUser.value || typeof ownerUser.value !== 'object') return []

  return Object.entries(ownerUser.value)
    .filter(([key, value]) => !knownOwnerKeys.has(key) && ['string', 'number', 'boolean'].includes(typeof value) && value !== '')
    .slice(0, 8)
})

const formatDateTime = (value) => {
  if (!value) return 'No disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No disponible'
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const toStatusLabel = (status) => {
  return statusLabelByValue[status] || status || 'No disponible'
}

const resetLocalState = () => {
  ownerUser.value = null
  ownerLoadError.value = ''
  isLoadingOwner.value = false
  localError.value = ''
  rejectMode.value = false
  rejectionReason.value = ''
  imageLoadError.value = false
}

const onImageError = () => {
  imageLoadError.value = true
}

const fetchOwner = async () => {
  ownerLoadError.value = ''
  ownerUser.value = null

  const ownerUserId = props.community?.owner_id
  if (!ownerUserId) return

  isLoadingOwner.value = true
  try {
    const result = await adminUsersStore.fetchUserById(ownerUserId)
    if (!result.success) {
      ownerLoadError.value = result.error || 'No se pudo cargar el creador de la comunidad.'
      return
    }
    ownerUser.value = result.data || null
  } finally {
    isLoadingOwner.value = false
  }
}

watch(
  () => [props.modelValue, props.community?.id],
  async ([isOpen]) => {
    isBodyScrollLocked.value = Boolean(isOpen)
    if (!isOpen) {
      resetLocalState()
      return
    }
    await fetchOwner()
  },
  { immediate: true },
)

watch(
  () => props.community?.image_url,
  () => {
    imageLoadError.value = false
  },
)

onBeforeUnmount(() => {
  isBodyScrollLocked.value = false
})

const closeModal = () => {
  if (busy.value) return
  emit('update:modelValue', false)
}

const onApprove = async () => {
  if (!props.community?.id || busy.value) return

  localError.value = ''
  const result = await adminStore.updateCommunityStatus(props.community.id, { action: 'ACTIVATE' })
  if (!result.success) {
    localError.value = result.error || 'No se pudo aprobar la comunidad.'
    return
  }

  emit('updated', {
    action: 'ACTIVATE',
    message: result.message,
    communityId: props.community.id,
  })
  emit('update:modelValue', false)
}

const onStartReject = () => {
  if (busy.value) return
  rejectMode.value = true
  localError.value = ''
}

const onCancelReject = () => {
  if (busy.value) return
  rejectMode.value = false
  rejectionReason.value = ''
  localError.value = ''
}

const onConfirmReject = async () => {
  if (!props.community?.id || busy.value) return

  const reason = rejectionReason.value.trim()
  if (!reason) {
    localError.value = 'Debes escribir el motivo de rechazo para continuar.'
    return
  }

  localError.value = ''
  const result = await adminStore.updateCommunityStatus(props.community.id, {
    action: 'REJECT',
    rejection_reason: reason,
  })

  if (!result.success) {
    localError.value = result.error || 'No se pudo rechazar la comunidad.'
    return
  }

  emit('updated', {
    action: 'REJECT',
    message: result.message,
    communityId: props.community.id,
  })
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition
    appear
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="modelValue" class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div class="mx-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-2xl dark:border-slate-800 dark:bg-slate-900/90">
        <div class="flex items-start justify-between gap-3 border-b border-slate-200 p-6 dark:border-slate-800">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">Pendientes</p>
            <h3 class="mt-1 font-headline text-xl font-black text-slate-900 dark:text-slate-100">Revisar solicitud de comunidad</h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Valida informacion de comunidad y creador antes de aprobar o rechazar.</p>
          </div>
          <button
            type="button"
            class="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
            :disabled="busy"
            @click="closeModal"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto p-6">
          <section class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <h4 class="text-sm font-black text-slate-900 dark:text-slate-100">Comunidad</h4>
            <div class="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-2">
              <p><span class="font-semibold">Nombre:</span> {{ community?.name || 'No disponible' }}</p>
              <p><span class="font-semibold">Estado:</span> {{ toStatusLabel(community?.status) }}</p>
              <p><span class="font-semibold">Categoria ID:</span> {{ community?.category_id || 'No disponible' }}</p>
              <p><span class="font-semibold">Contacto:</span> {{ community?.contact_email || 'No disponible' }}</p>
              <p class="md:col-span-2"><span class="font-semibold">Creada:</span> {{ formatDateTime(community?.created_at) }}</p>
              <div class="md:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Descripcion</p>
                <RichTextRenderer
                  :content="community?.description || 'No disponible'"
                  max-height="160px"
                  class="mt-2"
                />
              </div>
              <div class="md:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Imagen de comunidad</p>
                <div v-if="communityImageUrl && !imageLoadError" class="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60">
                  <img
                    :src="communityImageUrl"
                    alt="Imagen de comunidad"
                    class="h-52 w-full object-cover"
                    loading="lazy"
                    @error="onImageError"
                  />
                </div>
                <p v-else class="mt-2 text-xs text-slate-500 dark:text-slate-400">No se pudo visualizar la imagen o no esta disponible.</p>
                <p class="mt-2 break-all text-xs text-slate-600 dark:text-slate-300">
                  <span class="font-semibold">URL:</span> {{ communityImageUrl || 'No disponible' }}
                </p>
              </div>
            </div>

            <div class="mt-3" v-if="communitySocialLinks.length">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Social links</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="([key, value]) in communitySocialLinks"
                  :key="key"
                  class="inline-flex items-center rounded-full border border-slate-300 px-2.5 py-1 text-xs dark:border-slate-700"
                >
                  {{ key }}: {{ value }}
                </span>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div class="flex items-center justify-between gap-3">
              <h4 class="text-sm font-black text-slate-900 dark:text-slate-100">Creador</h4>
              <span v-if="isLoadingOwner" class="text-xs font-semibold text-slate-500 dark:text-slate-400">Cargando usuario...</span>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-2">
              <p><span class="font-semibold">Nombre:</span> {{ ownerDisplayName }}</p>
              <p><span class="font-semibold">Email:</span> {{ ownerEmail }}</p>
              <p class="md:col-span-2"><span class="font-semibold">ID:</span> {{ ownerId }}</p>
            </div>

            <Alert
              v-if="ownerLoadError"
              :model-value="Boolean(ownerLoadError)"
              type="error"
              title="No se pudo cargar el creador"
              :message="ownerLoadError"
              :dismissible="false"
              :duration="0"
              class="mt-3"
            />

            <div v-if="ownerExtraEntries.length" class="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
              <p class="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Campos extra</p>
              <div class="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <p v-for="([key, value]) in ownerExtraEntries" :key="key">
                  <span class="font-semibold">{{ key }}:</span> {{ value }}
                </p>
              </div>
            </div>
          </section>

          <div v-if="rejectMode" class="rounded-2xl border border-error-200 bg-error-50 p-4 dark:border-error-900/40 dark:bg-error-900/20">
            <label class="text-sm font-semibold text-error-700 dark:text-error-200">
              Motivo de rechazo
              <textarea
                v-model="rejectionReason"
                rows="3"
                class="mt-2 w-full rounded-xl border border-error-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-error-400 dark:border-error-800 dark:bg-slate-950"
                placeholder="Describe por que esta comunidad no cumple con las politicas"
              />
            </label>
          </div>

          <Alert
            v-if="localError"
            :model-value="Boolean(localError)"
            type="error"
            title="Accion requerida"
            :message="localError"
            :dismissible="false"
            :duration="0"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            type="button"
            class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            :disabled="busy"
            @click="closeModal"
          >
            Cerrar
          </button>

          <div class="flex items-center gap-2">
            <button
              v-if="!rejectMode"
              type="button"
              class="rounded-full bg-error-600 px-4 py-2 text-sm font-bold text-white hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="busy"
              @click="onStartReject"
            >
              Rechazar
            </button>
            <button
              v-else
              type="button"
              class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              :disabled="busy"
              @click="onCancelReject"
            >
              Cancelar rechazo
            </button>
            <button
              v-if="rejectMode"
              type="button"
              class="rounded-full bg-error-600 px-4 py-2 text-sm font-bold text-white hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="busy"
              @click="onConfirmReject"
            >
              {{ isUpdatingCommunityStatus ? 'Rechazando...' : 'Confirmar rechazo' }}
            </button>
            <button
              type="button"
              class="rounded-full bg-success-600 px-4 py-2 text-sm font-bold text-white hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="busy"
              @click="onApprove"
            >
              {{ isUpdatingCommunityStatus ? 'Aprobando...' : 'Aprobar comunidad' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

