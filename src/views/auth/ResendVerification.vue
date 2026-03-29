<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthViewHeader from '@/components/auth/AuthViewHeader.vue'
import Alert from '@/components/util/Alert.vue'
import FieldError from '@/components/util/FieldError.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'

const route = useRoute()
const auth = useAuthStore()

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
})
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
	const result = await auth.resendVerification(form.email.trim().toLowerCase())
	if (result.success) {
	  showToast('success', 'Correo reenviado', result.message)
	  return
	}

	showToast('error', 'No se pudo reenviar', result.error || 'Intenta nuevamente en unos minutos.')
  } finally {
	loading.value = false
  }
}
</script>

<template>
  <section class="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-100 dark:bg-slate-950">
	<SpinnerOverlay :show="loading" text="Enviando correo de verificacion..." />
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
		title="Verifica tu correo"
		subtitle="Reenviamos el enlace de verificacion a tu correo institucional."
	  />

	  <form class="space-y-4" @submit.prevent="submit">
		<label class="block">
		  <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Correo</span>
		  <input
			v-model="form.email"
			type="email"
			autocomplete="email"
			class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
			placeholder="juan.perez@universidad.edu.mx"
		  />
		  <FieldError :error="errors.email" />
		</label>

		<button
		  type="submit"
		  :disabled="loading"
		  class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
		>
		  {{ loading ? 'Enviando...' : 'Reenviar enlace' }}
		</button>
	  </form>

	  <div class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
		<p>
		  Ya verificaste tu cuenta?
		  <RouterLink to="/auth/login" class="font-medium text-primary-600 hover:underline">Inicia sesion</RouterLink>
		</p>
	  </div>
	</div>
  </section>
</template>

