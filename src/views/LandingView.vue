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
  <div class="bg-neutral-50 text-neutral-900 transition-colors duration-300 selection:bg-primary-500/30 overflow-x-hidden dark:bg-neutral-950 dark:text-neutral-100">
    <!-- TOP NAVIGATION BAR (Simplified for Landing) -->
    <header
      class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200 transition-colors duration-300 dark:bg-neutral-950/80 dark:border-neutral-800/60"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200 overflow-hidden shrink-0 dark:bg-neutral-900 dark:border-neutral-700"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCv_wZJRTi5DqAYEYwdDgsuxjSYEv-JB2T5_RsmC272YkWz9VF7QP0_z8ba8OQPFTf9nZdfmp9aMfEAP31PIkcYQQjrURZFSb3XFRT15H8QGOqRDkJYiYye8Yz9kw4Dl7fa2c4pX3fyyuf_YwQMM_Dsb6fyUSB7UKv_ffRcIVhwoIwK90cyXI0NOZ-jbcH4jAMAQRjNF3JSZEuCNbofZB0Ouir-TDGHU2nK4EdbvTZ_89I81eMyChjLX7IEz987Ynrup9A-IGhA"
              alt="CUTonalá Seal"
              class="w-8 h-8 object-contain"
            />
          </div>
          <span class="text-sm font-semibold uppercase tracking-[0.25em] text-primary-600 md:text-2xl hidden sm:block">EVENTCUT</span>
        </div>

        <!-- Desktop Nav Links -->
        <nav class="hidden md:flex gap-8 font-headline font-semibold text-sm">
          <a
            href="#caracteristicas"
            class="text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
            >Características</a
          >
          <a
            href="#comunidad"
            class="text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
            >Comunidad</a
          >
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="hidden sm:inline-flex size-10 items-center justify-center rounded-full p-2 text-neutral-600 transition-all hover:bg-neutral-100 active:scale-95 dark:text-neutral-300 dark:hover:bg-white/5"
            aria-label="Toggle Theme"
            @click="onToggleTheme"
          >
            <span class="material-symbols-outlined text-[22px] leading-none">{{ themeIcon }}</span>
          </button>

          <RouterLink
            to="/auth/login"
            class="hidden sm:block font-headline font-bold text-sm text-neutral-700 dark:text-neutral-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Iniciar Sesión
          </RouterLink>
          <RouterLink
            to="/auth/register"
            class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            Registrarse
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- HERO SECTION -->
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <!-- Background decorative elements -->
      <div
        class="absolute top-1/4 -left-64 w-96 h-96 rounded-full blur-3xl pointer-events-none bg-primary-500/20 dark:bg-primary-500/10"
      ></div>
      <div
        class="absolute bottom-0 -right-64 w-[30rem] h-[30rem] rounded-full blur-3xl pointer-events-none bg-secondary-500/10 dark:bg-secondary-400/10"
      ></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <!-- Value Proposition (Left) -->
          <div class="text-center lg:text-left">
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 border border-primary-200 text-primary-700 text-xs font-bold uppercase tracking-widest mb-6 dark:bg-primary-500/10 dark:border-primary-500/20 dark:text-primary-300"
            >
              <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              Plataforma Oficial CUTonalá
            </div>

            <h1
              class="font-headline font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mb-6 tracking-tight text-neutral-900 dark:text-white"
            >
              Toda tu vida universitaria en <br class="hidden lg:block" />
              <span class="bg-gradient-to-r from-primary-400 to-primary-800 bg-clip-text text-transparent dark:from-primary-300 dark:to-primary-600"
                >un solo lugar.</span
              >
            </h1>

            <p class="text-lg sm:text-xl mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed text-neutral-600 dark:text-neutral-400">
              Despídete de los correos perdidos y tableros saturados. Descubre conferencias, organiza tu agenda y conecta con
              eventos de ingeniería, arte y deportes al instante.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <RouterLink
                to="/app"
                class="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-primary-500 dark:hover:bg-primary-400 text-white dark:text-primary-950 px-8 py-4 rounded-full font-bold text-base shadow-xl active:scale-95 transition-all"
              >
                Explorar Eventos
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </RouterLink>
              <a
                href="#caracteristicas"
                class="flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 px-8 py-4 rounded-full font-bold text-base active:scale-95 transition-all"
              >
                Conocer más
              </a>
            </div>

            <!-- Social Proof -->
            <div class="mt-10 flex items-center justify-center lg:justify-start gap-4">
              <div class="flex -space-x-3">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5EmC1nL-LMgpd8yRLkg1dSHPv8LUPCho4gbBCbZyCJ3zxFUAqfJriAHIT2UHwhcZpPFGOzXNcWUCWGBfuIfkLl7Bim8ATC4qySNceUvwt6wJcYvjnNLk01Qj7wOhmkcZvdCLPwg9dekjn7zS-LyGH46FgrrVHIfk7rBbT4_772MfLvzCQRWlaDoOfAhc0I2HP4m7S9X4oxzHLT9bEa9OeUTR0pexYgxdwVWbmETMaPspZvZiHYjVxOW8KMTmqDajXfEJr6QIW"
                  class="w-10 h-10 rounded-full border-2 border-neutral-50 dark:border-neutral-950 object-cover"
                  alt="Student"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhSf-RIompDizabHYY8vXy6HJIAu3g-OPJVBlMAoM2zr-TJet4NIpb8ffc194qVOZ0K6GfROjl2T_8faDO5Tl3QULkSRUJIzpq1niV7Jxe7fhz906vfMdMuJIlGxowHn8pyK1tiyAGg9j7HJ4gOLCGzzk0y87ky9MMl7M8Fb-Ump9NRB90opNwmSpGSVzhBrOiY7Wo86i7vBVQezXvzdlk8DkaCDk2CULAkP7rh1ww6vMIbF5ZULtDQplOClXwWzP0rEf2HS9a"
                  class="w-10 h-10 rounded-full border-2 border-neutral-50 dark:border-neutral-950 object-cover"
                  alt="Student"
                />
                <div
                  class="w-10 h-10 rounded-full border-2 border-neutral-50 dark:border-neutral-950 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-white"
                >
                  +2k
                </div>
              </div>
              <p class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Estudiantes activos <br />este semestre.</p>
            </div>
          </div>

          <!-- Hero Visual (Right) -->
          <div class="relative lg:ml-10">
            <!-- Main visual card -->
            <div
              class="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-900/40 aspect-[4/3] transform rotate-2 hover:rotate-0 transition-transform duration-500"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJC9NKFznMIKCRg4qCx1mFEPmcEfhbPnGQqgiGwPnddqIO2N9G3cRt9wFB3l9csjQEKqhhlnBSfHE7A-Fbalr3XX1JiHcRoglQXhzhoQ1Yk4Gfg-B2VXzBacfXnuCM55jsfwUJWtRp6H0pCOxBDBOEkvP-NhEYylXjNayAgu8WMwNcYO9oX4ovwcqszGET-HHh3hTpqD2dZv1xMHUgh-tEjkKjKwAtBzbG9mhgEH3qPUCtKqL-w3qBgYZeVtIGJo3AXbSZYkbX"
                alt="Plataforma CampusEvents"
                class="w-full h-full object-cover opacity-90 dark:opacity-70"
              />

              <!-- Floating UI Element to show it's an app -->
              <div
                class="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-neutral-950/70 backdrop-blur-md rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center gap-4"
              >
                <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex flex-col items-center justify-center shrink-0">
                  <span class="font-headline font-black text-primary-600 dark:text-primary-400 leading-none">24</span>
                  <span class="text-[8px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-widest">OCT</span>
                </div>
                <div>
                  <h4 class="font-headline font-bold text-sm text-neutral-900 dark:text-white">Vibe Coding en Vivo</h4>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Lab. Innovación B • 17:00 hrs</p>
                </div>
                <div class="ml-auto w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary-600 dark:text-primary-400 text-sm icon-filled">check_circle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES SECTION -->
    <section id="caracteristicas" class="py-20 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="font-headline font-extrabold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-4">Diseñado para la agilidad académica</h2>
          <p class="text-lg text-slate-600 dark:text-slate-400">
            Automatiza tu rutina. Pasa menos tiempo buscando en dónde será tu próxima conferencia y más tiempo aprendiendo y haciendo networking.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div
            class="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:shadow-lg dark:hover:border-sky-500/30 transition-all group"
          >
            <div class="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-sky-600 dark:text-sky-400 text-3xl icon-filled">travel_explore</span>
            </div>
            <h3 class="font-headline font-bold text-xl text-slate-900 dark:text-white mb-3">Descubrimiento Inteligente</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Filtros potentes por facultad, tipo de evento o intereses. Encuentra exactamente lo que buscas sin ruido ni distracciones.
            </p>
          </div>

          <!-- Feature 2 -->
          <div
            class="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:shadow-lg dark:hover:border-indigo-500/30 transition-all group"
          >
            <div
              class="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
            >
              <span class="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-3xl icon-filled">calendar_sync</span>
            </div>
            <h3 class="font-headline font-bold text-xl text-slate-900 dark:text-white mb-3">Sincronización de Agenda</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Añade eventos con un clic. Recibe notificaciones automáticas antes de que inicien y evita empalmes con tus clases regulares.
            </p>
          </div>

          <!-- Feature 3 -->
          <div
            class="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:shadow-lg dark:hover:border-emerald-500/30 transition-all group"
          >
            <div
              class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
            >
              <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-3xl icon-filled">forum</span>
            </div>
            <h3 class="font-headline font-bold text-xl text-slate-900 dark:text-white mb-3">Networking Integrado</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Mira quiénes asistirán a los eventos. Conecta con perfiles de tu misma carrera, forma equipos para talleres y amplía tu red profesional.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- METRICS / PROOF SECTION -->
    <section id="comunidad" class="py-20 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="bg-sky-600 dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-16 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-10 overflow-hidden relative border dark:border-slate-800"
        >
          <!-- Background decoration for dark mode -->
          <div class="hidden dark:block absolute top-0 right-0 w-full h-full bg-gradient-to-r from-transparent to-sky-900/20 pointer-events-none"></div>

          <div class="relative z-10 max-w-xl">
            <h2 class="font-headline font-extrabold text-3xl sm:text-4xl text-white mb-4">La comunidad universitaria te espera.</h2>
            <p class="text-sky-100 dark:text-slate-300 text-lg">
              Centralizamos la información para que la participación aumente. Resultados cuantificables en la adopción del campus.
            </p>
          </div>

          <div class="relative z-10 flex flex-wrap justify-center lg:justify-end gap-8 md:gap-12 w-full lg:w-auto">
            <div class="text-center">
              <span class="block font-headline font-black text-4xl md:text-5xl text-white mb-1">500+</span>
              <span class="text-sky-200 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Eventos Anuales</span>
            </div>
            <div class="text-center">
              <span class="block font-headline font-black text-4xl md:text-5xl text-white mb-1">8k</span>
              <span class="text-sky-200 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Usuarios Activos</span>
            </div>
            <div class="text-center">
              <span class="block font-headline font-black text-4xl md:text-5xl text-white mb-1">100%</span>
              <span class="text-sky-200 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Gratuito</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CALL TO ACTION SECTION -->
    <section class="py-24 text-center">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 class="font-headline font-black text-4xl md:text-5xl text-slate-900 dark:text-white mb-6">¿Listo para optimizar tu tiempo?</h2>
        <p class="text-lg text-slate-600 dark:text-slate-400 mb-10">
          Únete hoy mismo utilizando tu correo institucional. Configura tus intereses en menos de un minuto.
        </p>
        <RouterLink
          to="/auth/register"
          class="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-sky-950 px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-sky-500/20 active:scale-95 transition-all"
        >
          Crear cuenta gratis
          <span class="material-symbols-outlined">how_to_reg</span>
        </RouterLink>
        <p class="mt-6 text-sm text-slate-500 dark:text-slate-500">
          ¿Ya tienes una cuenta?
          <RouterLink to="/auth/login" class="text-sky-600 dark:text-sky-400 font-bold hover:underline">Inicia sesión aquí</RouterLink>.
        </p>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-3">
          <span class="font-headline font-bold text-slate-900 dark:text-white text-xl">CampusEvents</span>
          <span class="text-slate-400">|</span>
          <span class="text-slate-500 text-sm">CUTonalá © 2026</span>
        </div>

        <div class="flex gap-6 text-sm font-medium">
          <a href="#" class="text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Soporte técnico</a>
          <a href="#" class="text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Privacidad</a>
          <a href="#" class="text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Términos</a>
        </div>
      </div>
    </footer>
  </div>
</template>

