<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const MODE_FULL = 'full'
const MODE_ICON = 'icon'
const MODE_WORDMARK = 'wordmark'

const props = defineProps({
  mode: {
    type: String,
    default: '',
  },
  to: {
    type: String,
    default: '/',
  },
  clickable: {
    type: Boolean,
    default: true,
  },
  showText: {
    type: Boolean,
    default: true,
  },
  containerClass: {
    type: String,
    default: 'flex items-center gap-3',
  },
  logoClass: {
    type: String,
    default: 'flex h-10 w-10 items-center justify-center shrink-0',
  },
  imgClass: {
    type: String,
    default: 'h-10 w-10 object-contain',
  },
  wordmarkClass: {
    type: String,
    default: 'h-6 w-auto object-contain shrink-0',
  },
})

const resolvedMode = computed(() => {
  if (props.mode === MODE_ICON || props.mode === MODE_WORDMARK || props.mode === MODE_FULL) {
    return props.mode
  }
  return props.showText ? MODE_FULL : MODE_ICON
})

const showIcon = computed(() => resolvedMode.value === MODE_FULL || resolvedMode.value === MODE_ICON)
const showWordmark = computed(() => resolvedMode.value === MODE_FULL || resolvedMode.value === MODE_WORDMARK)
const wrapperTag = computed(() => (props.clickable ? RouterLink : 'div'))
const wrapperProps = computed(() => (props.clickable ? { to: props.to } : {}))
</script>

<template>
  <component :is="wrapperTag" v-bind="wrapperProps" :class="containerClass">
    <div v-if="showIcon" :class="logoClass">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 190" :class="imgClass" role="img" aria-label="EventCut icon">
        <path d="M 20 0 L 50 0 L 50 30 L 20 30 Z M 150 0 L 180 0 L 180 30 L 150 30 Z" fill="var(--color-logo-3)" />
        <path d="M 0 20 L 0 190 L 200 190 L 200 20 L 170 20 L 170 160 L 30 160 L 30 20 Z" fill="var(--color-logo-2)" />
        <path d="M 70 50 L 130 50 L 130 80 L 160 80 L 160 110 L 40 110 L 40 80 L 70 80 Z" fill="var(--color-logo-1)" />
        <circle cx="100" cy="115" r="15" fill="var(--color-logo-3)" />
        <rect x="95" y="60" width="10" height="70" fill="var(--color-logo-3)" />
      </svg>
    </div>
    <svg
      v-if="showWordmark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-70 -6 360 122"
      :class="wordmarkClass"
      role="img"
      aria-label="EventCut"
    >
      <text x="110" y="62" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="48" text-anchor="middle" letter-spacing="2.5">
        <tspan fill="var(--color-logo-4)">EVENT</tspan><tspan fill="var(--color-logo-1)">CUT</tspan>
      </text>
      <rect x="30" y="82" width="160" height="6" rx="3" fill="var(--color-logo-1)" />
      <circle cx="110" cy="85" r="8" fill="var(--color-logo-4)" />
    </svg>
  </component>
</template>

