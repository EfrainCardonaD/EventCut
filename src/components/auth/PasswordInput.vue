<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '••••••••' },
  autocomplete: { type: String, default: 'current-password' },
  showCheck: { type: Boolean, default: false },
  valid: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :passwordrules="autocomplete === 'new-password' ? 'minlength: 8; required: upper; required: lower; required: digit; required: special;' : undefined"
      class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <div class="absolute inset-y-0 right-3 flex items-center gap-1.5">
      <!-- Inline check mark when valid -->
      <Transition name="check-pop">
        <svg
          v-if="showCheck && valid"
          class="h-4.5 w-4.5 text-success-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
        </svg>
      </Transition>

      <!-- Eye toggle button -->
      <button
        type="button"
        tabindex="-1"
        class="p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        @click="visible = !visible"
      >
        <!-- Eye open -->
        <svg v-if="!visible" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <!-- Eye closed -->
        <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.check-pop-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.check-pop-leave-active {
  transition: all 0.15s ease;
}
.check-pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.check-pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
