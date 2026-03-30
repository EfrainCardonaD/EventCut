<script setup>
import { computed } from 'vue'
import { getCategoryAccentStyles } from '@/utils/categoryColors'

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

const onSelect = () => emit('select', props.event)
const onToggleFavorite = (event) => {
  event.stopPropagation()
  emit('toggle-favorite', props.event)
}
</script>

<template>
  <article
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-sky-500/50 transition-all flex gap-4 md:gap-5 group cursor-pointer active:scale-[0.99]"
    :class="compact ? 'p-3' : 'p-4 md:p-5'"
    @click="onSelect"
  >
    <div class="w-20 md:w-24 shrink-0 flex flex-col">
      <div class="w-full aspect-square rounded-xl overflow-hidden mb-2 hidden sm:block">
        <img :src="cardImage" :alt="event.title" class="w-full h-full object-cover" />
      </div>
        <div class="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 py-2 h-full sm:h-auto">
        <span class="text-sky-600 dark:text-sky-400 font-headline font-black text-xl md:text-2xl leading-none">{{ dayLabel }}</span>
        <span class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">{{ monthLabel }}</span>
      </div>
    </div>

    <div class="flex flex-col flex-grow justify-center">
      <span class="text-[10px] font-bold uppercase tracking-widest mb-1" :style="categoryAccentStyle">{{ event.category_name || 'Evento' }}</span>
      <h4
        class="font-headline font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors"
      >
        {{ event.title }}
      </h4>
      <div class="flex flex-col gap-1 mt-auto">
        <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
          <span class="material-symbols-outlined text-[14px]">schedule</span>
          {{ dateTimeLabel }}
        </div>
        <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
          <span class="material-symbols-outlined text-[14px]">location_on</span>
          {{ event.location || 'Ubicacion por confirmar' }}
        </div>
        <div v-if="ownerLabel" class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
          <span class="material-symbols-outlined text-[14px]">person</span>
          <span class="truncate">{{ ownerLabel }}</span>
        </div>
      </div>
    </div>

    <button
      class="self-start rounded-full p-1.5 text-slate-400 transition-colors hover:bg-tertiary-50 hover:text-tertiary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-300/60 dark:hover:bg-tertiary-500/10"
      :class="event.isFavorite ? 'text-tertiary-600 dark:text-tertiary-400' : 'dark:text-slate-500'"
      aria-label="Marcar favorito"
      @click="onToggleFavorite"
    >
      <span
        class="material-symbols-outlined"
        :class="event.isFavorite ? 'icon-filled' : ''"
      >{{ event.isFavorite ? 'bookmark' : 'bookmark_border' }}</span>
    </button>
  </article>
</template>

