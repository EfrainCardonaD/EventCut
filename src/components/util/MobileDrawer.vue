<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const bodyLockTarget = computed(() => (typeof document !== 'undefined' ? document.body : null))
const htmlLockTarget = computed(() => (typeof document !== 'undefined' ? document.documentElement : null))
const isBodyLocked = useScrollLock(bodyLockTarget)
const isHtmlLocked = useScrollLock(htmlLockTarget)

const close = () => {
  emit('update:modelValue', false)
}

const onKeyDown = (event) => {
  if (!props.modelValue) return
  if (event.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
})

watch(
  () => props.modelValue,
  (isOpen) => {
    isBodyLocked.value = isOpen
    isHtmlLocked.value = isOpen
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  isBodyLocked.value = false
  isHtmlLocked.value = false
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" @click.self="close">
    <section class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-950">
      <header class="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 class="font-headline text-lg font-extrabold text-slate-900 dark:text-slate-100">{{ title }}</h3>
          <p v-if="subtitle" class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
        </div>

        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          aria-label="Cerrar panel"
          @click="close"
        >
          <span class="material-symbols-outlined text-[20px] leading-none">close</span>
        </button>
      </header>

      <div class="max-h-[min(70dvh,560px)] overflow-y-auto overscroll-contain pr-1">
        <slot />
      </div>
    </section>
  </div>
</template>

