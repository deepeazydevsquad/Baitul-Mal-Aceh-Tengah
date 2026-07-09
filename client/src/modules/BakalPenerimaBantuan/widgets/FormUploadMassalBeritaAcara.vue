<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import {
  get_list_belum_upload_berita_acara,
  upload_massal_berita_acara,
} from '@/service/bakal_penerima_bantuan';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  kegiatan_id: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// State
const isLoading = ref(false);
const isSubmitting = ref(false);

// Data list permohonan
interface PermohonanItem {
  id: number;
  nama_pemohon: string;
  nomor_ktp: string;
  nominal_bantuan: number;
  nama_kegiatan: string;
}

const listPermohonan = ref<PermohonanItem[]>([]);
const selectedIds = ref<number[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'select', label: '', headerClass: 'w-16 text-center px-3 py-2', cellClass: 'px-3 py-2 text-center' },
  { key: 'nama_pemohon', label: 'Nama Pemohon', headerClass: 'text-left px-3 py-2 font-semibold text-gray-700', cellClass: 'px-3 py-2 text-left' },
  { key: 'nomor_ktp', label: 'Nomor KTP', headerClass: 'text-left px-3 py-2 font-semibold text-gray-700', cellClass: 'px-3 py-2 text-left text-gray-600' },
  { key: 'nominal_bantuan', label: 'Nominal Bantuan', headerClass: 'text-right px-3 py-2 font-semibold text-gray-700', cellClass: 'px-3 py-2 text-right font-semibold text-green-700' },
]);

// Form
const beritaAcaraFile = ref<File | null>(null);
const errors = ref<Record<string, string>>({
  berita_acara: '',
  selected_ids: '',
});

// Computed: Check all status
const isAllSelected = computed(() => {
  return (
    listPermohonan.value.length > 0 && selectedIds.value.length === listPermohonan.value.length
  );
});

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Function: Reset form
const resetForm = () => {
  beritaAcaraFile.value = null;
  selectedIds.value = [];
  errors.value = {};
};

// Function: Fetch data
async function fetchData() {
  isLoading.value = true;
  try {
    const response = await get_list_belum_upload_berita_acara({
      kegiatan_id: props.kegiatan_id,
    });

    // Temporary mock data
    // const response = {
    //   error: false,
    //   data: [
    //     {
    //       id: 1,
    //       nama_pemohon: 'SALAWATI',
    //       nomor_ktp: '1117066512860001',
    //       nominal_bantuan: 400000,
    //       nama_kegiatan: 'Santunan bulanan fakir Uzur',
    //     },
    //     {
    //       id: 2,
    //       nama_pemohon: 'BUDI SANTOSO',
    //       nomor_ktp: '1117066512860002',
    //       nominal_bantuan: 500000,
    //       nama_kegiatan: 'Santunan bulanan fakir Uzur',
    //     },
    //     {
    //       id: 3,
    //       nama_pemohon: 'SITI AMINAH',
    //       nomor_ktp: '1117066512860003',
    //       nominal_bantuan: 450000,
    //       nama_kegiatan: 'Santunan bulanan fakir Uzur',
    //     },
    //   ],
    // };

    if (response.error) {
      displayNotification('Gagal memuat data permohonan', 'error');
      return;
    }

    listPermohonan.value = response.data;
  } catch (error: any) {
    console.error('Error fetching data:', error);
    displayNotification('Gagal memuat data permohonan', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Function: Toggle select all
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = listPermohonan.value.map((item) => item.id);
  }
};

// Function: Toggle select item
const toggleSelectItem = (id: number) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

// Function: Handle file upload
const handleFileUpload = (file: File | null) => {
  beritaAcaraFile.value = file;
  errors.value.berita_acara = '';
};

// Function: Validate form
const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!beritaAcaraFile.value) {
    errors.value.berita_acara = 'Berita acara harus diupload';
    isValid = false;
  }

  if (selectedIds.value.length === 0) {
    errors.value.selected_ids = 'Pilih minimal 1 permohonan';
    displayNotification('Pilih minimal 1 permohonan untuk diupload berita acara', 'warning');
    isValid = false;
  }

  return isValid;
};

// Function: Handle submit
const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  const formData = new FormData();
  formData.append('berita_acara', beritaAcaraFile.value!);
  formData.append('selected_ids', JSON.stringify(selectedIds.value));

  try {
    const response = await upload_massal_berita_acara(formData);

    if (response.error) {
      displayNotification(response.error_msg || 'Gagal upload berita acara', 'error');
    } else {
      emit('status', {
        error_msg:
          response.error_msg ||
          `Berita acara berhasil diupload untuk ${selectedIds.value.length} permohonan`,
        error: false,
      });
      closeModal();
    }
  } catch (error: any) {
    console.error('Error upload berita acara massal:', error);
    displayNotification(
      error.response?.data?.error_msg ||
        error.response?.data?.message ||
        'Gagal upload berita acara',
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

// Watch: Fetch data when modal opens
watch(
  () => props.isModalOpen,
  (newVal) => {
    if (newVal) {
      resetForm();
      fetchData();
    }
  },
);

watch;
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
      <div class="relative max-w-3xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 id="modal-title" class="text-xl font-bold text-gray-800">
              Upload Berita Acara Massal Program Bantuan
            </h2>
            <p class="text-sm text-gray-500">
              {{ listPermohonan[0]?.nama_kegiatan || 'Santunan bulanan fakir Uzur' }}
            </p>
          </div>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <LoadingSpinner v-if="isLoading" label="Memuat data..." />
        <div v-else class="space-y-4">
          <!-- Upload File -->
          <div>
            <InputFile
              id="berita_acara"
              label="Berita Acara"
              accept=".jpg,.jpeg,.png"
              :max-size="1000"
              note="Ukuran maksimal file berita acara adalah 1MB"
              :error="errors.berita_acara"
              :required="true"
              @file-selected="handleFileUpload"
            />
          </div>

          <!-- Info Warning -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <font-awesome-icon
                icon="fa-solid fa-triangle-exclamation"
                class="text-yellow-600 mt-0.5"
              />
              <p class="text-xs text-yellow-800">
                <span class="font-semibold">Perhatian:</span> Silahkan pilih salah satu permohonan
                bantuan yang sesuai dengan berita acara yang akan diupload.
              </p>
            </div>
          </div>

          <!-- Table List Permohonan -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <font-awesome-icon icon="fa-solid fa-list" class="text-green-600" />
                Daftar Permohonan yang Belum Upload Berita Acara
                <span v-if="errors.selected_ids" class="text-xs text-red-600 font-normal">*</span>
              </h3>
              <span class="text-xs text-gray-600"
                >Dipilih: {{ selectedIds.length }} / {{ listPermohonan.length }}</span
              >
            </div>

            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="max-h-[40vh] overflow-y-auto">
                <BaseTable
          empty-title="Data tidak ditemukan"
          empty-desc="Semua permohonan sudah upload berita acara"
          empty-icon="fa-solid fa-inbox"
                  class="w-full text-sm"
                  :columns="tableColumns"
                  :data="listPermohonan"
                  :loading="isLoading"
                  :with-pagination="false"
                  :show-search="false"
                  :show-add="false"
                  :show-edit="false"
                  :show-delete="false"
                  :show-numbering="false"
                  :show-actions="false"
                >
                  <template #header-select>
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                      class="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                  </template>

                  <template #cell-select="{ row }">
                    <input
                      type="checkbox"
                      :checked="selectedIds.includes(row.id)"
                      @change="toggleSelectItem(row.id)"
                      class="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                  </template>
                  <template #cell-nama_pemohon="{ row }">
                    <span class="font-semibold text-gray-800">{{ row.nama_pemohon }}</span>
                  </template>
                  <template #cell-nomor_ktp="{ row }">
                    {{ row.nomor_ktp }}
                  </template>
                  <template #cell-nominal_bantuan="{ row }">
                    {{ $formatToRupiah(row.nominal_bantuan) }}
                  </template>
                  
                </BaseTable>
              </div>
            </div>

            <!-- Selected Summary -->
            <div
              v-if="selectedIds.length > 0"
              class="mt-3 bg-green-50 border border-green-200 rounded-lg p-3"
            >
              <div class="flex items-center gap-2 text-sm text-green-800">
                <font-awesome-icon icon="fa-solid fa-check-circle" class="text-green-600" />
                <span class="font-semibold">{{ selectedIds.length }} permohonan dipilih</span>
                <span class="text-xs text-green-600">
                  (Berita acara akan diupload untuk semua permohonan yang dipilih)
                </span>
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
              Tutup
            </BaseButton>
            <BaseButton
              type="button"
              variant="success"
              :disabled="!beritaAcaraFile || selectedIds.length === 0 || isSubmitting"
              @click="handleSubmit"
            >
              <span v-if="isSubmitting">Mengupload...</span>
              <span v-else>
                <font-awesome-icon icon="fa-solid fa-cloud-arrow-up" class="mr-2" />
                Upload
              </span>
            </BaseButton>
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
