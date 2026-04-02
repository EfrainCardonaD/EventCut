<script setup>
import { computed, ref, watch } from 'vue'
import FieldError from '@/components/util/FieldError.vue'

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
    default: 'Confirmar',
  },
  cancelText: {
    type: String,
    default: 'Cancelar',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  requireReason: {
    type: Boolean,
    default: false,
  },
  reasonLabel: {
    type: String,
    default: 'Motivo',
  },
  reasonPlaceholder: {
    type: String,
    default: 'Describe el motivo',
  },
  minReasonLength: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const reason = ref('')
const error = ref('')

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      reason.value = ''
      error.value = ''
    }
  },
)

const canConfirm = computed(() => {
  if (props.loading) return false
  if (!props.requireReason) return true
  return reason.value.trim().length >= props.minReasonLength
})

const onClose = () => {
  if (props.loading) return
  emit('update:modelValue', false)
}

const onConfirm = () => {
  if (props.requireReason && reason.value.trim().length < props.minReasonLength) {
    error.value = `El motivo debe tener al menos ${props.minReasonLength} caracteres.`
    return
  }

  error.value = ''
  emit('confirm', reason.value.trim())
}
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
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h3 class="text-lg font-black text-slate-900 dark:text-slate-100">{{ title }}</h3>
        <p v-if="description" class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ description }}</p>

        <label v-if="requireReason" class="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {{ reasonLabel }}
          <textarea
            v-model="reason"
            rows="3"
            :placeholder="reasonPlaceholder"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-tertiary-500 dark:border-slate-700 dark:bg-slate-950"
          ></textarea>
          <FieldError :error="error" />
        </label>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            :disabled="loading"
            @click="onClose"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="rounded-full bg-tertiary-500 px-4 py-2 text-sm font-bold text-white hover:bg-tertiary-600 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canConfirm"
            @click="onConfirm"
          >
            {{ loading ? 'Procesando...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

