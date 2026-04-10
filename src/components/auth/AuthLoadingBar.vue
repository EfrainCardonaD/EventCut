<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <Transition name="bar-fade">
    <div
      v-if="show"
      class="absolute top-0 left-0 w-full h-2.5 bg-slate-200 dark:bg-slate-800 overflow-hidden z-10"
      aria-hidden="true"
    >
      <div class="auth-loading-wave h-full bg-tertiary-500 dark:bg-tertiary-200 rounded-full" />
    </div>
  </Transition>
</template>

<style scoped>
.auth-loading-wave {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  height: 80%;
  animation: cyclic-fill-wave 1s linear infinite;
  will-change: transform, clip-path, opacity;
}

@keyframes cyclic-fill-wave {
  /* Ida: primer tercio super lento, luego acelera */
  0% {
    transform-origin: left center;
    transform: scaleX(0.008);
    opacity: 0.95;
    animation-timing-function: cubic-bezier(0.12, 0, 0.22, 1);
    clip-path: polygon(0% 88%, 0% 0%, 78% 0%, 88% 0%, 95% 0%, 88% 88%, 0% 88%);
  }
  14% {
    transform-origin: left center;
    transform: scaleX(0.03);
    clip-path: polygon(0% 100%, 0% 0%, 78% 0%, 88% 0%, 95% 0%, 100% 100%, 0% 100%);
  }
  16.7% {
    transform-origin: left center;
    transform: scaleX(0.055);
    animation-timing-function: cubic-bezier(0.18, 0.85, 0.3, 1);
    clip-path: polygon(0% 100%, 0% 0%, 78% 0%, 88% 0%, 95% 0%, 100% 100%, 0% 100%);
  }
  16.9% {
    transform-origin: left center;
    transform: scaleX(0.055);
    animation-timing-function: cubic-bezier(0.18, 0.85, 0.3, 1);
    clip-path: polygon(0% 100%, 0% 0%, 78% 18%, 88% 14%, 95% 22%, 100% 100%, 0% 100%);
  }
  17.2% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 30%, 88% 22%, 95% 36%, 100% 100%, 0% 100%);
  }
  17.5% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 36%, 88% 28%, 95% 42%, 100% 100%, 0% 100%);
  }
  33.3% {
    transform-origin: left center;
    transform: scaleX(0.36);
    clip-path: polygon(0% 100%, 0% 0%, 78% 36%, 88% 28%, 95% 42%, 100% 100%, 0% 100%);
  }
  33.6% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 48%, 88% 40%, 95% 56%, 100% 100%, 0% 100%);
  }
  34% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 60%, 88% 52%, 95% 68%, 100% 100%, 0% 100%);
  }
  34.4% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 68%, 88% 60%, 95% 76%, 100% 100%, 0% 100%);
  }
  44% {
    transform-origin: left center;
    transform: scaleX(0.7);
    clip-path: polygon(0% 100%, 0% 0%, 78% 68%, 88% 60%, 95% 76%, 100% 100%, 0% 100%);
  }
  44.4% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 76%, 88% 68%, 95% 82%, 100% 100%, 0% 100%);
  }
  44.8% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 84%, 88% 76%, 95% 90%, 100% 100%, 0% 100%);
  }
  45.2% {
    clip-path: polygon(0% 100%, 0% 0%, 78% 90%, 88% 84%, 95% 96%, 100% 100%, 0% 100%);
  }
  49.5% {
    transform-origin: left center;
    transform: scaleX(1);
    opacity: 1;
    clip-path: polygon(0% 100%, 0% 0%, 78% 98%, 88% 94%, 95% 100%, 100% 100%, 0% 100%);
  }

  /* Reset para invertir sentido */
  50% {
    transform-origin: left center;
    transform: scaleX(0.008);
    opacity: 0;
  }

  /* Vuelta: primer tercio super lento, luego acelera */
  50.1% {
    transform-origin: right center;
    transform: scaleX(0.008);
    opacity: 0.95;
    animation-timing-function: cubic-bezier(0.12, 0, 0.22, 1);
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 30%, 12% 22%, 5% 16%, 0% 0%);
  }
  64% {
    transform-origin: right center;
    transform: scaleX(0.03);
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 30%, 12% 22%, 5% 16%, 0% 0%);
  }
  66.7% {
    transform-origin: right center;
    transform: scaleX(0.055);
    animation-timing-function: cubic-bezier(0.18, 0.85, 0.3, 1);
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 30%, 12% 22%, 5% 16%, 0% 0%);
  }
  66.9% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 40%, 12% 30%, 5% 22%, 0% 0%);
  }
  67.2% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 45%, 12% 35%, 5% 26%, 0% 0%);
  }
  67.5% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 50%, 12% 40%, 5% 30%, 0% 0%);
  }
  83.3% {
    transform-origin: right center;
    transform: scaleX(0.36);
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 50%, 12% 40%, 5% 30%, 0% 0%);
  }
  83.6% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 56%, 12% 46%, 5% 36%, 0% 0%);
  }
  84% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 62%, 12% 52%, 5% 42%, 0% 0%);
  }
  84.4% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 68%, 12% 58%, 5% 48%, 0% 0%);
  }
  94% {
    transform-origin: right center;
    transform: scaleX(0.7);
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 68%, 12% 58%, 5% 48%, 0% 0%);
  }
  94.4% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 76%, 12% 68%, 5% 58%, 0% 0%);
  }
  94.8% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 82%, 12% 74%, 5% 66%, 0% 0%);
  }
  95.2% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 90%, 12% 84%, 5% 78%, 0% 0%);
  }
  99.5% {
    transform-origin: right center;
    transform: scaleX(1);
    opacity: 1;
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 22% 8%, 12% 4%, 5% 6%, 0% 0%);
  }

}

.bar-fade-enter-active,
.bar-fade-leave-active {
  transition: opacity 0.75s ease;
}

.bar-fade-enter-from,
.bar-fade-leave-to {
  opacity: 0;
}
</style>