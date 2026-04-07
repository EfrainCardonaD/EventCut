<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none" class="w-full h-auto drop-shadow-2xl">
    <defs>
      <!-- Primary Blurple gradient -->
      <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="var(--color-logo-1)" stop-opacity="0.5"/>
        <stop offset="70%" stop-color="var(--color-logo-1)" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="var(--color-logo-1)" stop-opacity="0"/>
      </radialGradient>
      <!-- Secondary Teal gradient -->
      <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="var(--color-logo-2)" stop-opacity="0.5"/>
        <stop offset="70%" stop-color="var(--color-logo-2)" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="var(--color-logo-2)" stop-opacity="0"/>
      </radialGradient>
      <!-- Tertiary Coral gradient -->
      <radialGradient id="orb3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="var(--color-logo-3)" stop-opacity="0.45"/>
        <stop offset="70%" stop-color="var(--color-logo-3)" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="var(--color-logo-3)" stop-opacity="0"/>
      </radialGradient>
      <!-- Subtle grid pattern -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" class="stroke-slate-400 dark:stroke-slate-600" stroke-width="0.3" stroke-opacity="0.2"/>
      </pattern>
      <!-- Floating card shadow -->
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="var(--color-logo-1)" flood-opacity="0.12"/>
      </filter>
      <filter id="cardShadow2" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="var(--color-logo-2)" flood-opacity="0.10"/>
      </filter>
    </defs>

    <!-- Subtle grid background -->
    <rect width="800" height="600" fill="url(#grid)" opacity="0.5"/>

    <!-- Soft gradient orbs -->
    <ellipse cx="580" cy="180" rx="280" ry="260" fill="url(#orb1)"/>
    <ellipse cx="250" cy="420" rx="220" ry="200" fill="url(#orb2)"/>
    <ellipse cx="650" cy="480" rx="160" ry="140" fill="url(#orb3)"/>

    <!-- Geometric accent lines -->
    <line x1="120" y1="100" x2="120" y2="500" stroke="var(--color-logo-1)" stroke-width="0.8" stroke-opacity="0.15"/>
    <line x1="680" y1="60" x2="680" y2="540" stroke="var(--color-logo-2)" stroke-width="0.8" stroke-opacity="0.12"/>
    <circle cx="120" cy="260" r="4" fill="var(--color-logo-1)" opacity="0.3"/>
    <circle cx="680" cy="320" r="4" fill="var(--color-logo-2)" opacity="0.25"/>

    <!-- Floating UI Card 1 (main) -->
    <g filter="url(#cardShadow)" transform="translate(200, 120)">
      <rect width="400" height="240" rx="20" class="fill-white dark:fill-neutral-900" fill-opacity="0.85"/>
      <rect x="0" y="0" width="400" height="240" rx="20" class="stroke-slate-200 dark:stroke-neutral-800" stroke-width="1" fill="none"/>
      <!-- Header bar -->
      <rect x="24" y="20" width="352" height="8" rx="4" class="fill-slate-100 dark:fill-neutral-800"/>
      <!-- Calendar icon placeholder -->
      <rect x="24" y="48" width="48" height="48" rx="12" class="fill-primary-100 dark:fill-primary-900/30"/>
      <text x="36" y="72" font-family="Inter, sans-serif" font-weight="800" font-size="16" fill="var(--color-logo-1)">24</text>
      <text x="36" y="86" font-family="Inter, sans-serif" font-weight="700" font-size="7" fill="var(--color-logo-1)" letter-spacing="1">OCT</text>
      <!-- Title lines -->
      <rect x="88" y="52" width="180" height="10" rx="5" class="fill-slate-800 dark:fill-slate-200" opacity="0.75"/>
      <rect x="88" y="72" width="120" height="8" rx="4" class="fill-slate-400 dark:fill-slate-500" opacity="0.4"/>
      <!-- Divider -->
      <line x1="24" y1="116" x2="376" y2="116" class="stroke-slate-100 dark:stroke-neutral-800" stroke-width="1.5"/>
      <!-- Content skeleton rows -->
      <rect x="24" y="132" width="280" height="8" rx="4" class="fill-slate-100 dark:fill-neutral-800"/>
      <rect x="24" y="152" width="200" height="8" rx="4" class="fill-slate-100 dark:fill-neutral-800"/>
      <rect x="24" y="172" width="240" height="8" rx="4" class="fill-slate-100 dark:fill-neutral-800"/>
      <!-- Action button -->
      <rect x="24" y="200" width="100" height="28" rx="14" fill="var(--color-logo-1)"/>
      <text x="50" y="218" font-family="Inter, sans-serif" font-weight="600" font-size="10" class="fill-white dark:fill-neutral-900">Asistir</text>
      <!-- Status badge -->
      <rect x="310" y="200" width="66" height="28" rx="14" class="fill-emerald-50 dark:fill-emerald-900/30"/>
      <circle cx="326" cy="214" r="3.5" class="fill-emerald-500 dark:fill-emerald-400"/>
      <text x="335" y="218" font-family="Inter, sans-serif" font-weight="600" font-size="9" class="fill-emerald-600 dark:fill-emerald-400">Abierto</text>
    </g>

    <!-- Floating UI Card 2 (small, overlapping) -->
    <g filter="url(#cardShadow2)" transform="translate(480, 300)">
      <rect width="220" height="130" rx="16" class="fill-white dark:fill-neutral-900" fill-opacity="0.9"/>
      <rect width="220" height="130" rx="16" class="stroke-slate-200 dark:stroke-neutral-800" stroke-width="1" fill="none"/>
      <!-- Teal accent bar -->
      <rect x="16" y="16" width="40" height="40" rx="10" class="fill-cyan-50 dark:fill-cyan-900/30"/>
      <text x="24" y="38" font-family="Inter, sans-serif" font-weight="800" font-size="14" fill="var(--color-logo-2)">3</text>
      <text x="24" y="50" font-family="Inter, sans-serif" font-weight="700" font-size="6" fill="var(--color-logo-2)" letter-spacing="1">NOV</text>
      <!-- Text -->
      <rect x="68" y="20" width="130" height="9" rx="4.5" class="fill-slate-800 dark:fill-slate-200" opacity="0.7"/>
      <rect x="68" y="38" width="90" height="7" rx="3.5" class="fill-slate-400 dark:fill-slate-500" opacity="0.35"/>
      <!-- Divider -->
      <line x1="16" y1="72" x2="204" y2="72" class="stroke-slate-100 dark:stroke-neutral-800" stroke-width="1"/>
      <!-- Avatar stack -->
      <circle cx="32" cy="96" r="12" class="fill-primary-100 dark:fill-primary-900/30"/>
      <circle cx="52" cy="96" r="12" class="fill-cyan-50 dark:fill-cyan-900/30 stroke-white dark:stroke-neutral-900" stroke-width="2"/>
      <circle cx="72" cy="96" r="12" class="fill-red-50 dark:fill-red-900/30 stroke-white dark:stroke-neutral-900" stroke-width="2"/>
      <text x="96" y="100" font-family="Inter, sans-serif" font-weight="600" font-size="10" class="fill-slate-400 dark:fill-slate-500">+12 asistentes</text>
    </g>

    <!-- Small floating notification badge -->
    <g transform="translate(160, 330)">
      <rect width="150" height="50" rx="25" class="fill-white dark:fill-neutral-900" fill-opacity="0.92" filter="url(#cardShadow2)"/>
      <rect width="150" height="50" rx="25" class="stroke-slate-200 dark:stroke-neutral-800" stroke-width="0.8" fill="none"/>
      <circle cx="30" cy="25" r="10" class="fill-amber-100 dark:fill-amber-900/30"/>
      <text x="25" y="29" font-family="Inter, sans-serif" font-size="11">🔔</text>
      <text x="48" y="22" font-family="Inter, sans-serif" font-weight="600" font-size="9" class="fill-slate-800 dark:fill-slate-200">Evento mañana</text>
      <text x="48" y="35" font-family="Inter, sans-serif" font-weight="400" font-size="8" class="fill-slate-400 dark:fill-slate-500">Taller de UI · 10:00</text>
    </g>

    <!-- Decorative dots / particles -->
    <circle cx="160" cy="140" r="2.5" fill="var(--color-logo-1)" opacity="0.2"/>
    <circle cx="720" cy="160" r="3" fill="var(--color-logo-3)" opacity="0.2"/>
    <circle cx="380" cy="520" r="2" fill="var(--color-logo-2)" opacity="0.25"/>
    <circle cx="100" cy="480" r="3" fill="var(--color-logo-1)" opacity="0.15"/>
    <circle cx="740" cy="400" r="2.5" fill="var(--color-logo-3)" opacity="0.15"/>
  </svg>
</template>

<script>
export default {
  name: 'HeroAbstract'
}
</script>
