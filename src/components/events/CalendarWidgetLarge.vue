<script setup>
import CalendarWidgetBase from '@/components/events/CalendarWidgetBase.vue'
import { calendarWidgetEmits, calendarWidgetProps } from '@/components/events/calendarWidget.contract'

const props = defineProps(calendarWidgetProps)
const emit = defineEmits(calendarWidgetEmits)
</script>

<template>
  <CalendarWidgetBase
    :month-key="props.monthKey"
    :selected-date="props.selectedDate"
    :events-by-date="props.eventsByDate"
    size-preset="large"
    @change-month="emit('change-month', $event)"
    @select-date="emit('select-date', $event)"
  />
</template>

