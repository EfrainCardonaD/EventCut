<script setup>
import CalendarWidget from '@/components/events/CalendarWidget.vue'
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'

defineProps({
  monthKey: {
    type: String,
    required: true,
  },
  selectedDate: {
    type: String,
    default: '',
  },
  eventsByDate: {
    type: Object,
    default: () => ({}),
  },
  favoriteUpcomingEvents: {
    type: Array,
    default: () => [],
  },
  agendaEvents: {
    type: Array,
    default: () => [],
  },
  selectedDateLabel: {
    type: String,
    default: 'agenda actual',
  },
})

const emit = defineEmits(['change-month', 'select-date', 'select-event', 'sync'])
</script>

<template>
  <aside
    class="fixed right-0 top-14 hidden h-[calc(100vh-3.5rem)] w-[22rem] flex-col overflow-y-auto overflow-x-hidden border-l border-slate-200 bg-slate-100 p-6 shadow-sm transition-colors duration-300 sm:top-16 sm:h-[calc(100vh-4rem)] md:top-20 md:h-[calc(100vh-5rem)] dark:border-slate-800/50 dark:bg-slate-900 dark:shadow-none xl:flex"
  >
    <CalendarWidget
      :month-key="monthKey"
      :selected-date="selectedDate"
      :events-by-date="eventsByDate"
      @change-month="(key) => emit('change-month', key)"
      @select-date="(key) => emit('select-date', key)"
    />

    <div class="mt-4">
      <MyScheduleTimelineCard
        :events="favoriteUpcomingEvents"
        @select="(event) => emit('select-event', event)"
        @sync="emit('sync')"
      />
    </div>

    <div class="mt-4 pr-2">
      <h4 class="mb-3 font-headline text-[11px] font-bold uppercase tracking-widest text-slate-500">
        Agenda de {{ selectedDateLabel }}
      </h4>

      <div
        v-if="agendaEvents.length === 0"
        class="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
      >
        Sin eventos confirmados para este dia.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="event in agendaEvents"
          :key="event.id"
          class="cursor-pointer rounded-xl border-l-4 border-tertiary-400 bg-tertiary-500/8 p-3 transition-colors hover:bg-tertiary-500/14 dark:bg-tertiary-500/8 dark:hover:bg-tertiary-500/14"
          @click="emit('select-event', event)"
        >
          <p class="mb-1 text-[10px] font-bold uppercase tracking-wider text-tertiary-700 dark:text-tertiary-300">
            {{ new Intl.DateTimeFormat('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(new Date(event.start_datetime)) }}
            /
            {{ new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(event.start_datetime)) }}
            -
            {{ new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(event.end_datetime)) }}
          </p>
          <h5 class="mb-0.5 text-sm font-bold leading-tight text-slate-800 dark:text-white">{{ event.title }}</h5>
          <p class="flex items-center gap-1 text-[11px] text-slate-500">
            <span class="material-symbols-outlined text-[12px]">location_on</span>
            {{ event.location }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
