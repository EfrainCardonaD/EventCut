<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCommunityStore } from '@/stores/community'
import { useEventStore } from '@/stores/event'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import CreateEventModal from '@/components/events/CreateEventModal.vue'
import CreateCommunityModal from '@/components/communities/CreateCommunityModal.vue'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const communityStore = useCommunityStore()
const eventStore = useEventStore()

const { activeList, selectedCommunityId, myList, mySubscribedList, isLoadingList, isLoadingMyList, isLoadingMySubscribedList, isSavingCommunity, isUpdatingCommunity, error } = storeToRefs(communityStore)
const { categories, isSavingEvent } = storeToRefs(eventStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const createEventModalOpen = ref(false)
const createCommunityModalOpen = ref(false)
const mobileActionsOpen = ref(false)

const createSubmitError = ref('')
const createFieldErrors = ref({})
const createCommunitySubmitError = ref('')
const createCommunityFieldErrors = ref({})

const isAdmin = computed(() => authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN']))
const isAdminUser = computed(() => isAdmin.value)
const searchQuery = ref('')
const selectedCategoryId = ref('')
const myCommunitiesTab = ref('owned')
const categoryDraftByCommunityId = ref({})

const ensureHttpUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  // El API a veces devuelve URLs sin protocolo (ej: r2.dev/...);
  // en ese caso asumimos https para que el navegador la resuelva.
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return trimmed
  return `https://${trimmed}`
}

const COMMUNITY_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=256&q=80'

const getCommunityCardImageUrl = (community) => {
  const candidate =
    community?.image_url ||
    community?.logo_url ||
    community?.avatar_url ||
    community?.cover_url ||
    community?.photo_url

  const url = ensureHttpUrl(candidate)
  return url || COMMUNITY_FALLBACK_IMAGE
}

const truncateWords = (value, limit = 8) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return ''

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= limit) return words.join(' ')
  return `${words.slice(0, limit).join(' ')}...`
}

const truncateChars = (value, max = 70) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}...`
}

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

const categoryNameById = computed(() => {
  const map = new Map()
  for (const category of categories.value) {
    map.set(Number(category.id), category.name)
  }
  return map
})

const selectedCategoryLabel = computed(() => {
  const key = Number(selectedCategoryId.value)
  return categoryNameById.value.get(key) || 'Todas las categorias'
})

const displayedMyCommunities = computed(() => {
  return myCommunitiesTab.value === 'subscribed' ? mySubscribedList.value : myList.value
})

const displayedMyCommunitiesCount = computed(() => displayedMyCommunities.value.length)

const getEditableCategoryId = (community) => {
  if (!community?.id) return ''
  const draft = categoryDraftByCommunityId.value[community.id]
  if (draft !== undefined) return String(draft)
  return community.category_id ? String(community.category_id) : ''
}

const hasCategoryDraftChanged = (community) => {
  const draft = Number(getEditableCategoryId(community))
  const current = Number(community?.category_id || 0)
  return Number.isFinite(draft) && draft > 0 && draft !== current
}

const onCategoryDraftChange = (communityId, value) => {
  categoryDraftByCommunityId.value = {
    ...categoryDraftByCommunityId.value,
    [communityId]: String(value || ''),
  }
}

watch(
  () => error.value,
  (nextError) => {
    if (!nextError) return
    showToast('error', 'No se pudo completar la operacion', nextError)
    communityStore.error = null
  }
)

const onOpenCommunity = (communityId) => {
  if (!communityId) return
  communityStore.setSelectedCommunityId(communityId)
  router.push(`/app/comunidades/${communityId}`)
}

const isCommunitySubscribed = (communityId) => {
  return communityStore.isSubscribed(communityId)
}

const isSubscriptionUpdating = (communityId) => {
  return communityStore.isSubscriptionUpdating(communityId)
}

const onToggleSubscription = async (communityId) => {
  if (!communityId) return

  if (!authStore.isAuthenticated) {
    showToast('info', 'Inicia sesion', 'Debes iniciar sesion para suscribirte a comunidades.')
    await router.push('/login')
    return
  }

  const result = isCommunitySubscribed(communityId)
    ? await communityStore.unsubscribeFromCommunity(communityId)
    : await communityStore.subscribeToCommunity(communityId)

  if (!result.success) {
    showToast('error', 'No se pudo actualizar tu suscripcion', result.error)
    return
  }

  showToast('success', 'Suscripcion actualizada', result.message || 'Tu suscripcion fue actualizada correctamente.')
}

const onHeaderLogout = async () => {
  await authStore.logout({ redirect: true })
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
  showToast('success', 'Evento creado', 'Tu evento fue enviado correctamente.')
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

const onSaveCommunityCategory = async (community) => {
  if (!community?.id) return

  const nextCategoryId = Number(getEditableCategoryId(community))
  if (!Number.isFinite(nextCategoryId) || nextCategoryId <= 0) {
    showToast('error', 'Categoria invalida', 'Selecciona una categoria valida para actualizar.')
    return
  }

  const result = await communityStore.updateCommunityCategory(community.id, nextCategoryId)
  if (!result.success) {
    showToast('error', 'No se pudo actualizar la categoria', result.error)
    return
  }

  onCategoryDraftChange(community.id, String(nextCategoryId))
  showToast('success', 'Categoria actualizada', result.message || 'La categoria fue actualizada correctamente.')
}

onMounted(async () => {
  if (!categories.value.length) await eventStore.fetchCategories()

  await communityStore.fetchActiveCommunities({
    search: searchQuery.value.trim() || undefined,
    category_id: selectedCategoryId.value || undefined,
    limit: 100,
  })
  if (authStore.isAuthenticated) {
    await Promise.all([
      communityStore.fetchMyCommunities({ limit: 20 }),
      communityStore.fetchMySubscribedCommunities({ limit: 20 }),
    ])
  }
  if (!selectedCommunityId.value && activeList.value.length) {
    communityStore.setSelectedCommunityId(activeList.value[0].id)
  }
})

watch(
  [searchQuery, selectedCategoryId],
  async () => {
    await communityStore.fetchActiveCommunities({
      search: searchQuery.value.trim() || undefined,
      category_id: selectedCategoryId.value || undefined,
      limit: 100,
    })
  },
)
</script>

<template>

  <AppHeader
    v-model="searchQuery"
    :is-admin-user="isAdminUser"
    :avatar-initial="avatarInitial"
    @create-event="createEventModalOpen = true"
    @logout="onHeaderLogout"

  />

  <main class="min-h-screen pb-24 pt-40 bg-slate-50  text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:pb-8">


    <SpinnerOverlay :show="isLoadingList || isLoadingMyList || isLoadingMySubscribedList" text="Cargando comunidades..." />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="4500"
    />

    <Alert
      v-model="mobileActionsOpen"
      toast
      position="bottom-right"
      type="info"
      title="Accesos rapidos"
      message="Usa el menu para crear o navegar rapidamente entre comunidades."
      :duration="1"
      class="hidden"
    />

    <CreateEventModal
      v-model="createEventModalOpen"
      :categories="categories"
      :communities="activeList"
      :community-context-id="selectedCommunityId"
      :allow-community-selection="true"
      :is-saving="isSavingEvent"
      :submit-error="createSubmitError"
      :field-errors="createFieldErrors"
      @submit="onCreateEvent"
      @request-create-community="createCommunityModalOpen = true"
    />

    <CreateCommunityModal
      v-model="createCommunityModalOpen"
      :categories="categories"
      :is-saving="isSavingCommunity"
      :submit-error="createCommunitySubmitError"
      :field-errors="createCommunityFieldErrors"
      @submit="onCreateCommunity"
    />

    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <header class="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Comunidades</p>
            <h1 class="mt-1 font-headline text-2xl font-black">Descubre por comunidad</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Selecciona una comunidad activa para ver sus eventos aprobados.</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="isAdmin" class="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">Admin</span>
            <button class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800" @click="createCommunityModalOpen = true">
              Crear comunidad
            </button>
            <button class="rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700" @click="createEventModalOpen = true">
              Crear evento
            </button>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end">
          <RouterLink
            v-if="isAdmin"
            to="/app/admin"
            class="rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-semibold hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Ir a admin
          </RouterLink>
        </div>
      </header>

      <section class="mt-6">
        <div class="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
          <label class="flex items-center gap-2">
            <span class="font-bold text-slate-700 dark:text-slate-200">Categoria:</span>
            <select
              v-model="selectedCategoryId"
              class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">Todas</option>
              <option v-for="category in categories" :key="`filter-${category.id}`" :value="String(category.id)">
                {{ category.name }}
              </option>
            </select>
          </label>
          <span class="rounded-full bg-slate-200 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {{ selectedCategoryLabel }}
          </span>
        </div>

        <div v-if="activeList.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No hay comunidades activas disponibles por ahora.
        </div>

        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <article
            v-for="community in activeList"
            :key="community.id"
            class="group cursor-pointer rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            @click="onOpenCommunity(community.id)"
          >
            <div class="flex items-start gap-2">
              <img
                :src="getCommunityCardImageUrl(community)"
                :alt="community.name"
                class="h-9 w-9 flex-none rounded-lg border border-slate-200 bg-white object-cover dark:border-slate-800"
                loading="lazy"
              />

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h3 class="truncate text-[13px] font-black leading-4 text-slate-900 dark:text-slate-100">{{ community.name }}</h3>
                    <p class="mt-0.5 truncate text-[10px] leading-3 text-slate-500 dark:text-slate-400">
                      {{ (community.events_count ?? community.approved_events_count ?? 0) }} ev.
                      <span class="mx-1 text-slate-300 dark:text-slate-700">•</span>
                      {{ categoryNameById.get(Number(community.category_id)) || 'Sin categoria' }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="flex-none rounded-full px-2 py-1 text-[10px] font-bold text-white transition"
                    :class="isCommunitySubscribed(community.id) ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'"
                    :disabled="isSubscriptionUpdating(community.id)"
                    @click.stop="onToggleSubscription(community.id)"
                  >
                    {{ isSubscriptionUpdating(community.id) ? '...' : isCommunitySubscribed(community.id) ? 'Suscrito' : 'Suscribirse' }}
                  </button>
                </div>

                <p class="mt-1 truncate text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                  {{ truncateChars(truncateWords(community.description || 'Comunidad activa en EventCut.', 8), 68) }}
                </p>
              </div>
            </div>
          </article>
        </div>


      </section>

      <section v-if="authStore.isAuthenticated" class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-headline text-lg font-extrabold">Mis comunidades</h2>
          <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {{ displayedMyCommunitiesCount }} registradas
          </span>
        </div>

        <div class="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-bold transition"
            :class="myCommunitiesTab === 'owned' ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'"
            @click="myCommunitiesTab = 'owned'"
          >
            Administradas
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-bold transition"
            :class="myCommunitiesTab === 'subscribed' ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'"
            @click="myCommunitiesTab = 'subscribed'"
          >
            Suscritas
          </button>
        </div>

        <div v-if="isLoadingMyList || isLoadingMySubscribedList" class="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Cargando tus comunidades...
        </div>

        <div v-else-if="displayedMyCommunities.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {{ myCommunitiesTab === 'owned' ? 'Aun no has creado comunidades.' : 'Aun no tienes comunidades suscritas.' }}
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <article
            v-for="community in displayedMyCommunities"
            :key="`my-${community.id}`"
            class="rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{{ community.name }}</h3>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ community.contact_email }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Categoria actual: {{ categoryNameById.get(Number(community.category_id)) || 'Sin categoria' }}
                </p>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                :class="
                  community.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : community.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                "
              >
                {{ community.status }}
              </span>
            </div>

            <p class="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{{ community.description }}</p>

            <div v-if="myCommunitiesTab === 'owned'" class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Editar categoria
                <select
                  :value="getEditableCategoryId(community)"
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  @change="onCategoryDraftChange(community.id, $event.target.value)"
                >
                  <option value="" disabled>Selecciona una categoria</option>
                  <option v-for="category in categories" :key="`owned-${community.id}-${category.id}`" :value="String(category.id)">
                    {{ category.name }}
                  </option>
                </select>
              </label>

              <button
                type="button"
                class="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!hasCategoryDraftChanged(community) || isUpdatingCommunity"
                @click="onSaveCommunityCategory(community)"
              >
                {{ isUpdatingCommunity ? 'Guardando...' : 'Guardar categoria' }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <nav class="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-slate-200 bg-white/90 px-4 pb-safe pt-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 md:hidden">
      <RouterLink to="/app" class="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400">
        <span class="material-symbols-outlined">event</span>
        <span class="text-[10px] font-medium">Eventos</span>
      </RouterLink>
      <RouterLink to="/app/comunidades" class="flex flex-col items-center p-2 text-sky-600 dark:text-sky-300">
        <span class="material-symbols-outlined">groups</span>
        <span class="text-[10px] font-medium">Comunidades</span>
      </RouterLink>
      <button type="button" class="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400" @click="mobileActionsOpen = !mobileActionsOpen">
        <span class="material-symbols-outlined">add_circle</span>
        <span class="text-[10px] font-medium">Popup</span>
      </button>
    </nav>

    <div v-if="mobileActionsOpen" class="fixed bottom-24 left-3 right-3 z-[70] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
      <div class="grid grid-cols-1 gap-2 text-sm">
        <button class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700" @click="createCommunityModalOpen = true; mobileActionsOpen = false">
          Crear comunidad
        </button>
        <button class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700" @click="createEventModalOpen = true; mobileActionsOpen = false">
          Crear evento para comunidad
        </button>
        <button
          class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700"
          :disabled="!selectedCommunityId"
          @click="onOpenCommunity(selectedCommunityId); mobileActionsOpen = false"
        >
          Ver detalle de comunidad
        </button>
        <RouterLink
          v-if="isAdmin"
          to="/app/admin"
          class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700"
          @click="mobileActionsOpen = false"
        >
          Ir a panel admin
        </RouterLink>
      </div>
    </div>

    <div v-if="error" class="fixed bottom-24 right-4 z-[75] hidden max-w-sm rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-md dark:border-rose-900/40 dark:bg-rose-950/50 dark:text-rose-200 md:block">
      {{ error }}
    </div>
  </main>
</template>

