<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useCommunityStore } from '@/stores/community'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SocialLinksStep from '@/components/util/SocialLinksStep.vue'
import RichTextEditor from '@/components/util/RichTextEditor.vue'
import { isAllowedEventImageType } from '@/utils/eventCreateFactory'
import { uiToDbStrict } from '@/utils/eventDateTimeAdapter'
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
  categories: {
    type: Array,
    default: () => [],
  },
  isSaving: {
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
  communities: {
    type: Array,
    default: () => [],
  },
  communityContextId: {
    type: String,
    default: '',
  },
  allowCommunitySelection: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const communityStore = useCommunityStore()
const { activeList: storeCommunities } = storeToRefs(communityStore)

const TOTAL_STEPS = 4
const step = ref(1)
const showSocialInput = ref({
  whatsapp: false,
  facebook: false,
  instagram: false,
})

const form = ref({
  title: '',
  description: '',
  location: '',
  category_id: '',
  date: '',
  allDay: true,
  startTime: '',
  endTime: '',
  hasEndDate: false,
  endDate: '',
  imageFile: null,
  community_id: '',
  social_links: {
    whatsapp: '',
    facebook: '',
    instagram: '',
  },
})

const imagePreview = ref('')
const validationError = ref('')
const closeConfirmOpen = ref(false)
const communitySelectorOpen = ref(false)
const communitySearch = ref('')
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const formErrorMessage = computed(() => {
  return (validationError.value || props.submitError || '').trim()
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


const normalizedCommunities = computed(() => {
  const source = props.communities.length ? props.communities : storeCommunities.value
  const unique = new Map()

  for (const community of source) {
    if (!community?.id) continue
    unique.set(community.id, community)
  }

  return [...unique.values()]
})

const selectedCommunity = computed(() => {
  if (!form.value.community_id) return null
  return normalizedCommunities.value.find((community) => community.id === form.value.community_id) || null
})

const toCompactCommunityLabel = (name) => {
  const safe = String(name || '').trim()
  if (!safe) return 'Seleccionar comunidad'

  // UX: por ahora, usar solo la primer palabra para no ocupar mucho espacio.
  // Ajustable a futuro: truncado por longitud o abreviaturas.
  const firstWord = safe.split(/\s+/).filter(Boolean)[0] || safe
  return firstWord.length > 18 ? `${firstWord.slice(0, 18)}…` : firstWord
}

const communityButtonLabel = computed(() => {
  return selectedCommunity.value?.name
    ? toCompactCommunityLabel(selectedCommunity.value.name)
    : 'Seleccionar comunidad'
})

const filteredCommunities = computed(() => {
  const query = communitySearch.value.trim().toLowerCase()
  if (!query) return normalizedCommunities.value

  return normalizedCommunities.value.filter((community) => {
    const name = String(community.name || '').toLowerCase()
    return name.includes(query)
  })
})

const isDirty = computed(() => {
  return Boolean(
    form.value.title.trim() ||
      form.value.description.trim() ||
      form.value.location.trim() ||
      form.value.category_id ||
      form.value.date ||
      form.value.startTime ||
      form.value.endTime ||
      form.value.endDate ||
      form.value.imageFile ||
      form.value.social_links.whatsapp.trim() ||
      form.value.social_links.facebook.trim() ||
      form.value.social_links.instagram.trim() ||
      form.value.community_id,
  )
})

const canSubmit = computed(() => {
  return !props.isSaving
})

const closeModal = () => {
  if (props.isSaving) return
  if (isDirty.value) {
    closeConfirmOpen.value = true
    return
  }

  emit('update:modelValue', false)
}

const closeWithoutSaving = () => {
  closeConfirmOpen.value = false
  emit('update:modelValue', false)
}

const openCommunitySelector = async () => {
  communitySearch.value = ''
  if (!normalizedCommunities.value.length) {
    await communityStore.fetchActiveCommunities({ limit: 100 })
  }
  communitySelectorOpen.value = true
}

const onPickCommunity = (communityId) => {
  form.value.community_id = communityId || ''
  communitySelectorOpen.value = false
}

const clearImagePreview = () => {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = ''
}

const resetForm = () => {
  step.value = 1
  form.value = {
    title: '',
    description: '',
    location: '',
    category_id: '',
    date: '',
    allDay: true,
    startTime: '',
    endTime: '',
    hasEndDate: false,
    endDate: '',
    imageFile: null,
    community_id: props.communityContextId || '',
    social_links: {
      whatsapp: '',
      facebook: '',
      instagram: '',
    },
  }
  clearImagePreview()
  validationError.value = ''
  closeConfirmOpen.value = false
  communitySelectorOpen.value = false
  communitySearch.value = ''
  showSocialInput.value = { whatsapp: false, facebook: false, instagram: false }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    isBodyScrollLocked.value = isOpen
    if (!isOpen) resetForm()
    if (isOpen) step.value = 1
  },
)

onBeforeUnmount(() => {
  isBodyScrollLocked.value = false
})

watch(
  () => props.communityContextId,
  (communityId) => {
    if (!communityId) return
    form.value.community_id = communityId
  },
)

const progressRatio = computed(() => {
  return Math.min(1, Math.max(0, step.value / TOTAL_STEPS))
})

const goPrev = () => {
  validationError.value = ''
  if (step.value > 1) step.value -= 1
}

const validateStep = (targetStep) => {
  validationError.value = ''

  if (targetStep === 1) {
    const titleError = validateEventTitle(form.value.title)
    if (titleError) {
      validationError.value = titleError
      return false
    }

    const descriptionError = validateEventDescription(form.value.description)
    if (descriptionError) {
      validationError.value = descriptionError
      return false
    }

    return true
  }

  if (targetStep === 2) {
    const categoryError = validateEventCategory(form.value.category_id, props.categories)
    if (categoryError) {
      validationError.value = categoryError
      return false
    }

    const locationError = validateEventLocation(form.value.location)
    if (locationError) {
      validationError.value = locationError
      return false
    }

    return true
  }

  if (targetStep === 3) {
    const socialLinksError = validateEventSocialLinks(form.value.social_links)
    if (socialLinksError) {
      validationError.value = socialLinksError
      return false
    }

    return true
  }

  if (targetStep === 4) {
    if (!form.value.date) {
      validationError.value = 'Selecciona la fecha del evento.'
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
      validationError.value = scheduleResult.error
      return false
    }

    return true
  }

  return true
}


const goNext = () => {
  if (props.isSaving) return
  const ok = validateStep(step.value)
  if (!ok) return
  if (step.value < TOTAL_STEPS) step.value += 1
}

const onFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!isAllowedEventImageType(file.type)) {
    form.value.imageFile = null
    clearImagePreview()
    validationError.value = 'Formato no permitido. Usa JPEG, PNG, WEBP, GIF o AVIF.'
    event.target.value = ''
    return
  }

  validationError.value = ''
  form.value.imageFile = file
  clearImagePreview()
  imagePreview.value = URL.createObjectURL(file)
}

const onSubmit = () => {
  validationError.value = ''

  // Asegura validacion completa antes del envio.
  for (let s = 1; s <= TOTAL_STEPS; s += 1) {
    if (!validateStep(s)) {
      step.value = s
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
    validationError.value = result.error
    return
  }

  emit('submit', {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    location: form.value.location.trim(),
    category_id: toEventCategoryId(form.value.category_id),
    start_datetime: result.value.start_datetime,
    end_datetime: result.value.end_datetime,
    imageFile: form.value.imageFile,
    community_id: form.value.community_id || undefined,
    social_links: normalizeSocialLinksPayload(form.value.social_links),
  })
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
    <div v-if="modelValue" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <ConfirmModal
        v-model="closeConfirmOpen"
        title-user="Descartar cambios"
        message="Tienes cambios sin guardar en la creacion del evento."
        description="Si cierras ahora, se perdera la informacion capturada en este formulario."
        confirm-text="Descartar"
        cancel-text="Seguir editando"
        :danger="false"
        @confirm="closeWithoutSaving"
      />

      <Transition
        appear
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-3 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
          <div
            v-if="modelValue"
            class="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/75 shadow-2xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/75"
          >
            <!-- Barra superior: progreso por pasos + indeterminado al guardar -->
            <div class="absolute left-0 top-0 z-10 h-2 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                v-if="isSaving"
                class="h-full w-full origin-left scale-x-1000 animate-spin bg-tertiary-600/90 transition-transform duration-300 ease-out dark:bg-tertiary-400/90"
              ></div>
              <div
                v-else
                class="h-full bg-tertiary-600 dark:bg-tertiary-400 origin-left transition-transform duration-300 ease-out"
                :style="{ transform: `scaleX(${progressRatio})` }"
              ></div>
            </div>

            <!-- Header fijo -->
            <div class="flex-shrink-0 p-6 pb-0 pt-8">
      <div class="mb-4 flex items-center justify-between">
        <div class="min-w-0">
          <h3 class="font-headline text-xl font-extrabold text-slate-900 dark:text-white">Crear evento</h3>
          <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Paso {{ step }} de {{ TOTAL_STEPS }}</p>
        </div>
        <button class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeModal">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
            </div>

            <!-- Contenido scrollable -->
            <div class="flex-1 overflow-y-auto px-6 pb-6">
      <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Paso 1: Basico -->
        <template v-if="step === 1">
          <div class="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100">Comunidad asociada</p>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Opcional. Selecciona una comunidad desde el modal.</p>
              </div>

              <button
                type="button"
                class="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                @click="openCommunitySelector"
                :title="selectedCommunity?.name || ''"
              >
                {{ communityButtonLabel }}
              </button>
            </div>

            <FieldError class="mt-2" :error="getFieldError('community_id')" />
          </div>

          <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Titulo del evento
            <input
              v-model="form.title"
              type="text"
              name="event_title"
              maxlength="150"
              required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Hackathon Ingenieria 2026"
            />
            <FieldError :error="getFieldError('title')" />
          </label>

          <div class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <p>Descripcion</p>
            <div class="mt-1">
              <RichTextEditor
                v-model="form.description"
                placeholder="Maraton de desarrollo colaborativo para estudiantes y egresados"
                min-height="100px"
                max-height="250px"
              />
            </div>
            <FieldError :error="getFieldError('description')" />
          </div>
        </template>

        <!-- Paso 2: Categoria + Ubicacion -->
        <template v-else-if="step === 2">
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
              placeholder="Auditorio Principal"
            />
            <FieldError :error="getFieldError('location')" />
          </label>

        </template>

        <template v-else-if="step === 3">
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

        <!-- Paso 4: Horario + Imagen -->
        <template v-else-if="step === 4">
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
                <span v-if="form.imageFile" class="mt-2 inline-flex items-center gap-2 rounded-full bg-tertiary-50 px-3 py-1 text-xs font-bold text-tertiary-700 dark:bg-slate-800 dark:text-tertiary-200">
                  <span class="material-symbols-outlined text-base">check_circle</span>
                  {{ form.imageFile.name }}
                </span>
              </label>
              <FieldError class="mt-2" :error="getFieldError('image_url')" />
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
            :disabled="isSaving"
            @click="closeModal"
          >
            Cancelar
          </button>

          <div class="flex gap-2">
            <button
              v-if="step > 1"
              type="button"
              class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              :disabled="isSaving"
              @click="goPrev"
            >
              Atras
            </button>

            <button
              v-if="step < TOTAL_STEPS"
              type="button"
              class="rounded-full bg-tertiary-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving"
              @click="goNext"
            >
              Siguiente
            </button>

            <button
              v-else
              type="submit"
              class="rounded-full bg-tertiary-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!canSubmit"
            >
              {{ isSaving ? 'Guardando...' : 'Guardar evento' }}
            </button>
          </div>
        </div>
      </form>
            </div>

      <Transition
        appear
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="communitySelectorOpen" class="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
          <div class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <p class="text-base font-extrabold text-slate-900 dark:text-slate-100">Seleccionar comunidad</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Busca por nombre y elige una card compacta.</p>
              </div>
              <button type="button" class="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="communitySelectorOpen = false">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <input
              v-model="communitySearch"
              type="text"
              placeholder="Buscar comunidad por nombre"
              class="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
            />

            <div class="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              <button
                type="button"
                class="w-full rounded-xl border border-dashed px-3 py-2 text-left text-xs font-semibold transition"
                :class="!form.community_id ? 'border-tertiary-400 bg-tertiary-50 text-tertiary-700 dark:border-tertiary-500/60 dark:bg-tertiary-900/20 dark:text-tertiary-300' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'"
                @click="onPickCommunity('')"
              >
                Sin comunidad
              </button>

              <button
                v-for="community in filteredCommunities"
                :key="community.id"
                type="button"
                class="w-full rounded-xl border px-3 py-2 text-left transition"
                :class="form.community_id === community.id ? 'border-tertiary-400 bg-tertiary-50 dark:border-tertiary-500/60 dark:bg-tertiary-900/20' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800'"
                @click="onPickCommunity(community.id)"
              >
                <span class="flex items-start justify-between gap-2">
                  <span class="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{{ community.name }}</span>
                  <span class="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {{ community.events_count ?? community.approved_events_count ?? 0 }}
                  </span>
                </span>
                <span class="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">{{ community.contact_email || 'Sin contacto publico' }}</span>
              </button>

              <p v-if="!filteredCommunities.length" class="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No hay resultados para "{{ communitySearch }}".
              </p>
            </div>

            <div class="mt-3 flex justify-end">
              <button
                type="button"
                class="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                @click="communitySelectorOpen = false"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Transition>
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

