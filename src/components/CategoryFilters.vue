<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const toggleCategory = (catId) => {
  const next = props.modelValue.map((c) => (c.id === catId ? { ...c, selected: !c.selected } : c))
  emit('update:modelValue', next)
}
</script>

<template>
  <section class="px-2">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Categorías</h3>
    <div class="space-y-3">
      <label v-for="cat in modelValue" :key="cat.id" class="flex items-center gap-3 cursor-pointer group">
        <div class="relative flex items-center justify-center">
          <input
            type="checkbox"
            :checked="cat.selected"
            @change="toggleCategory(cat.id)"
            class="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand cursor-pointer appearance-none border checked:bg-brand checked:border-brand transition-colors"
          />
          <svg
            v-if="cat.selected"
            class="w-3.5 h-3.5 text-white absolute pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <span class="text-gray-700 group-hover:text-gray-900 transition-colors" :class="{ 'font-medium': cat.selected }">
          {{ cat.nombre }}
        </span>
      </label>
    </div>
  </section>
</template>

