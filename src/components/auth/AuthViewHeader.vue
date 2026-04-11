<script setup>
import { ref, onMounted } from 'vue'
import AuthLogoBranding from '@/components/auth/AuthLogoBranding.vue'
import { toggleTheme } from '@/utils/theme'

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

const themeIcon = ref('light_mode')

const syncIcon = () => {
  themeIcon.value = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'
}

const onToggleTheme = () => {
  toggleTheme()
  syncIcon()
}

onMounted(() => {
  syncIcon()
})
</script>

<template>
  <div class="relative mb-8 text-center flex flex-col items-center pb-3  border-b border-tertiary-200 dark:border-tertiary-900">
    <button
      type="button"
      class="  absolute right-0 top-0   inline-flex size-9 items-center justify-center rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 sm:size-10"
      aria-label="Cambiar tema"
      @click="onToggleTheme"
      title="Cambiar tema"
    >
      <span class="material-symbols-outlined text-[22px] leading-none">{{ themeIcon }}</span>
    </button>
    
    <AuthLogoBranding subtitle="CUTONALA" title="Click para ir a inicio"/>
    <h1 class="mt-3 text-2xl font-body text-slate-800 dark:text-primary-50">{{ title }}</h1>
    <p v-if="subtitle" class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
  </div>
</template>

