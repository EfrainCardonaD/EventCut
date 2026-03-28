<script setup>
defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
      <span class="text-lg font-bold">E</span>
    </div>
    <div v-if="!compact">
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-brand">EventCut</p>
      <p class="text-xs text-gray-500 dark:text-gray-400">Gestión de eventos</p>
    </div>
  </div>
</template>

