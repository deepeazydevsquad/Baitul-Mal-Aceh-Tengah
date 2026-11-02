<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import {
  add_permohonan_bantuan,
  get_list_bank,
  get_list_kegiatan,
  get_list_member,
  get_list_syarat,
} from '@/service/permohonan_bantuan';

import { RefreshValidasi } from '@/stores/refresh';
const refresh = RefreshValidasi();
//

// State: Loading
const isLoading = ref(false);

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
  form.value = {
    kegiatan_id: null,
    bank_id: null,
    member_id: null,
    nomor_rekening: '',
    atas_nama: '',
  };

  formUploadDynamic.value = {};

  // Reset errors
  errors.value = {};
};

// Function: Fetch data
const dataKegiatan = ref<Array<{ id: number; name: string }>>([]);
const dataBank = ref<Array<{ id: number; name: string }>>([]);
const dataMember = ref<Array<{ id: number; name: string }>>([]);
const dataKriteriaSyarat = ref<{
  kriteria: Array<{
    id: number;
    name: string;
  }>;
  syarat: Array<{
    id: number;
    name: string;
    path: string;
  }>;
}>({
  kriteria: [],
  syarat: [],
});

async function fetchData() {
  isLoading.value = true;
  try {
    const [kegiatanResponse, bankResponse, memberResponse] = await Promise.all([
      get_list_kegiatan(),
      get_list_bank(),
      get_list_member(),
    ]);
    dataKegiatan.value = kegiatanResponse.data;
    dataBank.value = bankResponse.data;
    dataMember.value = memberResponse.data;

    console.log(kegiatanResponse, bankResponse, memberResponse);
  } catch (error: any) {
    displayNotification('Gagal memuat data. Silakan coba lagi.', 'error');
    console.error('Error fetching data:', error);
  } finally {
    isLoading.value = false;
  }
}

async function fetchKriteriaSyarat(kegiatan_id: number) {
  isLoading.value = true;
  try {
    const syaratResponse = await get_list_syarat(kegiatan_id);
    dataKriteriaSyarat.value = syaratResponse.data;
  } catch (error: any) {
    displayNotification('Gagal memuat data syarat. Silakan coba lagi.', 'error');
    console.error('Error fetching syarat data:', error);
  } finally {
    isLoading.value = false;
  }
}

// Function: Validate form
const errors = ref<Record<string, string>>({
  kegiatan_id: '',
  bank_id: '',
  member_id: '',
  nomor_rekening: '',
  atas_nama: '',
});

const validateForm = () => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  // Validate kegiatan_id
  if (!form.value.kegiatan_id) {
    errors.value.kegiatan_id = 'Kegiatan harus diisi';
    isValid = false;
  }

  // Validate bank_id
  if (!form.value.bank_id) {
    errors.value.bank_id = 'ID Bank harus diisi';
    isValid = false;
  }

  // Validate member_id
  if (!form.value.member_id) {
    errors.value.member_id = 'ID Member harus diisi';
    isValid = false;
  }

  // Validate nomor_rekening
  if (!form.value.nomor_rekening.trim()) {
    errors.value.nomor_rekening = 'Nomor rekening harus diisi';
    isValid = false;
  } else if (!/^\d{10,16}$/.test(form.value.nomor_rekening)) {
    errors.value.nomor_rekening = 'Nomor rekening harus terdiri dari 10-16 digit angka';
    isValid = false;
  }

  // Validate atas_nama
  if (!form.value.atas_nama.trim()) {
    errors.value.atas_nama = 'Atas nama harus diisi';
    isValid = false;
  }

  if (dataKriteriaSyarat.value.syarat.length) {
    dataKriteriaSyarat.value.syarat.forEach((syarat) => {
      if (!formUploadDynamic.value[`dokumen_${syarat.path}`]) {
        errors.value[`dokumen_${syarat.path}`] = `${syarat.name} harus diunggah`;
        isValid = false;
      }
    });
  }
  return isValid;
};

// Function: Handle file
const handleFile = (file: File | null, path: string) => {
  formUploadDynamic.value[`dokumen_${path ?? ''}`] = file;
  errors.value[`dokumen_${path ?? ''}`] = '';
  console.log(formUploadDynamic.value);
};

// Function: Handle submit
const isSubmitting = ref(false);

const formUploadDynamic = ref<Record<string, File | null>>({});
const form = ref<{
  kegiatan_id: number | null;
  bank_id: number | null;
  member_id: number | null;
  nomor_rekening: string;
  atas_nama: string;
}>({
  kegiatan_id: null,
  bank_id: null,
  member_id: null,
  nomor_rekening: '',
  atas_nama: '',
});

const handleSubmit = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;

  const formData = new FormData();
  Object.entries(form.value).forEach(([key, value]) => {
    formData.append(key, value as string | Blob);
  });

  Object.entries(formUploadDynamic.value).forEach(([key, file]) => {
    if (file) formData.append(key, file);
  });

  console.table(formData);
  try {
    const response = await add_permohonan_bantuan(formData);
    refresh.setBool(true);
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

// Watch: Handler
watch(
  () => props.isModalOpen,
  (newVal) => {
    if (newVal) {
      fetchData();
    }
  },
);

watch(
  () => form.value.kegiatan_id,
  (newVal) => {
    if (newVal !== null) {
      fetchKriteriaSyarat(newVal);
    } else {
      dataKriteriaSyarat.value = { kriteria: [], syarat: [] };
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
      <div v-else class="relative max-w-4xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">
            Tambah Permohonan Bantuan
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
          <div>
            <SelectField
              id="kegiatan_id"
              v-model="form.kegiatan_id"
              :options="[{ id: null, name: 'Pilih Kegiatan' }, ...dataKegiatan]"
              label="Pilih Kegiatan"
              placeholder="Pilih kegiatan"
              :required="true"
              :error="errors.kegiatan_id"
            />
          </div>

          <div v-if="dataKriteriaSyarat.kriteria.length" class="space-y-2">
            <h3 class="text-sm font-medium text-gray-700">Kriteria:</h3>
            <ul
              class="px-6 py-2 list-disc list-outside text-gray-600 bg-gray-200 rounded-lg border border-gray-300"
            >
              <li v-for="kriteria in dataKriteriaSyarat.kriteria" :key="kriteria.id">
                {{ kriteria.name }}
              </li>
            </ul>
          </div>

          <div
            v-if="dataKriteriaSyarat.syarat.length"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div v-for="syaratFile in dataKriteriaSyarat.syarat" :key="syaratFile.id">
              <InputFile
                :id="`dokumen_${syaratFile.id}`"
                :label="`${syaratFile.name}`"
                :error="errors[`dokumen_${syaratFile.path}`]"
                :accept="'.pdf,.jpg,.jpeg,.png'"
                :showPreview="false"
                :maxSize="1000"
                :required="true"
                @file-selected="handleFile($event, syaratFile.path)"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SelectField
                id="bank_id"
                v-model="form.bank_id"
                :options="[{ id: null, name: 'Pilih Bank' }, ...dataBank]"
                label="Pilih Bank"
                placeholder="Pilih bank"
                :required="true"
                :error="errors.bank_id"
              />
            </div>
            <div>
              <InputText
                id="nomor_rekening"
                v-model="form.nomor_rekening"
                label="Nomor Rekening"
                placeholder="Masukkan nomor rekening"
                :error="errors.nomor_rekening"
                :required="true"
                maxlength="16"
              />
            </div>
            <div>
              <InputText
                id="atas_nama"
                v-model="form.atas_nama"
                label="Atas Nama"
                placeholder="Masukkan atas nama"
                :required="true"
                :error="errors.atas_nama"
              />
            </div>
            <div>
              <SelectField
                id="member_id"
                v-model="form.member_id"
                :options="[{ id: null, name: 'Pilih Member' }, ...dataMember]"
                label="Pilih Member"
                placeholder="Pilih member"
                :required="true"
                :error="errors.member_id"
              />
            </div>
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
            :disabled="
              !(
                form.kegiatan_id &&
                form.bank_id &&
                form.nomor_rekening &&
                form.atas_nama &&
                form.member_id &&
                formUploadDynamic
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
