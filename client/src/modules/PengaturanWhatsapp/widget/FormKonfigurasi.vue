<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputText from '@/components/Form/InputText.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { get_konfigurasi, update_konfigurasi } from '@/service/pengaturan_whatsapp';

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Props
interface Props {
  isModalOpen: boolean;
}
const props = defineProps<Props>();

// Emit
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// State
const isSubmitting = ref(false);
const form = ref<{ whatsapp_number: string; api_key: string; device_key: string }>({
  whatsapp_number: '',
  api_key: '',
  device_key: '',
});
const configured = ref({ api_key: false, device_key: false });
const errors = ref<Record<string, string>>({});

// Reset form
const resetForm = () => {
  form.value = { whatsapp_number: '', api_key: '', device_key: '' };
  configured.value = { api_key: false, device_key: false };
  errors.value = {};
};

// Mapping dari API
const mapApiDataToForm = (apiData: { name: string; value: string; configured?: boolean }[]) => {
  apiData.forEach((item) => {
    if (item.name === 'whatsapp_number') form.value.whatsapp_number = item.value;
    if (item.name === 'api_key') form.value.api_key = item.value;
    if (item.name === 'device_key') form.value.device_key = item.value;
    if (item.name === 'api_key' || item.name === 'device_key') {
      configured.value[item.name] = Boolean(item.configured);
    }
  });
};

// Fetch data konfigurasi
const getData = async () => {
  try {
    const response = await get_konfigurasi();
    const apiData = response.data?.data || [];
    mapApiDataToForm(apiData);
  } catch (error: any) {
    const msg =
      error.response?.data?.error_msg || error.response?.data?.message || 'Terjadi kesalahan';
    displayNotification(msg, 'error');
  }
};

// Watch biar tiap kali modal dibuka, data di-fetch ulang
watch(
  () => props.isModalOpen,
  (newVal) => {
    if (newVal) {
      getData();
    } else {
      resetForm();
    }
  },
);

// Validasi
const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!form.value.whatsapp_number) {
    errors.value.whatsapp_number = 'Whatsapp Number tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.api_key && !configured.value.api_key) {
    errors.value.api_key = 'API Key belum dikonfigurasi.';
    isValid = false;
  }

  if (!form.value.device_key && !configured.value.device_key) {
    errors.value.device_key = 'Device Key belum dikonfigurasi.';
    isValid = false;
  } else if (/\s/.test(form.value.device_key)) {
    errors.value.device_key =
      'Device Key tidak boleh mengandung spasi, gunakan "_" sebagai pengganti.';
    isValid = false;
  }

  return isValid;
};

// Submit
const handleSubmit = async () => {
  if (!validateForm()) return;

  form.value.device_key = form.value.device_key.replace(/\s+/g, '_');

  isSubmitting.value = true;
  try {
    const response = await update_konfigurasi(form.value);
    emit('status', { error_msg: response.error_msg, error: response.error });
    closeModal();
  } catch (error: any) {
    const msg =
      error.response?.data?.error_msg || error.response?.data?.message || 'Terjadi kesalahan';
    displayNotification(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Close modal
const closeModal = () => {
  resetForm();
  emit('close');
};

// Escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(() => document.addEventListener('keydown', handleEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', handleEscape));
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
    >
      <LoadingSpinner v-if="isSubmitting" label="Menyimpan..." />
      <div v-else class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">Edit Konfigurasi</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Whatsapp Number -->
        <InputText
          v-model="form.whatsapp_number"
          label="Whatsapp Number"
          type="text"
          placeholder="Masukkan Whatsapp Number"
          :error="errors.whatsapp_number"
        />

        <!-- API Key -->
        <InputText
          v-model="form.api_key"
          label="API Key"
          type="password"
          :placeholder="
            configured.api_key ? 'Tersimpan — kosongkan untuk mempertahankan' : 'Masukkan API Key'
          "
          :error="errors.api_key"
        />

        <!-- Device Key -->
        <InputText
          v-model="form.device_key"
          label="Device Key"
          type="password"
          :placeholder="
            configured.device_key
              ? 'Tersimpan — kosongkan untuk mempertahankan'
              : 'Masukkan Device Key'
          "
          :error="errors.device_key"
        />

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
            :disabled="!form.whatsapp_number.trim() || isSubmitting"
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
