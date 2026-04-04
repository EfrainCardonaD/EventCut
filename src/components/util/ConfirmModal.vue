<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  titleUser: { type: String, default: '' },
  message: { type: String, default: '' },
  description: { type: String, default: '' },
  confirmText: { type: String, default: 'Si, continuar' },
  cancelText: { type: String, default: 'Cancelar' },
  danger: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue','confirm','cancel'])
const cancelButtonRef = ref(null)
const titleId = 'confirm-modal-title'
const descriptionId = 'confirm-modal-description'

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}
function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function onKey(e) {
  if (!props.modelValue) return
  if (e.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    cancelButtonRef.value?.focus?.()
  }
)

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="close"></div>

    <div class="relative z-10 w-full max-w-md mx-4">
      <div
        class="relative p-4 text-center bg-white/75 backdrop-blur-sm rounded-lg shadow dark:bg-slate-900/75 sm:p-5"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
      >
        <button type="button" class="text-slate-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-slate-700 dark:hover:text-white" @click="close">
          <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          <span class="sr-only">Cerrar modal</span>
        </button>

        <div class="flex justify-center items-center p-2 mx-auto mb-4 w-12 h-12 bg-slate-100 rounded-lg dark:bg-slate-700">
          <svg class="w-8 h-8 text-slate-500 dark:text-slate-400" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
          <span class="sr-only">Icono de confirmacion</span>
        </div>

        <p :id="titleId" class="text-slate-900 dark:text-white mb-3.5"><span :class="danger ? 'text-tertiary-700 dark:text-tertiary-400' : 'text-tertiary-600 dark:text-tertiary-300'">{{ titleUser || '¿Estás seguro?' }}</span>, {{ message || '¿Deseas continuar con esta acción?' }}</p>
        <p :id="descriptionId" v-if="description" class="mb-4 font-light text-slate-500 dark:text-slate-300">{{ description }}</p>

        <div class="flex justify-center items-center space-x-4">
          <button ref="cancelButtonRef" type="button" @click="close" class="py-2 px-3 text-sm font-medium text-slate-500 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 focus:ring-4 focus:outline-none focus:ring-tertiary-200 hover:text-slate-900 focus:z-10 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:text-white dark:hover:bg-slate-600 dark:focus:ring-tertiary-500/40">
            {{ cancelText }}
          </button>
          <button type="button" @click="confirm" :class="['py-2 px-3 text-sm font-medium text-white rounded-lg focus:ring-4 focus:outline-none', danger ? 'bg-tertiary-600 hover:bg-tertiary-700 focus:ring-tertiary-300 dark:bg-tertiary-500 dark:hover:bg-tertiary-600 dark:focus:ring-tertiary-900' : 'bg-tertiary-500 hover:bg-tertiary-600 focus:ring-tertiary-300 dark:bg-tertiary-500 dark:hover:bg-tertiary-600 dark:focus:ring-tertiary-900']">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

