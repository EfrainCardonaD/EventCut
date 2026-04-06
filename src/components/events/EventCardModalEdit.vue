<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import SocialLinksStep from '@/components/util/SocialLinksStep.vue'
import RichTextEditor from '@/components/util/RichTextEditor.vue'
import { isAllowedEventImageType } from '@/utils/eventCreateFactory'
import { dbToUiModel, uiToDbStrict } from '@/utils/eventDateTimeAdapter'
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

const deleteModalOpen = ref(false)
const discardConfirmOpen = ref(false)
const localError = ref('')
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)
const modalContentRef = ref(null)
const pointerStartedInsideModal = ref(false)
const initialFormSnapshot = ref('')

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
  social_links: {
    whatsapp: '',
    facebook: '',
    instagram: '',
  },
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
  return props.event?.image_url || ''
})

const formErrorMessage = computed(() => {
  return (localError.value || props.submitError || '').trim()
})

const showFormError = computed(() => Boolean(formErrorMessage.value))

const toFieldErrorText = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'string') return value
  return ''
}

const getFieldError = (field) => {
  return toFieldErrorText(props.fieldErrors?.[field])
}

const buildFormSnapshot = () => {
  return JSON.stringify({
    title: String(form.value.title || '').trim(),
    description: String(form.value.description || '').trim(),
    location: String(form.value.location || '').trim(),
    category_id: String(form.value.category_id || ''),
    date: String(form.value.date || ''),
    allDay: Boolean(form.value.allDay),
    startTime: String(form.value.startTime || ''),
    endTime: String(form.value.endTime || ''),
    hasEndDate: Boolean(form.value.hasEndDate),
    endDate: String(form.value.endDate || ''),
    removeImage: Boolean(form.value.removeImage),
    hasImageFile: Boolean(form.value.imageFile),
    social_links: {
      whatsapp: String(form.value.social_links?.whatsapp || '').trim(),
      facebook: String(form.value.social_links?.facebook || '').trim(),
      instagram: String(form.value.social_links?.instagram || '').trim(),
    },
  })
}

const isDirty = computed(() => buildFormSnapshot() !== initialFormSnapshot.value)

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
  discardConfirmOpen.value = false
  localError.value = ''
  initialFormSnapshot.value = buildFormSnapshot()
}

watch(
  () => [props.modelValue, props.event?.id],
  ([isOpen]) => {
    isBodyScrollLocked.value = isOpen

    if (!isOpen) {
      editStep.value = 1
      deleteModalOpen.value = false
      discardConfirmOpen.value = false
      localError.value = ''
      clearLocalImagePreview()
      return
    }

    syncFormFromEvent()
  },
  { immediate: true },
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
  if (props.isSaving || props.isDeleting) return
  if (isDirty.value) {
    discardConfirmOpen.value = true
    return
  }
  emit('update:modelValue', false)
}

const closeWithoutSaving = () => {
  discardConfirmOpen.value = false
  emit('update:modelValue', false)
}

const hasSelectionInsideModal = () => {
  if (typeof window === 'undefined' || !modalContentRef.value) return false
  const selection = window.getSelection?.()
  if (!selection || selection.isCollapsed) return false

  const anchorNode = selection.anchorNode
  const focusNode = selection.focusNode
  return modalContentRef.value.contains(anchorNode) || modalContentRef.value.contains(focusNode)
}

const onOverlayPointerDown = (event) => {
  pointerStartedInsideModal.value = Boolean(modalContentRef.value?.contains(event.target))
}

const onBackdropIntent = () => {
  if (pointerStartedInsideModal.value || hasSelectionInsideModal()) {
    pointerStartedInsideModal.value = false
    return
  }
  pointerStartedInsideModal.value = false
  if (props.isSaving || props.isDeleting) return
  if (deleteModalOpen.value || discardConfirmOpen.value) return
  closeModal()
}

const onBackIntent = () => {
  if (props.isSaving || props.isDeleting) return
  if (deleteModalOpen.value || discardConfirmOpen.value) return

  if (editStep.value > 1) {
    goEditPrev()
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
  clearLocalImagePreview()
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
    <div
      v-if="modelValue && event"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-2 pt-5 backdrop-blur-md sm:p-4 md:p-6"
      @pointerdown="onOverlayPointerDown"
      @click.self="onBackdropIntent"
    >
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

      <ConfirmModal
        v-model="discardConfirmOpen"
        title-user="Descartar cambios"
        message="Tienes cambios sin guardar en la edicion del evento."
        description="Si cierras ahora, se perdera la informacion editada."
        confirm-text="Descartar"
        cancel-text="Seguir editando"
        :danger="false"
        @confirm="closeWithoutSaving"
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
        <div
          v-if="modelValue && event"
          ref="modalContentRef"
          class="relative flex max-h-[100dvh] w-full flex-col overflow-hidden border-0 border-slate-200 bg-white/75 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/75 sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl sm:border"
        >
          <header
            class="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/50 bg-white/50 px-4 py-3 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/50 sm:px-6 sm:py-4"
          >
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Editar evento</p>
              <h3 class="truncate font-headline text-lg font-black text-slate-900 dark:text-white sm:text-xl">{{ event.title }}</h3>
              <p class="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Paso {{ editStep }} de {{ EDIT_TOTAL_STEPS }}</p>

              <div class="absolute bottom-0 left-0 h-[2px] w-full bg-slate-200/50 dark:bg-slate-800/50">
                <div
                  v-if="isSaving || isDeleting"
                  class="h-full w-1/3 bg-tertiary-600 dark:bg-tertiary-400 animate-[progressbar_1.1s_ease-in-out_infinite]"
                ></div>
                <div
                  v-else
                  class="h-full origin-left bg-tertiary-600 transition-transform duration-300 ease-out dark:bg-tertiary-400"
                  :style="{ transform: `scaleX(${editProgressRatio})` }"
                ></div>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canManage"
                type="button"
                class="rounded-full border border-rose-200/70 bg-rose-50/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
                :disabled="isSaving || isDeleting"
                @click="onDelete"
              >
                Eliminar
              </button>

              <button
                type="button"
                class="rounded-full bg-slate-100/50 p-1.5 text-slate-500 transition-colors hover:bg-slate-200/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
                :disabled="isSaving || isDeleting"
                @click="closeModal"
              >
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-6">
            <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="onSave">
              <template v-if="editStep === 1">
                <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Titulo del evento
                  <input
                    v-model="form.title"
                    type="text"
                    name="event_title"
                    maxlength="150"
                    required
                    class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Taller de innovación 2026"
                  />
                  <FieldError :error="getFieldError('title')" />
                </label>

                <div class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <p>Descripcion</p>
                  <div class="mt-1">
                    <RichTextEditor
                      v-model="form.description"
                      placeholder="Comparte detalles del evento para ayudar a la comunidad a participar"
                      min-height="120px"
                      max-height="280px"
                    />
                  </div>
                  <FieldError :error="getFieldError('description')" />
                </div>
              </template>

              <template v-else-if="editStep === 2">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Categoria
                  <select
                    v-model="form.category_id"
                    name="event_category"
                    required
                    class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="" disabled>Selecciona una categoria</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                  </select>
                  <FieldError :error="getFieldError('category_id')" />
                </label>

                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ubicacion
                  <input
                    v-model="form.location"
                    type="text"
                    name="event_location"
                    maxlength="200"
                    required
                    class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Auditorio principal"
                  />
                  <FieldError :error="getFieldError('location')" />
                </label>
              </template>

              <template v-else-if="editStep === 3">
                <div class="md:col-span-2">
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
                </div>
              </template>

              <template v-else-if="editStep === 4">
                <div class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <label class="block">Fecha del evento</label>
                  <div class="relative mt-1">
                    <input
                      v-model="form.date"
                      type="date"
                      name="event_date"
                      required
                      class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <FieldError :error="getFieldError('start_datetime')" />
                </div>

                <div class="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span class="flex items-center gap-2 text-tertiary-600 dark:text-tertiary-400">Hora de inicio (opcional)</span>
                    <input
                      v-model="form.startTime"
                      type="time"
                      name="event_start_time"
                      class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>

                  <label class="text-sm font-semibold text-slate-700 dark:text-slate-300" :class="form.allDay ? 'opacity-60' : ''">
                    <span class="flex items-center gap-2 text-tertiary-600 dark:text-tertiary-400">Hora de fin (opcional)</span>
                    <input
                      v-model="form.endTime"
                      type="time"
                      name="event_end_time"
                      :disabled="form.allDay"
                      class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
                    />
                    <FieldError :error="getFieldError('end_datetime')" />
                  </label>

                  <label class="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      v-model="form.allDay"
                      type="checkbox"
                      name="event_all_day"
                      class="h-4 w-4 rounded border-slate-300 text-tertiary-500 focus:ring-tertiary-500"
                    />
                    <span class="text-tertiary-600 dark:text-tertiary-400">Todo el dia</span>
                  </label>

                  <label
                    v-if="!form.allDay"
                    class="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <input v-model="form.hasEndDate" type="checkbox" class="h-5 w-5 rounded border-slate-300 text-tertiary-500" />
                    <span class="flex items-center gap-2 text-tertiary-600 dark:text-tertiary-400">Añadir fecha de finalizacion</span>
                  </label>

                  <label v-if="!form.allDay && form.hasEndDate" class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Fecha de finalizacion
                    <input
                      v-model="form.endDate"
                      type="date"
                      class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>

                  <div class="md:col-span-2">
                    <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Imagen del evento</p>

                    <label
                      class="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600 transition hover:border-tertiary-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-tertiary-500 dark:hover:bg-slate-900"
                    >
                      <input type="file" class="sr-only" :accept="ACCEPTED_IMAGE_TYPES" @change="onFileChange" />

                      <span class="material-symbols-outlined text-3xl text-tertiary-600 dark:text-tertiary-400">upload</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-100">Sube una imagen para la portada</span>
                      <span class="text-xs text-slate-500 dark:text-slate-400">JPEG, PNG, WEBP, GIF o AVIF. Recomendado: 1200×630</span>
                      <span
                        v-if="form.imageFile"
                        class="mt-2 inline-flex items-center gap-2 rounded-full bg-tertiary-50 px-3 py-1 text-xs font-bold text-tertiary-700 dark:bg-slate-800 dark:text-tertiary-200"
                      >
                        <span class="material-symbols-outlined text-base">check_circle</span>
                        {{ form.imageFile.name }}
                      </span>
                    </label>

                    <div class="mt-2 flex items-center justify-between gap-2">
                      <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <input v-model="form.removeImage" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-tertiary-500" @change="onToggleRemoveImage" />
                        Quitar imagen actual
                      </label>
                      <FieldError :error="getFieldError('image_url')" />
                    </div>
                  </div>

                  <div v-if="imagePreview" class="md:col-span-2 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                    <img :src="imagePreview" alt="Preview de imagen" class="h-56 w-full object-cover" />
                  </div>
                </div>
              </template>

              <div class="md:col-span-2">
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
              </div>

              <div class="md:col-span-2 mt-1 flex justify-between gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  :disabled="isSaving || isDeleting"
                  @click="closeModal"
                >
                  Cancelar
                </button>

                <div class="flex gap-2">
                  <button
                    v-if="editStep > 1"
                    type="button"
                    class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    :disabled="isSaving || isDeleting"
                    @click="goEditPrev"
                  >
                    Atras
                  </button>

                  <button
                    v-if="editStep < EDIT_TOTAL_STEPS"
                    type="button"
                    class="rounded-full bg-tertiary-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSaving || isDeleting"
                    @click="goEditNext"
                  >
                    Siguiente
                  </button>

                  <button
                    v-else
                    type="submit"
                    class="rounded-full bg-tertiary-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSaving || isDeleting"
                  >
                    {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
                  </button>
                </div>
              </div>
            </form>
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

