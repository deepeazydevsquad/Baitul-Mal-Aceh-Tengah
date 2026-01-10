<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div class="text-2xl font-semibold text-green-900 space-x-1">
        <span
          v-for="(char, index) in chars"
          :key="index"
          class="inline-block animate-blink"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          {{ char }}
        </span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const show = ref(true);
const chars = 'Loading...'.split('');

onMounted(() => {
  // sembunyikan setelah halaman siap
  if (document.readyState === 'complete') {
    setTimeout(() => (show.value = false), 1000);
  } else {
    window.addEventListener('load', () => setTimeout(() => (show.value = false), 1000), {
      once: true,
    });
  }
});
</script>

<style scoped>
@keyframes blink {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.animate-blink {
  animation: blink 1.5s infinite;
}

.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-500 ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
