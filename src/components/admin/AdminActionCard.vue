<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
      </div>
      <span
        v-if="status"
        class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
        :class="
          status === 'ACTIVE'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : status === 'REJECTED'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        "
      >
        {{ status }}
      </span>
    </div>

    <div class="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
      <slot name="meta" />
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </article>
</template>

