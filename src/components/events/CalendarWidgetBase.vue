<script setup>
import { computed } from 'vue'
import { calendarWidgetEmits, calendarWidgetProps } from '@/components/events/calendarWidget.contract'

const props = defineProps({
  ...calendarWidgetProps,
  sizePreset: {
    type: String,
    default: 'default',
    validator: (value) => ['compact', 'default', 'large'].includes(value),
  },
})

const emit = defineEmits(calendarWidgetEmits)

const currentMonthDate = computed(() => {
  const [year, month] = props.monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1)
})

const monthTitle = computed(() => {
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(currentMonthDate.value)
})

const weekLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

const calendarCells = computed(() => {
  const monthStart = new Date(currentMonthDate.value)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

  const leadingDays = (monthStart.getDay() + 6) % 7
  const cells = []

  for (let index = 0; index < leadingDays; index += 1) {
    const date = new Date(monthStart)
    date.setDate(monthStart.getDate() - (leadingDays - index))
    cells.push({ date, inCurrentMonth: false })
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    cells.push({ date: new Date(monthStart.getFullYear(), monthStart.getMonth(), day), inCurrentMonth: true })
  }

  while (cells.length % 7 !== 0) {
    const date = new Date(monthEnd)
    date.setDate(monthEnd.getDate() + (cells.length % 7))
    cells.push({ date, inCurrentMonth: false })
  }

  return cells.map((cell) => {
    const dateKey = `${cell.date.getFullYear()}-${`${cell.date.getMonth() + 1}`.padStart(2, '0')}-${`${cell.date.getDate()}`.padStart(2, '0')}`
    const isSelected = props.selectedDate === dateKey
    const eventCount = props.eventsByDate?.[dateKey]?.length || 0

    return {
      ...cell,
      dateKey,
      dayNumber: cell.date.getDate(),
      isSelected,
      eventCount,
    }
  })
})

const isCompact = computed(() => props.sizePreset === 'compact')
const isLarge = computed(() => props.sizePreset === 'large')

const sectionClass = computed(() => {
  if (isCompact.value) {
    return 'rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800/70 dark:bg-slate-950'
  }

  return isLarge.value
      ? 'h-full rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950 md:p-5'
      : 'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800/70 dark:bg-slate-950'
})

const titleClass = computed(() => {
  if (isCompact.value) {
    return 'font-headline text-base font-extrabold capitalize text-slate-900 dark:text-white'
  }

  return isLarge.value
    ? 'font-headline text-lg font-extrabold capitalize text-slate-900 dark:text-white md:text-xl lg:text-2xl'
    : 'font-headline text-lg font-extrabold capitalize text-slate-900 dark:text-white'
})

const chevronClass = computed(() => {
  if (isCompact.value) {
    return 'material-symbols-outlined text-sm'
  }

  return isLarge.value ? 'material-symbols-outlined text-base md:text-lg' : 'material-symbols-outlined text-base'
})

const weekHeaderClass = computed(() => {
  if (isCompact.value) {
    return 'mb-1 grid grid-cols-7 gap-y-1 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400'
  }

  return isLarge.value
    ? 'mb-1 grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 md:text-xs lg:text-sm'
    : 'mb-1 grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400'
})

const gridTextClass = computed(() => {
  if (isCompact.value) {
    return 'grid grid-cols-7 gap-y-1 text-center text-xs font-medium text-slate-700 dark:text-slate-200'
  }

  return isLarge.value
    ? 'grid grid-cols-7 gap-y-2 text-center text-sm font-medium text-slate-700 dark:text-slate-200 md:text-base lg:text-lg'
    : 'grid grid-cols-7 gap-y-2 text-center text-sm font-medium text-slate-700 dark:text-slate-200'
})

const dayButtonClass = computed(() => {
  if (isCompact.value) {
    return 'relative mx-auto flex h-7 w-7 items-center justify-center rounded-full transition-colors'
  }

  return isLarge.value
    ? 'relative mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors md:h-11 md:w-11 lg:h-12 lg:w-12'
    : 'relative mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors'
})

const markerClass = computed(() => {
  if (isCompact.value) {
    return 'absolute bottom-0.5 h-1 w-1 rounded-full bg-sky-500'
  }

  return isLarge.value ? 'absolute bottom-1 h-1.5 w-1.5 rounded-full bg-sky-500 md:h-2 md:w-2' : 'absolute bottom-1 h-1.5 w-1.5 rounded-full bg-sky-500'
})

const getDayClass = (day) => {
  return [
    dayButtonClass.value,
    day.inCurrentMonth ? 'hover:bg-slate-100 dark:hover:bg-slate-900' : 'text-slate-300 dark:text-slate-600',
    day.isSelected ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-500/20 dark:bg-sky-500 dark:text-sky-950' : '',
  ]
}

const changeMonth = (delta) => {
  const nextMonth = new Date(currentMonthDate.value)
  nextMonth.setMonth(nextMonth.getMonth() + delta)
  const key = `${nextMonth.getFullYear()}-${`${nextMonth.getMonth() + 1}`.padStart(2, '0')}`
  emit('change-month', key)
}

const selectDate = (dateKey) => {
  emit('select-date', dateKey)
}
</script>

<template>
  <section :class="sectionClass">
    <header class="mb-4 flex items-center justify-between">
      <h3 :class="titleClass">{{ monthTitle }}</h3>
      <span class="flex gap-1">
          <button class="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900" @click="changeMonth(-1)">
          <span :class="chevronClass">chevron_left</span>
        </button>
          <button class="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900" @click="changeMonth(1)">
          <span :class="chevronClass">chevron_right</span>
        </button>
      </span>
    </header>

    <div :class="weekHeaderClass">
      <div v-for="label in weekLabels" :key="label">{{ label }}</div>
    </div>

    <div :class="gridTextClass">
      <button
        v-for="day in calendarCells"
        :key="day.dateKey"
        :aria-label="`Seleccionar dia ${day.dayNumber}`"
        :aria-pressed="day.isSelected"
        :class="getDayClass(day)"
        @click="selectDate(day.dateKey)"
      >
        <span>{{ day.dayNumber }}</span>
        <span v-if="day.eventCount > 0" :class="markerClass"></span>
      </button>
    </div>
  </section>
</template>

