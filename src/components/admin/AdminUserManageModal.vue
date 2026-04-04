<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useAdminUsersStore } from '@/stores/adminUsers'
import { useAdminStore } from '@/stores/admin'
import Alert from '@/components/util/Alert.vue'
import SpinnerOverlay from '@/components/util/SpinnerOverlay.vue'
import AdminActionModal from '@/components/admin/AdminActionModal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'updated'])

const usersStore = useAdminUsersStore()
const adminStore = useAdminStore()

const { userBanStatuses, isUpdatingRole } = storeToRefs(usersStore)
const { isBanningUser, isUnbanningUser } = storeToRefs(adminStore)

const isLoading = ref(false)
const error = ref('')
const toast = ref({ show: false, type: 'info', title: '', message: '' })
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const detail = ref(null)
const selectedRole = ref('ROLE_USER')

const banModalOpen = ref(false)
const unbanModalOpen = ref(false)

const roleOptions = [
  { value: 'ROLE_USER', label: 'Usuario' },
  { value: 'ROLE_SECURITY_ADMIN', label: 'Security Admin' },
  { value: 'ROLE_ADMIN', label: 'Administrador' },
]

const userIdText = computed(() => String(props.userId || '').trim())

const banStatus = computed(() => {
  const userId = userIdText.value
  if (!userId) return { is_banned: false }
  return userBanStatuses.value?.[userId] || { is_banned: false }
})

const displayName = computed(() => {
  const user = detail.value
  if (!user) return ''
  const full =
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    [user.first_name, user.last_name].filter(Boolean).join(' ')
  return full || user.username || user.email || String(user.id || '')
})

const roleLabelByValue = {
  ROLE_USER: 'Usuario',
  ROLE_SECURITY_ADMIN: 'Security Admin',
  ROLE_ADMIN: 'Administrador',
}

const originalRole = computed(() => detail.value?.role || 'ROLE_USER')
const hasRoleChanged = computed(() => selectedRole.value !== originalRole.value)
const isModerationBusy = computed(() => Boolean(isBanningUser.value || isUnbanningUser.value))
const canSaveRole = computed(() => {
  return Boolean(detail.value && hasRoleChanged.value && !isUpdatingRole.value && !isLoading.value && !isModerationBusy.value)
})

const roleChipLabel = computed(() => roleLabelByValue[detail.value?.role] || detail.value?.role || 'Sin rol')

const avatarInitial = computed(() => {
  const source = (displayName.value || detail.value?.username || detail.value?.email || 'U').trim()
  return source.charAt(0).toUpperCase()
})

const userIdentityText = computed(() => {
  if (detail.value?.username) return `@${detail.value.username}`
  return detail.value?.email || ''
})

const formatDateTime = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

const close = () => {
  emit('update:modelValue', false)
}

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message }
}

const loadUser = async () => {
  const userId = userIdText.value
  if (!userId) return

  isLoading.value = true
  error.value = ''

  try {
    const result = await usersStore.fetchUserById(userId)
    if (!result.success) {
      error.value = result.error || 'No se pudo cargar el usuario.'
      return
    }

    detail.value = result.data || null
    selectedRole.value = detail.value?.role || 'ROLE_USER'

    await usersStore.fetchUserBanStatus(userId)
  } finally {
    isLoading.value = false
  }
}

const onConfirmRole = async () => {
  const userId = userIdText.value
  if (!userId) return

  const result = await usersStore.updateUserRole(userId, selectedRole.value)
  if (!result.success) {
    showToast('error', 'No se pudo cambiar rol', result.error)
    return
  }

  // Refresca
  await loadUser()
  emit('updated', { userId, action: 'role' })
  showToast('success', 'Rol actualizado', result.message)
}

const onConfirmBan = async (reason) => {
  const userId = userIdText.value
  if (!userId) return

  const result = await adminStore.banUser(userId, reason)
  if (!result.success) {
    showToast('error', 'No se pudo banear', result.error)
    return
  }

  await usersStore.fetchUserBanStatus(userId)
  emit('updated', { userId, action: 'ban' })
  showToast('success', 'Usuario baneado', result.message)
}

const onConfirmUnban = async () => {
  const userId = userIdText.value
  if (!userId) return

  const result = await adminStore.unbanUser(userId)
  if (!result.success) {
    showToast('error', 'No se pudo desbanear', result.error)
    return
  }

  await usersStore.fetchUserBanStatus(userId)
  emit('updated', { userId, action: 'unban' })
  showToast('success', 'Usuario desbaneado', result.message)
}

const onKeyDown = (event) => {
  if (!props.modelValue) return
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    isBodyScrollLocked.value = isOpen

    if (!isOpen) {
      detail.value = null
      error.value = ''
      toast.value = { show: false, type: 'info', title: '', message: '' }
      return
    }

    await nextTick()
    await loadUser()
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  isBodyScrollLocked.value = false
})
</script>

<template>
  <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
    <div v-if="modelValue" class="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <SpinnerOverlay :show="isLoading" text="Cargando usuario..." />

      <Alert
        v-model="toast.show"
        toast
        position="top-right"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="4500"
      />

      <AdminActionModal
        v-model="banModalOpen"
        title="Banear usuario"
        :description="`Esta acción bloqueará a ${displayName || 'este usuario'} de realizar mutaciones en la plataforma.`"
        confirm-text="Banear"
        :loading="isBanningUser"
        :require-reason="true"
        reason-label="Motivo del baneo"
        reason-placeholder="Violación de términos..."
        @confirm="onConfirmBan"
      />

      <AdminActionModal
        v-model="unbanModalOpen"
        title="Desbanear usuario"
        :description="`Se restaurará el acceso de ${displayName || 'este usuario'} a la plataforma.`"
        confirm-text="Desbanear"
        :loading="isUnbanningUser"
        :require-reason="false"
        @confirm="onConfirmUnban"
      />

      <div class="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white/75 shadow-2xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/75">
        <header class="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">Administración</p>
              <h3 class="mt-1 truncate font-headline text-xl font-black text-slate-900 dark:text-white">Gestionar usuario</h3>
            </div>
            <button type="button" class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div v-if="detail" class="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="flex min-w-0 items-center gap-3">
              <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-black text-white dark:bg-primary-500 dark:text-primary-950">
                {{ avatarInitial }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-base font-extrabold text-slate-900 dark:text-slate-100">{{ displayName }}</p>
                <p class="truncate text-sm text-slate-500 dark:text-slate-400">{{ userIdentityText }}</p>
                <p v-if="detail.email && detail.username" class="truncate text-xs text-slate-500 dark:text-slate-400">{{ detail.email }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 md:justify-end">
              <span class="rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {{ roleChipLabel }}
              </span>
              <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="banStatus.is_banned ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'">
                {{ banStatus.is_banned ? 'BANEADO' : 'SIN BANEO' }}
              </span>
              <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="detail.email_verified ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'">
                {{ detail.email_verified ? 'EMAIL VERIFICADO' : 'EMAIL SIN VERIFICAR' }}
              </span>
              <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="detail.active ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'">
                {{ detail.active ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </div>
          </div>
        </header>

        <div class="max-h-[74vh] overflow-y-auto overscroll-contain p-5">
          <Alert
            v-if="error"
            :model-value="true"
            type="error"
            title=""
            :message="error"
            :toast="false"
            :dismissible="false"
            :duration="0"
          />

          <div v-if="detail" class="space-y-4">
            <section class="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Acciones rápidas</p>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Toma decisiones de moderación y permisos sin salir del flujo.</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    v-if="!banStatus.is_banned"
                    type="button"
                    class="rounded-xl bg-error-600 px-4 py-2 text-sm font-bold text-white hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isModerationBusy || isLoading || isUpdatingRole"
                    @click="banModalOpen = true"
                  >
                    {{ isBanningUser ? 'Baneando...' : 'Banear' }}
                  </button>

                  <button
                    v-else
                    type="button"
                    class="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    :disabled="isModerationBusy || isLoading || isUpdatingRole"
                    @click="unbanModalOpen = true"
                  >
                    {{ isUnbanningUser ? 'Quitando baneo...' : 'Quitar baneo' }}
                  </button>

                  <button
                    type="button"
                    class="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="!canSaveRole"
                    @click="onConfirmRole"
                  >
                    {{ isUpdatingRole ? 'Guardando rol...' : 'Guardar rol' }}
                  </button>
                </div>
              </div>
            </section>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section class="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60">
              <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Perfil</h4>
              <dl class="mt-3 space-y-2 text-sm">
                <div>
                  <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nombre</dt>
                  <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ displayName }}</dd>
                </div>
                <div v-if="detail.email">
                  <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</dt>
                  <dd class="truncate font-medium text-slate-700 dark:text-slate-200">{{ detail.email }}</dd>
                </div>
                <div v-if="detail.username">
                  <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Usuario</dt>
                  <dd class="font-mono text-[12px] text-slate-600 dark:text-slate-300">{{ detail.username }}</dd>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Activo</dt>
                    <dd>
                      <span
                        class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                        :class="detail.active ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'"
                      >
                        {{ detail.active ? 'SI' : 'NO' }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email verificado</dt>
                    <dd>
                      <span
                        class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                        :class="detail.email_verified ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'"
                      >
                        {{ detail.email_verified ? 'SI' : 'NO' }}
                      </span>
                    </dd>
                  </div>
                </div>
                <div v-if="detail.id">
                  <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">ID</dt>
                  <dd class="font-mono text-[12px] text-slate-500 dark:text-slate-400">{{ detail.id }}</dd>
                </div>
                <div v-if="detail.token_version !== undefined && detail.token_version !== null">
                  <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Token version</dt>
                  <dd class="text-[12px] font-medium text-slate-600 dark:text-slate-300">{{ detail.token_version }}</dd>
                </div>
              </dl>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60">
              <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Permisos</h4>

              <div class="mt-3 space-y-3">
                <div>
                  <label class="text-sm font-bold text-slate-700 dark:text-slate-200">Rol</label>
                  <select
                    v-model="selectedRole"
                    class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                    :disabled="isUpdatingRole || isModerationBusy"
                  >
                    <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>

                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ hasRoleChanged ? `Cambio pendiente: ${roleLabelByValue[originalRole] || originalRole} -> ${roleLabelByValue[selectedRole] || selectedRole}` : 'Sin cambios de rol pendientes.' }}
                </p>
              </div>
            </section>
            </div>

            <section class="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60">
              <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Auditoría y seguridad</h4>
              <dl class="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div v-if="detail.created_at">
                  <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Creado</dt>
                  <dd class="text-[12px] font-medium text-slate-600 dark:text-slate-300">{{ formatDateTime(detail.created_at) }}</dd>
                </div>
                <div v-if="detail.updated_at">
                  <dt class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Actualizado</dt>
                  <dd class="text-[12px] font-medium text-slate-600 dark:text-slate-300">{{ formatDateTime(detail.updated_at) }}</dd>
                </div>
              </dl>
            </section>
          </div>

          <div v-else-if="!isLoading" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No se pudo cargar el usuario.
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>


