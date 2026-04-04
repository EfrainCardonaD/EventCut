<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import SocialNetworkIcon from '@/components/icons/SocialNetworkIcon.vue'
import SocialLinksStep from '@/components/util/SocialLinksStep.vue'
import RichTextEditor from '@/components/util/RichTextEditor.vue'
import RichTextRenderer from '@/components/util/RichTextRenderer.vue'
import { isAllowedEventImageType } from '@/utils/eventCreateFactory'
import { dbToUiModel, uiToDbStrict, parseDbDateTime } from '@/utils/eventDateTimeAdapter'
import { getCategoryAccentStyles } from '@/utils/categoryColors'
import {
  toEventCategoryId,
  validateEventCategory,
  validateEventDescription,
  validateEventLocation,
  validateEventSocialLinks,
  validateEventTitle,
} from '@/utils/eventFormValidation'
import { normalizeSocialLinksPayload } from '@/utils/socialLinks'

const ACCEPTED_IMAGE_TYPES = 'image/jpeg, image/png, image/webp, image/gif, image/avif'

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
  isSaving: {
    type: Boolean,
    default: false,
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
  submitError: {
    type: String,
    default: '',
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const EDIT_TOTAL_STEPS = 4
const editStep = ref(1)
const showSocialInput = ref({
  whatsapp: false,
  facebook: false,
  instagram: false,
})

const editMode = ref(false)
const deleteModalOpen = ref(false)
const creatorCardOpen = ref(false)
const descriptionExpanded = ref(false)
const localError = ref('')
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const formErrorMessage = computed(() => {
  return (localError.value || props.submitError || '').trim()
})

const showFormError = computed(() => Boolean(formErrorMessage.value))
const form = ref({
  title: '',
  description: '',
  location: '',
  category_id: '',
  date: '',
  allDay: false,
  startTime: '',
  endTime: '',
  hasEndDate: false,
  endDate: '',
  imageFile: null,
  removeImage: false,
})

const localImagePreview = ref('')

const clearLocalImagePreview = () => {
  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value)
  }
  localImagePreview.value = ''
}

const imagePreview = computed(() => {
  if (localImagePreview.value) return localImagePreview.value
  if (form.value.removeImage) return ''
  if (!props.event?.image_url) return ''
  return props.event.image_url
})

const toFieldErrorText = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'string') return value
  return ''
}

const getFieldError = (field) => {
  return toFieldErrorText(props.fieldErrors?.[field])
}

const syncFormFromEvent = () => {
  const schedule = dbToUiModel({
    start_datetime: props.event?.start_datetime,
    end_datetime: props.event?.end_datetime,
  })

  editStep.value = 1
  form.value = {
    title: props.event?.title || '',
    description: props.event?.description || '',
    location: props.event?.location || '',
    category_id: props.event?.category_id || '',
    ...schedule,
    social_links: {
      whatsapp: props.event?.social_links?.whatsapp || '',
      facebook: props.event?.social_links?.facebook || '',
      instagram: props.event?.social_links?.instagram || '',
    },
    imageFile: null,
    removeImage: false,
  }
  showSocialInput.value = {
    whatsapp: Boolean(form.value.social_links.whatsapp),
    facebook: Boolean(form.value.social_links.facebook),
    instagram: Boolean(form.value.social_links.instagram),
  }
  clearLocalImagePreview()
  deleteModalOpen.value = false
  localError.value = ''
}

watch(
  () => [props.modelValue, props.event?.id],
  ([isOpen]) => {
    isBodyScrollLocked.value = isOpen

    if (!isOpen) {
      editMode.value = false
      editStep.value = 1
      deleteModalOpen.value = false
      creatorCardOpen.value = false
      descriptionExpanded.value = false
      clearLocalImagePreview()
      return
    }
    syncFormFromEvent()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  isBodyScrollLocked.value = false
})

watch(
  () => editMode.value,
  (enabled) => {
    if (!enabled) {
      editStep.value = 1
      localError.value = ''
      descriptionExpanded.value = false
    }
  },
)

const editProgressRatio = computed(() => {
  return Math.min(1, Math.max(0, editStep.value / EDIT_TOTAL_STEPS))
})

const validateEditStep = (targetStep) => {
  localError.value = ''

  if (targetStep === 1) {
    const titleError = validateEventTitle(form.value.title)
    if (titleError) {
      localError.value = titleError
      return false
    }

    const descriptionError = validateEventDescription(form.value.description)
    if (descriptionError) {
      localError.value = descriptionError
      return false
    }

    return true
  }

  if (targetStep === 2) {
    const categoryError = validateEventCategory(form.value.category_id, props.categories)
    if (categoryError) {
      localError.value = categoryError
      return false
    }

    const locationError = validateEventLocation(form.value.location)
    if (locationError) {
      localError.value = locationError
      return false
    }

    return true
  }

  if (targetStep === 3) {
    const socialLinksError = validateEventSocialLinks(form.value.social_links)
    if (socialLinksError) {
      localError.value = socialLinksError
      return false
    }

    return true
  }

  if (targetStep === 4) {
    if (!form.value.date) {
      localError.value = 'Selecciona la fecha del evento.'
      return false
    }

    const scheduleResult = uiToDbStrict({
      date: form.value.date,
      allDay: form.value.allDay,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      hasEndDate: form.value.hasEndDate,
      endDate: form.value.endDate,
    })

    if (!scheduleResult.ok) {
      localError.value = scheduleResult.error
      return false
    }

    return true
  }

  return true
}

const goEditPrev = () => {
  localError.value = ''
  if (editStep.value > 1) editStep.value -= 1
}

const goEditNext = () => {
  if (props.isSaving || props.isDeleting) return
  const ok = validateEditStep(editStep.value)
  if (!ok) return
  if (editStep.value < EDIT_TOTAL_STEPS) editStep.value += 1
}


const closeModal = () => {
  emit('update:modelValue', false)
}

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
  const links = form.value.social_links || {}
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
    ''

  const lastName =
    source.owner_last_name ||
    source.ownerLastName ||
    owner.last_name ||
    owner.lastName ||
    ''

  const fullName =
    source.owner_display_name ||
    source.ownerDisplayName ||
    source.owner_name ||
    source.ownerName ||
    owner.full_name ||
    owner.fullName ||
    owner.name ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    ''

  return {
    id: source.owner_id || source.ownerId || owner.id || null,
    username: source.owner_username || source.ownerUsername || source.username || owner.username || owner.handle || '',
    email: source.owner_email || source.ownerEmail || owner.email || '',
    fullName,
  }
})

const creatorSummary = computed(() => {
  return creatorIdentity.value.fullName || creatorIdentity.value.username || 'Creador anonimo'
})

const creatorInitial = computed(() => {
  const parts = String(creatorSummary.value || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
})

const creatorDetails = computed(() => {
  const rows = [
    { icon: 'person', label: 'Nombre', value: creatorIdentity.value.fullName },
    { icon: 'badge', label: 'ID', value: creatorIdentity.value.id },
    { icon: 'alternate_email', label: 'Usuario', value: creatorIdentity.value.username },
    { icon: 'mail', label: 'Correo', value: creatorIdentity.value.email },
  ]
  return rows.filter((row) => row.value !== null && row.value !== undefined && String(row.value).trim())
})

const descriptionContent = computed(() => {
  return String(props.event?.description || '').trim()
})

const hasLongDescription = computed(() => descriptionContent.value.length > 420)

const extractYouTubeId = (rawUrl) => {
  if (!rawUrl) return ''

  try {
    const normalized = String(rawUrl).replaceAll('&amp;', '&')
    const parsed = new URL(normalized)
    const host = parsed.hostname.toLowerCase()

    if (host === 'youtu.be') return parsed.pathname.slice(1)

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v') || ''
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || ''
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || ''
    }
  } catch {
    return ''
  }

  return ''
}

const youtubeEmbeds = computed(() => {
  const urls = descriptionContent.value.match(/https?:\/\/[^\s"'<>]+/g) || []
  const seen = new Set()

  return urls
    .map((url) => {
      const id = extractYouTubeId(url)
      if (!id || seen.has(id)) return null
      seen.add(id)
      return {
        id,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      }
    })
    .filter(Boolean)
    .slice(0, 2)
})

const onKeyDown = (event) => {
  if (!props.modelValue) return
  if (event.key === 'Escape') closeModal()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

const onFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!isAllowedEventImageType(file.type)) {
    localError.value = 'Formato no permitido. Usa JPEG, PNG, WEBP, GIF o AVIF.'
    form.value.imageFile = null
    clearLocalImagePreview()
    event.target.value = ''
    return
  }

  localError.value = ''
  form.value.removeImage = false
  form.value.imageFile = file
  clearLocalImagePreview()
  localImagePreview.value = URL.createObjectURL(file)
}

const onToggleRemoveImage = () => {
  if (!form.value.removeImage) return
  form.value.imageFile = null
  clearLocalImagePreview()
}

const onSave = () => {
  localError.value = ''

  for (let s = 1; s <= EDIT_TOTAL_STEPS; s += 1) {
    if (!validateEditStep(s)) {
      editStep.value = s
      return
    }
  }

  const result = uiToDbStrict({
    date: form.value.date,
    allDay: form.value.allDay,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    hasEndDate: form.value.hasEndDate,
    endDate: form.value.endDate,
  })

  if (!result.ok) {
    localError.value = result.error
    return
  }

  emit('save', {
    eventId: props.event.id,
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    location: form.value.location.trim(),
    category_id: toEventCategoryId(form.value.category_id),
    start_datetime: result.value.start_datetime,
    end_datetime: result.value.end_datetime,
    imageFile: form.value.imageFile,
    imageAction: form.value.removeImage ? 'remove' : form.value.imageFile ? 'replace' : 'keep',
    social_links: normalizeSocialLinksPayload(form.value.social_links),
  })
}

const onDelete = () => {
  deleteModalOpen.value = true
}

const onConfirmDelete = () => {
  emit('delete', props.event.id)
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  isBodyScrollLocked.value = false
})
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
    <div v-if="modelValue && event" class="p-2 pt-5  fixed inset-0 z-[80] flex items-center justify-center  border sm:p-4 md:p-6  sm:border border-slate-200  shadow-2xl backdrop-blur-md dark:border-slate-800 ">
      <SpinnerOverlay :show="isSaving || isDeleting" :text="isDeleting ? 'Eliminando evento...' : 'Guardando cambios...'" />

      <ConfirmModal
        v-model="deleteModalOpen"
        title-user="Eliminar evento"
        message="Esta accion eliminara el evento de la cartelera."
        description="La eliminacion es permanente y tambien quitara favoritos relacionados."
        confirm-text="Si, eliminar"
        cancel-text="Cancelar"
        :danger="true"
        :loading="isDeleting"
        @confirm="onConfirmDelete"
      />

      <Transition
        appear
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95"
        enter-to-class="opacity-100 translate-y-0 sm:scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 sm:scale-100"
        leave-to-class="opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95"
      >
        <div v-if="modelValue && event" class="relative flex max-h-[100dvh] w-full flex-col sm:max-h-[90vh]   sm:max-w-4xl sm:rounded-3xl border-0 sm:border border-slate-200 bg-white/75 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/75 overflow-hidden">

          <!-- Header Sticky -->
          <header class=" sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/50 bg-white/50 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/50">
            <div class="min-w-0 flex-1">
              <p class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em]" :style="categoryAccentStyle">{{ categoryName }}</p>
              <h3 class="truncate font-headline text-lg font-black text-slate-900 dark:text-white sm:text-xl">{{ event.title }}</h3>

              <!-- Barra progreso modo edición -->
              <div v-if="editMode && canManage" class="absolute bottom-0 left-0 h-[2px] w-full bg-slate-200/50 dark:bg-slate-800/50">
                 <div
                  v-if="isSaving || isDeleting"
                  class="h-full w-1/3 bg-tertiary-600 dark:bg-tertiary-400 animate-[progressbar_1.1s_ease-in-out_infinite]"
                 ></div>
                 <div
                  v-else
                  class="h-full bg-tertiary-600 dark:bg-tertiary-400 origin-left transition-transform duration-300 ease-out"
                  :style="{ transform: `scaleX(${editProgressRatio})` }"
                 ></div>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canManage"
                type="button"
                class="rounded-full border border-slate-300/70 bg-white/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                @click="editMode = !editMode"
              >
                {{ editMode ? 'Cancelar' : 'Editar' }}
              </button>
              <button type="button" class="rounded-full bg-slate-100/50 p-1.5 text-slate-500 hover:bg-slate-200/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors" @click="closeModal">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto overscroll-contain">

            <!-- Modo Detalle -->
            <div v-if="!editMode" class="flex flex-col md:flex-row h-full  overscroll-contain p-2">
              <!-- Hero Image (Desktop Left, Mobile Top) -->

              <div class="relative w-full md:w-5/12 shrink-0  ">

                <img
                  :src="imagePreview || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'"
                  :alt="event.title"
                  class="w-full object-cover items-center md:absolute md:inset-0"
                />
                <div class="absolute top-0  bg-gradient-to-b from-slate-900/80 via-slate-900/20 to-transparent md:bg-gradient-to-tr"></div>

                <div class="absolute top-0 left-0 w-full p-4 sm:p-5 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider text-white">
                  <span class="rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[14px]">category</span>
                    {{ categoryName }}
                  </span>
                  <span v-if="event.score" class="rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md flex items-center gap-1.5 text-amber-300">
                    <span class="material-symbols-outlined text-[14px]">star</span>
                    {{ event.score || 0 }}
                  </span>
                </div>


              </div>

              

              <!-- Content Panel -->
              <div class="flex flex-1 flex-col p-4 sm:p-6 space-y-6 md:space-y-8 ">

                <!-- Facts Panel -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
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

                <!-- Description -->
                <div>
                  <h4 class="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    <span class="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                    Acerca del evento
                    <span class="h-px w-8 bg-slate-200 dark:bg-slate-800"></span>
                  </h4>
                  <div class="rounded-2xl bg-white/40 p-4 sm:p-5 backdrop-blur-sm dark:bg-slate-950/40 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <div
                      v-if="descriptionContent"
                      class="relative"
                    >
                      <div
                        class="  pr-1"
                        :class="descriptionExpanded ? 'max-h-none' : 'max-h-[28vh] sm:max-h-[32vh] md:max-h-[36vh]'"
                      >
                        <RichTextRenderer :content="descriptionContent" :max-height="descriptionExpanded ? 'none' : '36vh'" />
                      </div>

                      <div
                        v-if="hasLongDescription && !descriptionExpanded"
                        class="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/95 to-transparent dark:from-slate-900/95"
                      ></div>

                      <button
                        v-if="hasLongDescription"
                        type="button"
                        class="mt-3 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition hover:bg-white dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
                        @click="descriptionExpanded = !descriptionExpanded"
                      >
                        {{ descriptionExpanded ? 'Ver menos' : 'Ver descripción completa' }}
                      </button>
                    </div>
                    <p v-else class="italic text-slate-500">Sin descripción disponible.</p>
                  </div>
                </div>

                <div v-if="youtubeEmbeds.length" class="space-y-2">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Preview multimedia</p>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <article
                      v-for="video in youtubeEmbeds"
                      :key="video.id"
                      class="rounded-2xl border border-slate-200/50 bg-white/50 p-2 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
                    >
                      <div class="aspect-video overflow-hidden rounded-xl bg-black/80">
                        <iframe
                          :src="video.embedUrl"
                          class="h-full w-full"
                          title="YouTube preview"
                          loading="lazy"
                          referrerpolicy="strict-origin-when-cross-origin"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowfullscreen
                        ></iframe>
                      </div>
                      <a
                        :href="video.watchUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-tertiary-600 hover:text-tertiary-700 dark:text-tertiary-300 dark:hover:text-tertiary-200"
                      >
                        Ver en YouTube
                        <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    </article>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                  <!-- Links -->
                  <div v-if="socialLinks.length" class="flex-1">
                    <p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Conectar</p>
                    <div class="flex flex-wrap gap-2">
                      <a
                        v-for="link in socialLinks"
                        :key="`${event.id}-modal-${link.key}`"
                        :href="link.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold text-slate-700 backdrop-blur-md transition hover:bg-white hover:text-primary-600 hover:shadow-sm dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-primary-400"
                      >
                        <SocialNetworkIcon :network="link.key" :size="14" class-name="text-current" />
                        {{ link.label }}
                      </a>
                    </div>
                  </div>

                  <!-- Creator Inline Card -->
                  <div class="relative shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 rounded-2xl bg-primary-50/50 p-2 pr-4 backdrop-blur-sm transition-colors hover:bg-primary-50 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 sm:w-auto"
                      @click="creatorCardOpen = !creatorCardOpen"
                    >
                      <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xs font-black text-white shadow-sm dark:bg-primary-500 dark:text-primary-950">{{ creatorInitial }}</span>
                      <span class="flex flex-col items-start leading-tight">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-primary-600/70 dark:text-primary-400/70">Organizado por</span>
                        <span class="text-xs font-bold text-primary-900 dark:text-primary-100">{{ creatorSummary }}</span>
                      </span>
                      <span class="material-symbols-outlined ml-auto sm:ml-2 text-tertiary-500/80 dark:text-tertiary-300/80 text-[18px]">{{ creatorCardOpen ? 'expand_less' : 'expand_more' }}</span>
                    </button>

                    <Transition
                      enter-active-class="transition duration-200 ease-out"
                      enter-from-class="opacity-0 translate-y-2 scale-95"
                      enter-to-class="opacity-100 translate-y-0 scale-100"
                      leave-active-class="transition duration-150 ease-in"
                      leave-from-class="opacity-100 translate-y-0 scale-100"
                      leave-to-class="opacity-0 translate-y-2 scale-95"
                    >
                      <div
                        v-if="creatorCardOpen"
                        class="absolute bottom-full left-0 z-20 mb-2 w-full min-w-[200px] rounded-2xl border border-slate-200/50 bg-white/90 p-3 text-xs shadow-xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/90 sm:left-auto sm:right-0"
                      >
                        <p v-if="!creatorDetails.length" class="text-slate-500">Sin datos adicionales.</p>
                        <div v-else class="space-y-2">
                          <p v-for="item in creatorDetails" :key="item.label" class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <span class="material-symbols-outlined text-[16px] text-tertiary-500/80 dark:text-tertiary-300/80">{{ item.icon }}</span>
                            <span class="font-medium text-[11px] uppercase tracking-wider text-slate-500 border-r border-slate-300 dark:border-slate-700 pr-2">{{ item.label }}</span>
                            <span class="truncate">{{ item.value }}</span>
                          </p>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>

              </div>
            </div>

            <!-- Modo Edición -->
            <div v-else class="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
              <div class="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h4 class="font-headline text-2xl font-black text-slate-900 dark:text-white">Editor</h4>
                  <p class="mt-1 text-xs font-bold uppercase tracking-wider text-tertiary-600 dark:text-tertiary-400">Paso {{ editStep }} de {{ EDIT_TOTAL_STEPS }}</p>
                </div>

                <div class="flex items-center gap-2 mb-1">
                  <button
                    v-if="editStep > 1"
                    type="button"
                    class="rounded-full border border-slate-300/50 bg-white/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700/80"
                    :disabled="isSaving || isDeleting"
                    @click="goEditPrev"
                  >
                    Atrás
                  </button>
                  <button
                    v-if="editStep < EDIT_TOTAL_STEPS"
                    type="button"
                    class="rounded-full bg-tertiary-500 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSaving || isDeleting"
                    @click="goEditNext"
                  >
                    Siguiente
                  </button>
                </div>
              </div>

              <!-- Pasos de Edición con inputs en bg-white sólido -->
              <div class="grid grid-cols-1 gap-5  rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <template v-if="editStep === 1">
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Título</span>
                    <input
                      v-model="form.title"
                      type="text"
                      name="event_title"
                      maxlength="150"
                      class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <FieldError :error="getFieldError('title')" class="mt-1" />
                  </label>

                  <div class="block">
                    <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Descripción</span>
                    <div class="rounded-2xl   ">
                      <RichTextEditor
                        v-model="form.description"
                        placeholder="Describe el evento..."
                        min-height="120px"
                        max-height="300px"
                      />
                    </div>
                    <FieldError :error="getFieldError('description')" class="mt-1" />
                  </div>
                </template>

                <template v-else-if="editStep === 2">
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Categoría</span>
                    <select
                      v-model="form.category_id"
                      name="event_category"
                      class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                    </select>
                    <FieldError :error="getFieldError('category_id')" class="mt-1" />
                  </label>

                  <label class="block">
                    <span class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ubicación</span>
                    <input
                      v-model="form.location"
                      type="text"
                      name="event_location"
                      maxlength="200"
                      class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <FieldError :error="getFieldError('location')" class="mt-1" />
                  </label>
                </template>

                <template v-else-if="editStep === 3">
                    <SocialLinksStep
                      v-model="form.social_links"
                      v-model:visible-inputs="showSocialInput"
                      :field-errors="fieldErrors"
                      :placeholders="{
                        whatsapp: 'https://wa.me/...',
                      facebook: 'https://facebook.com/...',
                      instagram: 'https://instagram.com/...',
                      }"
                    />

                </template>

                <template v-else-if="editStep === 4">
                  <div class="grid gap-5 rounded-2xl bg-white/40 p-5 backdrop-blur-sm dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50">
                    <label class="block">
                      <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fecha del evento</span>
                      <input
                        v-model="form.date"
                        type="date"
                        name="event_date"
                        class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                      <FieldError :error="getFieldError('start_datetime')" />
                    </label>

                    <label class="flex items-center gap-3">
                      <input
                        v-model="form.allDay"
                        type="checkbox"
                        class="h-5 w-5 rounded border-slate-300 text-tertiary-500 focus:ring-tertiary-500 bg-white dark:bg-slate-950 dark:border-slate-700"
                      />
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200">Todo el día</span>
                    </label>

                    <div class="grid grid-cols-2 gap-4">
                      <label class="block" :class="form.allDay ? 'opacity-50 pointer-events-none' : ''">
                        <span class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Hora inicio</span>
                        <input
                          v-model="form.startTime"
                          type="time"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                      </label>
                      <label class="block" :class="form.allDay ? 'opacity-50 pointer-events-none' : ''">
                        <span class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Hora fin</span>
                        <input
                          v-model="form.endTime"
                          type="time"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                      </label>
                    </div>

                    <label v-if="!form.allDay" class="flex items-center gap-2">
                      <input v-model="form.hasEndDate" type="checkbox" class="h-4 w-4 rounded border-slate-300 bg-white dark:bg-slate-950 dark:border-slate-700" />
                      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Añadir fecha fin</span>
                    </label>

                    <label v-if="!form.allDay && form.hasEndDate" class="block">
                      <span class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha fin</span>
                      <input
                        v-model="form.endDate"
                        type="date"
                        class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>

                    <div class="my-2 h-px bg-slate-200/50 dark:bg-slate-700/50"></div>

                    <label class="block">
                      <span class="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nueva imagen (opcional)</span>
                      <input
                        type="file"
                        :accept="ACCEPTED_IMAGE_TYPES"
                        class="w-full rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700/80 dark:bg-slate-950/50 dark:text-slate-300"
                        @change="onFileChange"
                      />
                      <FieldError :error="getFieldError('image_url')" />
                    </label>

                    <label class="flex items-center gap-3">
                      <input v-model="form.removeImage" type="checkbox" class="h-4 w-4 rounded border-slate-300 bg-white dark:bg-slate-950" @change="onToggleRemoveImage" />
                      <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Eliminar imagen actual</span>
                    </label>
                  </div>
                </template>
              </div>

              <Alert
                v-if="showFormError"
                :model-value="true"
                type="error"
                title=""
                :message="formErrorMessage"
                :dismissible="false"
                :duration="0"
                :auto-focus="false"
                :auto-scroll="true"
                :toast="false"
                class="mt-4"
              />

              <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  v-if="editStep === EDIT_TOTAL_STEPS"
                  type="button"
                  class="w-full sm:w-auto rounded-full border border-error-300/50 bg-error-50/50 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-error-600 transition hover:bg-error-100 disabled:opacity-50 dark:border-error-800/50 dark:bg-error-900/20 dark:text-error-400 dark:hover:bg-error-900/50"
                  :disabled="isDeleting || isSaving"
                  @click="onDelete"
                >
                  {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
                </button>
                <div v-else class="hidden sm:block"></div>

                <button
                  v-if="editStep === EDIT_TOTAL_STEPS"
                  type="button"
                  class="w-full sm:w-auto rounded-full bg-tertiary-500 px-8 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-tertiary-600 disabled:opacity-50"
                  :disabled="isSaving || isDeleting"
                  @click="onSave"
                >
                  {{ isSaving ? 'Guardando...' : 'Finalizar y Guardar' }}
                </button>
              </div>
            </div>

          </div>

        </div>

      </Transition>

    </div>
  </Transition>
</template>

<style scoped>
@keyframes progressbar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}


</style>

