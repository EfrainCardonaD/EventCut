<template>
  <div v-if="error" class="mt-2">
    <p class="text-xs text-red-600 dark:text-red-400 flex items-center">
      <svg class="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
      </svg>
      <span class="font-medium">Error:</span>
      <span class="ml-1">{{ error }}</span>
    </p>
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: String,
    default: null
  }
})
</script>
