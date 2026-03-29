<template>
  <div v-if="show">
    <div v-if="mode === 'overlay'" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <svg :class="svgClass" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span v-if="showText" class="text-sm">{{ text }}</span>
      </div>
    </div>

    <div v-else class="inline-flex items-center justify-center" role="status">
      <svg :class="svgClass" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span v-if="showText" class="ml-2 text-sm">{{ text }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  text: { type: String, default: 'Procesando…' },
  mode: { type: String, default: 'overlay' }, // 'overlay' | 'inline'
  size: { type: String, default: 'md' } // 'sm' | 'md' | 'lg'
})

const showText = computed(() => props.text && props.mode === 'overlay')

const svgClass = computed(() => {
  const base = 'animate-spin text-primary-600'
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  }
  return `${base} ${sizes[props.size] || sizes.md}`
})
</script>
