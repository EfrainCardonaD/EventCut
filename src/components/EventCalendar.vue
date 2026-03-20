<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'March 2026',
  },
  days: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['select-day'])
</script>

<template>
  <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
    <div class="flex items-center justify-between mb-6">
      <button type="button" class="text-gray-400 hover:text-gray-600" aria-label="Mes anterior">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      <h3 class="font-semibold text-gray-900">{{ title }}</h3>
      <button type="button" class="text-gray-400 hover:text-gray-600" aria-label="Mes siguiente">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
      <div>Lun</div>
      <div>Mar</div>
      <div>Mié</div>
      <div>Jue</div>
      <div>Vie</div>
      <div>Sáb</div>
      <div>Dom</div>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-sm">
      <div
        v-for="(day, index) in days"
        :key="index"
        @click="emit('select-day', day)"
        :class="[
          'p-2 rounded-lg cursor-pointer transition-colors relative',
          day.isCurrentMonth ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300',
          day.isSelected ? 'bg-brand text-white font-semibold shadow-sm shadow-blue-200 hover:bg-brand' : '',
          day.isToday ? 'border border-brand text-brand' : '',
        ]"
      >
        {{ day.numero }}
        <span
          v-if="day.hasEvent && !day.isSelected"
          class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-brand rounded-full"
        ></span>
      </div>
    </div>
  </div>
</template>

