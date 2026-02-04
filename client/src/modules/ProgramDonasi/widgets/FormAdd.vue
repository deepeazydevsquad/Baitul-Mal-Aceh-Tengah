<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import InputDate from '@/components/Form/InputDate.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { add_program } from '@/service/program_donasi';
import InputFile from '@/components/Form/InputFile.vue';

// Notification
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

// Form state
const form = ref({
  name: '',
  banner: '',
  tahun: '',
  deskripsi: '',
  target_donasi_terkumpul: '',
  waktu_donasi: '',
});

// Errors
const errors = ref<Record<string, string>>({});

// Reset form
const resetForm = () => {
  form.value = {
    name: '',
    banner: '',
    tahun: '',
    deskripsi: '',
    target_donasi_terkumpul: '',
    waktu_donasi: '',
  };
  errors.value = {};
};

// Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Validation
const validateForm = () => {
  errors.value = {};
  let isValid = true;

  if (!form.value.name) {
    errors.value.name = 'Nama program wajib diisi';
    isValid = false;
  }
  if (!form.value.banner) {
    errors.value.banner = 'banner  wajib diisi';
    isValid = false;
  }
  if (!form.value.tahun) {
    errors.value.tahun = 'tahun  wajib dipilih';
    isValid = false;
  }
  if (!form.value.deskripsi) {
    errors.value.deskripsi = 'deskripsi wajib dipilih';
    isValid = false;
  }

  if (!form.value.waktu_donasi) {
    errors.value.waktu_donasi = 'waktu  wajib diisi';
    isValid = false;
  }

  return isValid;
};

// Submit
const isSubmitting = ref(false);
const handleSubmit = async () => {
  if (!validateForm()) return;

  const formData = new FormData();
  formData.append('name', form.value.name);
  formData.append('banner', form.value.banner);
  formData.append('tahun', form.value.tahun);
  formData.append('deskripsi', form.value.deskripsi);
  formData.append('target_donasi_terkumpul', String(nominalRaw.value || 0));
  formData.append('waktu_donasi', form.value.waktu_donasi);

  isSubmitting.value = true;

  try {
    const response = await add_program(formData);
    console.log(response);
    emit('status', { error_msg: response.message || response, error: response.error });
    closeModal();
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});
onBeforeUnmount(() => document.removeEventListener('keydown', handleEscape));

const nominalRaw = ref<number | null>(null);

const handleFile = (file: File | null) => {
  if (!file) {
    form.value.banner = '';
    return;
  }
  form.value.banner = file;
};

const nominalFormatted = computed({
  get: () => {
    if (nominalRaw.value == null) return '';
    return 'Rp ' + nominalRaw.value.toLocaleString('id-ID');
  },
  set: (val: string) => {
    const angka = val.replace(/\D/g, '');
    nominalRaw.value = angka ? parseInt(angka) : null;
  },
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
    >
      <div
        class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">Tambah Program Donasi</h2>
          <button class="text-gray-400 text-lg hover:text-gray-600" @click="closeModal">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <!-- Upload Logo -->
        <div>
          <InputFile
            id="photo-upload"
            label="Upload Banner Donasi"
            buttonText="Pilih File"
            accept=".jpg,.jpeg,.png"
            :error="errors.banner"
            :maxSize="1000"
            dimensionsInfo="100x33 px"
            @file-selected="handleFile"
          />
        </div>
        <!-- Form -->
        <div class="space-y-4">
          <InputText
            v-model="form.name"
            label="Name Program"
            :error="errors.name"
            placeholder="Masukkan name program"
          />
          <InputText
            v-model="form.tahun"
            label="Tahun Donasi"
            :error="errors.tahun"
            placeholder="Masukkan Tahun Donasi"
          />
          <InputText
            v-model="form.deskripsi"
            label="Deskripsi"
            :error="errors.deskripsi"
            placeholder="Masukkan Deskripsi"
          />
          <InputText
            v-model="nominalFormatted"
            label="Target Donasi Terkumpul"
            :error="errors.target_donasi_terkumpul"
            placeholder="Masukkan Target Donasi Terkumpul"
          />

          <InputText
            v-model="form.waktu_donasi"
            label="Waktu Donasi"
            :error="errors.waktu_donasi"
            placeholder="Masukkan Waktu Donasi"
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
            :disabled="
              !(
                form.name &&
                form.banner &&
                form.tahun &&
                form.deskripsi &&
                nominalRaw &&
                form.waktu_donasi
              ) || isSubmitting
            "
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
