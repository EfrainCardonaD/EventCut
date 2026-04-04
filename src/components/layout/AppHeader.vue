<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toggleTheme } from '@/utils/theme'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  isAdminUser: {
    type: Boolean,
    default: false,
  },
  avatarInitial: {
    type: String,
    default: 'U',
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'create-event', 'logout'])
const route = useRoute()
const themeIcon = ref('light_mode')
const userMenuOpen = ref(false)
const userMenuRef = ref(null)

const searchQuery = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isRouteActive = (targetPath) => {
  if (targetPath === '/app') return route.path === '/app'
  return route.path.startsWith(targetPath)
}

const linkClass = (targetPath) => {
  const isActive = isRouteActive(targetPath)
  return isActive
    ? 'border-b-2 border-primary-600 pb-1 text-primary-600 dark:border-primary-500 dark:text-primary-300'
    : 'pb-1 text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
}

const syncIcon = () => {
  themeIcon.value = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'
}

const onToggleTheme = () => {
  toggleTheme()
  syncIcon()
}

const onCreateEvent = () => {
  emit('create-event')
}

const onToggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const onLogout = () => {
  closeUserMenu()
  emit('logout')
}

const handleClickOutside = (event) => {
  if (!userMenuRef.value) return
  if (userMenuRef.value.contains(event.target)) return
  closeUserMenu()
}

onMounted(() => {
  syncIcon()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header
    class="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/80 dark:shadow-none md:h-20 md:px-8"
  >
    <div class="flex items-center gap-3 md:gap-8">
      <div class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-primary-400">
        <span class="material-symbols-outlined">event</span>
      </div>
      <span class="hidden text-sm font-semibold uppercase tracking-[0.25em] text-primary-600 dark:text-primary-500 sm:block md:text-2xl">EVENTCUT</span>

      <nav class="ml-4 hidden gap-6 text-sm font-bold tracking-tight md:flex lg:text-base">
        <RouterLink to="/app" :class="linkClass('/app')">Eventos</RouterLink>
        <RouterLink to="/app/calendario" :class="linkClass('/app/calendario')">Calendario</RouterLink>
        <RouterLink to="/app/comunidades" :class="linkClass('/app/comunidades')">Comunidades</RouterLink>
        <RouterLink
          v-if="isAdminUser"
          to="/app/admin"
          :class="linkClass('/app/admin')"
        >
          Admin
        </RouterLink>
      </nav>
    </div>

    <div class="flex items-center gap-2 md:gap-4">
      <div v-if="showSearch" class="relative mr-2 hidden lg:block">
        <input
          v-model="searchQuery"
          type="text"
          name="event_search"
          aria-label="Buscar eventos"
          placeholder="Buscar eventos por titulo, descripcion o sede"
          class="w-80 rounded-full border border-transparent bg-slate-100 px-5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-tertiary-500"
        />
        <span class="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">search</span>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-primary-700 active:scale-95 dark:bg-primary-500 dark:text-primary-950 dark:hover:bg-primary-400 sm:px-4 sm:text-sm"
        @click="onCreateEvent"
      >
        <span class="material-symbols-outlined text-base leading-none text-white">add</span>
        <span class="hidden sm:inline text-white ">Crear evento</span>
      </button>

      <button
        type="button"
        class="inline-flex size-10 items-center justify-center rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-white/5"
        aria-label="Toggle Theme"
        @click="onToggleTheme"
      >
        <span class="material-symbols-outlined text-[22px] leading-none">{{ themeIcon }}</span>
      </button>

      <div ref="userMenuRef" class="relative">
        <button
          type="button"
          class="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-200 font-bold text-slate-700 transition-all hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
          :aria-expanded="userMenuOpen"
          aria-haspopup="menu"
          aria-label="Abrir menu de usuario"
          @click.stop="onToggleUserMenu"
        >
          {{ avatarInitial }}
          <span
            v-if="isAdminUser"
            class="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-primary-600 text-white dark:border-slate-950 dark:bg-primary-500 dark:text-primary-950"
            title="Usuario administrador"
          >
            <span class="material-symbols-outlined text-[12px] leading-none">shield</span>
          </span>
        </button>

        <div
          v-if="userMenuOpen"
          class="absolute right-0 top-12 z-[70] w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-error-600 transition-colors hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-900/20"
            @click="onLogout"
          >
            <span class="material-symbols-outlined text-[18px]">logout</span>
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

