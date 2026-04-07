<script setup>
import { onMounted, ref } from 'vue'
import EventCutLogo from '@/components/icons/EventCutLogo.vue'
import { toggleTheme } from '@/utils/theme'
import HeroSvg from '@/assets/hero-abstract.svg'

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
  <div
    class="min-h-screen bg-neutral-50 text-neutral-900 transition-colors duration-500 selection:bg-tertiary-400/30 overflow-x-hidden dark:bg-neutral-950 dark:text-neutral-100"
  >
    <!-- ─── HEADER ─── -->
    <header
      class="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl transition-colors duration-300 dark:bg-neutral-950/70"
    >
      <div class="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
        <!-- Logo -->
        <EventCutLogo
          :wordmark-class="'hidden h-6 w-auto object-contain sm:block'"
          :logo-class="'w-9 h-9 flex items-center justify-center shrink-0'"
          :img-class="'w-9 h-9 object-contain'"
        />

        <!-- Nav -->
        <nav class="hidden md:flex gap-10 font-body text-[13px] font-medium tracking-wide uppercase">
          <a
            href="#caracteristicas"
            class="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
          >Características</a>
          <a
            href="#comunidad"
            class="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
          >Comunidad</a>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="size-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors duration-200"
            aria-label="Toggle Theme"
            @click="onToggleTheme"
          >
            <span class="material-symbols-outlined text-[20px] leading-none">{{ themeIcon }}</span>
          </button>

          <RouterLink
            to="/auth/login"
            class="hidden sm:block text-[13px] font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors duration-200 px-4"
          >
            Iniciar Sesión
          </RouterLink>
          <RouterLink
            to="/auth/register"
            class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2 rounded-full text-[13px] font-semibold hover:opacity-80 active:scale-[0.97] transition-all duration-200"
          >
            Registrarse
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- ─── HERO ─── -->
    <section class="relative pt-36 pb-24 lg:pt-48 lg:pb-40">
      <!-- Ambient glow (background) -->
      <div
        class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[36rem] rounded-full blur-[120px] opacity-30 pointer-events-none bg-gradient-to-br from-primary-400 via-secondary-300 to-tertiary-300 dark:opacity-15"
      ></div>

      <div class="max-w-6xl mx-auto px-6 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-10 items-center">

          <!-- Copy -->
          <div class="text-center lg:text-left">
            <span
              class="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 mb-6"
            >
              Plataforma CUTonalá
            </span>

            <h1
              class="font-headline font-extrabold text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.08] tracking-tight text-neutral-900 dark:text-white mb-6"
            >
              Tus eventos y comunidades,
              <span
                class="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-secondary-400"
              >en un solo lugar.</span>
            </h1>

            <p
              class="text-base sm:text-lg leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto lg:mx-0 mb-10"
            >
              Despídete de los mensajes perdidos en WhatsApp. Descubre conferencias,
              organiza tu agenda y conecta con la comunidad estudiantil al instante.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <RouterLink
                to="/app"
                class="group inline-flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-85 active:scale-[0.97] transition-all duration-200"
              >
                Explorar Eventos
                <span
                  class="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform duration-200"
                >arrow_forward</span>
              </RouterLink>
              <a
                href="#caracteristicas"
                class="inline-flex items-center justify-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors duration-200 px-4 py-3.5"
              >
                Conocer más
                <span class="material-symbols-outlined text-[14px]">expand_more</span>
              </a>
            </div>

            <!-- Social proof -->
            <div class="mt-14 flex items-center justify-center lg:justify-start gap-4">
              <div class="flex -space-x-2.5">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5EmC1nL-LMgpd8yRLkg1dSHPv8LUPCho4gbBCbZyCJ3zxFUAqfJriAHIT2UHwhcZpPFGOzXNcWUCWGBfuIfkLl7Bim8ATC4qySNceUvwt6wJcYvjnNLk01Qj7wOhmkcZvdCLPwg9dekjn7zS-LyGH46FgrrVHIfk7rBbT4_772MfLvzCQRWlaDoOfAhc0I2HP4m7S9X4oxzHLT9bEa9OeUTR0pexYgxdwVWbmETMaPspZvZiHYjVxOW8KMTmqDajXfEJr6QIW"
                  class="w-8 h-8 rounded-full border-2 border-neutral-50 dark:border-neutral-950 object-cover"
                  alt="Estudiante"
                />
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhSf-RIompDizabHYY8vXy6HJIAu3g-OPJVBlMAoM2zr-TJet4NIpb8ffc194qVOZ0K6GfROjl2T_8faDO5Tl3QULkSRUJIzpq1niV7Jxe7fhz906vfMdMuJIlGxowHn8pyK1tiyAGg9j7HJ4gOLCGzzk0y87ky9MMl7M8Fb-Ump9NRB90opNwmSpGSVzhBrOiY7Wo86i7vBVQezXvzdlk8DkaCDk2CULAkP7rh1ww6vMIbF5ZULtDQplOClXwWzP0rEf2HS9a"
                  class="w-8 h-8 rounded-full border-2 border-neutral-50 dark:border-neutral-950 object-cover"
                  alt="Estudiante"
                />
                <div
                  class="w-8 h-8 rounded-full border-2 border-neutral-50 dark:border-neutral-950 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500 dark:text-neutral-300"
                >
                  +2k
                </div>
              </div>
              <p class="text-xs text-neutral-400 dark:text-neutral-500">
                Estudiantes activos este semestre
              </p>
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="relative flex justify-center lg:justify-end">
            <img
              :src="HeroSvg"
              alt="EventCut Platform"
              class="w-full max-w-[520px] h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FEATURES ─── -->
    <section id="caracteristicas" class="py-28 lg:py-36 relative">
      <!-- Faint divider line -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-neutral-200 dark:bg-neutral-800"></div>

      <div class="max-w-5xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-20">
          <h2
            class="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-neutral-900 dark:text-white mb-5"
          >
            Diseñado para la agilidad académica
          </h2>
          <p class="text-neutral-500 dark:text-neutral-400 text-base leading-relaxed">
            Pasa menos tiempo buscando y más tiempo aprendiendo.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-10">
          <!-- Feature 1 -->
          <div class="text-center md:text-left group">
            <div
              class="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center mx-auto md:mx-0 mb-5 group-hover:scale-110 transition-transform duration-300"
            >
              <span class="material-symbols-outlined text-primary-500 dark:text-primary-400 text-2xl icon-filled"
              >travel_explore</span>
            </div>
            <h3 class="font-headline font-bold text-lg text-neutral-900 dark:text-white mb-2">
              Descubrimiento inteligente
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Filtros potentes por facultad, tipo de evento o intereses.
              Encuentra exactamente lo que buscas sin ruido.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="text-center md:text-left group">
            <div
              class="w-12 h-12 rounded-2xl bg-secondary-100 dark:bg-secondary-500/10 flex items-center justify-center mx-auto md:mx-0 mb-5 group-hover:scale-110 transition-transform duration-300"
            >
              <span class="material-symbols-outlined text-secondary-500 dark:text-secondary-400 text-2xl icon-filled"
              >event_available</span>
            </div>
            <h3 class="font-headline font-bold text-lg text-neutral-900 dark:text-white mb-2">
              Sincronización de agenda
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Añade eventos con un clic. Recibe notificaciones automáticas
              y evita empalmes con tus clases.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="text-center md:text-left group">
            <div
              class="w-12 h-12 rounded-2xl bg-tertiary-100 dark:bg-tertiary-500/10 flex items-center justify-center mx-auto md:mx-0 mb-5 group-hover:scale-110 transition-transform duration-300"
            >
              <span class="material-symbols-outlined text-tertiary-500 dark:text-tertiary-400 text-2xl icon-filled"
              >forum</span>
            </div>
            <h3 class="font-headline font-bold text-lg text-neutral-900 dark:text-white mb-2">
              Networking integrado
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Conecta con perfiles de tu carrera, forma equipos
              y amplía tu red profesional.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── METRICS ─── -->
    <section id="comunidad" class="py-28 lg:py-36 relative">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-neutral-200 dark:bg-neutral-800"></div>

      <div class="max-w-5xl mx-auto px-6 text-center">
        <h2
          class="font-headline font-extrabold text-3xl sm:text-4xl tracking-tight text-neutral-900 dark:text-white mb-4"
        >
          La comunidad universitaria te espera.
        </h2>
        <p class="text-neutral-500 dark:text-neutral-400 text-base mb-20 max-w-xl mx-auto">
          Resultados cuantificables en la adopción del campus.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <span
              class="block font-headline font-black text-6xl md:text-7xl tracking-tight bg-gradient-to-br from-primary-500 to-primary-700 bg-clip-text text-transparent dark:from-primary-300 dark:to-primary-500 mb-2"
            >500+</span>
            <span class="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500"
            >Eventos anuales</span>
          </div>
          <div>
            <span
              class="block font-headline font-black text-6xl md:text-7xl tracking-tight bg-gradient-to-br from-secondary-500 to-secondary-700 bg-clip-text text-transparent dark:from-secondary-300 dark:to-secondary-500 mb-2"
            >8k</span>
            <span class="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500"
            >Usuarios activos</span>
          </div>
          <div>
            <span
              class="block font-headline font-black text-6xl md:text-7xl tracking-tight bg-gradient-to-br from-tertiary-500 to-tertiary-700 bg-clip-text text-transparent dark:from-tertiary-300 dark:to-tertiary-500 mb-2"
            >100%</span>
            <span class="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500"
            >Gratuito</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CTA ─── -->
    <section class="py-28 lg:py-36 text-center relative">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-neutral-200 dark:bg-neutral-800"></div>

      <div class="max-w-2xl mx-auto px-6">
        <h2
          class="font-headline font-extrabold text-3xl md:text-5xl tracking-tight text-neutral-900 dark:text-white mb-5"
        >
          ¿Listo para optimizar tu tiempo?
        </h2>
        <p class="text-base text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed">
          Únete hoy con tu correo institucional. Configura tus intereses en menos de un minuto.
        </p>
        <RouterLink
          to="/auth/register"
          class="group inline-flex items-center justify-center gap-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-10 py-4 rounded-full text-base font-semibold hover:opacity-85 active:scale-[0.97] transition-all duration-200 shadow-xl shadow-neutral-900/10 dark:shadow-white/5"
        >
          Crear cuenta gratis
          <span
            class="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform duration-200"
          >arrow_forward</span>
        </RouterLink>
        <p class="mt-6 text-sm text-neutral-400 dark:text-neutral-500">
          ¿Ya tienes una cuenta?
          <RouterLink
            to="/auth/login"
            class="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
          >Inicia sesión</RouterLink>.
        </p>
      </div>
    </section>

    <!-- ─── FOOTER ─── -->
    <footer class="border-t border-neutral-100 dark:border-neutral-800/50 py-10">
      <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-3">
          <EventCutLogo
            :wordmark-class="'h-5 w-auto object-contain'"
            :logo-class="'w-8 h-8 flex items-center justify-center shrink-0'"
            :img-class="'w-8 h-8 object-contain'"
          />
          <span class="text-neutral-300 dark:text-neutral-700">|</span>
          <span class="text-neutral-400 dark:text-neutral-500 text-xs">CUTonalá © 2026</span>
        </div>

        <div class="flex gap-8 text-xs font-medium">
          <a href="#" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200">Soporte</a>
          <a href="#" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200">Privacidad</a>
          <a href="#" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200">Términos</a>
        </div>
      </div>
    </footer>
  </div>
</template>
