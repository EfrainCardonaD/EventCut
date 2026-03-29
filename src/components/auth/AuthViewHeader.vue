<script setup>
import AuthLogoBranding from '@/components/auth/AuthLogoBranding.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="mb-6 text-center flex flex-col items-center">
    <AuthLogoBranding subtitle="CUTONALA" />
    <h1 class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{{ title }}</h1>
    <p v-if="subtitle" class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
  </div>
</template>

