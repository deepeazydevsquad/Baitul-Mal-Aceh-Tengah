<script setup lang="ts">
// Library
import { ref, watchEffect } from 'vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputCurrency from '@/components/Form/InputCurrency.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { upload_bukti_setoran } from '@/service/riwayat_donasi';

// Composable: notification
const { displayNotification } = useNotification();

interface Props {
  isModalOpen: boolean;
  id: number;
  nominal_donasi: number;
}

const props = defineProps<Props>();
const isLoading = ref(false);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// Function:
const errors = ref<Record<string, string>>({});

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{
  id: number;
  bukti: File | null;
  nominal_setoran: number;
}>({
  id: 0,
  bukti: null,
  nominal_setoran: 0,
});

// Function: Reset form
const resetForm = () => {
  form.value = {
    id: 0,
    bukti: null,
    nominal_setoran: 0,
  };

  // Reset errors
  errors.value = {};
};

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

const validateForm = () => {
  let isValid = true;
  // Reset errors
  errors.value = {};

  if (!form.value.id) {
    errors.value.bukti = 'ID wajib diisi.';
    isValid = false;
  }

  if (!form.value.bukti) {
    errors.value.bukti = 'Bukti setoran wajib diisi.';
    isValid = false;
  }

  if (form.value.nominal_setoran <= 0) {
    errors.value.nominal_setoran = 'Nominal setoran wajib diisi.';
    isValid = false;
  }

  console.log(errors.value);
  return isValid;
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  if (!validateForm()) return;

  const formData = new FormData();
  formData.append('id', String(form.value.id));
  formData.append('nominal_setoran', String(form.value.nominal_setoran));
  formData.append('bukti', form.value.bukti);

  try {
    const response = await upload_bukti_setoran(formData);
    emit('status', { error_msg: response.error_msg || response, error: response.error });
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

const previewUrl = ref<string | null>(null);
const handleFile = (file: File | null) => {
  if (!file) {
    form.value.bukti = null;
    return;
  }

  // Validasi ukuran file
  const fileSizeMB = Math.round(file.size / (1024 * 1024));
  if (fileSizeMB > 2) {
    errors.value.bukti = 'Ukuran file maksimal 2 MB';
    return;
  }

  previewUrl.value = URL.createObjectURL(file);
  form.value.bukti = file;
};

watchEffect(async () => {
  form.value.id = props.id;
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
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
      <div v-else class="relative max-w-xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Upload Bukti Setoran</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <div>
          <InputFile
            id="bukti-setoran"
            label="Bukti Setoran"
            buttonText="Pilih File"
            accept=".jpg,.jpeg,.png"
            :error="errors.bukti"
            :maxSize="2000"
            :show-preview="true"
            @file-selected="handleFile"
          />
        </div>
        <div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Nominal Donasi</label>
            <input
              type="text"
              :value="$formatToRupiah(props.nominal_donasi)"
              class="w-full bg-gray-100 border-gray-300 rounded-md p-2 mt-1"
              readonly
            />
          </div>
        </div>
        <div>
          <InputCurrency
            id="nominal_setoran"
            v-model="form.nominal_setoran"
            label="Nominal Setoran"
            placeholder="Masukkan nominal setoran"
            required
            :error="errors.nominal_setoran"
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
            :disabled="!(form.id && form.nominal_setoran && form.bukti) || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Mengupload...</span>
            <span v-else>Upload Bukti</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
