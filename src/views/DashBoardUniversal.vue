<script setup>
import { onMounted, ref } from 'vue'
import { toggleTheme } from '@/utils/theme'

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
  <div class="bg-slate-50 dark:bg-[#0f1418] text-slate-900 dark:text-[#dfe3e8] transition-colors duration-300 selection:bg-sky-500/30">
    <!-- TOP NAVIGATION BAR -->
    <header
      class="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#0f1418]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 shadow-sm dark:shadow-none flex justify-between items-center px-4 md:px-8 h-16 md:h-20 transition-colors duration-300"
    >
      <!-- Logo & Desktop Nav -->
      <div class="flex items-center gap-3 md:gap-8">
        <div
          class="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1b2024] flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCv_wZJRTi5DqAYEYwdDgsuxjSYEv-JB2T5_RsmC272YkWz9VF7QP0_z8ba8OQPFTf9nZdfmp9aMfEAP31PIkcYQQjrURZFSb3XFRT15H8QGOqRDkJYiYye8Yz9kw4Dl7fa2c4pX3fyyuf_YwQMM_Dsb6fyUSB7UKv_ffRcIVhwoIwK90cyXI0NOZ-jbcH4jAMAQRjNF3JSZEuCNbofZB0Ouir-TDGHU2nK4EdbvTZ_89I81eMyChjLX7IEz987Ynrup9A-IGhA"
            alt="CUTonalá Seal"
            class="w-8 h-8 object-contain"
          />
        </div>
        <span class="font-headline font-black text-sky-600 dark:text-[#009bdb] tracking-tight text-xl md:text-2xl hidden sm:block"
          >CampusEvents</span
        >

        <!-- Desktop Links -->
        <nav class="hidden md:flex gap-6 font-headline font-bold text-sm lg:text-base tracking-tight ml-4">
          <a href="#" class="text-sky-600 dark:text-[#88ceff] border-b-2 border-sky-600 dark:border-[#009bdb] pb-1">Eventos</a>
          <a href="#" class="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors pb-1">Calendario</a>
          <a href="#" class="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors pb-1">Talleres</a>
        </nav>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-2 md:gap-4">
        <!-- Search Bar (Desktop) -->
        <div class="relative group hidden lg:block mr-2">
          <input
            type="text"
            placeholder="Buscar eventos..."
            class="bg-slate-100 dark:bg-[#1b2024] border border-transparent dark:border-slate-800 focus:border-sky-500 dark:focus:border-[#009bdb] rounded-full px-5 py-2 w-64 text-sm focus:ring-2 focus:ring-sky-500/20 transition-all outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
          <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">search</span>
        </div>

        <!-- Theme Toggle -->
        <button
          type="button"
          class="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-full transition-all active:scale-95"
          aria-label="Toggle Theme"
          @click="onToggleTheme"
        >
          <span class="material-symbols-outlined">{{ themeIcon }}</span>
        </button>

        <!-- Notifications -->
        <button class="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-full transition-all active:scale-95 relative">
          <span class="material-symbols-outlined">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0f1418]"></span>
        </button>

        <!-- Profile Desktop -->
        <div
          class="hidden sm:block w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-surface-container border border-slate-300 dark:border-outline-variant/30 overflow-hidden cursor-pointer hover:ring-2 hover:ring-sky-500 transition-all"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZVoGxLNXLeJg0l2SFKfC3mAtckD_zhQSQICMNeD6w5OYgQjoAELxpugnha-prow_vskXUf_wxAjLxqK9jEbqBYb_opCk48M4nVm5z2CLggxjhZX3Lzw_81xjQw5MJQPEWd0eBa5duwDsLhVhMGbX4rWK-dswcZ4r4mAeQqqnateAD1HAc3KjIu433wR2VXkLVlFFz9bLVhuO4mTC7zeFnmdmZr5gQcEjmIkvhvWWIZR9Yg4eGe9VS1IOGyUCq9EsBvOECsiqn"
            alt="User Profile"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>

    <!-- LEFT SIDEBAR (Hidden on Mobile) -->
    <aside
      class="hidden md:flex flex-col py-6 gap-4 h-[calc(100vh-5rem)] w-64 fixed left-0 top-20 bg-slate-50 dark:bg-[#171c20] z-40 border-r border-slate-200 dark:border-slate-800/50 transition-colors duration-300"
    >
      <div class="px-6 mb-2">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-sky-600 dark:text-sky-400 text-lg icon-filled">school</span>
          </div>
          <div>
            <h2 class="font-headline font-bold text-slate-800 dark:text-slate-200">Mi Panel</h2>
            <p class="text-[10px] text-slate-500 uppercase tracking-tighter">Estudiante</p>
          </div>
        </div>
      </div>

      <nav class="flex flex-col gap-1 px-3">
        <a href="#" class="flex items-center gap-3 px-4 py-2.5 bg-sky-100 dark:bg-[#1b2024] text-sky-700 dark:text-[#88ceff] rounded-full font-medium transition-colors">
          <span class="material-symbols-outlined icon-filled">explore</span>
          <span class="text-sm">Descubrir</span>
        </a>
        <a
          href="#"
          class="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1b2024]/50 rounded-full font-medium transition-colors"
        >
          <span class="material-symbols-outlined">calendar_month</span>
          <span class="text-sm">Mi Agenda</span>
        </a>
        <a
          href="#"
          class="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1b2024]/50 rounded-full font-medium transition-colors"
        >
          <span class="material-symbols-outlined">category</span>
          <span class="text-sm">Categorías</span>
        </a>
        <a
          href="#"
          class="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1b2024]/50 rounded-full font-medium transition-colors"
        >
          <span class="material-symbols-outlined">account_balance</span>
          <span class="text-sm">Info Universitaria</span>
        </a>
      </nav>

      <div class="mt-auto px-4">
        <button
          class="w-full py-3.5 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-[#00344d] font-bold rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined">add</span>
          Proponer Evento
        </button>
      </div>

      <div class="mt-2 px-3 flex flex-col gap-1 border-t border-slate-200 dark:border-slate-800 pt-4">
        <a href="#" class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
          <span class="material-symbols-outlined text-xl">help</span>
          <span class="text-sm">Ayuda</span>
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
          <span class="material-symbols-outlined text-xl">logout</span>
          <span class="text-sm">Cerrar Sesión</span>
        </a>
      </div>
    </aside>

    <!-- MAIN CONTENT CANVAS -->
    <main class="pt-20 pb-24 md:pb-8 md:pl-64 xl:pr-[22rem] min-h-screen">
      <div class="p-4 md:p-8">
        <!-- Horizontal Categories Filter -->
        <div class="flex items-center gap-2 md:gap-3 overflow-x-auto pb-4 mb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <button class="px-5 py-2 rounded-full bg-sky-600 dark:bg-sky-500 text-white dark:text-[#002e44] font-semibold text-sm whitespace-nowrap shadow-sm">Todos</button>
          <button
            class="px-5 py-2 rounded-full bg-white dark:bg-[#1b2024] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm whitespace-nowrap"
          >
            Ingeniería
          </button>
          <button
            class="px-5 py-2 rounded-full bg-white dark:bg-[#1b2024] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm whitespace-nowrap"
          >
            CineCUT
          </button>
          <button
            class="px-5 py-2 rounded-full bg-white dark:bg-[#1b2024] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm whitespace-nowrap"
          >
            Talleres
          </button>
          <button
            class="px-5 py-2 rounded-full bg-white dark:bg-[#1b2024] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm whitespace-nowrap"
          >
            Deportes
          </button>
          <button
            class="px-5 py-2 rounded-full bg-white dark:bg-[#1b2024] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm whitespace-nowrap"
          >
            Conferencias
          </button>
        </div>

        <!-- Mobile Mini Calendar (Visible only on mobile) -->
        <section class="xl:hidden mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold font-headline text-slate-800 dark:text-slate-100">Esta Semana</h3>
          </div>
          <div class="flex justify-between bg-white dark:bg-[#171c20] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="flex flex-col items-center gap-1 opacity-50">
              <span class="text-[10px] uppercase font-bold text-slate-500">Lun</span>
              <span class="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold">21</span>
            </div>
            <div class="flex flex-col items-center gap-1 opacity-50">
              <span class="text-[10px] uppercase font-bold text-slate-500">Mar</span>
              <span class="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold">22</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Mié</span>
              <span
                class="w-9 h-9 flex items-center justify-center rounded-full bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-sm font-bold border border-sky-200 dark:border-sky-500/30"
                >23</span
              >
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Jue</span>
              <span
                class="w-9 h-9 flex items-center justify-center rounded-full bg-sky-600 dark:bg-sky-500 text-white dark:text-[#002e44] text-sm font-bold shadow-md shadow-sky-500/20"
                >24</span
              >
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Vie</span>
              <span class="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold">25</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Sáb</span>
              <span class="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold">26</span>
            </div>
          </div>
        </section>

        <!-- Featured Event Section -->
        <section class="mb-8 md:mb-12">
          <div class="flex justify-between items-end mb-4 md:mb-6">
            <h2 class="font-headline font-extrabold text-2xl md:text-3xl tracking-tight text-slate-900 dark:text-white">Destacado</h2>
          </div>

          <div class="relative group overflow-hidden rounded-2xl md:rounded-3xl h-[400px] md:h-[440px] flex items-end md:items-center bg-slate-900 shadow-xl">
            <div class="absolute inset-0 w-full h-full">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJC9NKFznMIKCRg4qCx1mFEPmcEfhbPnGQqgiGwPnddqIO2N9G3cRt9wFB3l9csjQEKqhhlnBSfHE7A-Fbalr3XX1JiHcRoglQXhzhoQ1Yk4Gfg-B2VXzBacfXnuCM55jsfwUJWtRp6H0pCOxBDBOEkvP-NhEYylXjNayAgu8WMwNcYO9oX4ovwcqszGET-HHh3hTpqD2dZv1xMHUgh-tEjkKjKwAtBzbG9mhgEH3qPUCtKqL-w3qBgYZeVtIGJo3AXbSZYkbX"
                alt="Hero Event"
                class="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700"
              />
              <!-- Desktop Gradient -->
              <div class="hidden md:block absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
              <!-- Mobile Gradient -->
              <div class="block md:hidden absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
            </div>

            <div class="relative z-10 w-full md:w-2/3 p-6 md:p-12">
              <div class="flex items-center gap-3 mb-3 md:mb-4">
                <span class="bg-sky-500 text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg">Taller Élite</span>
                <span class="text-sky-200 text-xs font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">event</span> 24 OCT
                </span>
              </div>
              <h3 class="font-headline font-black text-3xl md:text-5xl text-white mb-3 leading-tight">Vibe Coding en Vivo</h3>
              <p class="text-slate-300 text-sm md:text-base mb-6 max-w-md line-clamp-3 md:line-clamp-none">
                Aprende a crear experiencias visuales y sonoras en tiempo real utilizando lenguajes de programación creativos. Inmersión total en la
                experimentación digital.
              </p>

              <div class="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <button
                  class="px-6 md:px-8 py-3 bg-white text-slate-900 font-bold rounded-full hover:bg-sky-50 transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  Registrarse Ahora
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <!-- Avatars stack -->
                <div class="hidden sm:flex -space-x-3 items-center">
                  <div class="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5EmC1nL-LMgpd8yRLkg1dSHPv8LUPCho4gbBCbZyCJ3zxFUAqfJriAHIT2UHwhcZpPFGOzXNcWUCWGBfuIfkLl7Bim8ATC4qySNceUvwt6wJcYvjnNLk01Qj7wOhmkcZvdCLPwg9dekjn7zS-LyGH46FgrrVHIfk7rBbT4_772MfLvzCQRWlaDoOfAhc0I2HP4m7S9X4oxzHLT9bEa9OeUTR0pexYgxdwVWbmETMaPspZvZiHYjVxOW8KMTmqDajXfEJr6QIW"
                      alt="User"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhSf-RIompDizabHYY8vXy6HJIAu3g-OPJVBlMAoM2zr-TJet4NIpb8ffc194qVOZ0K6GfROjl2T_8faDO5Tl3QULkSRUJIzpq1niV7Jxe7fhz906vfMdMuJIlGxowHn8pyK1tiyAGg9j7HJ4gOLCGzzk0y87ky9MMl7M8Fb-Ump9NRB90opNwmSpGSVzhBrOiY7Wo86i7vBVQezXvzdlk8DkaCDk2CULAkP7rh1ww6vMIbF5ZULtDQplOClXwWzP0rEf2HS9a"
                      alt="User"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">+45</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Upcoming Events Feed/Grid -->
        <section>
          <div class="flex justify-between items-end mb-6">
            <h2 class="font-headline font-extrabold text-xl md:text-2xl tracking-tight text-slate-900 dark:text-white">Próximos Eventos</h2>
            <a href="#" class="text-sky-600 dark:text-sky-400 font-bold text-sm hover:underline">Ver Todos</a>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <!-- Event Card 1 -->
            <div
              class="bg-white dark:bg-[#1b2024] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-sky-500/50 transition-all flex gap-4 md:gap-5 group cursor-pointer active:scale-[0.99]"
            >
              <div class="w-20 md:w-24 shrink-0 flex flex-col">
                <div class="w-full aspect-square rounded-xl overflow-hidden mb-2 hidden sm:block">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ8RX8q2tkKtH-Wx-PnTe1bS4-Gd44yvR5Swxz3CztefEAV8-ZTgJHnAXfwx_0TQkfXmmM2Qp3-DNJMNnPgI2TsneyteJdWx2GwoKu8VGIgnOlSEKOjZxI92_TvuU7rp0IGkeqVqln9Oo9KBWjelSb2lo_YJj3EVMShxRdhdIU5TbR9rU_i_ByYeJgDx6E7ITFxUxykIG3i7iLAAyZIvSC8nK_Q3_TfinVoa7RwLy6Cdb3pb8iTuRxR5pwfraKwLJ4QV8sOEQ1"
                    alt="Event"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  class="flex flex-col items-center justify-center bg-slate-50 dark:bg-[#171c20] rounded-xl border border-slate-100 dark:border-slate-800 py-2 h-full sm:h-auto"
                >
                  <span class="text-sky-600 dark:text-sky-400 font-headline font-black text-xl md:text-2xl leading-none">28</span>
                  <span class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">OCT</span>
                </div>
              </div>
              <div class="flex flex-col flex-grow justify-center">
                <span class="text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mb-1">Académico</span>
                <h4
                  class="font-headline font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
                >
                  UI/UX Design Masterclass
                </h4>
                <div class="flex flex-col gap-1 mt-auto">
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">schedule</span> 14:30 - 16:00
                  </div>
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">location_on</span> Design Lab B-204
                  </div>
                </div>
              </div>
              <button class="self-start text-slate-400 hover:text-sky-500 transition-colors p-1">
                <span class="material-symbols-outlined">bookmark_border</span>
              </button>
            </div>

            <!-- Event Card 2 -->
            <div
              class="bg-white dark:bg-[#1b2024] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-sky-500/50 transition-all flex gap-4 md:gap-5 group cursor-pointer active:scale-[0.99]"
            >
              <div class="w-20 md:w-24 shrink-0 flex flex-col">
                <div class="w-full aspect-square rounded-xl overflow-hidden mb-2 hidden sm:block">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZTcMEHnAzgLFmwKj-Fkthknyqx0rDxnV9OVKQlb66MXImV3UKW8i-YFKBc9iNqhskS0v20Kb4i4_xhu_wimT2Xd7z_CC3uY5arbpbiGCrWGZ42G1mmx0lzoVh7N9MYaIKcMqLOGJdQ8bS3UfQiaRwfdSe6BDC4N03W_CwOz6ILcK8DwwZZq4b_Mdve2jN9MJn1XkAwavu-uIYmFNrirpjb3eANx72fCvP9wJM7TOMup0vbPys46NTm_YQXhbLLpQGrwEW0Kr-"
                    alt="Event"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  class="flex flex-col items-center justify-center bg-slate-50 dark:bg-[#171c20] rounded-xl border border-slate-100 dark:border-slate-800 py-2 h-full sm:h-auto"
                >
                  <span class="text-sky-600 dark:text-sky-400 font-headline font-black text-xl md:text-2xl leading-none">02</span>
                  <span class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">NOV</span>
                </div>
              </div>
              <div class="flex flex-col flex-grow justify-center">
                <span class="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Arte & Cultura</span>
                <h4
                  class="font-headline font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
                >
                  CineCUT: Proyección Local
                </h4>
                <div class="flex flex-col gap-1 mt-auto">
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">schedule</span> 19:30 - 21:00
                  </div>
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">location_on</span> Auditorio Central
                  </div>
                </div>
              </div>
              <button class="self-start text-sky-500 transition-colors p-1">
                <span class="material-symbols-outlined icon-filled">bookmark</span>
              </button>
            </div>

            <!-- Event Card 3 -->
            <div
              class="bg-white dark:bg-[#1b2024] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-sky-500/50 transition-all flex gap-4 md:gap-5 group cursor-pointer active:scale-[0.99]"
            >
              <div class="w-20 md:w-24 shrink-0 flex flex-col">
                <div
                  class="flex flex-col items-center justify-center bg-slate-50 dark:bg-[#171c20] rounded-xl border border-slate-100 dark:border-slate-800 py-2 h-full"
                >
                  <span class="text-sky-600 dark:text-sky-400 font-headline font-black text-xl md:text-2xl leading-none">05</span>
                  <span class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">NOV</span>
                </div>
              </div>
              <div class="flex flex-col flex-grow justify-center">
                <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Ciencia</span>
                <h4
                  class="font-headline font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
                >
                  IA en Medicina Moderna
                </h4>
                <div class="flex flex-col gap-1 mt-auto">
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">schedule</span> 10:00 - 12:00
                  </div>
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">location_on</span> Aula Magna
                  </div>
                </div>
              </div>
              <button class="self-start text-slate-400 hover:text-sky-500 transition-colors p-1">
                <span class="material-symbols-outlined">bookmark_border</span>
              </button>
            </div>

            <!-- Event Card 4 -->
            <div
              class="bg-white dark:bg-[#1b2024] rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-sky-500/50 transition-all flex gap-4 md:gap-5 group cursor-pointer active:scale-[0.99]"
            >
              <div class="w-20 md:w-24 shrink-0 flex flex-col">
                <div class="w-full aspect-square rounded-xl overflow-hidden mb-2 hidden sm:block">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuARgjdcF7yooVn059mg0wvBzvKwxop01wbHa8u2KyEG7C5O0mzfkagTcoUgA2EaVhAA-NeK5eQVsyXmmvWUN4B2F2jxrwfbntDbbEp_OWjy9xdoi2dn-8WQ0qhzP3D-cHyWh4BsO1n1f8JhEuRn6CL-2BgoxARFwhmA45BL4-xSrOxBX9UgGS9U16KaRYrDzEUhdnATOx8ICq6ayUEZ680rPEg6DpZPmm7Yb7-v1Djwge7hLRKCG0BjCZlG7PPtSXcMThSQwFnz"
                    alt="Event"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  class="flex flex-col items-center justify-center bg-slate-50 dark:bg-[#171c20] rounded-xl border border-slate-100 dark:border-slate-800 py-2 h-full sm:h-auto"
                >
                  <span class="text-sky-600 dark:text-sky-400 font-headline font-black text-xl md:text-2xl leading-none">12</span>
                  <span class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">NOV</span>
                </div>
              </div>
              <div class="flex flex-col flex-grow justify-center">
                <span class="text-[10px] font-bold text-blue-600 dark:text-sky-400 uppercase tracking-widest mb-1">Deportes</span>
                <h4
                  class="font-headline font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
                >
                  Finales Baloncesto Intersedes
                </h4>
                <div class="flex flex-col gap-1 mt-auto">
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">schedule</span> 17:00 - 20:00
                  </div>
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <span class="material-symbols-outlined text-[14px]">location_on</span> Domo Deportivo
                  </div>
                </div>
              </div>
              <button class="self-start text-slate-400 hover:text-sky-500 transition-colors p-1">
                <span class="material-symbols-outlined">bookmark_border</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- RIGHT SIDEBAR (Widget Calendario - Desktop Only) -->
    <aside
      class="hidden xl:flex flex-col fixed right-0 top-20 h-[calc(100vh-5rem)] w-[22rem] bg-white dark:bg-[#13181c] p-6 border-l border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-none transition-colors duration-300"
    >
      <!-- Calendar Header -->
      <div class="mb-6">
        <h3 class="font-headline font-extrabold text-lg text-slate-900 dark:text-white mb-4 flex items-center justify-between">
          <span>Octubre 2024</span>
          <span class="flex gap-1">
            <button class="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1b2024] rounded-full text-slate-500 transition-colors">
              <span class="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button class="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1b2024] rounded-full text-slate-500 transition-colors">
              <span class="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </span>
        </h3>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-y-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          <div>Lu</div>
          <div>Ma</div>
          <div>Mi</div>
          <div>Ju</div>
          <div>Vi</div>
          <div>Sa</div>
          <div>Do</div>
        </div>
        <div class="grid grid-cols-7 gap-y-1 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
          <div class="p-1.5 text-slate-300 dark:text-slate-600">30</div>
          <div class="p-1.5">1</div>
          <div class="p-1.5">2</div>
          <div class="p-1.5">3</div>
          <div class="p-1.5">4</div>
          <div class="p-1.5">5</div>
          <div class="p-1.5 text-slate-400">6</div>
          <div class="p-1.5">7</div>
          <div class="p-1.5">8</div>
          <div class="p-1.5">9</div>
          <div class="p-1.5">10</div>
          <div class="p-1.5">11</div>
          <div class="p-1.5">12</div>
          <div class="p-1.5 text-slate-400">13</div>
          <div class="p-1.5">14</div>
          <div class="p-1.5">15</div>
          <div class="p-1.5">16</div>
          <div class="p-1.5">17</div>
          <div class="p-1.5">18</div>
          <div class="p-1.5">19</div>
          <div class="p-1.5 text-slate-400">20</div>
          <div class="p-1.5">21</div>
          <div class="p-1.5">22</div>
          <div class="p-1.5">23</div>
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-sky-600 dark:bg-sky-500 text-white dark:text-[#002e44] font-bold flex items-center justify-center z-10 shadow-md">24</div>
          </div>
          <div class="p-1.5">25</div>
          <div class="p-1.5">26</div>
          <div class="p-1.5 text-slate-400">27</div>
          <div class="relative flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <div class="p-1.5 font-bold text-sky-600 dark:text-sky-400">28</div>
            <div class="absolute w-1 h-1 bg-sky-500 rounded-full bottom-0.5"></div>
          </div>
          <div class="p-1.5">29</div>
          <div class="p-1.5">30</div>
          <div class="p-1.5">31</div>
          <div class="p-1.5 text-slate-300 dark:text-slate-600">1</div>
          <div class="p-1.5 text-slate-300 dark:text-slate-600">2</div>
          <div class="p-1.5 text-slate-300 dark:text-slate-600">3</div>
        </div>
      </div>

      <!-- Schedule List -->
      <div class="flex-grow overflow-y-auto custom-scrollbar pr-2 mt-2">
        <h4 class="font-headline font-bold text-[11px] text-slate-500 uppercase tracking-widest mb-4">Agenda Confirmada</h4>

        <div class="space-y-3">
          <div class="bg-slate-50 dark:bg-[#1b2024] rounded-xl p-3 border-l-4 border-sky-500 hover:bg-slate-100 dark:hover:bg-[#22282c] transition-colors cursor-pointer">
            <div class="flex justify-between items-start mb-1">
              <p class="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">Hoy • 17:00</p>
            </div>
            <h5 class="text-sm font-bold text-slate-800 dark:text-white mb-0.5 leading-tight">Vibe Coding en Vivo</h5>
            <p class="text-[11px] text-slate-500 flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">location_on</span> Lab. Innovación B
            </p>
          </div>

          <div
            class="bg-slate-50 dark:bg-[#1b2024] rounded-xl p-3 border-l-4 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#22282c] transition-colors cursor-pointer"
          >
            <div class="flex justify-between items-start mb-1">
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mañana • 11:00</p>
            </div>
            <h5 class="text-sm font-bold text-slate-800 dark:text-white mb-0.5 leading-tight">Asesoría Proyectos</h5>
            <p class="text-[11px] text-slate-500 flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">location_on</span> Cubículo 12
            </p>
          </div>

          <div
            class="bg-slate-50 dark:bg-[#1b2024] rounded-xl p-3 border-l-4 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#22282c] transition-colors cursor-pointer"
          >
            <div class="flex justify-between items-start mb-1">
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">28 Oct • 19:30</p>
            </div>
            <h5 class="text-sm font-bold text-slate-800 dark:text-white mb-0.5 leading-tight">CineCUT Local</h5>
            <p class="text-[11px] text-slate-500 flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">location_on</span> Auditorio Central
            </p>
          </div>
        </div>
      </div>
    </aside>

    <!-- BOTTOM NAV BAR (Mobile Only) -->
    <nav
      class="fixed bottom-0 left-0 w-full md:hidden flex justify-around items-center px-4 pb-safe pt-2 bg-white/90 dark:bg-[#0f1418]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 h-20 transition-colors duration-300"
    >
      <a href="#" class="flex flex-col items-center justify-center text-sky-600 dark:text-[#88ceff] p-2">
        <div class="bg-sky-100 dark:bg-[#009bdb]/20 rounded-full px-4 py-1 mb-1">
          <span class="material-symbols-outlined icon-filled">event</span>
        </div>
        <span class="font-medium text-[10px]">Eventos</span>
      </a>
      <a
        href="#"
        class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-[#88ceff] transition-colors p-2"
      >
        <div class="px-4 py-1 mb-1">
          <span class="material-symbols-outlined">calendar_month</span>
        </div>
        <span class="font-medium text-[10px]">Agenda</span>
      </a>
      <a
        href="#"
        class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-[#88ceff] transition-colors p-2"
      >
        <div class="px-4 py-1 mb-1">
          <span class="material-symbols-outlined">search</span>
        </div>
        <span class="font-medium text-[10px]">Buscar</span>
      </a>
      <a
        href="#"
        class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-[#88ceff] transition-colors p-2"
      >
        <div class="px-4 py-1 mb-1">
          <span class="material-symbols-outlined">person</span>
        </div>
        <span class="font-medium text-[10px]">Perfil</span>
      </a>
    </nav>
  </div>
</template>


