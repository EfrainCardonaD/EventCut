<script setup>
import { computed } from 'vue'
import FieldError from '@/components/util/FieldError.vue'
import SocialNetworkIcon from '@/components/icons/SocialNetworkIcon.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  visibleInputs: {
    type: Object,
    default: () => ({}),
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
  placeholders: {
    type: Object,
    default: () => ({
      whatsapp: 'https://wa.me/528112345678',
      facebook: 'https://facebook.com/runnersmty',
      instagram: 'https://instagram.com/runnersmty',
    }),
  },
})

const emit = defineEmits(['update:modelValue', 'update:visibleInputs'])

const linksModel = computed(() => {
  return {
    whatsapp: String(props.modelValue?.whatsapp || ''),
    facebook: String(props.modelValue?.facebook || ''),
    instagram: String(props.modelValue?.instagram || ''),
  }
})

const visibleModel = computed(() => {
  return {
    whatsapp: Boolean(props.visibleInputs?.whatsapp),
    facebook: Boolean(props.visibleInputs?.facebook),
    instagram: Boolean(props.visibleInputs?.instagram),
  }
})

const toFieldErrorText = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'string') return value
  return ''
}

const getSocialFieldError = (network) => {
  return (
    toFieldErrorText(props.fieldErrors?.[`social_links.${network}`]) ||
    toFieldErrorText(props.fieldErrors?.[`social_links[${network}]`]) ||
    toFieldErrorText(props.fieldErrors?.[`social_links_${network}`])
  )
}

const setNetworkValue = (network, value) => {
  emit('update:modelValue', {
    ...linksModel.value,
    [network]: String(value || ''),
  })
}

const toggleNetwork = (network) => {
  const nextVisible = !visibleModel.value[network]
  emit('update:visibleInputs', {
    ...visibleModel.value,
    [network]: nextVisible,
  })

  if (!nextVisible) {
    setNetworkValue(network, '')
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4">
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <p class="text-sm font-black text-slate-800 dark:text-slate-100">Redes sociales (opcional)</p>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Agrega links oficiales. Por contrato deben ser URL completas y con el formato correcto.
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black transition"
          :class="visibleModel.whatsapp ? 'border-tertiary-300 bg-white text-slate-800 dark:border-tertiary-900/50 dark:bg-slate-950 dark:text-slate-100' : 'border-slate-200 bg-white text-slate-700 hover:border-tertiary-300 hover:text-tertiary-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'"
          @click="toggleNetwork('whatsapp')"
        >
          <SocialNetworkIcon network="whatsapp" :size="18" class-name="text-tertiary-600" />
          WhatsApp
          <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-700 group-hover:bg-tertiary-200 dark:bg-tertiary-900/30 dark:text-tertiary-200">
            <span class="material-symbols-outlined" style="font-size: 16px">add</span>
          </span>
        </button>

        <button
          type="button"
          class="group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black transition"
          :class="visibleModel.facebook ? 'border-tertiary-300 bg-white text-slate-800 dark:border-tertiary-900/50 dark:bg-slate-950 dark:text-slate-100' : 'border-slate-200 bg-white text-slate-700 hover:border-tertiary-300 hover:text-tertiary-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'"
          @click="toggleNetwork('facebook')"
        >
          <SocialNetworkIcon network="facebook" :size="18" class-name="text-tertiary-600" />
          Facebook
          <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-700 group-hover:bg-tertiary-200 dark:bg-tertiary-900/30 dark:text-tertiary-200">
            <span class="material-symbols-outlined" style="font-size: 16px">add</span>
          </span>
        </button>

        <button
          type="button"
          class="group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black transition"
          :class="visibleModel.instagram ? 'border-tertiary-300 bg-white text-slate-800 dark:border-tertiary-900/50 dark:bg-slate-950 dark:text-slate-100' : 'border-slate-200 bg-white text-slate-700 hover:border-tertiary-300 hover:text-tertiary-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'"
          @click="toggleNetwork('instagram')"
        >
          <SocialNetworkIcon network="instagram" :size="18" class-name="text-tertiary-600" />
          Instagram
          <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-700 group-hover:bg-tertiary-200 dark:bg-tertiary-900/30 dark:text-tertiary-200">
            <span class="material-symbols-outlined" style="font-size: 16px">add</span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="visibleModel.whatsapp" class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-black text-slate-800 dark:text-slate-100">WhatsApp</p>
        <button type="button" class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="toggleNetwork('whatsapp')">
          <span class="material-symbols-outlined" style="font-size: 18px">close</span>
        </button>
      </div>
      <input
        :value="linksModel.whatsapp"
        type="url"
        class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 focus:ring-4 focus:ring-tertiary-500/10 dark:border-slate-700 dark:bg-slate-950"
        :placeholder="placeholders.whatsapp"
        @input="setNetworkValue('whatsapp', $event.target.value)"
      />
      <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Debe iniciar con <code>https://wa.me/</code></p>
      <FieldError :error="getSocialFieldError('whatsapp')" />
    </div>

    <div v-if="visibleModel.facebook" class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-black text-slate-800 dark:text-slate-100">Facebook</p>
        <button type="button" class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="toggleNetwork('facebook')">
          <span class="material-symbols-outlined" style="font-size: 18px">close</span>
        </button>
      </div>
      <input
        :value="linksModel.facebook"
        type="url"
        class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 focus:ring-4 focus:ring-tertiary-500/10 dark:border-slate-700 dark:bg-slate-950"
        :placeholder="placeholders.facebook"
        @input="setNetworkValue('facebook', $event.target.value)"
      />
      <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Debe iniciar con <code>https://facebook.com/</code> o <code>https://www.facebook.com/</code></p>
      <FieldError :error="getSocialFieldError('facebook')" />
    </div>

    <div v-if="visibleModel.instagram" class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-black text-slate-800 dark:text-slate-100">Instagram</p>
        <button type="button" class="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="toggleNetwork('instagram')">
          <span class="material-symbols-outlined" style="font-size: 18px">close</span>
        </button>
      </div>
      <input
        :value="linksModel.instagram"
        type="url"
        class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-tertiary-500 focus:ring-4 focus:ring-tertiary-500/10 dark:border-slate-700 dark:bg-slate-950"
        :placeholder="placeholders.instagram"
        @input="setNetworkValue('instagram', $event.target.value)"
      />
      <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Debe iniciar con <code>https://instagram.com/</code> o <code>https://www.instagram.com/</code></p>
      <FieldError :error="getSocialFieldError('instagram')" />
    </div>
  </div>
</template>

