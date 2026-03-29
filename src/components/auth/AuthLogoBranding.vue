<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
  to: {
    type: String,
    default: '/',
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div>
    <RouterLink :to="to" class="inline-flex items-center gap-3 group">
      <!--
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <img src="/favicon.ico" alt="EventCut logo" class="h-7 w-7 " />
      </div>
-->
      <div v-if="!compact">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-tertiary-700 group-hover:text-tertiary-800 transition-colors dark:text-tertiary-300 dark:group-hover:text-tertiary-200">EventCut</p>
      </div>
    </RouterLink>

    <p v-if="!compact && subtitle" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {{ subtitle }}
    </p>
  </div>
</template>

