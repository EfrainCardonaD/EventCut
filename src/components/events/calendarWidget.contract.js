export const calendarWidgetProps = {
  monthKey: {
    type: String,
    required: true,
  },
  selectedDate: {
    type: String,
    required: true,
  },
  eventsByDate: {
    type: Object,
    default: () => ({}),
  },
}

export const calendarWidgetEmits = ['change-month', 'select-date']

