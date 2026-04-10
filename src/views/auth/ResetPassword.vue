<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthViewHeader from '@/components/auth/AuthViewHeader.vue'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import AuthLoadingBar from '@/components/auth/AuthLoadingBar.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'
import PasswordStrength from '@/components/auth/PasswordStrength.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const routeToken = computed(() => {
  if (typeof route.params.token === 'string') return route.params.token
  if (typeof route.query.token === 'string') return route.query.token
  return ''
})

const isTokenFromUrl = computed(() => Boolean(routeToken.value.trim()))

const form = reactive({
  token: routeToken.value.trim(),
  newPassword: '',
  confirmPassword: '',
})
const loading = ref(false)
const errors = reactive({ token: '', newPassword: '', confirmPassword: '' })
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
  return form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword
})

const confirmDirty = computed(() => form.confirmPassword.length > 0)

const validate = () => {
  errors.token = form.token.trim() ? '' : 'Ingresa el token recibido en tu correo.'
  errors.newPassword = isStrongPassword(form.newPassword)
    ? ''
    : 'La contraseña no cumple los requisitos de seguridad.'
  errors.confirmPassword =
    form.confirmPassword === form.newPassword ? '' : 'Las contraseñas no coinciden.'

  return Object.values(errors).every((value) => !value)
}

const submit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const result = await auth.resetPassword(form.token.trim(), form.newPassword)
    if (result.success) {
      showToast('success', 'Contrasena actualizada', result.message || 'Ya puedes iniciar sesion con tu nueva contraseña.')
      setTimeout(() => {
        router.push('/auth/login')
      }, 1000)
      return
    }

    showToast('error', 'No se pudo actualizar', result.error || 'El token es invalido o expiro.')
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
      <AuthViewHeader
        title="Nueva contraseña"
        subtitle="Ingresa el token de recuperacion y define una nueva clave segura."
      />

      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Token</span>
          <input
            v-model="form.token"
            type="text"
            :readonly="isTokenFromUrl"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Token recibido por correo"
          />
          <span v-if="isTokenFromUrl" class="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            Token detectado.
          </span>
          <FieldError :error="errors.token" />
        </label>

        <div class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nueva contraseña</span>
          <PasswordInput
            v-model="form.newPassword"
            autocomplete="new-password"
          />
          <PasswordStrength :password="form.newPassword" />
          <FieldError :error="errors.newPassword" />
        </div>

        <div class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar contraseña</span>
          <PasswordInput
            v-model="form.confirmPassword"
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
          class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ loading ? 'Procesando...' : 'Actualizar contraseña' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
        <p>
          Necesitas un token?
          <RouterLink to="/auth/forgot" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Solicitar recuperacion</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
