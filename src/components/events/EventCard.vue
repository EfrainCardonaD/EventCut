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
    class="bg-white dark:bg-slate-900 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md dark:hover:border-primary-500/50 transition-all flex group cursor-pointer active:scale-[0.99]"
    :class="isCompact ? 'gap-2.5 p-2.5 md:p-3' : 'gap-4 p-4 md:gap-5 md:p-5'"
    @click="onSelect"
  >
    <div class="shrink-0 flex flex-col" :class="isCompact ? 'w-16 gap-1.5' : 'w-16 gap-1.5 sm:w-20 md:w-24'">
      <div class="w-full aspect-square overflow-hidden rounded-xl" :class="isCompact ? 'block' : 'block sm:mb-2'">
        <img :src="cardImage" :alt="event.title" class="w-full h-full object-cover" />
      </div>
      <div
        class="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
        :class="isCompact ? 'h-full py-1.5' : 'h-full py-2 sm:h-auto'"
      >

        <span class="text-primary-600 dark:text-primary-400 font-headline font-black leading-none" :class="isCompact ? 'text-base' : 'text-lg sm:text-xl md:text-2xl'">{{ dayLabel }}</span>
        <span class="ml-1 text-slate-500 font-bold uppercase tracking-widest" :class="isCompact ? 'text-[9px]' : 'mt-1 text-[10px]'">{{ monthLabel }}</span>
      </div>
    </div>

    <div class="min-w-0 flex flex-col flex-grow justify-center">
      <span v-if="!isCompact" class="mb-1 font-bold uppercase tracking-widest" :class="isCompact ? 'text-[9px]' : 'text-[10px]'" :style="categoryAccentStyle">{{ event.category_name || 'Evento' }}</span>
      <h4
        class="font-headline font-bold text-slate-800 dark:text-slate-100 mb-1.5 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
        :class="isCompact ? 'truncate text-sm' : 'text-base md:text-lg'"
      >
        {{ event.title }}
      </h4>
      <div v-if="!isCompact" class="flex flex-col mt-auto" :class="isCompact ? 'gap-0.5' : 'gap-1'">
        <div class="hidden items-center gap-1.5 text-slate-500 dark:text-slate-400 sm:flex" :class="isCompact ? 'text-[11px]' : 'text-xs'">
          <span class="material-symbols-outlined text-[14px]">schedule</span>
          <span class="truncate">{{ dateTimeLabel }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" :class="isCompact ? 'text-[11px]' : 'text-xs'">
          <span class="material-symbols-outlined text-[14px]">location_on</span>
          <span class="truncate">{{ event.location || 'Ubicacion por confirmar' }}</span>
        </div>
        <div v-if="ownerLabel && !isCompact" class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
          <span class="material-symbols-outlined text-[14px]">person</span>
          <span class="truncate">{{ ownerLabel }}</span>
        </div>
        <div v-if="socialLinks.length && !isCompact" class="hidden items-center gap-2 pt-1 sm:flex">
          <a
            v-for="link in socialLinks"
            :key="`${event.id}-${link.key}`"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:text-primary-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-primary-400"
            :aria-label="`Abrir ${link.label}`"
            @click.stop
          >
            <SocialNetworkIcon :network="link.key" :size="14" class-name="text-current" />
          </a>
        </div>
      </div>
    </div>

    <button
      class="self-start rounded-full text-slate-400 transition-colors hover:bg-tertiary-50 hover:text-tertiary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-300/60 dark:hover:bg-tertiary-500/10"
      :class="[
        isCompact ? 'p-1' : 'p-1.5',
        event.isFavorite ? 'text-tertiary-600 dark:text-tertiary-400' : 'dark:text-slate-500',
      ]"
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

