<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  searchQuery: {
    type: String,
    default: '',
  },
  isAdminUser: {
    type: Boolean,
    default: false,
  },
  isCommunitiesRoute: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'update:searchQuery'])
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed bottom-24 left-3 right-3 z-50 rounded-2xl border border-slate-200 bg-slate-100/95 p-3 shadow-xl backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95"
  >
    <div class="relative">
      <input
        :value="searchQuery"
        type="text"
        placeholder="Buscar eventos por titulo, descripcion o sede"
        class="w-full rounded-full border border-transparent bg-slate-100 px-5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-tertiary-500"
        @input="emit('update:searchQuery', $event.target.value)"
      />
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label="Cerrar buscador"
        @click="emit('update:modelValue', false)"
      >
        <span class="material-symbols-outlined text-lg">close</span>
      </button>
    </div>

    <div class="mt-3 grid grid-cols-1 gap-2 text-xs">
      <RouterLink
        to="/app/comunidades"
        class="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
        @click="emit('update:modelValue', false)"
      >
        Ir a comunidades
      </RouterLink>
      <RouterLink
        v-if="isAdminUser"
        to="/app/admin"
        class="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
        @click="emit('update:modelValue', false)"
      >
        Ir a panel admin
      </RouterLink>
      <p v-if="isCommunitiesRoute" class="rounded-xl bg-primary-50 px-3 py-2 text-[11px] font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
        En comunidades, el boton Crear permite seleccionar/usar comunidad para nuevos eventos.
      </p>
    </div>
  </div>
</template>
