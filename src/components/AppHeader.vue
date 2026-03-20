<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: {
    type: String,
    required: true,
    validator: (v) => ['inicio', 'eventos'].includes(v),
  },
})

const emit = defineEmits(['navigate'])

const isInicio = computed(() => props.current === 'inicio')
const isEventos = computed(() => props.current === 'eventos')
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between gap-3 py-3">
        <div class="flex items-center gap-5 sm:gap-7">
          <img
            src="https://ui-avatars.com/api/?name=U&background=f3f4f6&color=6b7280&size=32"
            alt="Avatar Usuario"
            class="w-8 h-8 rounded-full cursor-pointer border border-gray-200 object-cover"
            @click="emit('navigate', 'inicio')"
          />

          <nav class="hidden md:flex items-center gap-6">
            <button
              type="button"
              @click="emit('navigate', 'inicio')"
              :class="[isInicio ? 'font-semibold text-black' : 'text-gray-500 hover:text-gray-900', 'text-sm']"
            >
              Inicio
            </button>
            <button
              type="button"
              @click="emit('navigate', 'eventos')"
              :class="[isEventos ? 'font-semibold text-black' : 'text-gray-500 hover:text-gray-900', 'text-sm']"
            >
              Eventos
            </button>
          </nav>
        </div>

        <div class="hidden lg:block flex-1 max-w-lg px-2 lg:px-6">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              class="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-gray-50"
              placeholder="Busca el evento"
            />
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="text-sm font-medium text-gray-700 hover:text-black hidden sm:inline-flex items-center px-3 py-2 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Crear evento
          </button>
          <button
            type="button"
            class="bg-brand hover:bg-brand-hover text-white text-sm font-medium py-2 px-5 rounded-full transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

