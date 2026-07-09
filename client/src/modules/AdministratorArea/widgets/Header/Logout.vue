<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import { logout_administrator } from '@/service/auth'

const emit = defineEmits(['close-dropdown'])

// Reactive state
const showConfirmation = ref(false)
const isLoading = ref(false)
const showNotification = ref(false)

// Methods
const showLogoutConfirmation = () => {
  showConfirmation.value = true
}

const hideLogoutConfirmation = () => {
  if (!isLoading.value) {
    showConfirmation.value = false
    emit('close-dropdown')
  }
}

const handleLogout = async () => {
  isLoading.value = true

  try {
    await logout_administrator({
      refresh_token: localStorage.getItem('administrator_refresh_token'),
    })

    // Clear localStorage di sisi client
    localStorage.removeItem('administrator_access_token')
    localStorage.removeItem('administrator_refresh_token')

    showConfirmation.value = false
    showNotification.value = true

    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  } catch (error) {
    console.error('Error during logout:', error)

    localStorage.removeItem('administrator_access_token')
    localStorage.removeItem('administrator_refresh_token')

    showConfirmation.value = false
    showNotification.value = true

    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  } finally {
    isLoading.value = false
  }
}

defineExpose({
  showLogoutConfirmation,
  handleLogout,
})
</script>

<template>
  <div>
    <!-- <button
      @click="showLogoutConfirmation"
      class="flex items-center gap-3.5 py-4 px-6 text-sm font-medium duration-300 ease-in-out text-green-900 hover:text-green-700 lg:text-base w-full text-left"
    >
      <svg
        class="fill-current"
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15.5375 0.618744H11.6531C10.7594 0.618744 10.0031 1.37499 10.0031 2.26874V4.64062C10.0031 5.05312 10.3469 5.39687 10.7594 5.39687C11.1719 5.39687 11.55 5.05312 11.55 4.64062V2.23437C11.55 2.16562 11.5844 2.13124 11.6531 2.13124H15.5375C16.3625 2.13124 17.0156 2.78437 17.0156 3.60937V18.3562C17.0156 19.1812 16.3625 19.8344 15.5375 19.8344H11.6531C11.5844 19.8344 11.55 19.8 11.55 19.7312V17.3594C11.55 16.9469 11.2062 16.6031 10.7594 16.6031C10.3125 16.6031 10.0031 16.9469 10.0031 17.3594V19.7312C10.0031 20.625 10.7594 21.3812 11.6531 21.3812H15.5375C17.2219 21.3812 18.5625 20.0062 18.5625 18.3562V3.64374C18.5625 1.95937 17.1875 0.618744 15.5375 0.618744Z"
          fill=""
        />
        <path
          d="M6.05001 11.7563H12.2031C12.6156 11.7563 12.9594 11.4125 12.9594 11C12.9594 10.5875 12.6156 10.2438 12.2031 10.2438H6.08439L8.21564 8.07813C8.52501 7.76875 8.52501 7.2875 8.21564 6.97812C7.90626 6.66875 7.42501 6.66875 7.11564 6.97812L3.67814 10.4844C3.36876 10.7938 3.36876 11.275 3.67814 11.5844L7.11564 15.0906C7.25314 15.2281 7.45939 15.3312 7.66564 15.3312C7.87189 15.3312 8.04376 15.2625 8.21564 15.125C8.52501 14.8156 8.52501 14.3344 8.21564 14.025L6.05001 11.7563Z"
          fill=""
        />
      </svg>
      
    </button> -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      enter-to-class="opacity-100 translate-y-0 sm:scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 sm:scale-100"
      leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    >
      <Teleport to="body">
        <div
          v-if="showConfirmation"
          class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="hideLogoutConfirmation"
        >
          <div class="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Konfirmasi Logout</h3>
              <button
                @click="hideLogoutConfirmation"
                class="text-gray-400 hover:text-gray-600 transition-colors"

              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div class="p-6">
              <div class="flex items-center mb-4">
                <div
                  class="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    ></path>
                  </svg>
                </div>
              </div>
              <p class="text-center text-gray-700 mb-6">
                Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu login kembali untuk
                menggunakan aplikasi.
              </p>
            </div>

            <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                @click="hideLogoutConfirmation"
                :disabled="isLoading"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Batal
              </button>
              <button
                @click="handleLogout"
                :disabled="isLoading"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg
                  v-if="isLoading"
                  class="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {{ isLoading ? 'Keluar...' : 'Ya, Keluar' }}
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="showNotification"
          class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
          Berhasil logout. Mengalihkan ke halaman login...
        </div>
      </Teleport>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
