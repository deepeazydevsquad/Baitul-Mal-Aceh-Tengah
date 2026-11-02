<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import TextArea from '@/components/Form/TextArea.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import {
  edit_status_permohonan_bantuan,
} from '@/service/permohonan_bantuan';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  selectedPermohonanBantuan: any;
}


const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Function: Reset form
const resetForm = () => {
  form.value = {
    alasan_penolakan: '',
  };

  // Reset errors
  errors.value = {};

};

// Function: Validate form
const errors = ref<Record<string, string>>({
  alasan_penolakan: '',
});

const validateForm = () => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  if (!props.selectedPermohonanBantuan.id) {
    displayNotification('Form Invalid, Silahkan keluar dan isi form kembali.', 'error');
    isValid = false;
  }
  // Validate alasan_penolakan
  if (!form.value.alasan_penolakan.trim()) {
    errors.value.alasan_penolakan = 'Alasan penolakan harus diisi';
    isValid = false;
  }
  return isValid;
};

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{
  alasan_penolakan: string;
}>({
  alasan_penolakan: '',
});

const handleSubmit = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;

  const formData = {
    id: props.selectedPermohonanBantuan.id,
    alasan_penolakan: form.value.alasan_penolakan,
  };

  try {
    const response = await edit_status_permohonan_bantuan(formData);
    emit('status', { error_msg: response.error_msg || response, error: response.error });
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Function: Handle escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(async () => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(async () => {
  document.removeEventListener('keydown', handleEscape);
});
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
      <div class="relative max-w-xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">
            Pembatalan Permohonan Bantuan
          </h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <div class="px-1 py-1 space-y-4 max-h-[64vh] overflow-y-auto pr-2">
          <div class="space-y-2">
            <TextArea
              id="alasan_penolakan"
              v-model="form.alasan_penolakan"
              label="Alasan Penolakan"
              placeholder="Masukkan alasan penolakan permohonan bantuan"
              note="Agar dilakukan penolakan, alasan penolakan harus diisi."
              :error="errors.alasan_penolakan"
              :required="true"
            />
          </div>
        </div>
        <!-- Actions -->
        <div class="flex justify-end gap-3">
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
            :disabled="!form.alasan_penolakan.trim() || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan</span>
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
