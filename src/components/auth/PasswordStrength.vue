<script setup>
import { computed } from 'vue'

const props = defineProps({
  password: { type: String, default: '' },
})

const rules = computed(() => [
  { label: '8 caracteres o más', met: props.password.length >= 8 },
  { label: 'Al menos 1 mayúscula (A-Z)', met: /[A-Z]/.test(props.password) },
  { label: 'Al menos 1 minúscula (a-z)', met: /[a-z]/.test(props.password) },
  { label: 'Al menos 1 número (0-9)', met: /\d/.test(props.password) },
  { label: 'Al menos 1 símbolo (ej. !@#$)', met: /[^A-Za-z\d]/.test(props.password) },
])

const allMet = computed(() => rules.value.every((r) => r.met))
const dirty = computed(() => props.password.length > 0)
</script>

<template>
  <div v-if="dirty" class="mt-2 space-y-1">
    <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Requisitos de seguridad:</p>

    <ul class="space-y-0.5">
      <li
        v-for="rule in rules"
        :key="rule.label"
        class="flex items-center gap-1.5 text-xs transition-colors duration-200"
        :class="rule.met
          ? 'text-success-600 dark:text-success-400'
          : 'text-slate-400 dark:text-slate-500'"
      >
        <!-- Check icon -->
        <svg v-if="rule.met" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
        </svg>
        <!-- Circle icon -->
        <svg v-else class="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <span>{{ rule.label }}</span>
      </li>
    </ul>

    <p
      class="text-xs font-medium transition-colors duration-200"
      :class="allMet
        ? 'text-success-600 dark:text-success-400'
        : 'text-tertiary-600 dark:text-tertiary-400'"
    >
      {{ allMet ? 'Contraseña segura.' : 'Completa los requisitos.' }}
    </p>
  </div>
</template>
