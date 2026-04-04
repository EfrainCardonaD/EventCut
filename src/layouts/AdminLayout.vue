<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)

const isAdminUser = computed(() => authStore.hasAnyRole(['ADMIN', 'SECURITY_ADMIN']))

const avatarInitial = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''
  const fallback = authStore.username || authStore.user?.email || ''
  const source = `${firstName} ${lastName}`.trim() || fallback || 'U'
  return source.charAt(0).toUpperCase()
})

const onHeaderCreateEvent = () => {
  router.push('/app')
}

const onHeaderLogout = async () => {
  await authStore.logout({ redirect: true })
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const openMobileSidebar = () => {
  mobileSidebarOpen.value = true
}

const closeMobileSidebar = () => {
  mobileSidebarOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-700 dark:text-slate-100 dark:bg-slate-950 ">
    <AppHeader
      :is-admin-user="isAdminUser"
      :avatar-initial="avatarInitial"
      :show-search="false"
      @create-event="onHeaderCreateEvent"
      @logout="onHeaderLogout"
    />

    <div class="flex pt-16">
      <!-- Sidebar -->
      <AdminSidebar
        class="hidden md:block"
        :collapsed="sidebarCollapsed"
        @toggle="toggleSidebar"
      />

      <!-- Sidebar Mobile Drawer -->
      <div v-if="mobileSidebarOpen" class="fixed inset-0 top-16 z-30 bg-slate-950/50 backdrop-blur-sm md:hidden" @click="closeMobileSidebar" />
      <AdminSidebar
        v-if="mobileSidebarOpen"
        class="md:hidden"
        :collapsed="false"
        @toggle="closeMobileSidebar"
      />

      <!-- Main Content -->
      <main
        class="flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300"
        :class="sidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-72'"
      >
        <div class="p-4 md:p-6 lg:p-20">
          <div class="sticky top-20 z-20 -mx-1 mb-4 px-1 md:hidden">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
              @click="openMobileSidebar"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu admin
            </button>
          </div>
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
