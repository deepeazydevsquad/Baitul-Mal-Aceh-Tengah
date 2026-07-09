<template>
  <Teleport to="body">
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
    <div
      v-if="formStatus"
      class="fixed inset-0 z-[99999] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="flex min-h-screen items-end justify-center px-6 pt-6 pb-6 text-center sm:block sm:p-0"
      >
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          @click="emit('close')"
        ></div>
        <!-- Spacer for vertical alignment -->
        <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"
          >&#8203;</span
        >
        <!-- Modal Content -->
        <div
          class="relative inline-block rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle px-6 py-6"
          :class="width"
        >
          <h3 class="text-2xl font-bold leading-6 text-gray-900 mb-4 px-3">{{ label }}</h3>
          <div class="max-h-[55vh] overflow-y-auto py-6 ps-3 pe-0">
            <slot></slot>
          </div>
          <div class="flex justify-end gap-4 pt-6">
            <button
              type="button"
              @click="handleCancel"
              class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              CANCEL
            </button>
            <!-- Tambahkan pengecekan submitLabel -->
            <PrimaryButton v-if="submitLabel" type="submit" @click="handleSubmit">
              <font-awesome-icon icon="fa-solid fa-plus"></font-awesome-icon>
              {{ submitLabel }}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'submit'): void
}>()

const handleCancel = () => {
  emit('cancel')
}

const handleSubmit = () => {
  emit('submit')
}
const props = defineProps<{
  formStatus: boolean
  label: string
  width: string
  submitLabel: string
}>()
</script>
