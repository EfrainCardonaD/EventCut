<script setup>
import EventCard from './EventCard.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  events: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold text-gray-800 mb-5">{{ title }}</h2>

    <div class="space-y-5">
      <EventCard v-for="evento in events" :key="evento.id" :evento="evento" />
    </div>
  </section>
</template>

