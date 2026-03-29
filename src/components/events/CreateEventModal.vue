<script setup>
import { computed, ref, watch } from 'vue'
import FieldError from '@/components/util/FieldError.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'

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
})

const emit = defineEmits(['update:modelValue', 'submit'])

const form = ref({
  title: '',
  description: '',
  location: '',
  category_id: '',
  startLocal: '',
  endLocal: '',
  imageFile: null,
})

const imagePreview = ref('')
const validationError = ref('')
const closeConfirmOpen = ref(false)

const isDirty = computed(() => {
  return Boolean(
    form.value.title.trim() ||
      form.value.description.trim() ||
      form.value.location.trim() ||
      form.value.category_id ||
      form.value.startLocal ||
      form.value.endLocal ||
      form.value.imageFile,
  )
})

const canSubmit = computed(() => {
  return (
    form.value.title.trim() &&
    form.value.description.trim() &&
    form.value.location.trim() &&
    form.value.category_id &&
    form.value.startLocal &&
    form.value.endLocal &&
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
  form.value = {
    title: '',
    description: '',
    location: '',
    category_id: '',
    startLocal: '',
    endLocal: '',
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
  },
)

const onFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  form.value.imageFile = file
  clearImagePreview()
  imagePreview.value = URL.createObjectURL(file)
}

const normalizeLocalToIso = (localDateTime) => {
  const date = new Date(localDateTime)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const onSubmit = () => {
  validationError.value = ''

  const startIso = normalizeLocalToIso(form.value.startLocal)
  const endIso = normalizeLocalToIso(form.value.endLocal)

  if (!startIso || !endIso) {
    validationError.value = 'Selecciona una fecha y hora valida para el inicio y fin del evento.'
    return
  }

  if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
    validationError.value = 'La fecha de finalizacion debe ser posterior a la fecha de inicio.'
    return
  }

  emit('submit', {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    location: form.value.location.trim(),
    category_id: form.value.category_id,
    start_datetime: startIso,
    end_datetime: endIso,
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
      <SpinnerOverlay :show="isSaving" text="Guardando evento..." />

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
          <div v-if="modelValue" class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-headline text-xl font-extrabold text-slate-900 dark:text-white">Crear evento</h3>
        <button class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeModal">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
        <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Titulo del evento
          <input
            v-model="form.title"
            type="text"
            maxlength="150"
            required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Hackathon Ingenieria 2026"
          />
        </label>

        <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Descripcion
          <textarea
            v-model="form.description"
            rows="4"
            required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Maraton de desarrollo colaborativo para estudiantes y egresados"
          ></textarea>
        </label>

        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Categoria
          <select
            v-model="form.category_id"
            required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="" disabled>Selecciona una categoria</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
        </label>

        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Ubicacion
          <input
            v-model="form.location"
            type="text"
            maxlength="200"
            required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Auditorio Principal"
          />
        </label>

        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Inicio (local)
          <input
            v-model="form.startLocal"
            type="datetime-local"
            required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Fin (local)
          <input
            v-model="form.endLocal"
            type="datetime-local"
            required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Imagen del evento
          <input
            type="file"
            accept="image/*"
            required
              class="mt-1 w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
            @change="onFileChange"
          />
        </label>

        <div v-if="imagePreview" class="md:col-span-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <img :src="imagePreview" alt="Preview de imagen" class="h-48 w-full object-cover" />
        </div>

        <FieldError class="md:col-span-2" :error="validationError" />

        <div class="md:col-span-2 mt-1 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            :disabled="isSaving"
            @click="closeModal"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="rounded-full bg-sky-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canSubmit"
          >
            {{ isSaving ? 'Guardando...' : 'Guardar evento' }}
          </button>
        </div>
      </form>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

