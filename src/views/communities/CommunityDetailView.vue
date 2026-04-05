<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCommunityStore } from '@/stores/community'
import { useEventStore } from '@/stores/event'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import EventCardModal from '@/components/events/EventCardModal.vue'
import EventCardModalEdit from '@/components/events/EventCardModalEdit.vue'
import CreateEventModal from '@/components/events/CreateEventModal.vue'
import CreateCommunityModal from '@/components/communities/CreateCommunityModal.vue'
import CommunityManageModal from '@/components/communities/CommunityManageModal.vue'
import RichTextRenderer from '@/components/util/RichTextRenderer.vue'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'
import AppHeader from '@/components/layout/AppHeader.vue'
import SocialNetworkIcon from "@/components/icons/SocialNetworkIcon.vue";

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const communityStore = useCommunityStore()
const eventStore = useEventStore()

const { detail, events, isLoadingDetail, isLoadingEvents, isSavingCommunity, isUpdatingCommunity, isDeletingCommunity, error } = storeToRefs(communityStore)
const { categories, isSavingEvent, isUpdatingEvent, isDeletingEvent } = storeToRefs(eventStore)

const searchQuery = ref('')
const eventModalOpen = ref(false)
const eventEditModalOpen = ref(false)
const activeEvent = ref(null)
const createEventModalOpen = ref(false)
const createCommunityModalOpen = ref(false)
const manageCommunityModalOpen = ref(false)
const mobileActionsOpen = ref(false)

const openMobileActions = () => {
  mobileActionsOpen.value = true
}

const closeMobileActions = () => {
  mobileActionsOpen.value = false
}

const toggleMobileActions = () => {
  if (mobileActionsOpen.value) {
    closeMobileActions()
    return
  }
  openMobileActions()
}

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const createSubmitError = ref('')
const createFieldErrors = ref({})
const updateSubmitError = ref('')
const updateFieldErrors = ref({})
const createCommunitySubmitError = ref('')
const createCommunityFieldErrors = ref({})
const manageCommunitySubmitError = ref('')
const manageCommunityFieldErrors = ref({})

const isAdmin = computed(() => authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN']))
const isAdminUser = computed(() => isAdmin.value)

const avatarInitial = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''
  const fallback = authStore.username || authStore.user?.email || ''
  const source = `${firstName} ${lastName}`.trim() || fallback || 'U'
  return source.charAt(0).toUpperCase()
})

const hasHeroImage = computed(() => typeof detail.value?.image_url === 'string' && detail.value.image_url.trim())

const ensureHttpUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  // El API a veces devuelve URLs sin protocolo (ej: 9b32e...r2.dev/...).
  // En ese caso asumimos https para que el navegador la pueda resolver.
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  // Si es una ruta relativa (o absoluta del sitio), no la tocamos.
  if (trimmed.startsWith('/')) return trimmed
  return `https://${trimmed}`
}

const heroImageUrl = computed(() => ensureHttpUrl(detail.value?.image_url))

const communityAvatarImageUrl = computed(() => {
  return ensureHttpUrl(detail.value?.image_url)
})

const EVENT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80'

const getEventImageUrl = (event) => {
  const url = ensureHttpUrl(event?.image_url)
  return url || EVENT_FALLBACK_IMAGE
}

const socialLinks = computed(() => {
  const links = detail.value?.social_links || {}
  return [
    { key: 'whatsapp', label: 'WhatsApp', icon: 'chat', url: links.whatsapp },
    { key: 'facebook', label: 'Facebook', icon: 'language', url: links.facebook },
    { key: 'instagram', label: 'Instagram', icon: 'photo_camera', url: links.instagram },
  ].filter((item) => typeof item.url === 'string' && item.url.trim())
})

const categoryNameById = computed(() => {
  const map = new Map()
  for (const category of categories.value) {
    map.set(category.id, category.name)
  }
  return map
})

const communityCategoryName = computed(() => {
  const key = Number(detail.value?.category_id)
  return categoryNameById.value.get(key) || 'Sin categoria'
})

const normalizedEvents = computed(() => {
  const source = Array.isArray(events.value) ? events.value : []
  const query = searchQuery.value.trim().toLowerCase()

  return [...source]
    .map((event) => {
      const start = new Date(event.start_datetime)
      const end = new Date(event.end_datetime)
      const owner = event.owner_display_name || event.ownerDisplayName || event.owner_name || event.ownerName || event.username || 'Organizador por confirmar'
      const location = event.location || 'Ubicacion por confirmar'
      const categoryName = categoryNameById.value.get(event.category_id) || event.category_name || 'General'

      return {
        ...event,
        start,
        end,
        owner,
        location,
        categoryName,
      }
    })
    .filter((event) => {
      if (!query) return true
      const haystack = `${event.title || ''} ${event.description || ''} ${event.location || ''}`.toLowerCase()
      return haystack.includes(query)
    })
    .sort((a, b) => {
      const aMs = Number.isNaN(a.start.getTime()) ? Number.MAX_SAFE_INTEGER : a.start.getTime()
      const bMs = Number.isNaN(b.start.getTime()) ? Number.MAX_SAFE_INTEGER : b.start.getTime()
      return aMs - bMs
    })
})

const eventGroups = computed(() => {
  const grouped = new Map()

  for (const event of normalizedEvents.value) {
    const isValidDate = !Number.isNaN(event.start.getTime())
    const key = isValidDate
      ? `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}-${String(event.start.getDate()).padStart(2, '0')}`
      : 'sin-fecha'

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        label: formatGroupLabel(event.start),
        events: [],
      })
    }

    grouped.get(key).events.push(event)
  }

  return [...grouped.values()]
})

const nextEvent = computed(() => {
  const now = Date.now()
  return normalizedEvents.value.find((event) => !Number.isNaN(event.start.getTime()) && event.start.getTime() >= now) || null
})

const upcomingCount = computed(() => {
  const now = Date.now()
  return normalizedEvents.value.filter((event) => !Number.isNaN(event.start.getTime()) && event.start.getTime() >= now).length
})

const pastCount = computed(() => {
  const now = Date.now()
  return normalizedEvents.value.filter((event) => Number.isNaN(event.start.getTime()) || event.start.getTime() < now).length
})

const topLocations = computed(() => {
  const counts = new Map()
  for (const event of normalizedEvents.value) {
    const location = event.location || 'Ubicacion por confirmar'
    counts.set(location, (counts.get(location) || 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
})

const isEventManageable = computed(() => {
  if (!activeEvent.value) return false
  const currentUserId = authStore.user?.id || authStore.user?.userId || authStore.user?.sub || null
  const isOwner = Boolean(currentUserId && activeEvent.value.owner_id === currentUserId)
  return isOwner || isAdmin.value
})

const currentUserId = computed(() => authStore.user?.id || authStore.user?.userId || authStore.user?.sub || null)

const communityOwnerId = computed(() => {
  return detail.value?.owner_id || detail.value?.ownerId || null
})

const isCommunityOwner = computed(() => {
  return Boolean(currentUserId.value && communityOwnerId.value && currentUserId.value === communityOwnerId.value)
})

const canManageCommunity = computed(() => {
  return isCommunityOwner.value || isAdmin.value
})

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const formatGroupLabel = (date) => {
  if (Number.isNaN(date?.getTime?.())) return 'Fecha por confirmar'

  const today = new Date()
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((target.getTime() - current.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Manana'

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

const formatTimeRange = (event) => {
  if (Number.isNaN(event.start.getTime()) || Number.isNaN(event.end.getTime())) return 'Horario no disponible'

  const formatter = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${formatter.format(event.start)} - ${formatter.format(event.end)}`
}

const isLive = (event) => {
  if (Number.isNaN(event.start.getTime()) || Number.isNaN(event.end.getTime())) return false
  const now = Date.now()
  return event.start.getTime() <= now && now <= event.end.getTime()
}

const loadCommunity = async () => {
  const communityId = route.params.communityId
  if (!communityId || typeof communityId !== 'string') return

  await communityStore.fetchCommunityDetail(communityId)
  await communityStore.fetchCommunityEvents(communityId)
}

const openEventModal = (event) => {
  activeEvent.value = event
  eventModalOpen.value = true
}

const onHeaderLogout = async () => {
  try {
    await authStore.logout({ redirect: true })
  } catch {
    showToast('error', 'No se pudo cerrar sesion', 'Intenta nuevamente en unos segundos.')
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

  createEventModalOpen.value = false
  showToast('success', 'Evento creado', 'El evento se registro correctamente.')
  await loadCommunity()
}

const onUpdateEvent = async (payload) => {
  updateSubmitError.value = ''
  updateFieldErrors.value = {}

  const result = await eventStore.updateEvent(payload.eventId, payload)
  if (!result.success) {
    if (result.uxAction === 'SHOW_FIELD_ERRORS' || result.status === 422) {
      updateSubmitError.value = result.error || ''
      updateFieldErrors.value = normalizeFieldErrors(result.details)
    }
    showToast('error', 'No se pudo actualizar', result.error)
    return
  }

  eventEditModalOpen.value = false
  showToast('success', 'Evento actualizado', 'Cambios guardados correctamente.')
  await loadCommunity()
}

const onDeleteEvent = async (eventId) => {
  const result = await eventStore.deleteEvent(eventId)
  if (!result.success) {
    showToast('error', 'No se pudo eliminar', result.error)
    return
  }

  eventModalOpen.value = false
  activeEvent.value = null
  showToast('success', 'Evento eliminado', 'El evento se retiro del listado.')
  await loadCommunity()
}

const isCommunitySubscribed = computed(() => {
  return communityStore.isSubscribed(detail.value?.id)
})

const isSubscriptionUpdating = computed(() => {
  return communityStore.isSubscriptionUpdating(detail.value?.id)
})

const onToggleSubscription = async () => {
  const communityId = detail.value?.id
  if (!communityId) return

  if (!authStore.isAuthenticated) {
    showToast('info', 'Inicia sesion', 'Debes iniciar sesion para suscribirte a comunidades.')
    await router.push('/login')
    return
  }

  const result = isCommunitySubscribed.value
    ? await communityStore.unsubscribeFromCommunity(communityId)
    : await communityStore.subscribeToCommunity(communityId)

  if (!result.success) {
    showToast('error', 'No se pudo actualizar tu suscripcion', result.error)
    return
  }

  showToast('success', 'Suscripcion actualizada', result.message || 'Tu suscripcion fue actualizada correctamente.')
}

const onCreateCommunity = async (payload) => {
  createCommunitySubmitError.value = ''
  createCommunityFieldErrors.value = {}

  const result = await communityStore.createCommunity(payload)
  if (!result.success) {
    if (result.uxAction === 'SHOW_FIELD_ERRORS' || result.status === 422 || result.code === 'DUPLICATE_COMMUNITY_NAME' || result.code === 'TERMS_NOT_ACCEPTED') {
      createCommunitySubmitError.value = result.error || ''
      createCommunityFieldErrors.value = normalizeFieldErrors(result.details)
    }
    showToast('error', 'No se pudo crear la comunidad', result.error)
    return
  }

  createCommunityModalOpen.value = false
  showToast('success', 'Comunidad enviada', result.message || 'Tu comunidad quedo en revision.')
}

const onOpenManageCommunity = () => {
  if (!canManageCommunity.value) return
  manageCommunitySubmitError.value = ''
  manageCommunityFieldErrors.value = {}
  manageCommunityModalOpen.value = true
}

const onUpdateCommunity = async (payload) => {
  const communityId = detail.value?.id
  if (!communityId) return

  manageCommunitySubmitError.value = ''
  manageCommunityFieldErrors.value = {}

  const result = await communityStore.updateCommunity(communityId, payload)
  if (!result.success) {
    if (result.uxAction === 'SHOW_FIELD_ERRORS' || result.status === 422) {
      manageCommunitySubmitError.value = result.error || ''
      manageCommunityFieldErrors.value = normalizeFieldErrors(result.details)
    }
    showToast('error', 'No se pudo actualizar la comunidad', result.error)
    return
  }

  manageCommunityModalOpen.value = false
  showToast('success', 'Comunidad actualizada', result.message || 'Cambios guardados correctamente.')
  await loadCommunity()
}

const onDeleteCommunity = async () => {
  const communityId = detail.value?.id
  if (!communityId) return

  const result = await communityStore.deleteCommunity(communityId)
  if (!result.success) {
    showToast('error', 'No se pudo eliminar la comunidad', result.error)
    return
  }

  manageCommunityModalOpen.value = false
  showToast('success', 'Comunidad eliminada', result.message || 'La comunidad fue eliminada correctamente.')
  await router.push('/app/comunidades')
}

onMounted(async () => {
  if (!categories.value.length) await eventStore.fetchCategories()
  if (authStore.isAuthenticated) {
    await communityStore.fetchMySubscribedCommunities({ limit: 40 })
  }
  await loadCommunity()
})

watch(
  () => route.params.communityId,
  async () => {
    await loadCommunity()
  },
)

watch(eventModalOpen, (isOpen) => {
  if (isOpen) return
  updateSubmitError.value = ''
  updateFieldErrors.value = {}
})

watch(eventEditModalOpen, (isOpen) => {
  if (isOpen) return
  updateSubmitError.value = ''
  updateFieldErrors.value = {}
})

const displayedMyCommunitiesCount = computed(() => displayedMyCommunities.value.length)

const truncateWords = (value, limit = 3) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return ''

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= limit) return words.join(' ')
  return `${words.slice(0, limit).join(' ')}...`
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-700 dark:text-slate-100 dark:bg-slate-950  ">
    <SpinnerOverlay :show="isLoadingDetail || isLoadingEvents" text="Cargando comunidad..." />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="4500"
    />

    <CreateEventModal
      v-model="createEventModalOpen"
      :categories="categories"
      :communities="detail ? [detail] : []"
      :community-context-id="String(route.params.communityId || '')"
      :allow-community-selection="true"
      :is-saving="isSavingEvent"
      :submit-error="createSubmitError"
      :field-errors="createFieldErrors"
      @submit="onCreateEvent"
    />

    <CreateCommunityModal
      v-model="createCommunityModalOpen"
      :categories="categories"
      :is-saving="isSavingCommunity"
      :submit-error="createCommunitySubmitError"
      :field-errors="createCommunityFieldErrors"
      @submit="onCreateCommunity"
    />

    <CommunityManageModal
      v-model="manageCommunityModalOpen"
      :community="detail"
      :categories="categories"
      :is-saving="isUpdatingCommunity"
      :is-deleting="isDeletingCommunity"
      :submit-error="manageCommunitySubmitError"
      :field-errors="manageCommunityFieldErrors"
      @save="onUpdateCommunity"
      @delete="onDeleteCommunity"
    />

    <EventCardModal
      v-model="eventModalOpen"
      :event="activeEvent"
      :categories="categories"
      :can-manage="isEventManageable"
      @edit="() => { eventModalOpen = false; eventEditModalOpen = true }"
    />

    <EventCardModalEdit
      v-model="eventEditModalOpen"
      :event="activeEvent"
      :categories="categories"
      :can-manage="isEventManageable"
      :is-saving="isUpdatingEvent"
      :is-deleting="isDeletingEvent"
      :submit-error="updateSubmitError"
      :field-errors="updateFieldErrors"
      @save="onUpdateEvent"
      @delete="onDeleteEvent"
    />

    <AppHeader
      v-model="searchQuery"
      :is-admin-user="isAdminUser"
      :avatar-initial="avatarInitial"
      @create-event="createEventModalOpen = true"
      @logout="onHeaderLogout"
    />

    <main class="min-h-screen pb-24 pt-20 md:pb-8">
      <div class="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div class="mb-10">
          <div
            class="relative flex h-48 items-center justify-center overflow-hidden rounded-t-3xl sm:h-64"
            :class="hasHeroImage ? 'bg-slate-200 dark:bg-slate-900' : 'bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-500 dark:to-secondary-500'"
            :style="hasHeroImage && heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined"
          >
            <div class="absolute inset-0 bg-slate-950/35 dark:bg-black/45"></div>
            <h1 class="z-10 px-4 text-center font-headline text-3xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl">
              {{ truncateWords(detail?.name || 'Comunidad', 3) }}
            </h1>
          </div>

          <div class="relative px-2 sm:px-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="-mt-12 relative z-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-50 bg-tertiary-500 shadow-xl dark:border-slate-950">
                <img
                  v-if="communityAvatarImageUrl"
                  :src="communityAvatarImageUrl"
                  :alt="detail?.name || 'Comunidad'"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  @error="onCommunityAvatarError"
                />
                <span v-else class="text-4xl">👥</span>
              </div>
              <div class="mt-1 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  class="w-full rounded-lg px-6 py-2 text-sm font-bold text-white shadow-sm transition-colors active:scale-[0.99] sm:w-auto"
                  :class="isCommunitySubscribed ? 'bg-success-600 hover:bg-success-700' : 'bg-primary-600 hover:bg-primary-700'"
                  :disabled="isSubscriptionUpdating"
                  type="button"
                  @click="onToggleSubscription"
                >
                  {{ isSubscriptionUpdating ? 'Actualizando...' : isCommunitySubscribed ? 'Suscrito' : 'Suscribirse' }}
                </button>
                <button
                  class="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-200 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                  type="button"
                  @click="createEventModalOpen = true"
                >
                  Crear evento
                </button>
                <button
                  v-if="canManageCommunity"
                  class="w-full rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-100 active:scale-[0.99] dark:border-primary-900/40 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30 sm:w-auto"
                  type="button"
                  @click="onOpenManageCommunity"
                >
                  Gestionar comunidad
                </button>
              </div>
            </div>

            <div class="mt-4">
              <h2 class="mb-2 text-3xl font-bold">{{ truncateWords(detail?.name || 'Comunidad sin nombre', 3) }}</h2>
              <div v-if="detail?.description" class="mb-4">
                <RichTextRenderer :content="detail.description" max-height="300px" />
              </div>
              <p v-else class="mb-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">Sin descripcion disponible para esta comunidad.</p>

              <div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span class="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-800 dark:bg-slate-900">Eventos: {{ detail?.events_count || normalizedEvents.length }}</span>
                <span class="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-800 dark:bg-slate-900">Proximos: {{ upcomingCount }}</span>
                <span class="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-800 dark:bg-slate-900">Pasados: {{ pastCount }}</span>
                <span class="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-800 dark:bg-slate-900">Categoria: {{ communityCategoryName }}</span>
                <span v-if="detail?.contact_email" class="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 dark:border-slate-800 dark:bg-slate-900">{{ detail.contact_email }}</span>
              </div>

              <div v-if="socialLinks.length" class="flex flex-wrap gap-2 text-slate-600 dark:text-slate-300">

                <div v-if="socialLinks.length" class="flex flex-wrap gap-2">
                  <a
                      v-for="link in socialLinks"
                      :key="`${socialLinks.id}-modal-${link.key}`"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-500/50 dark:hover:text-primary-400"
                  >
                    <SocialNetworkIcon :network="link.key" :size="16" class-name="text-current" />
                    {{ link.label }}
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>

        <hr class="mb-8 border-slate-200 dark:border-slate-800">

        <div class="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div class="mb-8 flex items-center justify-between">
              <h3 class="text-2xl font-bold">Eventos</h3>
              <button class="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" @click="createCommunityModalOpen = true">
                Crear comunidad
              </button>
            </div>

            <div v-if="eventGroups.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              No hay eventos para esta comunidad con los filtros actuales.
            </div>

            <div v-else class="relative ml-2 border-l border-slate-200 pl-6 dark:border-slate-800 sm:pl-8">
              <div v-for="group in eventGroups" :key="group.key" class="relative mb-8">
                <div
                  class="absolute -left-[29px] top-1.5 box-content h-2.5 w-2.5 rounded-full border-[3px] border-slate-50 dark:border-slate-950 sm:-left-[37px]"
                  :class="group.key === 'sin-fecha' ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-500 dark:bg-slate-400'"
                ></div>
                <h4 class="mb-4 text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">{{ group.label }}</h4>

                <div
                  v-for="event in group.events"
                  :key="event.id"
                  class="group mb-4 flex w-full cursor-pointer flex-col gap-4 rounded-xl border border-slate-200 bg-slate-100 p-4 text-left shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:flex-row"
                  @click="openEventModal(event)"
                  @keydown.enter.prevent="openEventModal(event)"
                  @keydown.space.prevent="openEventModal(event)"
                  role="button"
                  tabindex="0"
                >
                  <div class="min-w-0 flex-1">
                    <div class="mb-1.5 flex items-center gap-2">
                      <span v-if="isLive(event)" class="flex items-center gap-1.5 text-xs font-bold text-liveRed">
                        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-liveRed"></span>
                        EN VIVO
                      </span>
                      <span class="text-[13px] font-medium text-slate-500 dark:text-slate-400">{{ formatTimeRange(event) }}</span>
                    </div>

                    <h5 class="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-300">{{ event.title || 'Evento sin titulo' }}</h5>

                    <div class="mb-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span class="material-symbols-outlined text-sm">sell</span>
                      <span class="truncate">{{ event.categoryName }}</span>
                    </div>

                    <div class="mb-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span class="material-symbols-outlined text-sm">person</span>
                      <span class="truncate">{{ event.owner }}</span>
                    </div>

                    <div class="mb-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span class="material-symbols-outlined text-sm">location_on</span>
                      <span class="truncate">{{ event.location }}</span>
                    </div>
                  </div>

                  <div class="h-40 w-full flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950/40 sm:h-28 sm:w-28">
                    <img
                      :src="getEventImageUrl(event)"
                      :alt="event.title || 'Evento'"
                      class="h-full w-full object-cover"
                      loading="lazy"
                      @error="onEventImageError"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="flex gap-2">
              <button class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" @click="createEventModalOpen = true">
                <span class="material-symbols-outlined text-sm text-slate-500 dark:text-slate-300">add</span>
                Enviar evento
              </button>
              <RouterLink to="/app/comunidades" class="flex w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <span class="material-symbols-outlined text-sm">north_west</span>
              </RouterLink>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-100 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="mb-3 text-lg font-bold">Proximo evento</h3>
              <div v-if="nextEvent" class="space-y-2 text-sm">
                <p class="font-semibold text-slate-900 dark:text-slate-100">{{ nextEvent.title }}</p>
                <p class="text-slate-600 dark:text-slate-300">{{ formatGroupLabel(nextEvent.start) }} · {{ formatTimeRange(nextEvent) }}</p>
                <p class="text-slate-600 dark:text-slate-300">{{ nextEvent.location }}</p>
                <button class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white" @click="openEventModal(nextEvent)">Ver detalle</button>
              </div>
              <p v-else class="text-sm text-slate-600 dark:text-slate-300">No hay eventos futuros programados.</p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-100 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="mb-3 text-lg font-bold">Ciudades activas</h3>
              <ul v-if="topLocations.length" class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li v-for="entry in topLocations" :key="entry[0]" class="flex items-center justify-between">
                  <span class="truncate pr-3">{{ entry[0] }}</span>
                  <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">{{ entry[1] }}</span>
                </li>
              </ul>
              <p v-else class="text-sm text-slate-600 dark:text-slate-300">Aun no hay ubicaciones registradas.</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <nav class="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-slate-200 bg-white/90 px-4 pb-safe pt-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 md:hidden">
      <RouterLink to="/app" class="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400">
        <span class="material-symbols-outlined">event</span>
        <span class="text-[10px] font-medium">Eventos</span>
      </RouterLink>
      <RouterLink to="/app/comunidades" class="flex flex-col items-center p-2 text-primary-600 dark:text-primary-300">
        <span class="material-symbols-outlined">groups</span>
        <span class="text-[10px] font-medium">Comunidades</span>
      </RouterLink>
      <button type="button" class="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400" @click="toggleMobileActions">
        <span class="material-symbols-outlined">add_circle</span>
        <span class="text-[10px] font-medium">Acciones</span>
      </button>
    </nav>

    <div
      v-if="mobileActionsOpen"
      class="fixed inset-x-0 top-0 bottom-20 z-[60] md:hidden"
      @click="closeMobileActions"
    ></div>

    <div v-if="mobileActionsOpen" class="fixed bottom-24 left-3 right-3 z-[70] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
      <div class="grid grid-cols-1 gap-2 text-sm">
        <button class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700" @click="createEventModalOpen = true; closeMobileActions()">
          Crear evento para esta comunidad
        </button>
        <button class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700" @click="createCommunityModalOpen = true; closeMobileActions()">
          Crear comunidad
        </button>
        <button
          v-if="canManageCommunity"
          class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700"
          @click="onOpenManageCommunity(); closeMobileActions()"
        >
          Gestionar comunidad
        </button>
        <RouterLink to="/app/comunidades" class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700" @click="closeMobileActions">
          Volver al selector
        </RouterLink>
      </div>
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

