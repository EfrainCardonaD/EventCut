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
  <Transition
    appear
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="close"></div>

    <Transition
      appear
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
    <div class="relative z-10 w-full max-w-md mx-4">
      <div
        class="relative p-5 text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl dark:bg-slate-900/80 sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
      >
        <button type="button" class="absolute top-3 right-3 flex items-center justify-center size-9 rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" @click="close">
          <span class="material-symbols-outlined text-xl">close</span>
          <span class="sr-only">Cerrar modal</span>
        </button>

        <div class="flex justify-center items-center p-3 mx-auto mb-4 w-14 h-14 rounded-2xl" :class="danger ? 'bg-tertiary-100 dark:bg-tertiary-900/30' : 'bg-slate-100 dark:bg-slate-800'">
          <span class="material-symbols-outlined text-3xl" :class="danger ? 'text-tertiary-600 dark:text-tertiary-400' : 'text-slate-500 dark:text-slate-400'">warning</span>
        </div>

        <p :id="titleId" class="text-slate-900 dark:text-white mb-3.5 text-sm sm:text-base"><span :class="danger ? 'text-tertiary-700 dark:text-tertiary-400 font-bold' : 'text-tertiary-600 dark:text-tertiary-300 font-bold'">{{ titleUser || '¿Estás seguro?' }}</span>, {{ message || '¿Deseas continuar con esta acción?' }}</p>
        <p :id="descriptionId" v-if="description" class="mb-5 text-sm text-slate-500 dark:text-slate-400">{{ description }}</p>

        <div class="flex justify-center items-center gap-3">
          <button ref="cancelButtonRef" type="button" @click="close" class="h-11 px-5 text-sm font-semibold text-slate-700 bg-white rounded-full border border-slate-200 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-tertiary-300/40 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700">
            {{ cancelText }}
          </button>
          <button type="button" @click="confirm" :class="['h-11 px-5 text-sm font-bold text-white rounded-full transition-colors focus:outline-none focus:ring-2', danger ? 'bg-tertiary-600 hover:bg-tertiary-700 focus:ring-tertiary-300 dark:bg-tertiary-500 dark:hover:bg-tertiary-600 dark:focus:ring-tertiary-900' : 'bg-tertiary-500 hover:bg-tertiary-600 focus:ring-tertiary-300 dark:bg-tertiary-500 dark:hover:bg-tertiary-600 dark:focus:ring-tertiary-900']">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
    </Transition>
  </div>
  </Transition>
</template>

