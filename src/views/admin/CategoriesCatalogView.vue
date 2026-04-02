<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminEventsStore } from '@/stores/adminEvents'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionModal from '@/components/admin/AdminActionModal.vue'
import AdminFormModal from '@/components/admin/AdminFormModal.vue'

const eventsStore = useAdminEventsStore()
const { categories, isLoadingCategories, isSavingCategory, isDeletingCategory } = storeToRefs(eventsStore)

const toast = ref({ show: false, type: 'info', title: '', message: '' })
const createModalOpen = ref(false)
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)
const targetCategory = ref(null)

const form = ref({
  name: '',
  slug: '',
})

const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
})

const isCreateDisabled = computed(() => !form.value.name.trim() || !form.value.slug.trim())
const isEditDisabled = computed(() => !form.value.name.trim())

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const loadCategories = async () => {
  const result = await eventsStore.fetchCategories({ force: true })
  if (!result.success) {
    showToast('error', 'Error', result.error)
  }
}

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const onNameInput = () => {
  if (!editModalOpen.value) {
    form.value.slug = generateSlug(form.value.name)
  }
}

const resetForm = () => {
  form.value = { name: '', slug: '' }
}

const onOpenCreateModal = () => {
  resetForm()
  createModalOpen.value = true
}

const onConfirmCreate = async () => {
  const result = await eventsStore.createCategory(form.value)
  if (!result.success) {
    showToast('error', 'Error', result.error)
    return
  }

  createModalOpen.value = false
  resetForm()
  showToast('success', 'Categoria creada', result.message)
}

const onOpenEditModal = (category) => {
  targetCategory.value = category
  form.value = {
    name: category.name,
    slug: category.slug,
  }
  editModalOpen.value = true
}

const onConfirmEdit = async () => {
  if (!targetCategory.value) return

  const result = await eventsStore.updateCategory(targetCategory.value.id, form.value)
  if (!result.success) {
    showToast('error', 'Error', result.error)
    return
  }

  editModalOpen.value = false
  targetCategory.value = null
  resetForm()
  showToast('success', 'Categoria actualizada', result.message)
}

const onOpenDeleteModal = (category) => {
  targetCategory.value = category
  deleteModalOpen.value = true
}

const onConfirmDelete = async () => {
  if (!targetCategory.value) return

  const result = await eventsStore.deleteCategory(targetCategory.value.id)
  if (!result.success) {
    if (result.status === 409) {
      showToast('error', 'Categoria en uso', 'Esta categoria tiene eventos asociados y no puede eliminarse.')
      return
    }
    showToast('error', 'Error', result.error)
    return
  }

  deleteModalOpen.value = false
  targetCategory.value = null
  showToast('success', 'Categoria eliminada', result.message)
}

onMounted(async () => {
  await loadCategories()
})
</script>

<template>
  <div class="space-y-6">
    <SpinnerOverlay :show="isLoadingCategories || isSavingCategory || isDeletingCategory" :text="isLoadingCategories ? 'Cargando categorias...' : 'Procesando cambios...'" />

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="4500"
    />

    <AdminFormModal
      v-model="createModalOpen"
      title="Nueva categoria"
      description="Crea una nueva categoria para clasificar eventos."
      confirm-text="Crear categoria"
      :loading="isSavingCategory"
      :confirm-disabled="isCreateDisabled"
      @confirm="onConfirmCreate"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre *</label>
          <input
            v-model="form.name"
            type="text"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Ej: Deportes"
            @input="onNameInput"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Slug *</label>
          <input
            v-model="form.slug"
            type="text"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950"
            placeholder="Ej: deportes"
          />
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Identificador unico sin espacios ni caracteres especiales.
          </p>
        </div>
      </div>
    </AdminFormModal>

    <AdminFormModal
      v-model="editModalOpen"
      title="Editar categoria"
      description="Modifica los datos de la categoria."
      confirm-text="Guardar cambios"
      :loading="isSavingCategory"
      :confirm-disabled="isEditDisabled"
      @confirm="onConfirmEdit"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre *</label>
          <input
            v-model="form.name"
            type="text"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Slug</label>
          <input
            v-model="form.slug"
            type="text"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>
    </AdminFormModal>

    <AdminActionModal
      v-model="deleteModalOpen"
      title="Eliminar categoria"
      :description="`¿Estas seguro de eliminar la categoria '${targetCategory?.name}'? Solo puede eliminarse si no tiene eventos asociados.`"
      confirm-text="Eliminar"
      :loading="isDeletingCategory"
      @confirm="onConfirmDelete"
    />

    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
          Contenido y Moderacion
        </p>
        <h1 class="mt-1 font-headline text-2xl font-black">Catalogo de Categorias</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gestiona las categorias disponibles para clasificar eventos.
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        @click="onOpenCreateModal"
      >
        + Nueva categoria
      </button>
    </header>

    <div
      v-if="sortedCategories.length === 0 && !isLoadingCategories"
      class="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700"
    >
      <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <h3 class="mt-4 font-semibold text-slate-900 dark:text-slate-100">Sin categorias</h3>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Crea la primera categoria para comenzar a clasificar eventos.
      </p>
      <button
        type="button"
        class="mt-4 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        @click="onOpenCreateModal"
      >
        Crear categoria
      </button>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="category in sortedCategories"
        :key="category.id"
        class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-bold text-slate-900 dark:text-slate-100">{{ category.name }}</h3>
            <p class="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{{ category.slug }}</p>
          </div>
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>

        <div class="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            class="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            @click="onOpenEditModal(category)"
          >
            Editar
          </button>
          <button
            type="button"
            class="rounded-xl border border-error-300 px-3 py-2 text-sm font-semibold text-error-600 hover:bg-error-50 dark:border-error-700 dark:text-error-400 dark:hover:bg-error-900/20"
            @click="onOpenDeleteModal(category)"
          >
            Eliminar
          </button>
        </div>
      </article>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Total: <span class="font-semibold text-slate-900 dark:text-slate-100">{{ sortedCategories.length }}</span> categorias
      </p>
    </div>
  </div>
</template>
