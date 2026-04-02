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
            ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
            : status === 'REJECTED'
              ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'
              : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
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

