<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCommunityStore } from '@/stores/community'
import { useEventStore } from '@/stores/event'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import CreateCommunityModal from '@/components/communities/CreateCommunityModal.vue'
import RichTextRenderer from '@/components/util/RichTextRenderer.vue'
import { normalizeFieldErrors } from '@/utils/formErrorAdapter'

const router = useRouter()
const authStore = useAuthStore()
const communityStore = useCommunityStore()
const eventStore = useEventStore()

const { activeList, selectedCommunityId, myList, mySubscribedList, isLoadingList, isLoadingMyList, isLoadingMySubscribedList, isSavingCommunity, isUpdatingCommunity, error } = storeToRefs(communityStore)
const { categories } = storeToRefs(eventStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const createCommunityModalOpen = ref(false)
const mobileActionsOpen = ref(false)

const lastMobileActionsOpenedAt = ref(0)

const onMobileActionsPopState = () => {
  if (Date.now() - lastMobileActionsOpenedAt.value < 250) return
  if (!mobileActionsOpen.value) return
  mobileActionsOpen.value = false
}

const openMobileActions = () => {
  const now = Date.now()
  if (now - lastMobileActionsOpenedAt.value < 400) return
  lastMobileActionsOpenedAt.value = now
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

const createCommunitySubmitError = ref('')
const createCommunityFieldErrors = ref({})

const isAdmin = computed(() => authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN']))

const searchQuery = computed({
  get: () => eventStore.searchQuery,
  set: (value) => eventStore.setSearchQuery(value),
})

const selectedCategoryId = ref('')
const myCommunitiesTab = ref('owned')
const categoryDraftByCommunityId = ref({})

const ensureHttpUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

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

const truncateWords = (value, limit = 3) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return ''

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= limit) return words.join(' ')
  return `${words.slice(0, limit).join(' ')}...`
}

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

const canManageCommunity = computed(() => {
  if (!selectedCommunityId.value) return false
  if (isAdmin.value) return true
  return myList.value.some((community) => Number(community.id) === Number(selectedCommunityId.value))
})

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

const onOpenManageCommunity = () => {
  if (!selectedCommunityId.value) return
  closeMobileActions()
  router.push(`/app/comunidades/${selectedCommunityId.value}`)
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

  window.addEventListener('popstate', onMobileActionsPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onMobileActionsPopState)
})

watch(mobileActionsOpen, (isOpen) => {
  if (!isOpen) return
  lastMobileActionsOpenedAt.value = Date.now()
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
  <main class="min-h-screen pb-24 pt-20 xl:pb-24 xl:pt-24 md:pb-8">

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
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">Comunidades</p>
            <h1 class="mt-1 font-headline text-2xl font-black">Descubre por comunidad</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Selecciona una comunidad activa para ver sus eventos aprobados.</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="isAdmin" class="rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">Admin</span>
            <button class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800" @click="createCommunityModalOpen = true">
              Crear comunidad
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
                    <h3 class="truncate text-[13px] font-black leading-4 text-slate-900 dark:text-slate-100">{{ truncateWords(community.name, 3) }}</h3>
                    <p class="mt-0.5 truncate text-[10px] leading-3 text-slate-500 dark:text-slate-400">
                      {{ (community.events_count ?? community.approved_events_count ?? 0) }} ev.
                      <span class="mx-1 text-slate-300 dark:text-slate-700">•</span>
                      {{ categoryNameById.get(Number(community.category_id)) || 'Sin categoria' }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="flex-none rounded-full px-2 py-1 text-[10px] font-bold text-white transition"
                    :class="isCommunitySubscribed(community.id) ? 'bg-success-600 hover:bg-success-700' : 'bg-primary-600 hover:bg-primary-700'"
                    :disabled="isSubscriptionUpdating(community.id)"
                    @click.stop="onToggleSubscription(community.id)"
                  >
                    {{ isSubscriptionUpdating(community.id) ? '...' : isCommunitySubscribed(community.id) ? 'Suscrito' : 'Suscribirse' }}
                  </button>
                </div>

                <div class="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                  <RichTextRenderer :content="community.description || 'Comunidad activa en EventCut.'" :line-clamp="1" />
                </div>
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
                    ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                    : community.status === 'REJECTED'
                      ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'
                      : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
                "
              >
                {{ community.status }}
              </span>
            </div>

            <div class="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
              <RichTextRenderer :content="community.description" :line-clamp="2" />
            </div>

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
                class="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
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

    <!-- Mobile-only: context actions (view-specific) -->
    <div class="fixed bottom-20 right-4 z-40 md:hidden">
      <button
        type="button"
        class="flex size-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg active:scale-95 dark:bg-primary-500 dark:text-primary-950"
        @click="toggleMobileActions"
      >
        <span class="material-symbols-outlined text-2xl">{{ mobileActionsOpen ? 'close' : 'add' }}</span>
      </button>
    </div>

    <div
      v-if="mobileActionsOpen"
      class="fixed inset-x-0 top-0 bottom-20 z-[60] md:hidden"
      @click="closeMobileActions"
    ></div>

    <div v-if="mobileActionsOpen" class="fixed bottom-36 right-4 z-[70] w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
      <div class="grid grid-cols-1 gap-2 text-sm">
        <button class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700" @click="createCommunityModalOpen = true; closeMobileActions()">
          Crear comunidad
        </button>
        <button
          v-if="canManageCommunity"
          class="rounded-xl border border-slate-300 px-3 py-2 text-left font-semibold dark:border-slate-700"
          @click="onOpenManageCommunity"
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
  </main>
</template>
