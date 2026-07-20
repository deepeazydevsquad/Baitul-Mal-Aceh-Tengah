<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Notification from '@/components/Modal/Notification.vue'
import BaseButton from '@/components/Button/BaseButton.vue'
import InputText from '@/components/Form/InputText.vue'
import SelectField from '@/components/Form/SelectField.vue'
import TextArea from '@/components/Form/TextArea.vue'

// Composable
import { useNotification } from '@/composables/useNotification'

// Service
import { edit_daftar_asnaf, get_info_edit_daftar_asnaf } from '@/service/daftar_asnaf'

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification()

// Props
interface Props {
  isModalOpen: boolean
  selectedAsnaf: any
}
const props = defineProps<Props>()

// Emit
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void
}>()

// Form state
const form = ref<{ name: string; tipe: string }>({ name: '', tipe: 'zakat' })
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isLoading = ref(false)

// Reset form
const resetForm = () => {
  form.value = { name: '', tipe: 'zakat' }
  errors.value = {}
}

// Validasi
const validateForm = () => {
  let isValid = true
  errors.value = {}

  if (!form.value.name) {
    errors.value.name = 'Nama asnaf tidak boleh kosong.'
    isValid = false
  }

  if (!form.value.tipe) {
    errors.value.tipe = 'Tipe asnaf harus dipilih.'
    isValid = false
  }

  return isValid
}

// Ambil data asnaf untuk edit
const fetchData = async () => {
  if (!props.selectedAsnaf?.id) return
  isLoading.value = true
  try {
    const response = await get_info_edit_daftar_asnaf(props.selectedAsnaf.id)
    form.value.name = response.data.name
    form.value.tipe = response.data.tipe || 'zakat'
  } catch (error) {
    displayNotification('Gagal mengambil data asnaf', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  // Pastikan data sudah di-fetch
  if (!props.selectedAsnaf?.id) {
    displayNotification('ID asnaf tidak valid', 'error')
    return
  }

  isSubmitting.value = true

  try {
    const payload = {
      id: Number(props.selectedAsnaf.id),
      name: String(form.value.name).trim(),
      tipe: String(form.value.tipe).trim(),
    }

    console.log('Payload dikirim ke backend:', payload)

    const response = await edit_daftar_asnaf(payload)

    const msg = response.message || response.error_msg || 'Berhasil'
    const isError = response.error || false

    emit('status', { error_msg: msg, error: isError })
    closeModal()
  } catch (error: any) {
    const msg =
      error.response?.data?.error_msg || error.response?.data?.message || 'Terjadi kesalahan'
    displayNotification(msg, 'error')
  } finally {
    isSubmitting.value = false
    closeModal()
  }
}

// Tutup modal
const closeModal = () => {
  if (isSubmitting.value) return
  resetForm()
  emit('close')
}

// Escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal()
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
})

// Watch perubahan modal + data
watch(
  () => props.isModalOpen,
  (val) => {
    if (val && props.selectedAsnaf?.id) {
      fetchData()
    } else if (!val) {
      resetForm()
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
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Edit Asnaf</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Input -->
        <div>
          <InputText
            id="name"
            v-model="form.name"
            label="Nama Asnaf"
            type="text"
            placeholder="Masukkan Nama Asnaf"
            :error="errors.name"
          />
        </div>

        <div>
          <SelectField
            id="tipe"
            v-model="form.tipe"
            label="Tipe Asnaf"
            :options="[
              { id: 'zakat', name: 'Zakat' },
              { id: 'infaq', name: 'Infaq' },
            ]"
            :error="errors.tipe"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-4">
          <BaseButton
            @click="closeModal"
            type="button"
            :disabled="isSubmitting"
            variant="secondary"
          >
            Batal
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="!form.name.trim() || isSubmitting"
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
