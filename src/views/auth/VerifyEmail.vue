<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthViewHeader from '@/components/auth/AuthViewHeader.vue'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'

const route = useRoute()
const auth = useAuthStore()

const routeToken = computed(() => {
  if (typeof route.params.token === 'string') return route.params.token
  if (typeof route.query.token === 'string') return route.query.token
  return ''
})

const form = reactive({ token: '' })
const loading = ref(false)
const completed = ref(false)
const errors = reactive({ token: '' })
const toast = reactive({ show: false, type: 'info', title: '', message: '' })

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
	  completed.value = true
	  showToast('success', 'Correo verificado', result.message)
	  return
	}

	showToast('error', 'No se pudo verificar', result.error || 'El enlace es invalido o expiro.')
  } finally {
	loading.value = false
  }
}

onMounted(async () => {
  if (!routeToken.value) return
  form.token = routeToken.value
  await submit()
})
</script>

<template>
  <section class="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-100 dark:bg-[#10161b]">
	<SpinnerOverlay :show="loading" text="Validando token..." />
	<Alert
	  v-model="toast.show"
	  toast
	  position="top-right"
	  :type="toast.type"
	  :title="toast.title"
	  :message="toast.message"
	  :duration="6000"
	/>

	<div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
	  <AuthViewHeader
		title="Confirmar verificacion"
		subtitle="Valida tu correo para habilitar el acceso a la plataforma."
	  />

	  <form class="space-y-4" @submit.prevent="submit">
		<label class="block">
		  <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Token de verificacion</span>
		  <input
			v-model="form.token"
			type="text"
			class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
			placeholder="Pega aqui el token recibido por correo"
		  />
		  <FieldError :error="errors.token" />
		</label>

		<button
		  type="submit"
		  :disabled="loading"
		  class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
		>
		  {{ loading ? 'Verificando...' : 'Confirmar email' }}
		</button>
	  </form>

	  <div class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
		<p v-if="completed">
		  Verificacion completada.
		  <RouterLink to="/auth/login" class="font-medium text-primary-600 hover:underline">Ir a iniciar sesion</RouterLink>
		</p>
		<p v-else>
		  No recibiste correo?
		  <RouterLink to="/auth/verify/resend" class="font-medium text-primary-600 hover:underline">Reenviar enlace</RouterLink>
		</p>
	  </div>
	</div>
  </section>
</template>

