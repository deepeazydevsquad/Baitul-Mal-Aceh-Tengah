<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputText from '@/components/Form/InputText.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { add_bank } from '@/service/bank';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
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
  form.value.name = '';
  form.value.img = null;

  // Reset errors
  errors.value = {};
};

// Function:
const errors = ref<Record<string, string>>({
  name: '',
  img: '',
});

const validateForm = () => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  if (form.value.name === '') {
    errors.value.name = 'Nama bank tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.img) {
    errors.value.img = 'Logo bank wajib diisi.';
    isValid = false;
  }

  console.log(errors.value);

  return isValid;
};

// Function: Handle file
const handleFile = (file: File | null) => {
  if (!file) {
    form.value.img = null;
    return;
  }

  // Validasi ukuran file
  const fileSizeKB = Math.round(file.size / 1024);
  if (fileSizeKB > 1000) {
    errors.value.img = 'Ukuran file maksimal 1000 KB';
    return;
  }

  form.value.img = file;
};

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{ name: string; img: File | null }>({
  name: '',
  img: null,
});

const handleSubmit = async () => {
  if (!validateForm()) return;

  const formData = new FormData();
  formData.append('name', form.value.name);
  if (form.value.img) formData.append('img', form.value.img);

  isSubmitting.value = true;

  console.log(formData.get('name'));
  console.log(formData.get('img'));

  try {
    const response = await add_bank(formData);
    emit('status', { error_msg: response.error_msg || response, error: response.error });
    closeModal();
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
      <div class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Tambah Bank</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Nama Bank -->
        <div>
          <InputText
            id="name"
            v-model="form.name"
            label="Nama Bank"
            type="text"
            placeholder="Masukkan nama bank"
            :error="errors.name"
          />
        </div>

        <!-- Upload Logo -->
        <div>
          <InputFile
            id="photo-upload"
            label="Upload Logo"
            buttonText="Pilih File"
            accept=".jpg,.jpeg,.png"
            :error="errors.img"
            :maxSize="1000"
            dimensionsInfo="100x33 px"
            @file-selected="handleFile"
          />
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
            :disabled="!(form.name.trim() || (form.img && !isSubmitting))"
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
