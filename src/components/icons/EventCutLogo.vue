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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="85 35 230 230" :class="imgClass" role="img" aria-label="EventCut icon">
        <defs>
          <linearGradient id="iconAztecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--color-logo-2)" />
            <stop offset="100%" stop-color="var(--color-logo-4)" />
          </linearGradient>
          <linearGradient id="iconAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--color-logo-1)" />
            <stop offset="100%" stop-color="var(--color-logo-3)" />
          </linearGradient>
        </defs>

        <g transform="translate(0, -20)">
          <path d="M 120 70 L 150 70 L 150 100 L 120 100 Z M 250 70 L 280 70 L 280 100 L 250 100 Z" fill="url(#iconAccentGrad)" />
          <path d="M 100 90 L 100 240 L 300 240 L 300 90 L 270 90 L 270 210 L 130 210 L 130 90 Z" fill="url(#iconAztecGrad)" />
          <path d="M 170 120 L 230 120 L 230 150 L 260 150 L 260 180 L 140 180 L 140 150 L 170 150 Z" fill="url(#iconAztecGrad)" />
          <circle cx="200" cy="165" r="15" fill="url(#iconAccentGrad)" />
          <rect x="195" y="110" width="10" height="70" fill="var(--color-logo-1)" />
        </g>
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
      <defs>
        <linearGradient id="wordmarkAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--color-logo-1)" />
          <stop offset="100%" stop-color="var(--color-logo-3)" />
        </linearGradient>
      </defs>
      <text x="110" y="62" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="48" text-anchor="middle" letter-spacing="2.5">
        <tspan fill="var(--color-logo-4)">EVENT</tspan><tspan fill="var(--color-logo-3)">CUT</tspan>
      </text>
      <rect x="30" y="82" width="160" height="6" rx="3" fill="url(#wordmarkAccentGrad)" />
      <circle cx="110" cy="85" r="8" fill="var(--color-logo-4)" />
    </svg>
  </component>
</template>

