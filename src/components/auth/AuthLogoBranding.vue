<script setup>
import { RouterLink } from 'vue-router'
import EventCutLogo from '@/components/icons/EventCutLogo.vue'

defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
  to: {
    type: String,
    default: '/',
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div>
    <RouterLink :to="to" class="inline-flex items-center gap-3 group">
      <EventCutLogo
        :clickable="false"
        :show-text="!compact"
        :container-class="'inline-flex items-center gap-3'"
        :logo-class="'flex h-11 w-11 items-center justify-center shrink-0'"
        :img-class="'h-11 w-11 object-contain'"
        :wordmark-class="'h-6 w-auto object-contain shrink-0 transition-opacity group-hover:opacity-90'"
      />
    </RouterLink>

    <p v-if="!compact && subtitle" class=" text-[.6rem] text-slate-500 dark:text-slate-400">
      {{ subtitle }}
    </p>
  </div>
</template>

