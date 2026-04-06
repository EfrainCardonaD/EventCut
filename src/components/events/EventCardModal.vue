<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import Alert from '@/components/util/Alert.vue'
import SocialNetworkIcon from '@/components/icons/SocialNetworkIcon.vue'
import RichTextRenderer from '@/components/util/RichTextRenderer.vue'
import { parseDbDateTime } from '@/utils/eventDateTimeAdapter'
import { getCategoryAccentStyles } from '@/utils/categoryColors'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  event: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  submitError: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'edit', 'toggle-favorite'])

const creatorCardOpen = ref(false)
const descriptionExpanded = ref(false)
const localError = ref('')
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

watch(
  () => props.modelValue,
  (isOpen) => {
    isBodyScrollLocked.value = isOpen
    if (!isOpen) {
      creatorCardOpen.value = false
      descriptionExpanded.value = false
      localError.value = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  isBodyScrollLocked.value = false
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const onToggleFavorite = (event) => {
  event?.stopPropagation?.()
  if (!props.event) return
  emit('toggle-favorite', props.event)
}

const onBackdropIntent = () => {
  if (creatorCardOpen.value) {
    creatorCardOpen.value = false
    return
  }
  closeModal()
}

const onBackIntent = () => {
  if (creatorCardOpen.value) {
    creatorCardOpen.value = false
    return
  }
  closeModal()
}

const onKeyDown = (event) => {
  if (!props.modelValue) return
  if (event.key === 'Escape') onBackIntent()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

const categoryName = computed(() => {
  const found = props.categories.find((category) => category.id === props.event?.category_id)
  return props.event?.category_name || found?.name || 'Evento'
})

const isDark = computed(() => document.documentElement.classList.contains('dark'))

const categoryAccentStyle = computed(() => {
  const found = props.categories.find((category) => category.id === props.event?.category_id)
  return getCategoryAccentStyles({
    category: { id: props.event?.category_id, name: found?.name || props.event?.category_name },
    isDark: isDark.value,
  })
})

const socialLinks = computed(() => {
  const links = props.event?.social_links || {}
  return [
    { key: 'whatsapp', label: 'WhatsApp', url: links.whatsapp },
    { key: 'facebook', label: 'Facebook', url: links.facebook },
    { key: 'instagram', label: 'Instagram', url: links.instagram },
  ].filter((item) => typeof item.url === 'string' && item.url.trim())
})

const startLabel = computed(() => {
  const parsedValue = parseDbDateTime(props.event?.start_datetime)
  if (!parsedValue) return 'Fecha no disponible'

  const parsed = new Date(`${parsedValue.date}T${parsedValue.time}`)
  if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
})

const endLabel = computed(() => {
  const parsedValue = parseDbDateTime(props.event?.end_datetime)
  if (!parsedValue) return 'Fecha no disponible'

  const parsed = new Date(`${parsedValue.date}T${parsedValue.time}`)
  if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
})

const creatorIdentity = computed(() => {
  const source = props.event || {}
  const owner = source.owner || source.author || source.user || {}

  const firstName =
    source.owner_first_name ||
    source.ownerFirstName ||
    owner.first_name ||
    owner.firstName ||
    source.first_name ||
    owner.name ||
    ''

  const lastName =
    source.owner_last_name ||
    source.ownerLastName ||
    owner.last_name ||
    owner.lastName ||
    source.last_name ||
    ''

  const safe = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim()
  return safe || 'Equipo EventCut'
})

const creatorInitials = computed(() => {
  const parts = String(creatorIdentity.value || '')
    .split(/\s+/)
    .filter(Boolean)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
})

const descriptionContent = computed(() => {
  const raw = props.event?.description
  if (!raw) return ''
  return String(raw)
})

const coverImageUrl = computed(() => {
  return (
    props.event?.image_url ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
  )
})

const openEdit = () => {
  emit('edit', props.event)
}
</script>

<template>
  <Transition
    appear
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="modelValue && event"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-2 pt-5 backdrop-blur-md sm:p-4 md:p-6"
      @click.self="onBackdropIntent"
    >
      <Transition
        appear
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95"
        enter-to-class="opacity-100 translate-y-0 sm:scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 sm:scale-100"
        leave-to-class="opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95"
      >
        <div
          v-if="modelValue && event"
          class="relative flex max-h-[100dvh] w-full flex-col overflow-hidden border-0 border-slate-200 bg-white/75 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/75 sm:max-h-[90vh] sm:max-w-[min(96vw,1400px)] sm:rounded-3xl sm:border"
        >
          <header
            class="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/50 bg-white/50 px-4 py-3 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/50 sm:px-6 sm:py-4"
          >
            <div class="min-w-0 flex-1">
              <p class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em]" :style="categoryAccentStyle">{{ categoryName }}</p>
              <h3 class="truncate font-headline text-lg font-black text-slate-900 dark:text-white sm:text-xl">{{ event.title }}</h3>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="rounded-full text-slate-400 transition-colors hover:bg-tertiary-50 hover:text-tertiary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-300/60 dark:hover:bg-tertiary-500/10"
                :class="event.isFavorite ? 'text-tertiary-600 dark:text-tertiary-400' : 'dark:text-slate-500'"
                aria-label="Marcar favorito"
                @click="onToggleFavorite"
              >
                <span class="material-symbols-outlined" :class="event.isFavorite ? 'icon-filled' : ''">
                  {{ event.isFavorite ? 'bookmark' : 'bookmark_border' }}
                </span>
              </button>

              <button
                v-if="canManage"
                type="button"
                class="rounded-full border border-slate-300/70 bg-white/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                @click="openEdit"
              >
                Editar
              </button>
              <button
                type="button"
                class="rounded-full bg-slate-100/50 p-1.5 text-slate-500 transition-colors hover:bg-slate-200/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
                @click="closeModal"
              >
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto overscroll-contain">
            <div class="mx-auto flex h-full w-full max-w-5xl flex-col p-2 sm:p-4">
              <div class="relative w-full overflow-hidden rounded-2xl">
                <img :src="coverImageUrl" :alt="event.title" class="h-52 w-full object-cover sm:h-64 lg:h-90" />
                <div class="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/20 to-transparent"></div>

                <div class="absolute left-0 top-0 flex w-full flex-wrap gap-2 p-4 text-[11px] font-bold uppercase tracking-wider text-white sm:p-5">
                  <span class="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md">
                    <span class="material-symbols-outlined text-[14px]">category</span>
                    {{ categoryName }}
                  </span>
                  <span
                    v-if="event.score"
                    class="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-amber-300 backdrop-blur-md"
                  >
                    <span class="material-symbols-outlined text-[14px]">star</span>
                    {{ event.score || 0 }}
                  </span>
                </div>
              </div>

              <div class="mx-auto flex w-full flex-1 flex-col space-y-6 p-4 sm:space-y-8 sm:p-6">
                <div class="grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                  <div class="flex items-start gap-3 rounded-2xl bg-white/40 p-3 backdrop-blur-sm dark:bg-slate-950/40">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-600 dark:bg-tertiary-900/30 dark:text-tertiary-300">
                      <span class="material-symbols-outlined text-[18px]">schedule</span>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inicio</p>
                      <p class="font-medium">{{ startLabel }}</p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 rounded-2xl bg-white/40 p-3 backdrop-blur-sm dark:bg-slate-950/40">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-600 dark:bg-tertiary-900/30 dark:text-tertiary-300">
                      <span class="material-symbols-outlined text-[18px]">event</span>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fin</p>
                      <p class="font-medium">{{ endLabel }}</p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3 rounded-2xl bg-white/40 p-3 backdrop-blur-sm dark:bg-slate-950/40 sm:col-span-2">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-600 dark:bg-tertiary-900/30 dark:text-tertiary-300">
                      <span class="material-symbols-outlined text-[18px]">location_on</span>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ubicación</p>
                      <p class="font-medium">{{ event.location || 'Por confirmar' }}</p>
                    </div>
                  </div>
                </div>

                <div v-if="socialLinks.length" class="space-y-3">
                  <h4 class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    <span class="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                    Redes y contacto
                    <span class="h-px w-8 bg-slate-200 dark:bg-slate-800"></span>
                  </h4>

                  <div class="flex flex-wrap gap-2">
                    <a
                      v-for="link in socialLinks"
                      :key="link.key"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <SocialNetworkIcon :network="link.key" class="h-4 w-4" />
                      {{ link.label }}
                    </a>
                  </div>
                </div>

                <div>
                  <h4 class="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    <span class="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                    Acerca del evento
                    <span class="h-px w-8 bg-slate-200 dark:bg-slate-800"></span>
                  </h4>

                  <div class="rounded-2xl bg-white/40 p-4 text-[15px] leading-relaxed text-slate-700 backdrop-blur-sm dark:bg-slate-950/40 dark:text-slate-300 sm:p-5">
                    <div v-if="descriptionContent" class="relative">
                      <div
                        class="pr-1"
                        :class="descriptionExpanded ? 'max-h-none' : 'max-h-[28vh] sm:max-h-[32vh] md:max-h-[36vh]'"
                      >
                        <RichTextRenderer :content="descriptionContent" :max-height="descriptionExpanded ? 'none' : '36vh'" />
                      </div>

                      <button
                        v-if="descriptionContent"
                        type="button"
                        class="mt-3 text-xs font-bold uppercase tracking-wide text-tertiary-600 hover:text-tertiary-700 dark:text-tertiary-400 dark:hover:text-tertiary-300"
                        @click="descriptionExpanded = !descriptionExpanded"
                      >
                        {{ descriptionExpanded ? 'Ver menos' : 'Ver más' }}
                      </button>
                    </div>
                    <p v-else class="text-sm text-slate-500 dark:text-slate-400">Sin descripción.</p>
                  </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white/40 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Creado por</p>
                      <p class="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">{{ creatorIdentity }}</p>
                    </div>

                    <button
                      type="button"
                      class="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-500 text-xs font-black text-white"
                      @click="creatorCardOpen = !creatorCardOpen"
                    >
                      {{ creatorInitials || 'EC' }}
                    </button>
                  </div>

                  <div v-if="creatorCardOpen" class="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <p class="font-bold">{{ creatorIdentity }}</p>
                    <p class="mt-1 text-slate-500 dark:text-slate-400">
                      <!-- Nota: el backend puede exponer email / perfil; si no existe, se muestra texto neutro -->
                      Organizador del evento.
                    </p>
                  </div>
                </div>

                <Alert
                  v-if="(localError || submitError).trim()"
                  :model-value="true"
                  type="error"
                  title=""
                  :message="(localError || submitError).trim()"
                  :dismissible="false"
                  :duration="0"
                  :auto-focus="false"
                  :auto-scroll="true"
                  :toast="false"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>


