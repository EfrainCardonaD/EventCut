<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthViewHeader from '@/components/auth/AuthViewHeader.vue'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import AuthLoadingBar from '@/components/auth/AuthLoadingBar.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'
import PasswordStrength from '@/components/auth/PasswordStrength.vue'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const errors = reactive({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
})
const toast = reactive({ show: false, type: 'info', title: '', message: '' })

const showToast = (type, title, message) => {
  toast.type = type
  toast.title = title
  toast.message = message
  toast.show = true
}

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/.test(password)
}

const passwordsMatch = computed(() => {
  return form.confirmPassword.length > 0 && form.password === form.confirmPassword
})

const confirmDirty = computed(() => form.confirmPassword.length > 0)

const validate = () => {
  errors.username = form.username.trim().length >= 3 ? '' : 'El usuario debe tener al menos 3 caracteres.'
  errors.email = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Ingresa un correo institucional valido.'
  errors.firstName = form.firstName.trim() ? '' : 'Ingresa tu nombre.'
  errors.lastName = form.lastName.trim() ? '' : 'Ingresa tu apellido.'
  errors.password = isStrongPassword(form.password)
    ? ''
    : 'La contraseña no cumple los requisitos de seguridad.'
  errors.confirmPassword =
    form.confirmPassword === form.password ? '' : 'Las contraseñas no coinciden.'

  return Object.values(errors).every((value) => !value)
}

const submit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const result = await auth.register({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      password: form.password,
    })

    if (result.success) {
      await router.push({ path: '/auth/verify/resend', query: { email: form.email.trim().toLowerCase() } })
      return
    }

    showToast('error', 'No se pudo registrar', result.error || 'Revisa los datos e intenta nuevamente.')
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

    <div class="relative overflow-hidden w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <AuthLoadingBar :show="loading" />
      <AuthViewHeader
        title="Crear cuenta"
        subtitle="Registrate con correo institucional para acceder a eventos del CUT."
      />

      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</span>
          <input
            v-model="form.firstName"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Juan"
          />
          <FieldError :error="errors.firstName" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Apellido</span>
          <input
            v-model="form.lastName"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Perez"
          />
          <FieldError :error="errors.lastName" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Usuario</span>
          <input
            v-model="form.username"
            type="text"
            name="username"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="juan.perez"
          />
          <FieldError :error="errors.username" />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Correo</span>
          <input
            v-model="form.email"
            type="email"
            name="email"
            autocomplete="email"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="juan.perez@alumnos.udg.mx"
          />
          <FieldError :error="errors.email" />
        </label>

        <div class="block md:col-span-2">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña de seguridad</span>
          <PasswordInput
            v-model="form.password"
            name="new-password"
            autocomplete="new-password"
          />
          <PasswordStrength :password="form.password" />
          <FieldError :error="errors.password" />
        </div>

        <div class="block md:col-span-2">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar contraseña</span>
          <PasswordInput
            v-model="form.confirmPassword"
            name="confirm-new-password"
            autocomplete="new-password"
            :show-check="confirmDirty"
            :valid="passwordsMatch"
          />
          <p
            v-if="confirmDirty"
            class="mt-1 text-xs transition-colors duration-200"
            :class="passwordsMatch
              ? 'text-success-600 dark:text-success-400'
              : 'text-tertiary-600 dark:text-tertiary-400'"
          >
            {{ passwordsMatch ? 'Las contraseñas coinciden.' : 'Las contraseñas no coinciden.' }}
          </p>
          <FieldError :error="errors.confirmPassword" />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="md:col-span-2 flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ loading ? 'Procesando...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Ya tienes cuenta?
        <RouterLink to="/auth/login" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Inicia sesion</RouterLink>
      </p>
    </div>
  </section>
</template>
