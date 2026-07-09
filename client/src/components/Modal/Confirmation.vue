<script setup lang="ts">
const props = defineProps<{
  showConfirmDialog: boolean
  confirmTitle: string
  confirmMessage: string
}>()
</script>

<template>
  <Teleport to="body">
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 z-[99999] flex items-center justify-center px-4 py-6 sm:px-0"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500/60 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative z-10 w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 transition-all"
      >
        <!-- Content -->
        <div class="p-6">
          <div class="flex items-start space-x-4">
            <!-- Icon -->
            <div
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
              <h3
                class="text-lg sm:text-xl font-semibold text-gray-900"
                id="modal-title"
              >
                {{ confirmTitle }}
              </h3>
              <p class="mt-2 text-sm sm:text-base text-gray-600" v-html="confirmMessage"></p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>
