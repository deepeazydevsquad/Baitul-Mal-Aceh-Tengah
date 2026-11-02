<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { edit_file, get_info_edit_file } from '@/service/validasi_permohonan_bantuan';
import { openSecureFile } from '@/service/secure_file';

// State: Loading
const isLoading = ref(false);

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  selectedValidasiPermohonanBantuan: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// Data file
const fileData = ref({
  id: null as number | null,
  file_name: '',
  file_path: '',
  status_validasi: 'process',
  alasan_penolakan: null as string | null,
});

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Function: Reset form
const resetForm = () => {
  fileData.value = {
    id: null,
    file_name: '',
    file_path: '',
    status_validasi: 'process',
    alasan_penolakan: null,
  };
  formUpload.value = {};
  errors.value = {};
};

// Function: Fetch data file
async function fetchData() {
  if (!props.selectedValidasiPermohonanBantuan?.realisasi_id) {
    displayNotification('Data tidak valid. Silakan tutup dan buka kembali.', 'error');
    return;
  }

  isLoading.value = true;
  try {
    const response = await get_info_edit_file({
      id: props.selectedValidasiPermohonanBantuan.realisasi_id,
      validasi_id: props.selectedValidasiPermohonanBantuan.validasi_id,
    });

    if (response.error) {
      displayNotification(response.error_msg || 'Gagal memuat data', 'error');
      return;
    }

    // Set data file
    fileData.value = {
      id: response.data.id,
      file_name: response.data.file_name || '',
      file_path: response.data.file_path || '',
      status_validasi: response.data.status_validasi || 'process',
      alasan_penolakan: response.data.alasan_penolakan || null,
    };
  } catch (error: any) {
    displayNotification('Gagal memuat data. Silakan coba lagi.', 'error');
    console.error('Error fetching data:', error);
  } finally {
    isLoading.value = false;
  }
}

// Function: Validate form
const errors = ref<Record<string, string>>({
  file: '',
});

const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!props.selectedValidasiPermohonanBantuan.realisasi_id) {
    displayNotification('Form Invalid, Silahkan keluar dan isi form kembali.', 'error');
    isValid = false;
  }

  if (!props.selectedValidasiPermohonanBantuan.validasi_id) {
    displayNotification('Form Invalid, Silahkan keluar dan isi form kembali.', 'error');
    isValid = false;
  }

  // Validate: file wajib diisi (karena ini edit file)
  if (!formUpload.value) {
    errors.value.file = 'Silakan pilih file baru untuk diupload';
    isValid = false;
  }

  return isValid;
};

// Function: Handle file change
const formUpload = ref<Record<string, File | null>>({});
const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files ? input.files[0] : null;

  if (!file) return;

  formUpload.value[`dokumen_${fileData.value?.file_name || ''}`] = file;

  errors.value.file = '';
};

// Function: Handle submit
const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  const formData = new FormData();
  formData.append('id', String(props.selectedValidasiPermohonanBantuan.realisasi_id));
  formData.append('validasi_id', String(props.selectedValidasiPermohonanBantuan.validasi_id));

  // Append file baru
  if (formUpload.value) {
    Object.entries(formUpload.value).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
  }

  try {
    const response = await edit_file(formData);

    if (response.error) {
      displayNotification(response.error_msg || 'Gagal mengupdate file', 'error');
    } else {
      emit('status', { error_msg: response.error_msg || 'File berhasil diupdate', error: false });
      closeModal();
    }
  } catch (error: any) {
    console.error('Error updating file:', error);
    displayNotification(
      error.response?.data?.error_msg || error.response?.data?.message || 'Gagal mengupdate file',
      'error',
    );
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Function: Handle escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
});

// Watch: Handler
watch(
  () => props.isModalOpen,
  (newVal) => {
    if (newVal) {
      fetchData();
    }
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
      <div v-else class="relative max-w-xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Edit File Permohonan</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Info File Lama -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-2">
            <font-awesome-icon icon="fa-solid fa-info-circle" />
            File Saat Ini
          </h3>
          <div class="space-y-1 text-xs text-blue-700">
            <p>
              <strong>Nama File:</strong>
              {{
                fileData.file_name
                  ?.split('_')
                  .filter((item) => item.trim() !== '')
                  .join(' ')
                  .toUpperCase() || '-'
              }}
            </p>
            <p>
              <strong>Status:</strong>
              <span
                :class="{
                  'text-green-700 font-bold': fileData.status_validasi === 'approve',
                  'text-red-700 font-bold': fileData.status_validasi === 'reject',
                  'text-yellow-700 font-bold': fileData.status_validasi === 'process',
                }"
              >
                {{
                  fileData.status_validasi === 'approve'
                    ? ' DISETUJUI'
                    : fileData.status_validasi === 'reject'
                      ? ' DITOLAK'
                      : ' DIPROSES'
                }}
              </span>
            </p>
            <p v-if="fileData.alasan_penolakan">
              <strong>Alasan Penolakan:</strong> {{ fileData.alasan_penolakan }}
            </p>
            <button
              v-if="fileData.file_path"
              type="button"
              @click="openSecureFile(`/documents/validation/${fileData.id}`)"
              class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
            >
              <font-awesome-icon icon="fa-solid fa-eye" />
              Lihat File Lama
            </button>
          </div>
        </div>

        <!-- Form Upload File Baru -->
        <div class="px-1 py-1 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          <InputFile
            id="edit-file-upload"
            label="Upload File Baru"
            buttonText="Pilih File"
            accept=".pdf"
            :error="errors.file"
            :maxSize="1000"
            :required="true"
            :hideInfo="false"
            :showPreview="false"
            @change="handleFileChange($event)"
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
            type="button"
            variant="primary"
            :disabled="!formUpload || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">
              <font-awesome-icon icon="fa-solid fa-spinner" spin class="mr-2" />
              Menyimpan...
            </span>
            <span v-else> Upload File Baru </span>
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
