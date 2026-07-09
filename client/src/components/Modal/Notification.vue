<script setup lang="ts">
import { computed, defineEmits, defineProps } from 'vue';

const props = defineProps<{
  showNotification: boolean;
  notificationType: 'success' | 'error' | 'warning';
  notificationMessage?: string | number;
  notificationMessageHtml?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const closeNotification = () => emit('close');

// Label & style dinamis biar konsisten dan bisa dikontrol satu tempat
const titleText = computed(() => {
  switch (props.notificationType) {
    case 'success':
      return 'Berhasil';
    case 'error':
      return 'Gagal';
    case 'warning':
      return 'Peringatan';
    default:
      return '';
  }
});

const titleClass = computed(() => {
  return {
    success: 'text-emerald-900',
    error: 'text-rose-900',
    warning: 'text-amber-900',
  }[props.notificationType];
});
</script>

<template>
  <teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      enter-to-class="opacity-100 translate-y-0 sm:scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 sm:scale-100"
      leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    >
      <div
        v-if="showNotification"
        class="fixed inset-0 z-[99999] flex items-center justify-center px-4 py-6 sm:px-0"
      >
        <!-- Overlay -->
        <div
          class="fixed inset-0 bg-gray-500/60 backdrop-blur-sm transition-opacity"
          @click="closeNotification"
        ></div>

        <!-- Notification Card -->
        <div
          class="relative z-10 w-full max-w-sm transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 transition-all p-6"
        >
          <div class="flex items-start space-x-4">
            <!-- Icon -->
            <div
              v-if="notificationType === 'success'"
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
            >
              <svg
                class="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div
              v-else-if="notificationType === 'error'"
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600"
            >
              <svg
                class="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div
              v-else
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"
            >
              <svg
                class="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374
                     1.948 3.374h14.71c1.73 0 2.813-1.874
                     1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898
                     0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <!-- Text -->
            <div class="flex-1">
              <h3 class="text-lg sm:text-xl font-semibold" :class="titleClass">
                {{ titleText }}
              </h3>

              <p
                v-if="notificationMessage"
                class="mt-1 text-sm sm:text-base text-gray-600 whitespace-pre-line"
              >
                {{ notificationMessage }}
              </p>

              <p
                v-else-if="notificationMessageHtml"
                class="mt-1 text-sm sm:text-base text-gray-600"
                v-html="notificationMessageHtml"
              ></p>
            </div>
          </div>

          <!-- Close Button -->
          <button
            @click="closeNotification"
            class="absolute top-3 right-3 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1
                0 111.414 1.414L11.414 10l4.293 4.293a1 1
                0 01-1.414 1.414L10 11.414l-4.293
                4.293a1 1 0 01-1.414-1.414L8.586
                10 4.293 5.707a1 1 0 010-1.414z"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </teleport>
</template>
