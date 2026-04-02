<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const { communities, bannedUsers, isLoadingCommunities, isLoadingBans } = storeToRefs(adminStore)

const isLoading = computed(() => isLoadingCommunities.value || isLoadingBans.value)

const stats = computed(() => [
  {
    title: 'Comunidades Pendientes',
    value: communities.value.filter(c => c.status === 'PENDING').length,
    icon: 'community',
    color: 'warning',
    link: '/app/admin/communities'
  },
  {
    title: 'Comunidades Activas',
    value: communities.value.filter(c => c.status === 'ACTIVE').length,
    icon: 'check',
    color: 'success',
    link: '/app/admin/communities'
  },
  {
    title: 'Usuarios Baneados',
    value: bannedUsers.value.length,
    icon: 'ban',
    color: 'error',
    link: '/app/admin/bans'
  },
  {
    title: 'Comunidades Rechazadas',
    value: communities.value.filter(c => c.status === 'REJECTED').length,
    icon: 'x',
    color: 'slate',
    link: '/app/admin/communities'
  }
])

const quickActions = [
  {
    title: 'Moderar Comunidades',
    description: 'Revisar solicitudes pendientes de comunidades',
    icon: 'community',
    link: '/app/admin/communities'
  },
  {
    title: 'Gestionar Usuarios',
    description: 'Ver directorio y asignar roles',
    icon: 'users',
    link: '/app/admin/users'
  },
  {
    title: 'Auditar Eventos',
    description: 'Revisar y moderar eventos publicados',
    icon: 'calendar',
    link: '/app/admin/events'
  },
  {
    title: 'Administrar Categorías',
    description: 'Crear y editar categorías de eventos',
    icon: 'tag',
    link: '/app/admin/categories'
  }
]

const recentCommunities = computed(() => {
  return [...communities.value]
    .filter(c => c.status === 'PENDING')
    .slice(0, 5)
})

const recentBans = computed(() => {
  return [...bannedUsers.value].slice(0, 5)
})

const getStatColorClasses = (color) => {
  const colors = {
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
    error: 'bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  }
  return colors[color] || colors.slate
}

const getIcon = (iconName) => {
  const icons = {
    community: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />`,
    check: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    ban: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />`,
    x: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    users: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />`,
    calendar: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`,
    tag: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />`
  }
  return icons[iconName] || ''
}

const navigateTo = (path) => {
  router.push(path)
}

onMounted(async () => {
  await Promise.all([
    adminStore.fetchCommunities({ limit: 100 }),
    adminStore.fetchBannedUsers({ limit: 50 })
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header>
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
        Panel de Administración
      </p>
      <h1 class="mt-1 font-headline text-2xl font-black md:text-3xl">Dashboard</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Resumen general y acciones rápidas de administración.
      </p>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <template v-else>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          v-for="stat in stats"
          :key="stat.title"
          type="button"
          class="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700"
          @click="navigateTo(stat.link)"
        >
          <div class="flex items-start justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl"
              :class="getStatColorClasses(stat.color)"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="getIcon(stat.icon)" />
            </div>
            <svg class="h-5 w-5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p class="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{{ stat.value }}</p>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ stat.title }}</p>
        </button>
      </div>

      <!-- Quick Actions -->
      <section>
        <h2 class="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Acciones Rápidas</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="action in quickActions"
            :key="action.title"
            type="button"
            class="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700"
            @click="navigateTo(action.link)"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="getIcon(action.icon)" />
            </div>
            <h3 class="mt-3 font-semibold text-slate-900 dark:text-slate-100">{{ action.title }}</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ action.description }}</p>
          </button>
        </div>
      </section>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Recent Pending Communities -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-bold text-slate-900 dark:text-slate-100">Comunidades Pendientes</h2>
            <RouterLink
              to="/app/admin/communities"
              class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Ver todas
            </RouterLink>
          </div>

          <div v-if="recentCommunities.length === 0" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No hay comunidades pendientes de revisión.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="community in recentCommunities"
              :key="community.id"
              class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-slate-900 dark:text-slate-100">{{ community.name }}</p>
                <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ community.contact_email }}</p>
              </div>
              <span class="ml-3 rounded-full bg-warning-100 px-2 py-1 text-xs font-bold text-warning-700 dark:bg-warning-900/30 dark:text-warning-400">
                Pendiente
              </span>
            </div>
          </div>
        </section>

        <!-- Recent Bans -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-bold text-slate-900 dark:text-slate-100">Baneos Recientes</h2>
            <RouterLink
              to="/app/admin/bans"
              class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Ver todos
            </RouterLink>
          </div>

          <div v-if="recentBans.length === 0" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No hay usuarios baneados actualmente.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="ban in recentBans"
              :key="ban.user_id"
              class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate font-mono text-sm text-slate-900 dark:text-slate-100">{{ ban.user_id.slice(0, 8) }}...</p>
                <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ ban.reason }}</p>
              </div>
              <span class="ml-3 rounded-full bg-error-100 px-2 py-1 text-xs font-bold text-error-700 dark:bg-error-900/30 dark:text-error-400">
                Baneado
              </span>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
