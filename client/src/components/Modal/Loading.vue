<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="loading"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white px-6 py-5 rounded-xl flex flex-col items-center shadow-lg">
          <svg class="w-12 h-12 animate-spin text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <p class="text-gray-700 font-medium text-sm text-center">
            {{ label || 'Loading...' }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  label?: string
}>()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
