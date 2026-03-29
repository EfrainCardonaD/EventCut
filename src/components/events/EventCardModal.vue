<script setup>
import { computed, ref, watch } from 'vue'
import FieldError from '@/components/util/FieldError.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'

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
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const editMode = ref(false)
const deleteModalOpen = ref(false)
const localError = ref('')
const form = ref({
  title: '',
  description: '',
  location: '',
  category_id: '',
  startLocal: '',
  endLocal: '',
  imageFile: null,
})

const imagePreview = computed(() => {
  if (!props.event?.image_url) return ''
  return props.event.image_url
})

const toLocalInputDateTime = (isoDateTime) => {
  if (!isoDateTime) return ''
  const parsed = new Date(isoDateTime)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getDate()}`.padStart(2, '0')
  const hours = `${parsed.getHours()}`.padStart(2, '0')
  const minutes = `${parsed.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const syncFormFromEvent = () => {
  form.value = {
    title: props.event?.title || '',
    description: props.event?.description || '',
    location: props.event?.location || '',
    category_id: props.event?.category_id || '',
    startLocal: toLocalInputDateTime(props.event?.start_datetime),
    endLocal: toLocalInputDateTime(props.event?.end_datetime),
    imageFile: null,
  }
  deleteModalOpen.value = false
  localError.value = ''
}

watch(
  () => [props.modelValue, props.event?.id],
  ([isOpen]) => {
    if (!isOpen) {
      editMode.value = false
      deleteModalOpen.value = false
      return
    }
    syncFormFromEvent()
  },
  { immediate: true },
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const categoryName = computed(() => {
  const found = props.categories.find((category) => category.id === props.event?.category_id)
  return props.event?.category_name || found?.name || 'Evento'
})

const startLabel = computed(() => {
  const parsed = new Date(props.event?.start_datetime)
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
  const parsed = new Date(props.event?.end_datetime)
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

const normalizeLocalToIso = (localDateTime) => {
  const date = new Date(localDateTime)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const onFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  form.value.imageFile = file
}

const onSave = () => {
  localError.value = ''

  const startIso = normalizeLocalToIso(form.value.startLocal)
  const endIso = normalizeLocalToIso(form.value.endLocal)

  if (!startIso || !endIso) {
    localError.value = 'Debes seleccionar fecha y hora validas para inicio y fin.'
    return
  }

  if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
    localError.value = 'La fecha de finalizacion debe ser posterior al inicio.'
    return
  }

  emit('save', {
    eventId: props.event.id,
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    location: form.value.location.trim(),
    category_id: Number(form.value.category_id),
    start_datetime: startIso,
    end_datetime: endIso,
    imageFile: form.value.imageFile,
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
            <p class="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">{{ categoryName }}</p>
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
          <div class="grid grid-cols-1 gap-4 xl:gap-6" :class="editMode && canManage ? 'xl:grid-cols-[1.15fr,0.85fr]' : ''">
              <section class="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
          <img
            :src="imagePreview || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'"
            :alt="event.title"
            class="h-48 w-full rounded-2xl object-cover sm:h-64"
          />

          <div class="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300">
              <p class="flex items-start gap-2 rounded-xl bg-white p-2 dark:bg-slate-900">
              <span class="material-symbols-outlined mt-0.5 text-base">schedule</span>
              <span><span class="font-semibold">Inicio:</span> {{ startLabel }}</span>
            </p>
              <p class="flex items-start gap-2 rounded-xl bg-white p-2 dark:bg-slate-900">
              <span class="material-symbols-outlined mt-0.5 text-base">event</span>
              <span><span class="font-semibold">Fin:</span> {{ endLabel }}</span>
            </p>
              <p class="flex items-start gap-2 rounded-xl bg-white p-2 dark:bg-slate-900">
              <span class="material-symbols-outlined mt-0.5 text-base">location_on</span>
              <span>{{ event.location || 'Ubicacion por confirmar' }}</span>
            </p>
              <p class="flex items-start gap-2 rounded-xl bg-white p-2 dark:bg-slate-900">
              <span class="material-symbols-outlined mt-0.5 text-base">star</span>
              <span><span class="font-semibold">Score:</span> {{ event.score || 0 }}</span>
            </p>
          </div>

            <p class="mt-4 rounded-2xl bg-white p-3 text-sm leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:p-4">
            {{ event.description || 'Sin descripcion disponible para este evento.' }}
          </p>
            </section>

            <section v-if="editMode && canManage" class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">
              <h4 class="mb-4 font-headline text-lg font-extrabold">Editar evento</h4>

              <div class="grid grid-cols-1 gap-3">
            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Titulo
              <input
                v-model="form.title"
                type="text"
                maxlength="150"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Descripcion
              <textarea
                v-model="form.description"
                rows="3"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
              ></textarea>
            </label>

            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categoria
              <select
                v-model="form.category_id"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
              </select>
            </label>

            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ubicacion
              <input
                v-model="form.location"
                type="text"
                maxlength="200"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Inicio (local)
              <input
                v-model="form.startLocal"
                type="datetime-local"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fin (local)
              <input
                v-model="form.endLocal"
                type="datetime-local"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nueva imagen (opcional)
              <input
                type="file"
                accept="image/*"
                  class="mt-1 w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
                @change="onFileChange"
              />
            </label>

            <FieldError :error="localError" />

            <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                class="rounded-full border border-red-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                :disabled="isDeleting || isSaving"
                @click="onDelete"
              >
                {{ isDeleting ? 'Eliminando...' : 'Eliminar evento' }}
              </button>

              <button
                type="button"
                class="rounded-full bg-sky-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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

