<script setup>
const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [Number, String, null],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const onSelectAll = () => {
  emit('update:modelValue', null)
}

const onSelectCategory = (categoryId) => {
  emit('update:modelValue', categoryId)
}
</script>

<template>
  <div class="mb-4">
    <div class="relative -mx-4 md:mx-0">
      <div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950 md:hidden"></div>
      <div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-950 md:hidden"></div>

      <div class="flex items-center gap-2 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          class="snap-start whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold shadow-sm sm:px-5 sm:text-sm"
          :class="modelValue === null ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-sky-950' : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'"
          @click="onSelectAll"
        >
          Todas
        </button>

        <button
          v-for="category in props.categories"
          :key="category.id"
          class="snap-start whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 sm:px-5 sm:text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          :class="Number(modelValue) === Number(category.id) ? '!bg-sky-600 !text-white dark:!bg-sky-500 dark:!text-sky-950' : ''"
          @click="onSelectCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>

    <p class="mt-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:hidden">
      <span class="material-symbols-outlined text-xs">swipe</span>
      Desliza para ver mas categorias
    </p>
  </div>
</template>

