<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import EventCutLogo from '@/components/icons/EventCutLogo.vue'
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
const searchPopupOpen = ref(false)
const searchPopupRef = ref(null)

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

const hubMainItems = computed(() => [
  { label: 'Eventos', to: '/app', icon: 'event' },
  { label: 'Calendario', to: '/app/calendario', icon: 'calendar_month' },
  { label: 'Comunidades', to: '/app/comunidades', icon: 'groups' },
])

const hubAdminItems = computed(() => {
  if (!props.isAdminUser) return []

  return [
    { label: 'Panel admin', to: '/app/admin', icon: 'admin_panel_settings', exact: true },
    { label: 'Usuarios', to: '/app/admin/users', icon: 'badge' },
    { label: 'Baneos', to: '/app/admin/bans', icon: 'gavel' },
    { label: 'Moderar comunidades', to: '/app/admin/communities', icon: 'shield_person' },
    { label: 'Auditoria eventos', to: '/app/admin/events', icon: 'event_note' },
    { label: 'Categorias', to: '/app/admin/categories', icon: 'sell' },
  ]
})

const isHubItemActive = (item) => {
  if (item.exact) return route.path === item.to
  return isRouteActive(item.to)
}

const hubItemClass = (item) => {
  const isActive = isHubItemActive(item)
  return isActive
    ? 'flex w-full items-center gap-2.5 rounded-xl bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 ring-1 ring-primary-200 transition-colors dark:bg-primary-500/15 dark:text-primary-300 dark:ring-primary-500/30'
    : 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-white'
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

const onToggleSearchPopup = () => {
  searchPopupOpen.value = !searchPopupOpen.value
}

const closeSearchPopup = () => {
  searchPopupOpen.value = false
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
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    closeUserMenu()
  }

  if (searchPopupRef.value && !searchPopupRef.value.contains(event.target)) {
    closeSearchPopup()
  }
}

const onHeaderKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeUserMenu()
    closeSearchPopup()
  }
}

onMounted(() => {
  syncIcon()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', onHeaderKeyDown)
})

watch(
  () => route.fullPath,
  () => {
    closeUserMenu()
    closeSearchPopup()
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', onHeaderKeyDown)
})
</script>

<template>
  <header
    class="xl:px-20  fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-3 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/80 dark:shadow-none sm:h-16 sm:px-4 md:h-20 md:px-6 lg:px-8"
  >
    <div class="flex items-center gap-2 sm:gap-3 md:gap-6 lg:gap-8">

      <EventCutLogo
        :wordmark-class="'hidden h-6 w-auto object-contain md:block lg:h-8 xl:h-9'"
        :logo-class="'flex h-8 w-8 items-center justify-center shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10'"
        :img-class="'h-8 w-8 object-contain sm:h-9 sm:w-9 md:h-10 md:w-10'"
      />

      <nav class="ml-2 hidden gap-4 text-[13px] font-bold tracking-tight min-[851px]:flex lg:ml-4 lg:gap-6 lg:text-sm xl:gap-8 xl:text-base">
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

    <div class="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">

      <div v-if="showSearch" class="relative mr-2 hidden 2xl:block">
        <input
          v-model="searchQuery"
          type="text"
          name="event_search"
          aria-label="Buscar eventos"
          placeholder="Buscar eventos, comunidades..."
          class="w-64 rounded-full border border-transparent bg-slate-100 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-tertiary-500 xl:w-80"
        />
        <span class="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">search</span>
      </div>

      <div v-if="showSearch" ref="searchPopupRef" class="relative hidden min-[851px]:block 2xl:hidden">
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-white/5 sm:size-10"
          aria-label="Abrir busqueda"
          :aria-expanded="searchPopupOpen"
          aria-haspopup="dialog"
          @click.stop="onToggleSearchPopup"
        >
          <span class="material-symbols-outlined text-[22px] leading-none">search</span>
        </button>

        <div
          v-if="searchPopupOpen"
          class="absolute right-0 top-12 z-[70] w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          @click.stop
        >
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              name="event_search_popup"
              aria-label="Buscar eventos"
              placeholder="Buscar eventos, comunidades..."
              class="w-full rounded-full border border-transparent bg-slate-100 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-tertiary-500"
            />
            <span class="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">search</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-primary-700 active:scale-95 dark:bg-primary-500 dark:text-primary-950 dark:hover:bg-primary-400 sm:gap-1.5 sm:px-2 sm:py-1.5 sm:text-xs md:px-4 md:text-sm"
        @click="onCreateEvent"
      >
        <span class="material-symbols-outlined text-base leading-none text-white">add</span>
        <span class="hidden lg:inline text-white ">Crear evento</span>
      </button>

      <button
        type="button"
        class="inline-flex size-9 items-center justify-center rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-white/5 sm:size-10"
        aria-label="Toggle Theme"
        @click="onToggleTheme"
      >
        <span class="material-symbols-outlined text-[22px] leading-none">{{ themeIcon }}</span>
      </button>

      <div ref="userMenuRef" class="relative">
        <button
          type="button"
          class="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-200 font-bold text-slate-700 transition-all hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 sm:h-10 sm:w-10"
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
          class="absolute right-0 top-12 z-[70] w-72 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/90"
        >
          <div class="px-2 py-1.5">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Accesos rapidos</p>
          </div>

          <nav class="space-y-1" aria-label="Navegacion principal" role="menu">
            <RouterLink
              v-for="item in hubMainItems"
              :key="item.to"
              :to="item.to"
              :class="hubItemClass(item)"
              role="menuitem"
              @click="closeUserMenu"
            >
              <span class="material-symbols-outlined text-[18px] leading-none">{{ item.icon }}</span>
              <span class="truncate">{{ item.label }}</span>
            </RouterLink>
          </nav>

          <div v-if="hubAdminItems.length" class="mt-2 border-t border-slate-200/80 pt-2 dark:border-slate-700/80">
            <p class="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Admin</p>
            <nav class="space-y-1" aria-label="Navegacion admin" role="menu">
              <RouterLink
                v-for="item in hubAdminItems"
                :key="item.to"
                :to="item.to"
                :class="hubItemClass(item)"
                role="menuitem"
                @click="closeUserMenu"
              >
                <span class="material-symbols-outlined text-[18px] leading-none">{{ item.icon }}</span>
                <span class="truncate">{{ item.label }}</span>
              </RouterLink>
            </nav>
          </div>

          <div class="mt-2 border-t border-slate-200/80 pt-2 dark:border-slate-700/80">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-error-600 transition-colors hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-900/20"
              role="menuitem"
              @click="onLogout"
            >
              <span class="material-symbols-outlined text-[18px]">logout</span>
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

