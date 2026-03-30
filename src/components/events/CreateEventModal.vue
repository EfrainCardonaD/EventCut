<script setup>
import { computed, ref, watch } from 'vue'
import FieldError from '@/components/util/FieldError.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import { isAllowedEventImageType } from '@/utils/eventCreateFactory'
import { uiToDbStrict } from '@/utils/eventDateTimeAdapter'

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
})

const emit = defineEmits(['update:modelValue', 'submit'])

const TOTAL_STEPS = 4
const step = ref(1)

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
})

const imagePreview = ref('')
const validationError = ref('')
const closeConfirmOpen = ref(false)

const toFieldErrorText = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'string') return value
  return ''
}

const getFieldError = (field) => {
  return toFieldErrorText(props.fieldErrors?.[field])
}

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
      form.value.imageFile,
  )
})

const canSubmit = computed(() => {
  return (
    form.value.title.trim() &&
    form.value.description.trim() &&
    form.value.location.trim() &&
    form.value.category_id &&
    form.value.date &&
    form.value.imageFile &&
    !props.isSaving
  )
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
  }
  clearImagePreview()
  validationError.value = ''
  closeConfirmOpen.value = false
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) resetForm()
    if (isOpen) step.value = 1
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
    if (!form.value.title.trim() || !form.value.description.trim()) {
      validationError.value = 'Completa el titulo y la descripcion para continuar.'
      return false
    }
    return true
  }

  if (targetStep === 2) {
    if (!form.value.category_id || !form.value.location.trim()) {
      validationError.value = 'Selecciona una categoria y captura la ubicacion.'
      return false
    }
    return true
  }

  if (targetStep === 3) {
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

  if (targetStep === 4) {
    if (!form.value.imageFile) {
      validationError.value = 'Selecciona una imagen para el evento.'
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
    category_id: form.value.category_id,
    start_datetime: result.value.start_datetime,
    end_datetime: result.value.end_datetime,
    imageFile: form.value.imageFile,
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
            class="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <!-- Barra superior: progreso por pasos + indeterminado al guardar -->
            <div class="absolute left-0 top-0 h-2 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                v-if="isSaving"
                class="h-full w-1/3 bg-tertiary-600/90 dark:bg-tertiary-400/90 animate-spin w-full origin-left scale-x-1000 transition-transform duration-300 ease-out"
              ></div>
              <div
                v-else
                class="h-full bg-tertiary-600 dark:bg-tertiary-400 origin-left transition-transform duration-300 ease-out"
                :style="{ transform: `scaleX(${progressRatio})` }"
              ></div>
            </div>
      <div class="mb-4 flex items-center justify-between">
        <div class="min-w-0">
          <h3 class="font-headline text-xl font-extrabold text-slate-900 dark:text-white">Crear evento</h3>
          <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Paso {{ step }} de {{ TOTAL_STEPS }}</p>
        </div>
        <button class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeModal">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Paso 1: Basico -->
        <template v-if="step === 1">
          <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Titulo del evento
            <input
              v-model="form.title"
              type="text"
              maxlength="150"
              required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Hackathon Ingenieria 2026"
            />
            <FieldError :error="getFieldError('title')" />
          </label>

          <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Descripcion
            <textarea
              v-model="form.description"
              rows="4"
              required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Maraton de desarrollo colaborativo para estudiantes y egresados"
            ></textarea>
            <FieldError :error="getFieldError('description')" />
          </label>
        </template>

        <!-- Paso 2: Categoria + Ubicacion -->
        <template v-else-if="step === 2">
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Categoria
            <select
              v-model="form.category_id"
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
              maxlength="200"
              required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Auditorio Principal"
            />
            <FieldError :error="getFieldError('location')" />
          </label>
        </template>

        <!-- Paso 3: Horario -->
        <template v-else-if="step === 3">
          <div class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <label class="block">Fecha del evento</label>
            <div class="relative mt-1">
              <input
                v-model="form.date"
                type="date"
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
                class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300" :class="form.allDay ? 'opacity-60' : ''">
              <span class="flex items-center gap-2 text-tertiary-600 dark:text-tertiary-400">Hora de fin (opcional)</span>
              <input
                v-model="form.endTime"
                type="time"
                :disabled="form.allDay"
                class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
              />
              <FieldError :error="getFieldError('end_datetime')" />
            </label>

            <label class="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <input
                v-model="form.allDay"
                type="checkbox"
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
          </div>
        </template>

        <!-- Paso 4: Imagen + Confirmacion -->
        <template v-else>
          <div class="md:col-span-2">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Imagen del evento</p>
            <label
              class="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600 transition hover:border-tertiary-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-tertiary-500 dark:hover:bg-slate-900"
            >
              <input type="file" class="sr-only" :accept="ACCEPTED_IMAGE_TYPES" required @change="onFileChange" />

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
        </template>

        <FieldError class="md:col-span-2" :error="validationError || submitError" />

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

