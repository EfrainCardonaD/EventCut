<script setup>
import { reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', email: '', firstName: '', lastName: '', password: '' })
const loading = ref(false)
const feedback = reactive({ type: '', message: '' })
const submit = async () => {
  feedback.type = ''
  feedback.message = ''
  if (!form.username || !form.email || !form.firstName || !form.lastName || !form.password) {
    feedback.type = 'error'
    feedback.message = 'Completa todos los campos para continuar con el registro.'
    return
  }
  loading.value = true
  try {
    const result = await auth.register(form)
    if (result.success) {
      await router.push('/auth/login')
      return
    }
    feedback.type = 'error'
    feedback.message = result.error || 'No se pudo completar el registro.'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <section class="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
    <div class="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div class="mb-6 text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-brand">EventCut</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Crear cuenta</h1>
      </div>
      <div v-if="feedback.message" class="mb-5 rounded-2xl border px-4 py-3 text-sm" :class="feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'">{{ feedback.message }}</div>
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="block"><span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Usuario</span><input v-model="form.username" type="text" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="eventcut_admin" /></label>
        <label class="block"><span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo</span><input v-model="form.email" type="email" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="admin@cutonala.mx" /></label>
        <label class="block"><span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</span><input v-model="form.firstName" type="text" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="Ana" /></label>
        <label class="block"><span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</span><input v-model="form.lastName" type="text" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="González" /></label>
        <label class="block md:col-span-2"><span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</span><input v-model="form.password" type="password" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="••••••••" /></label>
        <button type="submit" :disabled="loading" class="md:col-span-2 flex w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70">{{ loading ? 'Registrando…' : 'Crear cuenta' }}</button>
      </form>
      <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">¿Ya tienes cuenta? <RouterLink to="/auth/login" class="font-medium text-brand hover:underline">Inicia sesión</RouterLink></p>
    </div>
  </section>
</template>
