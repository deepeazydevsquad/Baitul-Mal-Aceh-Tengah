<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import SelectField from '@/components/Form/SelectField.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputText from '@/components/Form/InputText.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';

import { useNotification } from '@/composables/useNotification';
import { add_surveyor, detail_surveyor, daftar_surveyor } from '@/service/penetapan';
import { createSecureFileUrl } from '@/service/secure_file';

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  selectedKegiatan: any;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// State
const isSubmitting = ref(false);
const surveyorList = ref<any[]>([{ id: '' }]);
const surveyorOptions = ref<any[]>([]);
const nama_kegiatan = ref('');
const form = ref<{ sk: File | string }>({ sk: '' });
const errors = ref<Record<string, string>>({});
const previewUrl = ref<string | null>(null);

// Reset form
const resetForm = () => {
  surveyorList.value = [{ id: null }];
  errors.value = {};
  form.value.sk = '';
  nama_kegiatan.value = '';
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = null;
};

// Validasi
// Validasi
const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!form.value.sk) {
    errors.value['sk'] = 'File SK wajib diupload.';
    isValid = false;
  }

  const usedIds = new Set<string>();
  surveyorList.value.forEach((item, index) => {
    if (!item.id) {
      errors.value[`surveyor_id_${index}`] = 'Surveyor tidak boleh kosong.';
      isValid = false;
    } else if (usedIds.has(item.id)) {
      errors.value[`surveyor_id_${index}`] = 'Surveyor ini sudah dipilih.';
      isValid = false;
    } else {
      usedIds.add(item.id);
    }
  });

  return isValid;
};

// Ambil surveyor & kegiatan
const fetchData = async () => {
  try {
    const response = await daftar_surveyor();
    surveyorOptions.value = [
      { id: null, name: '-- Pilih Surveyor --' },
      ...response.data.map((s: any) => ({
        id: String(s.id),
        name: s.name,
      })),
    ];
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Terjadi kesalahan';
    displayNotification(msg, 'error');
  }
};

// ...

// Detail surveyor by kegiatan
const fetchDetailSurveyor = async () => {
  try {
    const response = await detail_surveyor({ kegiatan_id: props.selectedKegiatan });
    if (response.data.length > 0) {
      surveyorList.value = response.data.map((s: any) => ({ id: String(s.id) }));

      nama_kegiatan.value = response.data[0]?.kegiatan || '';
      if (response.data[0]?.surveyor_kegiatan_id) {
        const objectUrl = await createSecureFileUrl(
          `/documents/sk/${response.data[0].surveyor_kegiatan_id}`,
        );
        if (previewUrl.value?.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl.value);
        }
        previewUrl.value = objectUrl;
      } else {
        previewUrl.value = null;
      }
      form.value.sk = response.data[0]?.sk;
    } else {
      // fallback kalau ga ada surveyor
      surveyorList.value = [{ id: null }];
      previewUrl.value = null;
      form.value.sk = '';
    }

  } catch (error: any) {
    const msg = error.response?.data?.message || 'Terjadi kesalahan';
    displayNotification(msg, 'error');
  }
};

// Watch modal
watch(
  () => props.isModalOpen,
  async (val) => {
    if (val) {
      await fetchDetailSurveyor();
      await fetchData();
    } else {
      resetForm();
    }
  },
);

// Submit
const handleSubmit = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append('kegiatan_id', String(props.selectedKegiatan));
    if (form.value.sk instanceof File) formData.append('sk', form.value.sk);

    surveyorList.value.forEach((s, i) => {
      formData.append(`surveyor[${i}][surveyor_id]`, s.id);
    });

    formData.append('kegiatan_name', nama_kegiatan.value);

    const response = await add_surveyor(formData);
    emit('status', { error_msg: response.error_msg, error: response.error });
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Terjadi kesalahan';
    displayNotification(msg, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Tambah / hapus surveyor
const addField = () => surveyorList.value.push({ id: '' });
const removeField = (index: number) => {
  if (surveyorList.value.length > 1) surveyorList.value.splice(index, 1);
};

// Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// File handler
const handleFile = (file: File | null) => {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
  if (!file) {
    previewUrl.value = null;
    form.value.sk = '';
    return;
  }
  previewUrl.value = URL.createObjectURL(file);
  form.value.sk = file;
};

const fileName = computed(() => {
  if (form.value.sk instanceof File) {
    return form.value.sk.name;
  }
  if (typeof form.value.sk === 'string' && form.value.sk) {
    return form.value.sk.split('/').pop() || '';
  }
  return '';
});

// Escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(() => document.addEventListener('keydown', handleEscape));
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
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
    >
      <LoadingSpinner v-if="isSubmitting" label="Menyimpan..." />
      <div v-else class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">Edit Surveyor</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Dynamic Surveyor -->
        <div class="space-y-4">
          <InputText
            v-model="nama_kegiatan"
            label="Nama Kegiatan"
            placeholder="Masukkan Nama Kegiatan"
            :error="errors.kegiatan"
            disabled
          />

          <InputFile
            id="sk-upload"
            label="Upload SK Surveyor"
            buttonText="Pilih File"
            accept=".jpg,.jpeg,.png"
            :error="errors.sk"
            :maxSize="2000"
            dimensionsInfo="A4 atau sesuai format"
            :initialFileName="fileName"
            :initialPreview="previewUrl || ''"
            @file-selected="handleFile"
          />

          <div v-for="(item, index) in surveyorList" :key="index" class="flex items-end gap-2">
            <SelectField
              v-model="item.id"
              :id="`surveyor_${index}`"
              :label="index === 0 ? 'Pilih Surveyor' : ''"
              placeholder="Pilih surveyor"
              :error="errors[`surveyor_id_${index}`]"
              :options="surveyorOptions"
              class="flex-1"
            />
            <button
              v-if="surveyorList.length > 1"
              type="button"
              @click="removeField(index)"
              class="px-2 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
            >
              <DeleteIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Tombol tambah surveyor -->
          <button
            type="button"
            @click="addField"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            + Tambah Surveyor
          </button>
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
