<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthViewHeader from '@/components/auth/AuthViewHeader.vue'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import AuthLoadingBar from '@/components/auth/AuthLoadingBar.vue'

const route = useRoute()
const auth = useAuthStore()

const routeToken = computed(() => {
  if (typeof route.params.token === 'string') return route.params.token
  if (typeof route.query.token === 'string') return route.query.token
  return ''
})

const isTokenFromUrl = computed(() => Boolean(routeToken.value.trim()))

const form = reactive({ token: '' })
const loading = ref(false)
const errors = reactive({ token: '' })
const toast = reactive({ show: false, type: 'info', title: '', message: '' })
const autoResult = reactive({ ready: false, success: false, title: '', message: '' })

const showToast = (type, title, message) => {
  toast.type = type
  toast.title = title
  toast.message = message
  toast.show = true
}

const submit = async () => {
  errors.token = form.token.trim() ? '' : 'Ingresa el token de verificacion.'
  if (errors.token) return

  loading.value = true
  try {
	const result = await auth.confirmEmailVerification(form.token.trim())
	if (result.success) {
	  const successMessage = result.message || 'Tu correo fue verificado correctamente.'
	  if (isTokenFromUrl.value) {
		autoResult.ready = true
		autoResult.success = true
		autoResult.title = 'Correo verificado'
		autoResult.message = successMessage
	  } else {
		showToast('success', 'Correo verificado', successMessage)
	  }
	  return
	}

	const errorMessage = result.error || 'El enlace es invalido o expiro.'
	if (isTokenFromUrl.value) {
	  autoResult.ready = true
	  autoResult.success = false
	  autoResult.title = 'No se pudo verificar'
	  autoResult.message = errorMessage
	} else {
	  showToast('error', 'No se pudo verificar', errorMessage)
	}
  } finally {
	loading.value = false
  }
}

onMounted(async () => {
  if (!isTokenFromUrl.value) return
  form.token = routeToken.value.trim()
  await submit()
})
</script>

<template>
  <section class="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-100 dark:bg-slate-950">

	<Alert
	  v-if="!isTokenFromUrl"
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
		title="Confirmar verificacion"
		subtitle="Valida tu correo para habilitar el acceso a la plataforma."
	  />

	  <form v-if="!isTokenFromUrl" class="space-y-4" @submit.prevent="submit">
		<label class="block">
		  <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Token de verificacion</span>
		  <input
			v-model="form.token"
			type="text"
			class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
			placeholder="Pega aqui el token recibido por correo"
		  />
		  <FieldError :error="errors.token" />
		</label>

		<button
		  type="submit"
		  :disabled="loading"
		  class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
		>
		  {{ loading ? 'Procesando...' : 'Confirmar email' }}
		</button>
	  </form>

	  <div v-else class="rounded-2xl border p-4 text-sm" :class="autoResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'">
		<p class="font-semibold">{{ autoResult.title || 'Validando enlace...' }}</p>
		<p class="mt-1">{{ autoResult.message || 'Estamos procesando la verificacion de tu correo.' }}</p>
	  </div>

	  <div class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
		<template v-if="isTokenFromUrl">
		  <p>
			<RouterLink to="/auth/login" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Ir a iniciar sesion</RouterLink>
		  </p>
		  <p v-if="!autoResult.success && autoResult.ready">
			No recibiste correo?
			<RouterLink to="/auth/verify/resend" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Reenviar enlace</RouterLink>
		  </p>
		</template>
		<p v-else>
		  No recibiste correo?
		  <RouterLink to="/auth/verify/resend" class="micro-accent-link font-medium text-tertiary-700 hover:underline dark:text-tertiary-300">Reenviar enlace</RouterLink>
		</p>
	  </div>
	</div>
  </section>
</template>

