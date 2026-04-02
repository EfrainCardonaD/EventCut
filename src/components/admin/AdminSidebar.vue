<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
  pendingCommunities: {
    type: Number,
    default: 0,
  },
  activeBans: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['toggle'])

const route = useRoute()

const menuSections = computed(() => [
  {
    title: 'General',
    items: [
      {
        name: 'Dashboard',
        path: '/app/admin',
        icon: 'dashboard',
        exact: true,
      },
    ],
  },
  {
    title: 'Usuarios y Accesos',
    items: [
      {
        name: 'Directorio de Usuarios',
        path: '/app/admin/users',
        icon: 'users',
        badge: null,
      },
      {
        name: 'Registro de Sanciones',
        path: '/app/admin/bans',
        icon: 'ban',
        badge: props.activeBans > 0 ? props.activeBans : null,
      },
    ],
  },
  {
    title: 'Contenido y Moderacion',
    items: [
      {
        name: 'Solicitudes de Comunidades',
        path: '/app/admin/communities',
        icon: 'community',
        badge: props.pendingCommunities > 0 ? props.pendingCommunities : null,
      },
      {
        name: 'Auditoria de Eventos',
        path: '/app/admin/events',
        icon: 'calendar',
        badge: null,
      },
      {
        name: 'Catalogo de Categorias',
        path: '/app/admin/categories',
        icon: 'tag',
        badge: null,
      },
    ],
  },
])

const isActive = (item) => {
  if (item.exact) {
    return route.path === item.path
  }
  return route.path.startsWith(item.path)
}

const getIcon = (iconName) => {
  const icons = {
    dashboard: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />`,
    users: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />`,
    ban: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />`,
    community: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />`,
    calendar: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`,
    tag: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />`,
  }
  return icons[iconName] || icons.dashboard
}
</script>

<template>
  <aside
    class="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-slate-200 bg-white px-3 py-4 transition-all duration-300 dark:border-slate-800 dark:bg-slate-950"
    :class="collapsed ? 'w-20' : 'w-72'"
  >
    <!-- Toggle Button -->
    <button
      type="button"
      class="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      @click="emit('toggle')"
    >
      <svg class="h-4 w-4 transition-transform" :class="collapsed ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <nav class="h-full space-y-6 overflow-y-auto pr-1 pb-10 pt-8">
      <!-- Back to App Link -->


      <!-- Menu Sections -->
      <div v-for="section in menuSections" :key="section.title" class="space-y-1.5">
        <h3 v-if="!collapsed" class="px-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {{ section.title }}
        </h3>
        <div v-else class="my-3 border-t border-slate-200 dark:border-slate-800" />

        <RouterLink
          v-for="item in section.items"
          :key="item.path"
          :to="item.path"
          class="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="
            isActive(item)
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
          "
          :title="collapsed ? item.name : undefined"
        >
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="getIcon(item.icon)" />
          <span v-if="!collapsed" class="flex-1 truncate">{{ item.name }}</span>
          <span
            v-if="item.badge && !collapsed"
            class="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-error-100 px-1.5 text-xs font-bold text-error-700 dark:bg-error-900/30 dark:text-error-300"
          >
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
          <span v-if="item.badge && collapsed" class="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-error-500" />
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>
