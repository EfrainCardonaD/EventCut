<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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

const creatorSummary = computed(() => {
  const source = props.event || {}
  return source.owner_display_name || source.ownerDisplayName || source.owner_name || source.ownerName || source.username || 'Creador anonimo'
})

const creatorInitial = computed(() => {
  const parts = String(creatorSummary.value || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
})

const creatorDetails = computed(() => {
  const source = props.event || {}
  const rows = [
    { icon: 'badge', label: 'ID', value: source.owner_id },
    { icon: 'alternate_email', label: 'Usuario', value: source.owner_username || source.ownerUsername || source.username },
    { icon: 'mail', label: 'Correo', value: source.owner_email || source.ownerEmail },
  ]
  return rows.filter((row) => row.value !== null && row.value !== undefined && String(row.value).trim())
})

const descriptionContent = computed(() => {
  return String(props.event?.description || '').trim()
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
    <div v-if="modelValue && event" class="fixed inset-0 z-[80] bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4">
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

      <div class="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-3 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-2 scale-95"
        >
              <div v-if="modelValue && event" class="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header class="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div class="min-w-0">
            <p class="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]" :style="categoryAccentStyle">{{ categoryName }}</p>
            <h3 class="font-headline text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{{ event.title }}</h3>
          </div>
          <div class="flex shrink-0 items-center gap-2">
          <button
            v-if="canManage"
            type="button"
            class="rounded-full border border-slate-300 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            @click="editMode = !editMode"
          >
            {{ editMode ? 'Cancelar edicion' : 'Editar' }}
          </button>
          <button type="button" class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        </header>

        <div class="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div class="grid grid-cols-1 gap-4 xl:gap-6">
            <!-- Vista detalle solo cuando NO se edita -->
            <section v-if="!editMode || !canManage" class="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
              <div class="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-5">
                <div class="order-2 space-y-3 xl:col-span-7 xl:order-2">
                  <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h4 class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Descripcion</h4>
                    <div v-if="descriptionContent">
                      <RichTextRenderer :content="descriptionContent" max-height="40vh" />
                    </div>
                    <p v-else class="text-sm text-slate-500 dark:text-slate-400">Sin descripcion disponible para este evento.</p>
                  </div>

                  <div v-if="socialLinks.length" class="flex flex-wrap gap-2">
                    <a
                      v-for="link in socialLinks"
                      :key="`${event.id}-modal-${link.key}`"
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

                <div class="order-1 space-y-3 xl:col-span-5 xl:order-1">
                  <img
                    :src="imagePreview || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'"
                    :alt="event.title"
                    class="h-52 w-full rounded-2xl object-cover sm:h-64"
                  />

                  <div class="grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-1">
                    <p class="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
                      <span class="material-symbols-outlined mt-0.5 text-base">schedule</span>
                      <span><span class="font-semibold">Inicio:</span> {{ startLabel }}</span>
                    </p>
                    <p class="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
                      <span class="material-symbols-outlined mt-0.5 text-base">event</span>
                      <span><span class="font-semibold">Fin:</span> {{ endLabel }}</span>
                    </p>
                    <p class="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
                      <span class="material-symbols-outlined mt-0.5 text-base">location_on</span>
                      <span>{{ event.location || 'Ubicacion por confirmar' }}</span>
                    </p>
                    <p class="flex items-start gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
                      <span class="material-symbols-outlined mt-0.5 text-base">star</span>
                      <span><span class="font-semibold">Score:</span> {{ event.score || 0 }}</span>
                    </p>
                  </div>

                  <div class="relative">
                    <button
                      type="button"
                      class="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-left text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-800/50 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-950/70"
                      @click="creatorCardOpen = !creatorCardOpen"
                    >
                      <span class="inline-flex items-center gap-2">
                        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-[11px] font-black text-white dark:bg-primary-500 dark:text-primary-950">{{ creatorInitial }}</span>
                        <span>
                          Creado por
                          <span class="text-primary-900 dark:text-primary-200">{{ creatorSummary }}</span>
                        </span>
                      </span>
                      <span class="material-symbols-outlined text-sm">{{ creatorCardOpen ? 'expand_less' : 'expand_more' }}</span>
                    </button>

                    <div
                      v-if="creatorCardOpen"
                      class="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
                    >
                      <p class="mb-2 font-bold text-slate-700 dark:text-slate-200">Datos del creador</p>
                      <p v-if="!creatorDetails.length" class="text-slate-500 dark:text-slate-400">No hay mas datos disponibles.</p>
                      <div v-else class="space-y-1.5">
                        <p v-for="item in creatorDetails" :key="item.label" class="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                          <span class="material-symbols-outlined text-sm">{{ item.icon }}</span>
                          <span><span class="font-semibold">{{ item.label }}:</span> {{ item.value }}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Edicion por pasos ocupa todo el ancho -->
            <section v-if="editMode && canManage" class="relative overflow-hidden rounded-2xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">
              <!-- Barra superior: progreso por pasos + indeterminado al guardar/eliminar -->
              <div class="absolute left-0 top-0 h-2 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  v-if="isSaving || isDeleting"
                  class="h-full w-1/3 bg-tertiary-600/90 dark:bg-tertiary-400/90 animate-[progressbar_1.1s_ease-in-out_infinite]"
                ></div>
                <div
                  v-else
                  class="h-full bg-tertiary-600 dark:bg-tertiary-400 origin-left transition-transform duration-300 ease-out"
                  :style="{ transform: `scaleX(${editProgressRatio})` }"
                ></div>
              </div>

              <div class="mb-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h4 class="font-headline text-lg font-extrabold">Editar evento</h4>
                  <p class="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Paso {{ editStep }} de {{ EDIT_TOTAL_STEPS }}</p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    v-if="editStep > 1"
                    type="button"
                    class="rounded-full border border-slate-300 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    :disabled="isSaving || isDeleting"
                    @click="goEditPrev"
                  >
                    Atras
                  </button>

                  <button
                    v-if="editStep < EDIT_TOTAL_STEPS"
                    type="button"
                    class="rounded-full bg-tertiary-500 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSaving || isDeleting"
                    @click="goEditNext"
                  >
                    Siguiente
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3">
            <template v-if="editStep === 1">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Titulo
              <input
                v-model="form.title"
                type="text"
                maxlength="150"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
              />
              <FieldError :error="getFieldError('title')" />
            </label>

            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Descripcion
              <div class="mt-1">
                <RichTextEditor
                  v-model="form.description"
                  placeholder="Describe el evento..."
                  min-height="80px"
                  max-height="250px"
                />
              </div>
              <FieldError :error="getFieldError('description')" />
            </label>

            </template>

            <template v-else-if="editStep === 2">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categoria
                <select
                  v-model="form.category_id"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                </select>
                <FieldError :error="getFieldError('category_id')" />
              </label>

              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ubicacion
                <input
                  v-model="form.location"
                  type="text"
                  maxlength="200"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                />
                <FieldError :error="getFieldError('location')" />
              </label>
            </template>

            <template v-else-if="editStep === 3">
              <SocialLinksStep
                v-model="form.social_links"
                v-model:visible-inputs="showSocialInput"
                :field-errors="fieldErrors"
                :placeholders="{
                  whatsapp: 'https://wa.me/528112345678',
                  facebook: 'https://facebook.com/tu-evento',
                  instagram: 'https://instagram.com/tu-evento',
                }"
              />
            </template>

            <template v-else-if="editStep === 4">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fecha del evento
                <input
                  v-model="form.date"
                  type="date"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                />
                <FieldError :error="getFieldError('start_datetime')" />
              </label>

              <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input
                  v-model="form.allDay"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-tertiary-500 focus:ring-tertiary-500"
                />
                <span class="text-tertiary-600 dark:text-tertiary-400">Todo el dia</span>
              </label>

              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span class="flex items-center gap-2 text-tertiary-600 dark:text-tertiary-400">Hora inicio (opcional)</span>
                <input
                  v-model="form.startTime"
                  type="time"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500" :class="form.allDay ? 'opacity-60' : ''">
                <span class="flex items-center gap-2 text-tertiary-600 dark:text-tertiary-400">Hora fin (opcional)</span>
                <input
                  v-model="form.endTime"
                  type="time"
                  :disabled="form.allDay"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
                />
                <FieldError :error="getFieldError('end_datetime')" />
              </label>

              <label v-if="!form.allDay" class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input v-model="form.hasEndDate" type="checkbox" class="rounded border-slate-300" />
                <span class="flex items-center gap-2 text-tertiary-600 dark:text-tertiary-400">Añadir fecha de finalizacion</span>
              </label>

              <label v-if="!form.allDay && form.hasEndDate" class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fecha fin
                <input
                  v-model="form.endDate"
                  type="date"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nueva imagen (opcional)
                <input
                  type="file"
                  :accept="ACCEPTED_IMAGE_TYPES"
                  class="mt-1 w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                  @change="onFileChange"
                />
                <FieldError :error="getFieldError('image_url')" />
              </label>

              <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input v-model="form.removeImage" type="checkbox" class="rounded border-slate-300" @change="onToggleRemoveImage" />
                Eliminar imagen actual
              </label>
            </template>

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
            />

            <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                v-if="editStep === EDIT_TOTAL_STEPS"
                type="button"
                class="rounded-full border border-error-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-error-600 transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-700 dark:text-error-400 dark:hover:bg-error-950/30"
                :disabled="isDeleting || isSaving"
                @click="onDelete"
              >
                {{ isDeleting ? 'Eliminando...' : 'Eliminar evento' }}
              </button>

              <button
                v-if="editStep === EDIT_TOTAL_STEPS"
                type="button"
                class="rounded-full bg-tertiary-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSaving || isDeleting"
                @click="onSave"
              >
                {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
              </div>
            </section>
          </div>
        </div>
          </div>
        </Transition>
      </div>
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

.description-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(148 163 184 / 0.8) transparent;
}

.description-scroll::-webkit-scrollbar {
  width: 8px;
}

.description-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.description-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: linear-gradient(180deg, rgb(148 163 184 / 0.9), rgb(71 85 105 / 0.8));
}

.dark .description-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(100 116 139 / 0.95), rgb(51 65 85 / 0.9));
}
</style>

