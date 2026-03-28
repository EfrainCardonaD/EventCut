<script setup>
import { reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const feedback = reactive({ type: '', message: '' })
const submit = async () => {
  feedback.type = ''
  feedback.message = ''
  if (!form.username || !form.password) {
    feedback.type = 'error'
    feedback.message = 'Completa usuario y contraseña para continuar.'
    return
  }
  loading.value = true
  try {
    const result = await auth.login(form.username, form.password)
    if (result.success) {
      await router.push('/app')
      return
    }
    feedback.type = 'error'
    feedback.message = result.error || 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <section class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div class="mb-6 text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-brand">EventCut</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Iniciar sesión</h1>
      </div>
      <div v-if="feedback.message" class="mb-5 rounded-2xl border px-4 py-3 text-sm" :class="feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'">{{ feedback.message }}</div>
      <form class="space-y-4" @submit.prevent="submit">
        <label class="block"><span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Usuario o correo</span><input v-model="form.username" type="text" autocomplete="username" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="tu.usuario" /></label>
        <label class="block"><span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</span><input v-model="form.password" type="password" autocomplete="current-password" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="••••••••" /></label>
        <button type="submit" :disabled="loading" class="flex w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70">{{ loading ? 'Validando…' : 'Entrar' }}</button>
      </form>
      <div class="mt-6 flex items-center justify-between text-sm">
        <RouterLink to="/auth/forgot" class="text-brand hover:underline">¿Olvidaste tu contraseña?</RouterLink>
        <RouterLink to="/auth/register" class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Crear cuenta</RouterLink>
      </div>
    </div>
  </section>
</template>
