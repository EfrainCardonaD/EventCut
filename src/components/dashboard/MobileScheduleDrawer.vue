<script setup>
import MyScheduleTimelineCard from '@/components/events/MyScheduleTimelineCard.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  events: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'select-event', 'sync'])

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="modelValue" class="fixed inset-0 z-[60] bg-slate-950/60 p-4 backdrop-blur-sm md:hidden">
      <div class="mx-auto flex h-full w-full max-w-md flex-col justify-center">
        <div class="mb-2 flex justify-end">
          <button
            type="button"
            class="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Cerrar agenda"
            @click="close"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <MyScheduleTimelineCard
          :events="events"
          @select="(event) => { close(); emit('select-event', event) }"
          @sync="emit('sync')"
        />
      </div>
    </div>
  </Transition>
</template>
