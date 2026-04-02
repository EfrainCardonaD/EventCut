<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const userName = computed(() => auth.username || auth.user?.firstName || 'Invitado')
</script>
<template>
  <section class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-primary-600">Panel</p>
      <h1 class="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">Bienvenido, {{ userName }}</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">Este es un punto de partida para administrar eventos, revisar solicitudes y continuar expandiendo la experiencia de EventCut.</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <RouterLink to="/" class="rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700">Ver landing pública</RouterLink>
        <button type="button" class="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900" @click="auth.logout()">Cerrar sesión</button>
      </div>
    </div>
  </section>
</template>
