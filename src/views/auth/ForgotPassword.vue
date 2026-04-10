<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthViewHeader from '@/components/auth/AuthViewHeader.vue'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import AuthLoadingBar from '@/components/auth/AuthLoadingBar.vue'

const auth = useAuthStore()

const form = reactive({ email: '' })
const loading = ref(false)
const errors = reactive({ email: '' })
const toast = reactive({ show: false, type: 'info', title: '', message: '' })

const showToast = (type, title, message) => {
  toast.type = type
  toast.title = title
  toast.message = message
  toast.show = true
}

const submit = async () => {
  errors.email = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Ingresa un correo valido.'
  if (errors.email) return

  loading.value = true
  try {
    const result = await auth.forgotPassword(form.email.trim().toLowerCase())
    if (result.success) {
      showToast('success', 'Solicitud enviada', result.message || 'Revisa tu correo para continuar el restablecimiento.')
      return
    }

    showToast('error', 'No se pudo procesar', result.error || 'Intenta de nuevo en unos minutos.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-100 dark:bg-slate-950">

    <Alert
      v-model="toast.show"
      toast
      position="top-right"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="6000"
    />

    <div class="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <AuthLoadingBar :show="loading" />
      <AuthViewHeader title="Recuperar contraseña" subtitle="Te enviaremos un enlace de restablecimiento." />

      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Correo</span>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="juan.perez@alumnos.udg.mx"
          />
          <FieldError :error="errors.email" />
        </label>

        <button
          type="submit"
          :disabled="loading"
          class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ loading ? 'Procesando...' : 'Enviar instrucciones' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
        <p>
          Ya tienes token?
          <RouterLink to="/auth/reset" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Restablecer ahora</RouterLink>
        </p>
        <p>
          <RouterLink to="/auth/login" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Volver a iniciar sesion</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
