<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const tabs = [
  { label: 'Eventos', to: '/app', icon: 'event', exact: true },
  { label: 'Calendario', to: '/app/calendario', icon: 'calendar_month', exact: false },
  { label: 'Comunidades', to: '/app/comunidades', icon: 'groups' },
]

const isActive = (tab) => {
  if (tab.exact) return route.path === tab.to
  return route.path.startsWith(tab.to)
}

const tabClass = (tab) => {
  return isActive(tab)
    ? 'text-primary-600 dark:text-primary-300'
    : 'text-slate-500 transition-colors hover:text-tertiary-600 dark:text-slate-400 dark:hover:text-tertiary-300'
}

const pillClass = (tab) => {
  return isActive(tab)
    ? 'mb-1 rounded-full bg-primary-100 px-4 py-1 dark:bg-primary-500/20'
    : 'mb-1 px-4 py-1'
}

const iconClass = (tab) => {
  return isActive(tab) ? 'icon-filled' : ''
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 z-50 flex h-[4.5rem] w-full items-center justify-around border-t border-slate-200 bg-white/90 px-4 pb-safe pt-1.5 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 md:hidden"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-col items-center justify-center p-2"
      :class="tabClass(tab)"
    >
      <div :class="pillClass(tab)">
        <span class="material-symbols-outlined" :class="iconClass(tab)">{{ tab.icon }}</span>
      </div>
      <span class="text-[10px] font-medium">{{ tab.label }}</span>
    </RouterLink>

    <slot />
  </nav>
</template>
