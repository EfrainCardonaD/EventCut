<script setup>
import { RouterLink } from 'vue-router'
</script>
<template>
  <section class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-tertiary-700 dark:text-tertiary-300">404</p>
      <h1 class="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Página no encontrada</h1>
      <p class="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">La ruta que buscaste no existe o fue movida dentro de la nueva estructura del proyecto.</p>
      <RouterLink to="/" class="mt-6 inline-flex rounded-2xl bg-tertiary-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-tertiary-600">Volver al inicio</RouterLink>
    </div>
  </section>
</template>
