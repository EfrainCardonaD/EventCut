<script setup>
defineProps({
  evento: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div
    class="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5 sm:gap-6 hover:shadow-md transition-shadow cursor-pointer"
  >
    <div class="flex flex-col items-center sm:min-w-[4rem]">
      <span class="text-2xl font-bold text-gray-900 leading-none">{{ evento.dia }}</span>
      <span class="text-sm font-medium text-gray-500 capitalize">{{ evento.mes }}</span>
    </div>

    <div class="flex-1 space-y-3">
      <div class="flex flex-wrap items-start gap-2.5">
        <h3 class="text-lg font-semibold text-gray-900 leading-tight">{{ evento.titulo }}</h3>
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-brand border border-blue-100">
          {{ evento.categoria }}
        </span>
        <span
          v-if="evento.requiereAprobacion"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
        >
          Requiere aprobación
        </span>
      </div>

      <p class="text-sm text-gray-500">{{ evento.horario }}</p>

      <p class="text-sm text-gray-600 flex items-center gap-1.5">
        <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clip-rule="evenodd"
          ></path>
        </svg>
        {{ evento.ubicacion }}
      </p>

      <p class="text-sm text-gray-600 line-clamp-2">{{ evento.descripcion }}</p>

      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          ></path>
        </svg>
        {{ evento.asistentes }} Asistentes
      </div>
    </div>

    <div
      v-if="evento.imagen"
      class="w-full sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 mt-4 sm:mt-0 border border-gray-100 shadow-sm"
    >
      <img
        :src="evento.imagen"
        :alt="evento.titulo"
        class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
      />
    </div>
  </div>
</template>

