<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="flex items-center gap-3 text-sm">
    <RouterLink to="/" class="micro-accent-link text-gray-500 dark:text-gray-400">Inicio</RouterLink>
    <RouterLink to="/auth/login" class="micro-accent-link text-gray-500 dark:text-gray-400">Entrar</RouterLink>
  </nav>
</template>

