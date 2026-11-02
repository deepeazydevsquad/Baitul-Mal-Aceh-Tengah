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
import { edit_tab, get_info_edit_tab } from '@/service/daftar_tab';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  selectedTab: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// Function: Close modal
const closeModal = () => {
  resetForm();
  emit('close');
};

// Function: Reset form
const resetForm = () => {
  form.desc = '';
  errors.value = {};
};

// Function: Validate form
const errors = ref<Record<string, string>>({
  desc: '',
});

const validateForm = () => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  if (!form.value.desc) {
    errors.value.desc = 'Deskripsi tidak boleh kosong';
    isValid = false;
  }

  console.log(errors.value);

  return isValid;
};

// State: Loading
const isLoading = ref(true);

// Function: Fetch Data
const fetchData = async () => {
  if (!props.selectedTab || !props.selectedTab.id) return;
  try {
    const response = await get_info_edit_tab(props.selectedTab.id);
    form.value.desc = response.data.desc;

  } catch (error) {
    displayNotification('Gagal mengambil data daftar_tab', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{ desc: string }>({
  desc: '',
});

const handleSubmit = async () => {
  if (!validateForm()) return;

  const formData = { id: '', desc: '' };

  formData.id = props.selectedTab.id;
  formData.desc = form.value.desc;

  isSubmitting.value = true;
  console.log('Data tersimpan!:', formData);

  try {
    const response = await edit_tab(formData);
    emit('status', { error_msg: response.message, error: response.error });
    closeModal();
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
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
  () => props.selectedTab,
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
          <h2 id="modal-title" class="text-xl font-semibold text-gray-800">Edit Tab</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Deskripsi  -->
        <div>
          <textarea
            id="runningText"
            v-model="form.desc"
            rows="4"
            class="mt-1 block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.desc }"
            placeholder="isi Deskripsi Tab disini..."
            :disabled="isSubmitting"
            maxlength="500"
            required
            aria-required="true"
            :aria-invalid="!!errors"
            aria-describedby="text-error counter-info"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="pt-4">
          <BaseButton
            type="submit"
            fullWidth
            variant="primary"
            :disabled="isSubmitting"
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
