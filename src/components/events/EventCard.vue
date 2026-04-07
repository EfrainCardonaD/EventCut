<script setup>
import { computed } from 'vue'
import { getCategoryAccentStyles } from '@/utils/categoryColors'
import SocialNetworkIcon from '@/components/icons/SocialNetworkIcon.vue'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select', 'toggle-favorite'])
const isCompact = computed(() => props.compact)

const startDate = computed(() => new Date(props.event.start_datetime))
const endDate = computed(() => new Date(props.event.end_datetime))

const dayLabel = computed(() => {
  if (Number.isNaN(startDate.value.getTime())) return '--'
  return `${startDate.value.getDate()}`.padStart(2, '0')
})

const ownerLabel = computed(() => {
  const source = props.event || {}
  return source.owner_display_name || source.ownerDisplayName || source.owner_name || source.ownerName || source.username || ''
})

const monthLabel = computed(() => {
  if (Number.isNaN(startDate.value.getTime())) return '---'

  return new Intl.DateTimeFormat('es-MX', { month: 'short' })
    .format(startDate.value)
    .replace('.', '')
    .toUpperCase()
})

const dateTimeLabel = computed(() => {
  if (Number.isNaN(startDate.value.getTime()) || Number.isNaN(endDate.value.getTime())) return 'Horario no disponible'

  const dayPart = new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(startDate.value)

  const timeFormatter = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${dayPart} ${timeFormatter.format(startDate.value)} - ${timeFormatter.format(endDate.value)}`
})

const cardImage = computed(() => props.event.image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80')

const isDark = computed(() => document.documentElement.classList.contains('dark'))

const categoryAccentStyle = computed(() => {
  return getCategoryAccentStyles({
    category: { id: props.event.category_id, name: props.event.category_name },
    isDark: isDark.value,
  })
})

const socialLinks = computed(() => {
  const source = props.event?.social_links || {}
  return [
    { key: 'whatsapp', label: 'WhatsApp', url: source.whatsapp },
    { key: 'facebook', label: 'Facebook', url: source.facebook },
    { key: 'instagram', label: 'Instagram', url: source.instagram },
  ].filter((item) => typeof item.url === 'string' && item.url.trim())
})

const onSelect = () => emit('select', props.event)
const onToggleFavorite = (event) => {
  event.stopPropagation()
  emit('toggle-favorite', props.event)
}
</script>

<template>
  <article
    class="relative bg-white dark:bg-slate-900 w-full max-w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-primary-500/50 transition-all flex items-start group cursor-pointer active:scale-[0.99] border-l-4"
    :class="isCompact ? 'gap-2.5 px-3 py-2.5' : 'gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4'"
    :style="{ borderLeftColor: categoryAccentStyle.color || 'var(--color-primary-500)' }"
    @click="onSelect"
  >
    <!-- Responsive Image with date overlay always visible -->
    <div 
      class="relative shrink-0 overflow-hidden rounded-lg transition-all" 
      :class="isCompact ? 'size-12 sm:size-14 md:size-16' : 'size-14 sm:size-16 md:size-20'"
    >
      <img :src="cardImage" :alt="event.title" loading="lazy" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      <div class="absolute bottom-0 inset-x-0 flex flex-col items-center pb-1 sm:pb-1.5">
        <span class="font-headline font-black leading-none text-white drop-shadow-md" :class="isCompact ? 'text-xs md:text-sm' : 'text-sm sm:text-base md:text-lg'">{{ dayLabel }}</span>
        <span class="font-bold uppercase tracking-widest text-white/90 drop-shadow-md" :class="isCompact ? 'text-[6px] md:text-[7px]' : 'text-[7px] sm:text-[8px]'">{{ monthLabel }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="min-w-0 flex flex-col flex-grow justify-center pb-0.5" :class="isCompact ? 'pt-0' : 'pt-0.5'">
      <span class="font-bold uppercase tracking-widest leading-none mb-1 text-[9px] sm:text-[10px]" :style="categoryAccentStyle">{{ event.category_name || 'Evento' }}</span>
      <h4
        class="font-headline font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate pr-8"
        :class="isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg'"
      >
        {{ event.title }}
      </h4>
      <div class="flex items-center gap-2.5 mt-1 sm:mt-1.5">
        <span class="flex items-center gap-1 text-slate-500 dark:text-slate-400 min-w-0" :class="isCompact ? 'text-[10px]' : 'text-[10px] sm:text-[11px]'">
          <span class="material-symbols-outlined shrink-0 text-[12px]">location_on</span>
          <span class="truncate">{{ event.location || 'Por confirmar' }}</span>
        </span>
        <span class="hidden items-center gap-1 text-slate-500 dark:text-slate-400 sm:flex min-w-0" :class="isCompact ? 'text-[10px]' : 'text-[11px]'">
          <span class="material-symbols-outlined shrink-0 text-[12px]">schedule</span>
          <span class="truncate">{{ dateTimeLabel }}</span>
        </span>
      </div>
    </div>

    <!-- Favorite button strictly aligned to top right -->
    <button
      class="absolute top-2 right-2 shrink-0 flex items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-tertiary-50 hover:text-tertiary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-300/60 dark:hover:bg-tertiary-500/10"
      :class="[
        isCompact ? 'size-7' : 'size-8 sm:size-9',
        event.isFavorite ? 'text-tertiary-600 dark:text-tertiary-400' : 'dark:text-slate-500',
      ]"
      aria-label="Marcar favorito"
      @click="onToggleFavorite"
    >
      <span
        class="material-symbols-outlined"
        :class="[isCompact ? 'text-base' : 'text-lg', event.isFavorite ? 'icon-filled' : '']"
      >{{ event.isFavorite ? 'bookmark' : 'bookmark_border' }}</span>
    </button>
  </article>
</template>

