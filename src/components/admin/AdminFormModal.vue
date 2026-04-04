<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: 'Guardar',
  },
  cancelText: {
    type: String,
    default: 'Cancelar',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  confirmDisabled: {
    type: Boolean,
    default: false,
  },
  widthClass: {
    type: String,
    default: 'max-w-md',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const cancelButtonRef = ref(null)

const close = () => {
  if (props.loading) return
  emit('update:modelValue', false)
}

const onConfirm = () => {
  if (props.loading || props.confirmDisabled) return
  emit('confirm')
}

const onKeyDown = (event) => {
  if (!props.modelValue) return
  if (event.key === 'Escape') {
    close()
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    cancelButtonRef.value?.focus?.()
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
      <div v-if="modelValue" class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
        <div :class="['w-full rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/75', widthClass]">
        <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ title }}</h3>
        <p v-if="description" class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ description }}</p>

        <div class="mt-4">
          <slot />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            ref="cancelButtonRef"
            type="button"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            :disabled="loading"
            @click="close"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading || confirmDisabled"
            @click="onConfirm"
          >
            {{ loading ? 'Guardando...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

