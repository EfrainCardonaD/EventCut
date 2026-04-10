<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthViewHeader from '@/components/auth/AuthViewHeader.vue'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import AuthLoadingBar from '@/components/auth/AuthLoadingBar.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({ username: '', password: '' })
const loading = ref(true)
const errors = reactive({ username: '', password: '' })
const toast = reactive({ show: false, type: 'info', title: '', message: '' })

const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/')) return redirect
  return '/app'
})

const showToast = (type, title, message) => {
  toast.type = type
  toast.title = title
  toast.message = message
  toast.show = true
}

const isEmailCandidate = (value) => /\S+@\S+\.\S+/.test(value || '')

const isUnverifiedAccountError = (result) => {
  const code = String(result?.code || '').toUpperCase()
  const message = String(result?.error || '').toLowerCase()

  if (code === 'EMAIL_NOT_VERIFIED' || code === 'ACCOUNT_NOT_VERIFIED') return true
  return message.includes('verific') && message.includes('correo')
}

const validate = () => {
  errors.username = form.username ? '' : 'Ingresa tu usuario o correo institucional.'
  errors.password = form.password ? '' : 'Ingresa tu contraseña.'
  return !errors.username && !errors.password
}

const submit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const username = form.username.trim()
    const result = await auth.login(username, form.password)
    if (result.success) {
      await router.push(redirectTarget.value)
      return
    }

    if (isUnverifiedAccountError(result)) {
      const email = isEmailCandidate(username) ? username.toLowerCase() : ''
      await router.push({
        path: '/auth/verify/resend',
        query: {
          ...(email ? { email } : {}),
          reason: 'email-not-verified',
        },
      })
      return
    }

    showToast('error', 'No se pudo iniciar sesión', result.error || 'Verifica tus credenciales e inténtalo de nuevo.')
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
      :duration="5000"
    />

    <div class="relative overflow-hidden w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <AuthLoadingBar :show="loading" />
      <AuthViewHeader title="Iniciar sesion" subtitle="Accede con tu usuario o correo institucional." />

      <form class="space-y-4 " @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Usuario o correo</span>
          <input
            v-model="form.username"
            type="text"
            autocomplete="username"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="juan.perez o juan.perez@alumnos.udg.mx"
          />
          <FieldError :error="errors.username" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</span>
          <PasswordInput
            v-model="form.password"
            autocomplete="current-password"
          />
          <FieldError :error="errors.password" />
        </label>

        <button
          type="submit"
          :disabled="loading"
          class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ loading ? 'Procesando...' : 'Entrar' }}
        </button>
      </form>

      <div class="mt-6 flex items-center justify-between text-sm">
        <RouterLink to="/auth/forgot" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Olvide mi contraseña</RouterLink>
        <RouterLink to="/auth/register" class="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Crear cuenta</RouterLink>
      </div>
    </div>
  </section>
</template>
