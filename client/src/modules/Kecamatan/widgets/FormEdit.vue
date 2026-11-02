<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputText from '@/components/Form/InputText.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { edit_kecamatan, get_info_edit_kecamatan } from '@/service/kecamatan';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  selectedKecamatan: any;
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
  form.value.kode = '';
  errors.value = {};
};

// Function: Validate form
const errors = ref<Record<string, string>>({
  name: '',
  kode: '',
});

const validateForm = () => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  if (form.value.name === '') {
    errors.value.name = 'Nama kecamatan tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.kode) {
    errors.value.kode = 'Kode kecamatan wajib diisi.';
    isValid = false;
  }

  console.log(errors.value);

  return isValid;
};

// State: Loading
const isLoading = ref(true);

// Function: Fetch Data
const fetchData = async () => {
  if (!props.selectedKecamatan || !props.selectedKecamatan.id) return;
  try {
    const response = await get_info_edit_kecamatan(props.selectedKecamatan.id);
    form.value.name = response.data.name;
    form.value.kode = response.data.kode;
  } catch (error) {
    displayNotification('Gagal mengambil data kecamatan', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{ name: string; kode: string }>({
  name: '',
  kode: '',
});

const handleSubmit = async () => {
  if (!validateForm()) return;

  const kecamatan_id = props.selectedKecamatan.id;
  const formData = JSON.parse(JSON.stringify(form.value));
  console.log(formData);

  formData.id = kecamatan_id;

  isSubmitting.value = true;
  try {
    const response = await edit_kecamatan(formData);
    emit('status', { error_msg: response.error_msg, error: response.error });
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Function: Handle escape & Fetch Data
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(async () => {
  await fetchData();
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(async () => {
  await fetchData();
  document.removeEventListener('keydown', handleEscape);
});

watch(
  () => props.selectedKecamatan,
  (val) => {
    if (props.isModalOpen && val?.id) fetchData();
  },
);
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
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
      <div v-else class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Edit kecamatan</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Nama kecamatan -->
        <div>
          <InputText
            id="kode"
            v-model="form.kode"
            label="kode kecamatan"
            type="text"
            placeholder="Masukkan kode kecamatan"
            :error="errors.kode"
          />
        </div>

        <div>
          <InputText
            id="name"
            v-model="form.name"
            label="Nama kecamatan"
            type="text"
            placeholder="Masukkan nama kecamatan"
            :error="errors.name"
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
            :disabled="!(form.name.trim() && form.kode.trim()) || isSubmitting"
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
