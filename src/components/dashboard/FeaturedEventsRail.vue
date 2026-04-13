<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import RichTextRenderer from '@/components/util/RichTextRenderer.vue'

const props = defineProps({
  events: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select'])

const railRef = ref(null)
const canScroll = ref(false)
const atStart = ref(true)
const atEnd = ref(false)

const formatDateTime = (event) => {
  if (!event) return ''
  const start = new Date(event.start_datetime)
  const end = new Date(event.end_datetime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''

  const dayFormatter = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const hourFormatter = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${dayFormatter.format(start)} · ${hourFormatter.format(start)} - ${hourFormatter.format(end)}`
}

const syncRailState = () => {
  const rail = railRef.value
  if (!rail) return
  canScroll.value = rail.scrollWidth - rail.clientWidth > 8
  atStart.value = rail.scrollLeft <= 8
  atEnd.value = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8
}

const scroll = (direction) => {
  const rail = railRef.value
  if (!rail) return
  rail.scrollBy({ left: direction * Math.max(280, rail.clientWidth * 0.8), behavior: 'smooth' })
}

useEventListener(window, 'resize', syncRailState)

watch(() => props.events, async () => {
  await nextTick()
  syncRailState()
})

onMounted(async () => {
  await nextTick()
  syncRailState()
})
</script>

<template>
  <section v-if="events.length" class="mb-8">
    <div class="mb-4 flex items-end justify-between">
      <h2 class="font-headline text-2xl font-extrabold tracking-tight md:text-3xl">Destacado</h2>

      <div v-if="canScroll" class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          :disabled="atStart"
          aria-label="Ver destacados anteriores"
          @click="scroll(-1)"
        >
          <span class="material-symbols-outlined text-base">chevron_left</span>
        </button>
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          :disabled="atEnd"
          aria-label="Ver siguientes destacados"
          @click="scroll(1)"
        >
          <span class="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>
    </div>

    <div
      ref="railRef"
      class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      @scroll="syncRailState"
    >
      <article
        v-for="event in events"
        :key="`featured-${event.id}`"
        class="group relative h-[200px] w-[75%] shrink-0 snap-start cursor-pointer overflow-hidden rounded-3xl bg-neutral-900 shadow-xl sm:w-[calc(50%-0.5rem)] md:h-[250px] lg:h-[300px] lg:w-[calc(33.333%-0.66rem)]"
        @click="emit('select', event)"
      >
        <img :src="event.image_url" :alt="event.title" loading="lazy" class="h-full w-full object-cover opacity-60 transition duration-300 group-hover:scale-105" />
        <div class="absolute inset-0 bg-linear-to-r from-neutral-900 via-neutral-900/30 to-transparent"></div>

        <div class="absolute inset-0 z-10 flex flex-col justify-between p-5 md:p-6">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-primary-300 px-1.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-lg">Score {{ event.score }}</span>
            <span class="text-[11px] font-semibold text-primary-100">{{ formatDateTime(event) }}</span>
          </div>
          <div>
            <h3 class="mb-2 line-clamp-2 font-headline text-xl font-black leading-tight text-white md:text-2xl">{{ event.title }}</h3>
            <div class="line-clamp-2 max-w-md text-xs text-slate-200 md:text-sm">
              <RichTextRenderer
                :content="event.description"
                :line-clamp="2"
                :enable-embeds="false"
                :hide-urls-and-media="true"
                variant="featured-overlay"
              />
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
