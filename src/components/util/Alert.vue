<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 6000 // 6 segundos por defecto
  },
  actionLabel: {
    type: String,
    default: ''
  },
  actionDisabled: {
    type: Boolean,
    default: false
  },
  closeOnAction: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  autoFocus: {
    type: Boolean,
    default: true
  },
  autoScroll: {
    type: Boolean,
    default: true
  },
  toast: {
    type: Boolean,
    default: false
  },
  position: {
    type: String,
    default: 'top-right'
  },
  zIndex: {
    type: Number,
    default: 60
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'action'])

const show = ref(props.modelValue)
const root = ref(null)
let timer = null
let rafId = null
const progress = ref(100)

const clearTimers = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

const startAutoDismiss = () => {
  clearTimers()
  progress.value = 100

  if (!show.value) return
  if (!(props.duration > 0)) return

  const start = performance.now()
  const durationMs = props.duration

  const tick = (now) => {
    const elapsed = now - start
    progress.value = Math.max(0, 100 - (elapsed / durationMs) * 100)

    if (elapsed >= durationMs) {
      close()
      return
    }
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
  timer = setTimeout(() => {
    close()
  }, durationMs)
}

// Watcher para sincronizar con v-model
watch(() => props.modelValue, (newValue) => {
  show.value = newValue
  if (newValue) startAutoDismiss()
})

// Auto-dismiss y auto-enfoque/scroll
watch(show, async (newValue) => {
  clearTimers()
  progress.value = 100

  if (newValue) {
    await nextTick()
    try {
      if (props.autoScroll && root.value?.scrollIntoView) {
        root.value.scrollIntoView({behavior: 'smooth', block: 'center'})
      }
      if (props.autoFocus && typeof root.value?.focus === 'function') {
        root.value.focus({preventScroll: true})
      }
    } catch (_) {}

    startAutoDismiss()
  }
}, { immediate: true })

// Manejo de cambio de datos mientras la alerta está visible
watch(
    () => [props.message, props.title, props.type, props.duration],
    async () => {
      if (!show.value) return

      await nextTick()
      try {
        if (props.autoScroll && root.value?.scrollIntoView) {
          root.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        if (props.autoFocus && typeof root.value?.focus === 'function') {
          root.value.focus({ preventScroll: true })
        }
      } catch (_) {}

      startAutoDismiss()
    }
)

onBeforeUnmount(() => {
  clearTimers()
})

onMounted(() => {
  if (show.value) startAutoDismiss()
})

// Clases visuales minimalistas
const alertClasses = computed(() => {
  return 'relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950'
})

const accentClasses = computed(() => {
  const variants = {
    success: 'bg-secondary-500 dark:bg-secondary-400',
    error: 'bg-tertiary-600 dark:bg-tertiary-500',
    warning: 'bg-tertiary-500 dark:bg-tertiary-400',
    info: 'bg-primary-500 dark:bg-primary-400'
  }
  return variants[props.type] || variants.info
})

const iconColorClasses = computed(() => {
  const variants = {
    success: 'text-secondary-500 dark:text-secondary-400',
    error: 'text-tertiary-600 dark:text-tertiary-500',
    warning: 'text-tertiary-500 dark:text-tertiary-400',
    info: 'text-primary-500 dark:text-primary-400'
  }
  return variants[props.type] || variants.info
})

const closeButtonClasses = computed(() => {
  return 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800'
})

const wrapperClasses = computed(() => {
  if (!props.toast) return ''
  const base = 'fixed pointer-events-none'
  const posMap = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  }
  return `${base} ${posMap[props.position] || posMap['top-right']}`
})

const toastCardClasses = computed(() => {
  if (!props.toast) return ''
  return 'pointer-events-auto w-[min(90vw,380px)]'
})

const close = () => {
  clearTimers()
  show.value = false
  emit('update:modelValue', false)
  emit('close')
}

const onActionClick = () => {
  emit('update:modelValue', true)
  emit('action')
  if (props.closeOnAction) close()
}
</script>

<template>
  <div v-if="show" :class="wrapperClasses" :style="props.toast ? { zIndex: props.zIndex } : undefined">
    <div
        :class="[alertClasses, toastCardClasses]"
        class="mb-4 transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2 sm:slide-in-from-top-4"
        role="alert"
        :tabindex="autoFocus ? -1 : null"
        ref="root"
    >
      <div class="absolute left-0 top-0 bottom-0 w-1" :class="accentClasses"></div>

      <div class="relative flex items-start gap-3.5 p-4 pl-5">
        <div class="flex-shrink-0 mt-0.5">
          <svg v-if="type === 'success'" :class="iconColorClasses" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="type === 'error'" :class="iconColorClasses" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else-if="type === 'warning'" :class="iconColorClasses" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else :class="iconColorClasses" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>

        <div class="flex-1 min-w-0" :aria-live="type === 'error' ? 'assertive' : 'polite'">
          <h3 v-if="title" class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {{ title }}
          </h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words whitespace-pre-line">
            {{ message }}
          </p>
          <button
              v-if="actionLabel"
              type="button"
              class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:opacity-60"
              :disabled="actionDisabled"
              @click="onActionClick"
          >
            {{ actionLabel }}
          </button>
        </div>

        <button
            v-if="dismissible"
            @click="close"
            type="button"
            class="flex-shrink-0 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
            :class="closeButtonClasses"
            aria-label="Cerrar alerta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="duration > 0" class="absolute bottom-0 left-0 h-[2px] w-full bg-slate-100 dark:bg-slate-800">
        <div class="h-full transition-all duration-75" :class="accentClasses" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>