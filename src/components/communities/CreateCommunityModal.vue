<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import FieldError from '@/components/util/FieldError.vue'
import ConfirmModal from '@/components/util/ConfirmModal.vue'
import SocialLinksStep from '@/components/util/SocialLinksStep.vue'
import RichTextEditor from '@/components/util/RichTextEditor.vue'
import { ALLOWED_COMMUNITY_IMAGE_TYPES, uploadCommunityImageAndGetPublicUrl } from '@/utils/communityImageFactory'
import { normalizeSocialLinksPayload } from '@/utils/socialLinks'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
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
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const authStore = useAuthStore()

const STEP_DETAILS = 1
const STEP_SOCIAL = 2

const form = ref({
  name: '',
  description: '',
  category_id: '',
  image_url: '',
  contact_email: '',
  is_accepted_terms: false,
  social_links: {
    whatsapp: '',
    facebook: '',
    instagram: '',
  },
  imageFile: null,
})

const closeConfirmOpen = ref(false)
const localError = ref('')
const isUploadingImage = ref(false)

const currentStep = ref(STEP_DETAILS)

const showSocialInput = ref({
  whatsapp: false,
  facebook: false,
  instagram: false,
})

const imageInputRef = ref(null)
const imagePreviewUrl = ref('')
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const CONTACT_EMAIL_HELP = 'Usaremos el correo de tu cuenta para que el equipo de EventCut pueda contactarte.'

const ensureContactEmail = () => {
  // Por contrato el API requiere contact_email.
  const email = authStore.email || authStore.user?.email || ''
  form.value.contact_email = String(email || '').trim()
}

const revokeImagePreviewUrl = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }
}

const setImageFile = (file) => {
  form.value.imageFile = file || null
  revokeImagePreviewUrl()

  if (form.value.imageFile) {
    imagePreviewUrl.value = URL.createObjectURL(form.value.imageFile)
    // Evita inconsistencias: si subimos archivo, no usamos URL manual.
    form.value.image_url = ''
  }
}

const toFieldErrorText = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'string') return value
  return ''
}

const getFieldError = (field) => toFieldErrorText(props.fieldErrors?.[field])

const isDirty = computed(() => {
  return Boolean(
    form.value.name.trim() ||
      form.value.description.trim() ||
      Boolean(form.value.category_id) ||
      form.value.image_url.trim() ||
      // contact_email viene de sesion, no lo contamos como “dirty” por defecto.
      form.value.social_links.whatsapp.trim() ||
      form.value.social_links.facebook.trim() ||
      form.value.social_links.instagram.trim() ||
      form.value.is_accepted_terms ||
      Boolean(form.value.imageFile) ||
      Object.values(showSocialInput.value).some(Boolean),
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

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    category_id: '',
    image_url: '',
    contact_email: '',
    is_accepted_terms: false,
    social_links: {
      whatsapp: '',
      facebook: '',
      instagram: '',
    },
    imageFile: null,
  }
  localError.value = ''
  closeConfirmOpen.value = false
  isUploadingImage.value = false
  currentStep.value = STEP_DETAILS
  showSocialInput.value = { whatsapp: false, facebook: false, instagram: false }
  revokeImagePreviewUrl()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    isBodyScrollLocked.value = isOpen

    if (!isOpen) {
      resetForm()
      return
    }

    // Al abrir: siempre tomar email de sesion.
    ensureContactEmail()
  },
)

onBeforeUnmount(() => {
  isBodyScrollLocked.value = false
})

watch(
  () => authStore.email,
  () => {
    if (!props.modelValue) return
    ensureContactEmail()
  },
)

const validatePrefix = (value, prefixes) => {
  if (!value) return true
  return prefixes.some((prefix) => value.startsWith(prefix))
}

const onSelectImage = (event) => {
  const file = event?.target?.files?.[0] || null
  setImageFile(file)
}

const onPickImage = () => {
  imageInputRef.value?.click?.()
}

const removeImage = () => {
  setImageFile(null)
  if (imageInputRef.value) imageInputRef.value.value = ''
}

const allowedImageFormatsText = computed(() => {
  // Ej: image/jpeg -> JPEG
  const labels = (ALLOWED_COMMUNITY_IMAGE_TYPES || [])
    .map((type) => String(type).split('/')[1] || String(type))
    .map((ext) => ext.toUpperCase())
  return labels.length ? labels.join(', ') : 'JPEG, PNG, WEBP'
})

const canGoNext = computed(() => {
  if (props.isSaving || isUploadingImage.value) return false
  if (currentStep.value !== STEP_DETAILS) return false
  const parsedCategoryId = Number(form.value.category_id)

  return Boolean(form.value.name.trim() && form.value.description.trim() && form.value.contact_email.trim() && Number.isFinite(parsedCategoryId) && parsedCategoryId > 0)
})

const goNext = () => {
  localError.value = ''
  const parsedCategoryId = Number(form.value.category_id)

  ensureContactEmail()
  if (!form.value.name.trim()) {
    localError.value = 'Escribe el nombre de la comunidad para continuar.'
    return
  }
  if (!form.value.description.trim()) {
    localError.value = 'Agrega una descripcion breve para continuar.'
    return
  }
  if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
    localError.value = 'Selecciona una categoria para continuar.'
    return
  }
  if (!form.value.contact_email.trim()) {
    localError.value = 'No se pudo obtener tu correo de sesion. Cierra sesion e inicia nuevamente.'
    return
  }

  currentStep.value = STEP_SOCIAL
}

const goBack = () => {
  localError.value = ''
  currentStep.value = STEP_DETAILS
}

const canSubmit = computed(() => !props.isSaving && !isUploadingImage.value)

const onSubmit = async () => {
  localError.value = ''
  const parsedCategoryId = Number(form.value.category_id)

  if (currentStep.value !== STEP_SOCIAL) {
    goNext()
    return
  }

  ensureContactEmail()
  if (!form.value.contact_email.trim()) {
    localError.value = 'No se pudo obtener tu correo de sesion. Cierra sesion e inicia nuevamente.'
    return
  }

  if (!form.value.is_accepted_terms) {
    localError.value = 'Debes aceptar terminos y condiciones para enviar la comunidad.'
    return
  }

  if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) {
    localError.value = 'Selecciona una categoria valida para enviar la comunidad.'
    return
  }

  const socialLinks = {
    whatsapp: form.value.social_links.whatsapp.trim(),
    facebook: form.value.social_links.facebook.trim(),
    instagram: form.value.social_links.instagram.trim(),
  }
  const compactSocialLinks = normalizeSocialLinksPayload(socialLinks)

  if (!validatePrefix(socialLinks.whatsapp, ['https://wa.me/', 'https://chat.whatsapp.com/'])) {
    localError.value = 'El link de WhatsApp debe iniciar con https://wa.me/ o https://chat.whatsapp.com/'
    return
  }

  if (!validatePrefix(socialLinks.facebook, ['https://facebook.com/', 'https://www.facebook.com/'])) {
    localError.value = 'El link de Facebook debe iniciar con https://facebook.com/ o https://www.facebook.com/'
    return
  }

  if (!validatePrefix(socialLinks.instagram, ['https://instagram.com/', 'https://www.instagram.com/'])) {
    localError.value = 'El link de Instagram debe iniciar con https://instagram.com/ o https://www.instagram.com/'
    return
  }

  let imageUrl = form.value.image_url.trim() || null

  if (form.value.imageFile) {
    isUploadingImage.value = true
    try {
      // Flujo recomendado (docs):
      // 1) POST /v1/communities/image-upload-url
      // 2) PUT binario a upload_url
      // 3) Usar public_url como image_url
      imageUrl = await uploadCommunityImageAndGetPublicUrl({ file: form.value.imageFile })
    } catch (error) {
      localError.value = error?.message || 'No se pudo subir la imagen de la comunidad.'
      return
    } finally {
      isUploadingImage.value = false
    }
  }

  const payload = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    category_id: parsedCategoryId,
    image_url: imageUrl,
    contact_email: form.value.contact_email.trim(),
    is_accepted_terms: form.value.is_accepted_terms,
    social_links: compactSocialLinks || undefined,
  }

  emit('submit', payload)
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
    <div v-if="modelValue" class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <ConfirmModal
        v-model="closeConfirmOpen"
        title-user="Descartar cambios"
        message="Se perdera la informacion de la nueva comunidad."
        description="Si cierras ahora, tendras que volver a completar el formulario."
        confirm-text="Descartar"
        cancel-text="Seguir editando"
        :danger="false"
        @confirm="closeWithoutSaving"
      />

      <div class="mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <!-- Header fijo -->
        <div class="flex-shrink-0 p-6 pb-0">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 class="font-headline text-xl font-extrabold text-slate-900 dark:text-white">Crear comunidad</h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">La comunidad se registrara en estado PENDING y un admin la revisara.</p>
          </div>
          <button class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="mb-5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                :class="currentStep === 1 ? 'bg-tertiary-500 text-white' : 'bg-tertiary-100 text-tertiary-700 dark:bg-tertiary-900/30 dark:text-tertiary-300'"
              >
                1
              </span>
              <span class="text-sm font-bold text-slate-700 dark:text-slate-200">Datos</span>
            </div>
            <div class="mx-2 h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                :class="currentStep === 2 ? 'bg-tertiary-500 text-white' : 'bg-tertiary-100 text-tertiary-700 dark:bg-tertiary-900/30 dark:text-tertiary-300'"
              >
                2
              </span>
              <span class="text-sm font-bold text-slate-700 dark:text-slate-200">Redes</span>
            </div>
          </div>
          <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Paso {{ currentStep }} de 2 · Completa la informacion y envia tu comunidad a revision.
          </p>
        </div>
        </div>

        <!-- Contenido scrollable -->
        <div class="flex-1 overflow-y-auto px-6 pb-6">
        <form class="grid grid-cols-1 gap-4" @submit.prevent="onSubmit">
          <div v-if="currentStep === 1" class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nombre de la comunidad
              <input
                v-model="form.name"
                type="text"
                name="community_name"
                maxlength="100"
                required
                class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 focus:ring-4 focus:ring-tertiary-500/10 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Runners Monterrey"
              />
              <FieldError :error="getFieldError('name')" />
            </label>

            <div class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <p>Descripcion</p>
               <div class="mt-1">
                 <RichTextEditor
                   v-model="form.description"
                   placeholder="Comunidad para corredores y organizadores de carreras urbanas"
                   min-height="100px"
                   max-height="250px"
                 />
               </div>
               <FieldError :error="getFieldError('description')" />
            </div>

            <label class="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Categoria
              <select
                v-model="form.category_id"
                name="community_category"
                required
                class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 focus:ring-4 focus:ring-tertiary-500/10 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="" disabled>Selecciona una categoria</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
              <FieldError :error="getFieldError('category_id')" />
            </label>

            <div class="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p class="text-sm font-bold text-slate-700 dark:text-slate-200">Correo de contacto</p>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ CONTACT_EMAIL_HELP }}</p>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-2 rounded-full bg-terciary-100 px-3 py-1 text-xs font-bold text-terciary-700 dark:bg-terciary-900/30 dark:text-terciary-300">
                  <span class="material-symbols-outlined" style="font-size: 16px">mail</span>
                  {{ form.contact_email || '...' }}
                </span>
                <span v-if="!form.contact_email" class="text-xs font-semibold text-error-600">Sin correo en sesion</span>
              </div>

              <FieldError class="mt-2" :error="getFieldError('contact_email')" />
            </div>

            <div class="md:col-span-2">
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Imagen de comunidad (recomendado)</p>

              <input
                ref="imageInputRef"
                type="file"
                name="community_image"
                class="hidden"
                :accept="ALLOWED_COMMUNITY_IMAGE_TYPES.join(',')"
                @change="onSelectImage"
              />

              <div
                role="button"
                tabindex="0"
                class="mt-2 w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-left transition hover:border-tertiary-400 hover:bg-tertiary-50/40 focus:outline-none focus:ring-4 focus:ring-tertiary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-tertiary-500/70"
                @click="onPickImage"
                @keydown.enter.prevent="onPickImage"
                @keydown.space.prevent="onPickImage"
              >
                <div v-if="imagePreviewUrl" class="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div class="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                    <img :src="imagePreviewUrl" alt="Preview" class="h-full w-full object-cover" />
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-black text-slate-800 dark:text-slate-100">Imagen seleccionada</p>
                    <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {{ form.imageFile?.name }} · se subira automaticamente al enviar.
                    </p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span class="inline-flex items-center rounded-full bg-tertiary-100 px-3 py-1 text-[11px] font-bold text-tertiary-700 dark:bg-tertiary-900/30 dark:text-tertiary-300">CDN automatico</span>
                      <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{{ allowedImageFormatsText }}</span>
                    </div>
                  </div>
                </div>

                <div v-else class="flex items-start gap-3">
                  <div class="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-terciary-100 text-terciary-700 dark:bg-terciary-900/30 dark:text-terciary-300">
                    <span class="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-black text-slate-800 dark:text-slate-100">Sube el logo de tu comunidad</p>
                    <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Click para seleccionar una imagen. Formatos: {{ allowedImageFormatsText }}.
                    </p>
                    <p class="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      EventCut asignara automaticamente el <code>image_url</code> usando el CDN.
                    </p>
                  </div>
                  <span class="inline-flex items-center rounded-full bg-tertiary-500 px-3 py-1 text-[11px] font-black text-white">Seleccionar</span>
                </div>
              </div>

              <div v-if="imagePreviewUrl" class="mt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  @click="onPickImage"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  class="rounded-full border border-tertiary-200 bg-tertiary-50 px-4 py-2 text-xs font-black text-tertiary-700 hover:bg-tertiary-100 dark:border-tertiary-900/40 dark:bg-tertiary-900/20 dark:text-tertiary-300"
                  @click="removeImage"
                >
                  Quitar
                </button>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                URL de logo/imagen (alternativa)
                <input
                  v-model="form.image_url"
                  type="url"
                  :disabled="Boolean(form.imageFile)"
                  class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 focus:ring-4 focus:ring-tertiary-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="https://cdn.tu-comunidad.com/logo.png"
                />
              </label>
              <p class="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                Si subes un archivo, se desactiva esta opcion.
              </p>
              <FieldError :error="getFieldError('image_url')" />
            </div>
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <SocialLinksStep
              v-model="form.social_links"
              v-model:visible-inputs="showSocialInput"
              :field-errors="fieldErrors"
            />

            <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <input
                v-model="form.is_accepted_terms"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-tertiary-500 focus:ring-tertiary-500"
              />
              Acepto terminos y condiciones para crear la comunidad
            </label>
          </div>

          <FieldError :error="localError || submitError" />

          <div class="mt-1 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              :disabled="isSaving"
              @click="closeModal"
            >
              Cancelar
            </button>

            <div class="flex items-center gap-2">
              <button
                v-if="currentStep === 2"
                type="button"
                class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                :disabled="isSaving || isUploadingImage"
                @click="goBack"
              >
                Atras
              </button>

              <button
                v-if="currentStep === 1"
                type="button"
                class="rounded-full bg-tertiary-500 px-5 py-2 text-sm font-black text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canGoNext"
                @click="goNext"
              >
                Siguiente
              </button>

              <button
                v-else
                type="submit"
                class="rounded-full bg-tertiary-500 px-5 py-2 text-sm font-black text-white transition hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canSubmit"
              >
                {{ isUploadingImage ? 'Subiendo imagen...' : (isSaving ? 'Guardando...' : 'Enviar comunidad') }}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

