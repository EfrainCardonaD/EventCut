<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="flex items-center gap-3 text-sm">
    <RouterLink to="/" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Inicio</RouterLink>
    <RouterLink to="/auth/login" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Entrar</RouterLink>
  </nav>
</template>

