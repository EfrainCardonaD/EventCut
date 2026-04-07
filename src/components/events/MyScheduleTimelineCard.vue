<script setup>
import { computed } from 'vue'

const props = defineProps({
  events: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select', 'sync'])

const timelineEvents = computed(() => {
  return props.events.slice(0, 5).map((event, index) => {
    const start = new Date(event.start_datetime)

    const dateLabel = Number.isNaN(start.getTime())
      ? 'Fecha por confirmar'
      : new Intl.DateTimeFormat('es-MX', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(start)

    return {
      ...event,
      dateLabel,
      isActive: index === 0,
    }
  })
})

const onSelect = (event) => {
  emit('select', event)
}

const getConnectorClass = (isLast, isActive) => {
  if (isLast) return 'h-6 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700'
  return isActive ? 'bottom-[-6px] bg-primary-500 dark:bg-primary-300' : 'bottom-[-6px] bg-slate-300 dark:bg-slate-700'
}

const getDotClass = (isActive) => {
  return isActive
    ? 'left-[-1px] top-[5px] h-4 w-4 bg-primary-500 dark:bg-primary-300'
    : 'left-[1px] top-[6px] h-3.5 w-3.5 bg-slate-400 dark:bg-slate-600'
}

const getDateClass = (isActive) => {
  return isActive ? 'text-primary-600 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'
}
</script>

<template>
  <section class="rounded-[2rem] border border-slate-200 bg-white/75 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-xl">
    <header class="mb-6 flex items-start justify-between">
      <div class="font-headline">
        <h2 class="text-xs font-bold uppercase tracking-[0.2em] leading-tight text-slate-500 dark:text-slate-400">Tu</h2>
        <h3 class="mt-0.5 text-xl font-extrabold uppercase tracking-wide leading-tight text-slate-900 dark:text-slate-100">Agenda</h3>
      </div>

      <div class="flex min-w-[70px] flex-col items-center justify-center rounded-2xl bg-slate-100 px-3.5 py-1.5 dark:bg-slate-900">
        <span class="text-base font-bold leading-none text-primary-600 dark:text-primary-300">{{ timelineEvents.length }}</span>
        <span class="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-primary-600 dark:text-primary-300">Events</span>
      </div>
    </header>

    <div v-if="timelineEvents.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
      No hay eventos guardados proximos.
    </div>

    <div v-else class="pl-1.5">
      <div v-for="(event, index) in timelineEvents" :key="event.id" class="relative pb-6 last:pb-2">
        <div
          class="absolute left-[7px] top-[24px] z-0 w-[2px]"
          :class="getConnectorClass(index === timelineEvents.length - 1, event.isActive)"
        ></div>

        <div
          class="absolute z-10 rounded-full ring-[6px] ring-white dark:ring-slate-950"
          :class="getDotClass(event.isActive)"
        ></div>

        <button class="w-full min-h-[44px] pl-8 text-left" @click="onSelect(event)">
          <span class="mb-1 block text-[12px] font-bold tracking-wide" :class="getDateClass(event.isActive)">
            {{ event.dateLabel }}
          </span>
          <span class="mb-1 block text-[16px] font-extrabold leading-snug tracking-tight text-slate-900 dark:text-slate-100">{{ event.title }}</span>
          <span class="block text-[12px] font-medium tracking-wide text-slate-500 dark:text-slate-400">{{ event.location || 'Ubicacion por confirmar' }}</span>
        </button>
      </div>
    </div>

    <button
      type="button"
      class="mt-5 w-full rounded-[1.25rem] border border-slate-300 bg-transparent py-3.5 text-sm font-bold tracking-wide text-slate-700 transition-colors duration-200 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
      @click="emit('sync')"
    >
      Sincronizar con Google Calendar
    </button>
  </section>
</template>


