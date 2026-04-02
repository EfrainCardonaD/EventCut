<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import FieldError from '@/components/util/FieldError.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SocialLinksStep from '@/components/util/SocialLinksStep.vue'
import RichTextEditor from '@/components/util/RichTextEditor.vue'
import { ALLOWED_COMMUNITY_IMAGE_TYPES, isAllowedCommunityImageType } from '@/utils/communityImageFactory'
import { normalizeSocialLinksPayload } from '@/utils/socialLinks'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  community: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
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
const TOTAL_STEPS = 2
const step = ref(1)

const form = ref({
  name: '',
  description: '',
  category_id: '',
  contact_email: '',
  social_links: {
    whatsapp: '',
    facebook: '',
    instagram: '',
  },
  imageFile: null,
  imageAction: 'keep',
})

const localError = ref('')
const deleteConfirmOpen = ref(false)
const localImagePreview = ref('')
const imageInputRef = ref(null)
const showSocialInput = ref({
  whatsapp: false,
  facebook: false,
  instagram: false,
})
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const toFieldErrorText = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'string') return value
  return ''
}

const getFieldError = (field) => {
  return toFieldErrorText(props.fieldErrors?.[field])
}

const syncFormFromCommunity = () => {
  form.value = {
    name: props.community?.name || '',
    description: props.community?.description || '',
    category_id: props.community?.category_id ? String(props.community.category_id) : '',
    contact_email: props.community?.contact_email || '',
    social_links: {
      whatsapp: props.community?.social_links?.whatsapp || '',
      facebook: props.community?.social_links?.facebook || '',
      instagram: props.community?.social_links?.instagram || '',
    },
    imageFile: null,
    imageAction: 'keep',
  }
  localError.value = ''
  deleteConfirmOpen.value = false
  step.value = 1
  showSocialInput.value = {
    whatsapp: Boolean(form.value.social_links.whatsapp),
    facebook: Boolean(form.value.social_links.facebook),
    instagram: Boolean(form.value.social_links.instagram),
  }
  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value)
    localImagePreview.value = ''
  }
}

watch(
  () => [props.modelValue, props.community?.id],
  ([isOpen]) => {
    isBodyScrollLocked.value = Boolean(isOpen)
    if (!isOpen) {
      deleteConfirmOpen.value = false
      localError.value = ''
      return
    }
    syncFormFromCommunity()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  isBodyScrollLocked.value = false
  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value)
    localImagePreview.value = ''
  }
})

const imagePreview = computed(() => {
  if (localImagePreview.value) return localImagePreview.value
  if (form.value.imageAction === 'remove') return ''
  return props.community?.image_url || ''
})

const onPickImage = () => {
  imageInputRef.value?.click?.()
}

const onSelectImage = (event) => {
  const file = event?.target?.files?.[0] || null
  if (!file) return

  if (!isAllowedCommunityImageType(file.type)) {
    localError.value = 'Formato de imagen no permitido. Usa JPEG, PNG, WEBP, GIF o AVIF.'
    return
  }

  localError.value = ''
  form.value.imageFile = file
  form.value.imageAction = 'replace'

  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value)
  }
  localImagePreview.value = URL.createObjectURL(file)
}

const onRemoveImage = () => {
  form.value.imageFile = null
  form.value.imageAction = 'remove'
  if (imageInputRef.value) imageInputRef.value.value = ''
  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value)
    localImagePreview.value = ''
  }
}

const onKeepCurrentImage = () => {
  form.value.imageFile = null
  form.value.imageAction = 'keep'
  if (imageInputRef.value) imageInputRef.value.value = ''
  if (localImagePreview.value) {
    URL.revokeObjectURL(localImagePreview.value)
    localImagePreview.value = ''
  }
}

const canSubmit = computed(() => !props.isSaving && !props.isDeleting)

const goPrev = () => {
  localError.value = ''
  if (step.value > 1) step.value -= 1
}

const goNext = () => {
  localError.value = ''

  const parsedCategoryId = Number(form.value.category_id)
  if (!form.value.name.trim()) {
    localError.value = 'El nombre es obligatorio.'
    return
  }
  if (!form.value.description.trim()) {
    localError.value = 'La descripcion es obligatoria.'
    return
  }
  if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
    localError.value = 'Selecciona una categoria valida.'
    return
  }

  step.value = 2
}

const onSubmit = () => {
  localError.value = ''
  if (step.value !== TOTAL_STEPS) {
    goNext()
    return
  }
  const parsedCategoryId = Number(form.value.category_id)

  if (!form.value.name.trim()) {
    localError.value = 'El nombre es obligatorio.'
    return
  }
  if (!form.value.description.trim()) {
    localError.value = 'La descripcion es obligatoria.'
    return
  }
  if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
    localError.value = 'Selecciona una categoria valida.'
    return
  }

  emit('save', {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    category_id: parsedCategoryId,
    imageFile: form.value.imageFile,
    imageAction: form.value.imageAction,
    previous_image_url: props.community?.image_url || null,
    contact_email: form.value.contact_email.trim() || null,
    social_links: normalizeSocialLinksPayload(form.value.social_links),
  })
}

const onRequestDelete = () => {
  if (props.isDeleting || props.isSaving) return
  deleteConfirmOpen.value = true
}

const onConfirmDelete = () => {
  emit('delete')
}

const onClose = () => {
  if (props.isSaving || props.isDeleting) return
  emit('update:modelValue', false)
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
    <div v-if="modelValue" class="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <ConfirmModal
        v-model="deleteConfirmOpen"
        title-user="Eliminar comunidad"
        message="Esta accion no se puede deshacer."
        description="Tambien se eliminara la relacion con eventos y suscriptores segun reglas del backend."
        confirm-text="Eliminar"
        cancel-text="Cancelar"
        :danger="true"
        @confirm="onConfirmDelete"
      />

      <div class="mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <!-- Header fijo -->
        <div class="flex-shrink-0 p-6 pb-0">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 class="font-headline text-xl font-extrabold text-slate-900 dark:text-white">Gestionar comunidad</h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Edita los datos principales o elimina la comunidad.</p>
          </div>
          <button class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="onClose">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="mb-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Paso {{ step }} de {{ TOTAL_STEPS }}</p>
        </div>
        </div>

        <!-- Contenido scrollable -->
        <div class="flex-1 overflow-y-auto px-6 pb-6">
        <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
          <template v-if="step === 1">
          <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre
            <input
              v-model="form.name"
              type="text"
              maxlength="100"
              required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Comunidad Backend"
            />
            <FieldError :error="getFieldError('name')" />
          </label>

          <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Descripcion
            <div class="mt-1">
              <RichTextEditor
                v-model="form.description"
                placeholder="Describe la comunidad"
                min-height="100px"
                max-height="250px"
              />
            </div>
            <FieldError :error="getFieldError('description')" />
          </label>

          <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Categoria
            <select
              v-model="form.category_id"
              required
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="" disabled>Selecciona una categoria</option>
              <option v-for="category in categories" :key="category.id" :value="String(category.id)">
                {{ category.name }}
              </option>
            </select>
            <FieldError :error="getFieldError('category_id')" />
          </label>

          <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Correo de contacto
            <input
              v-model="form.contact_email"
              type="email"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950"
              placeholder="contacto@comunidad.dev"
            />
            <FieldError :error="getFieldError('contact_email')" />
          </label>

          <div class="md:col-span-2">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Imagen de comunidad</p>

            <input
              ref="imageInputRef"
              type="file"
              class="hidden"
              :accept="ALLOWED_COMMUNITY_IMAGE_TYPES.join(',')"
              @change="onSelectImage"
            />

            <div
              role="button"
              tabindex="0"
              class="mt-2 w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-left transition hover:border-primary-400 hover:bg-primary-50/30 focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-primary-500/70"
              @click="onPickImage"
              @keydown.enter.prevent="onPickImage"
              @keydown.space.prevent="onPickImage"
            >
              <div v-if="imagePreview" class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                  <img :src="imagePreview" alt="Preview" class="h-full w-full object-cover" />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-black text-slate-800 dark:text-slate-100">
                    {{ form.imageAction === 'remove' ? 'Imagen eliminada al guardar' : (form.imageFile ? 'Nueva imagen seleccionada' : 'Imagen actual') }}
                  </p>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {{ form.imageFile?.name || 'Puedes seleccionar otra imagen para reemplazar.' }}
                  </p>
                </div>
              </div>

              <div v-else class="flex items-start gap-3">
                <div class="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  <span class="material-symbols-outlined">cloud_upload</span>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-black text-slate-800 dark:text-slate-100">Selecciona una imagen</p>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    El frontend sube la imagen al servicio firmado del backend y reemplaza la anterior.
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                @click="onPickImage"
              >
                Reemplazar imagen
              </button>
              <button
                type="button"
                class="rounded-full border border-error-300 bg-error-50 px-3 py-1.5 text-xs font-bold text-error-700 hover:bg-error-100 dark:border-error-900/40 dark:bg-error-900/20 dark:text-error-200"
                @click="onRemoveImage"
              >
                Quitar imagen
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                @click="onKeepCurrentImage"
              >
                Mantener actual
              </button>
            </div>
            <FieldError :error="getFieldError('image_url')" />
          </div>

          </template>

          <template v-else>
            <div class="md:col-span-2 grid grid-cols-1 gap-4">
              <SocialLinksStep
                v-model="form.social_links"
                v-model:visible-inputs="showSocialInput"
                :field-errors="fieldErrors"
              />
            </div>
          </template>

          <FieldError class="md:col-span-2" :error="localError || submitError" />

          <div class="md:col-span-2 mt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              class="rounded-full border border-error-300 bg-error-50 px-4 py-2 text-sm font-bold text-error-700 transition hover:bg-error-100 disabled:opacity-60 dark:border-error-900/40 dark:bg-error-900/20 dark:text-error-200"
              :disabled="isDeleting || isSaving"
              @click="onRequestDelete"
            >
              {{ isDeleting ? 'Eliminando...' : 'Eliminar comunidad' }}
            </button>

            <div class="flex items-center gap-2">
              <button
                v-if="step > 1"
                type="button"
                class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                :disabled="isDeleting || isSaving"
                @click="goPrev"
              >
                Atras
              </button>

              <button
                v-if="step < TOTAL_STEPS"
                type="button"
                class="rounded-full bg-primary-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canSubmit"
                @click="goNext"
              >
                Siguiente
              </button>

              <button
                v-if="step === TOTAL_STEPS"
                type="button"
                class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                :disabled="isDeleting || isSaving"
                @click="onClose"
              >
                Cancelar
              </button>
              <button
                v-if="step === TOTAL_STEPS"
                type="submit"
                class="rounded-full bg-primary-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canSubmit"
              >
                {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

