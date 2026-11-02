<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import { useNotification } from '@/composables/useNotification';

import {
  get_info_member,
  daftar_bank,
  add_permohonan,
  daftar_syarat,
} from '@/service/permohonan_member';

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  id_kegiatan: number;
}

interface SyaratItem {
  id: number;
  name: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// ========== DEKLARASI VARIABEL REAKTIF ==========
const formUploadDynamic = ref<Record<string, File | null>>({});
const dataBank = ref<Array<{ id: number; name: string | null }>>([]);
const dataSyarat = ref<SyaratItem[]>([]);
const isSubmitting = ref(false);
const isLoadingSyarat = ref(false);

// Form data
const form = ref({
  nama_pemohon: '',
  nomor_ktp: '',
  nomor_whatsapp: '',
  bank_id: null as number | null,
  nomor_rekening: '',
  atas_nama: '',
});

// Errors
const errors = ref<Record<string, string>>({});

// ========== FUNGSI-FUNGSI ==========

// Fetch data member
const fetchData = async () => {
  try {
    const response = await get_info_member();
    console.log('Response get_info_member:', response);

    form.value.nama_pemohon = response.nama_pemohon || '';
    form.value.nomor_ktp = response.nomor_ktp || '';
    form.value.nomor_whatsapp = response.whatsapp_number || response.nomor_whatsapp || '';
  } catch (error) {
    console.error('Error fetching member data:', error);
  }
};

// Get list bank
const listBank = async () => {
  try {
    const response = await daftar_bank();
    dataBank.value = response.data || [];
  } catch (error) {
    console.error('Error fetching bank list:', error);
  }
};

// Generate field name dari nama syarat
const generateFieldName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

// Fetch data syarat dinamis
const fetchDataSyarat = async () => {
  if (!props.id_kegiatan) return;

  isLoadingSyarat.value = true;
  try {
    const response = await daftar_syarat({ kegiatan_id: props.id_kegiatan });
    console.log('Response daftar_syarat:', response);

    // Ambil data dari response
    const rawData = response.data || [];

    // Remove duplikat berdasarkan id dan name
    const uniqueData = rawData.reduce((acc: SyaratItem[], current: SyaratItem) => {
      const exists = acc.find((item) => item.id === current.id && item.name === current.name);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    dataSyarat.value = uniqueData;

    // Reset form upload saat syarat berubah
    formUploadDynamic.value = {};
    errors.value = {};

    console.log('Syarat yang sudah diproses:', dataSyarat.value);
  } catch (error) {
    console.error('Error fetching syarat data:', error);
    displayNotification('Gagal memuat daftar syarat', 'error');
  } finally {
    isLoadingSyarat.value = false;
  }
};

// Validate form
const validateForm = () => {
  let isValid = true;
  errors.value = {};

  console.log('Validating form:', form.value);
  console.log('File uploads:', formUploadDynamic.value);

  // Validasi text fields
  if (!form.value.nama_pemohon || !form.value.nama_pemohon.trim()) {
    errors.value.nama_pemohon = 'Nama pemohon tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.nomor_ktp || !form.value.nomor_ktp.trim()) {
    errors.value.nomor_ktp = 'Nomor KTP tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.nomor_whatsapp || !form.value.nomor_whatsapp.trim()) {
    errors.value.nomor_whatsapp = 'Nomor WhatsApp tidak boleh kosong.';
    isValid = false;
  }

  // Validasi file uploads berdasarkan syarat dinamis (semua wajib diisi)
  dataSyarat.value.forEach((syarat) => {
    const fieldName = generateFieldName(syarat.name);
    if (!formUploadDynamic.value[`dokumen_${fieldName}`]) {
      errors.value[fieldName] = `${syarat.name} wajib diisi.`;
      isValid = false;
    }
  });

  // Validasi bank info
  if (!form.value.bank_id) {
    errors.value.bank_id = 'Bank tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.nomor_rekening || !form.value.nomor_rekening.trim()) {
    errors.value.nomor_rekening = 'Nomor rekening tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.atas_nama || !form.value.atas_nama.trim()) {
    errors.value.atas_nama = 'Atas nama tidak boleh kosong.';
    isValid = false;
  }

  console.log('Validation result:', isValid, errors.value);
  return isValid;
};

// Handle file upload
const handleFileUpload = (field: string) => (file: File | null) => {
  if (!file) {
    formUploadDynamic.value[`dokumen_${field}`] = null;
    return;
  }

  const fileSizeKB = Math.round(file.size / 1024);
  if (fileSizeKB > 1000) {
    errors.value[field] = 'Ukuran file maksimal 1000 KB';
    return;
  }

  formUploadDynamic.value[`dokumen_${field}`] = file;
  errors.value[field] = '';
  console.log(`File uploaded for ${field}:`, file.name);
};

// Submit handler
const handleSubmit = async () => {
  if (!validateForm()) {
    console.log('Validation failed');
    displayNotification('Mohon lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  isSubmitting.value = true;

  const formData = new FormData();

  // Append form fields
  formData.append('kegiatan_id', props.id_kegiatan.toString());

  // Append other form fields
  Object.entries(form.value).forEach(([key, value]) => {
    if (value !== null && value !== '' && key !== 'nama_pemohon') {
      formData.append(key, value as string | Blob);
    }
  });

  // Append files
  Object.entries(formUploadDynamic.value).forEach(([key, file]) => {
    if (file) {
      formData.append(key, file);
    }
  });

  console.log('=== FormData yang akan dikirim ===');
  formData.forEach((value, key) => {
    if (value instanceof File) {
      console.log(`${key}: [File] ${value.name} (${Math.round(value.size / 1024)} KB)`);
    } else {
      console.log(`${key}:`, value);
    }
  });
  console.log('=== End FormData ===');

  try {
    const response = await add_permohonan(formData);

    console.log('Submit response:', response);
    emit('status', { error_msg: response.error_msg || response, error: response.error });
    displayNotification(
      response.error_msg || 'Data berhasil disimpan!',
      response.error ? 'error' : 'success',
    );
  } catch (error) {
    const responseError = error as {
      response?: { data?: { error_msg?: string; message?: string } };
    };
    console.error('Submit error:', error);
    displayNotification(
      responseError.response?.data?.error_msg ||
        responseError.response?.data?.message ||
        'Terjadi kesalahan saat menyimpan data.',
      'error',
    );
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Reset form
const resetForm = () => {
  form.value = {
    nama_pemohon: '',
    nomor_ktp: '',
    nomor_whatsapp: '',
    bank_id: null,
    nomor_rekening: '',
    atas_nama: '',
  };
  formUploadDynamic.value = {};
  errors.value = {};
};

// Handle escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};

// ========== LIFECYCLE HOOKS ==========
onMounted(() => {
  fetchData();
  listBank();
  document.addEventListener('keydown', handleEscape);
});

watch(
  () => props.id_kegiatan,
  (newVal) => {
    if (newVal) {
      console.log('🔥 props.id_kegiatan udah ready:', newVal);
      fetchDataSyarat();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      @click.self="closeModal"
    >
      <div
        class="relative max-w-4xl w-full bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
      >
        <div class="p-6 space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b">
            <div>
              <h2 id="modal-title" class="text-xl font-bold text-gray-800">
                UPLOAD SYARAT PRASYARAT PERMOHONAN BANTUAN
              </h2>
            </div>
            <button
              class="text-gray-400 text-lg hover:text-gray-600 transition-colors"
              @click="closeModal"
              aria-label="Tutup modal"
            >
              <font-awesome-icon icon="fa-solid fa-xmark" />
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingSyarat" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat daftar syarat...</span>
          </div>

          <!-- Form -->
          <div v-else class="space-y-6">
            <!-- Section: Data Pemohon -->
            <div>
              <h3 class="text-base font-semibold text-gray-700 mb-4 flex items-center">
                <span class="w-1 h-5 bg-blue-600 mr-2"></span>
                Data Pemohon
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputText
                  id="nama_pemohon"
                  v-model="form.nama_pemohon"
                  readonly
                  label="Nama Pemohon Bantuan"
                  type="text"
                  placeholder="Nama Pemohon"
                  :error="errors.nama_pemohon"
                />
                <InputText
                  id="nomor_ktp"
                  readonly
                  v-model="form.nomor_ktp"
                  label="Nomor KTP Pemohon Bantuan"
                  type="text"
                  placeholder="1177123787123716"
                  :error="errors.nomor_ktp"
                />
                <InputText
                  readonly
                  id="nomor_whatsapp"
                  v-model="form.nomor_whatsapp"
                  label="Nomor Whatsapp Pemohon Bantuan"
                  type="text"
                  placeholder="08526280141"
                  :error="errors.nomor_whatsapp"
                />
              </div>
            </div>

            <!-- Section: Dynamic Syarat Fields -->
            <div v-if="dataSyarat.length > 0">
              <h3 class="text-base font-semibold text-gray-700 mb-4 flex items-center">
                <span class="w-1 h-5 bg-blue-600 mr-2"></span>
                Dokumen Persyaratan
                <span class="ml-2 text-xs font-normal text-gray-500"
                  >({{ dataSyarat.length }} dokumen wajib)</span
                >
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputFile
                  v-for="(syarat, index) in dataSyarat"
                  :key="`${syarat.id}-${index}`"
                  :id="`syarat_${generateFieldName(syarat.name)}`"
                  :label="`${syarat.name} *`"
                  buttonText="Pilih File"
                  :accept="'.pdf,.jpeg,.jpg,.png'"
                  :error="errors[generateFieldName(syarat.name)]"
                  :maxSize="1000"
                  @file-selected="(file) => handleFileUpload(generateFieldName(syarat.name))(file)"
                />
              </div>
            </div>

            <div
              v-else-if="!isLoadingSyarat"
              class="text-center py-12 text-gray-500 bg-gray-50 rounded-lg"
            >
              <font-awesome-icon
                icon="fa-solid fa-folder-open"
                class="text-4xl mb-3 text-gray-400"
              />
              <p>Tidak ada syarat yang tersedia untuk kegiatan ini.</p>
            </div>

            <!-- Section: Informasi Rekening -->
            <div>
              <h3 class="text-base font-semibold text-gray-700 mb-4 flex items-center">
                <span class="w-1 h-5 bg-blue-600 mr-2"></span>
                Informasi Rekening
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  id="bank_id"
                  v-model="form.bank_id"
                  :options="[{ id: null, name: 'Pilih Bank' }, ...dataBank]"
                  label="Pilih Bank *"
                  placeholder="Pilih Bank"
                  :required="true"
                  :error="errors.bank_id"
                />
                <InputText
                  id="nomor_rekening"
                  v-model="form.nomor_rekening"
                  label="Nomor Rekening *"
                  type="text"
                  placeholder="Nomor Rekening"
                  :error="errors.nomor_rekening"
                />
                <InputText
                  id="atas_nama"
                  v-model="form.atas_nama"
                  label="Atas Nama *"
                  type="text"
                  placeholder="Atas Nama"
                  :error="errors.atas_nama"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end gap-3 pt-4 border-t">
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
                :disabled="isSubmitting || isLoadingSyarat"
                @click="handleSubmit"
              >
                <span v-if="isSubmitting" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menyimpan...
                </span>
                <span v-else>Simpan</span>
              </BaseButton>
            </div>
          </div>
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
