<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Notification from '@/components/Modal/Notification.vue'
import BaseButton from '@/components/Button/BaseButton.vue'
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue'
import ToggleSwitch from '@/components/Button/ToggleSwitch.vue'

// Composable
import { useNotification } from '@/composables/useNotification'

// Service
import {
  get_info_edit_status_program_bantuan,
  edit_status_program_bantuan,
} from '@/service/program_kegiatan_bantuan'

// State: loading
const isLoading = ref(false)

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification()

interface Props {
  isModalOpen: boolean
  selectedProgram: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void
}>()

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return
  resetForm()
  emit('close')
}

// Function: Fetch data
async function fetchData() {
  if (!props.selectedProgram || !props.selectedProgram.id) return
  isLoading.value = true
  try {
    const responseEditInfo = await get_info_edit_status_program_bantuan(
      props.selectedProgram.id as number,
    )

    form.value = responseEditInfo.data
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// Function: Reset form
const resetForm = () => {
  form.value = {
    id: 0,
  }

  // Reset errors
  errors.value = {}
}

// Function: Reset
const errors = ref<Record<string, string>>({
  status_kegiatan: '',
})

const validateForm = () => {
  let isValid = true

  // Reset errors
  errors.value = {}

  if (!props.selectedProgram?.id) {
    displayNotification('Form Invalid, Silahkan keluar dan isi form kembali.', 'error')
    isValid = false
  }

  if (typeof form.value.status_kegiatan !== 'boolean') {
    errors.value.banner = 'Status kegiatan wajib diisi.'
    isValid = false
  }

  console.log(errors.value)

  return isValid
}

// Function: Handle submit
const isSubmitting = ref(false)
const form = ref<{
  id: number
}>({
  id: 0,
})

const handleToggle = async () => {
  form.value = {
    ...form.value,
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  if (!validateForm()) return

  try {
    const response = await edit_status_program_bantuan(Number(props.selectedProgram.id))
    emit('status', { error_msg: response.error_msg || response, error: response.error })
  } catch (error: any) {
    console.error(error)
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error')
  } finally {
    isSubmitting.value = false
    closeModal()
  }
}

// Function: Handle escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal()
}
onMounted(async () => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(async () => {
  document.removeEventListener('keydown', handleEscape)
})

watch(
  () => [props.isModalOpen, props.selectedProgram],
  ([isModalOpen, selectedProgram]) => {
    if (isModalOpen && selectedProgram) {
      fetchData()
    }
  },
)
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <!-- Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- Loading -->
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />

      <!-- Modal Content -->
      <div v-else class="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">
            Edit Status Program Bantuan
          </h2>
          <button
            class="text-lg text-gray-400 hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Body -->
        <div class="max-h-[60vh] space-y-6 overflow-y-auto px-1 py-2">
          <div class="flex gap-2">
            <label for="status_kegiatan" class="text-sm font-semibold text-gray-600">Status Kegiatan</label>
            <ToggleSwitch
            :id="form.id"
            :checked="form.status_kegiatan"
            @change="handleToggle(form)"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 flex justify-end gap-3">
          <BaseButton
            type="button"
            variant="secondary"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            Batal
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan Perubahan</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Notification -->
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>
