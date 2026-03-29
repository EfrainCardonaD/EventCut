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
</script>

<template>
  <section class="rounded-[2rem] bg-[#12161b] p-5 shadow-xl sm:p-6">
    <header class="mb-6 flex items-start justify-between">
      <div class="font-headline">
        <h2 class="text-xs font-bold uppercase tracking-[0.2em] leading-tight text-[#8490a0]">My</h2>
        <h3 class="mt-0.5 text-xl font-extrabold uppercase tracking-wide leading-tight text-[#dfe3e8]">Schedule</h3>
      </div>

      <div class="flex min-w-[70px] flex-col items-center justify-center rounded-2xl bg-[#1e2536] px-3.5 py-1.5">
        <span class="text-base font-bold leading-none text-[#7bb0f9]">{{ timelineEvents.length }}</span>
        <span class="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#7bb0f9]">Events</span>
      </div>
    </header>

    <div v-if="timelineEvents.length === 0" class="rounded-2xl border border-dashed border-[#2e3746] p-4 text-center text-xs text-[#8490a0]">
      No hay eventos guardados proximos.
    </div>

    <div v-else class="pl-1.5">
      <div v-for="(event, index) in timelineEvents" :key="event.id" class="relative pb-6 last:pb-2">
        <div
          class="absolute left-[7px] top-[24px] z-0 w-[2px]"
          :class="[
            index === timelineEvents.length - 1 ? 'h-[30px] bg-gradient-to-b from-[#2e3746] to-transparent' : 'bottom-[-6px]',
            event.isActive ? 'bg-[#7bb0f9]' : 'bg-[#2e3746]',
          ]"
        ></div>

        <div
          class="absolute z-10 rounded-full ring-[6px] ring-[#12161b]"
          :class="event.isActive ? 'left-[-1px] top-[5px] h-4 w-4 bg-[#7bb0f9]' : 'left-[1px] top-[6px] h-3.5 w-3.5 bg-[#343e4f]'"
        ></div>

        <button class="w-full pl-8 text-left" @click="onSelect(event)">
          <span class="mb-1 block text-[12px] font-bold tracking-wide" :class="event.isActive ? 'text-[#7bb0f9]' : 'text-[#8490a0]'">
            {{ event.dateLabel }}
          </span>
          <span class="mb-1 block text-[16px] font-extrabold leading-snug tracking-tight text-[#dfe3e8]">{{ event.title }}</span>
          <span class="block text-[12px] font-medium tracking-wide text-[#687688]">{{ event.location || 'Ubicacion por confirmar' }}</span>
        </button>
      </div>
    </div>

    <button
      type="button"
      class="mt-5 w-full rounded-[1.25rem] border border-[#2e3746] bg-transparent py-3 text-sm font-bold tracking-wide text-[#dfe3e8] transition-colors duration-200 hover:bg-[#1e2536] active:scale-[0.98]"
      @click="emit('sync')"
    >
      Sync to Google Calendar
    </button>
  </section>
</template>


