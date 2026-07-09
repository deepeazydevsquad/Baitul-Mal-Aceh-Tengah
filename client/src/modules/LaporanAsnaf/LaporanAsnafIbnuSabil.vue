<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import { onMounted, ref, watch } from 'vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

// Service API
import { get_laporan_asnaf, get_tahun } from '@/service/laporan_asnaf';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// State Data Laporan
const allLaporanRows = ref<(string | number)[][]>([]);
const paginatedLaporanData = ref<(string | number)[][]>([]);
const selectedTahun = ref('0'); // '0' untuk "Semua Tahun"
const tahunOptions = ref<{ value: string; text: string }[]>([
  { value: '0', text: 'Pilih Semua Tahun' },
]);
const asnafId = 6; // ID untuk Asnaf Ibnu Sabil

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: pagination
const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(7);

const tableColumns = ref<TableColumn[]>([
  { key: 'tanggal', label: 'Tanggal', headerClass: 'w-[10%] text-center', cellClass: 'text-center whitespace-nowrap' },
  { key: 'uraian', label: 'Uraian', headerClass: 'w-[25%] text-center', cellClass: 'text-center' },
  { key: 'nik', label: 'NIK', headerClass: 'w-[15%] text-center', cellClass: 'text-center' },
  { key: 'alamat', label: 'Alamat', headerClass: 'w-[20%] text-center', cellClass: 'text-center' },
  { key: 'kecamatan', label: 'Kec', headerClass: 'w-[5%] text-center', cellClass: 'text-center' },
  { key: 'kode_akun', label: 'Kode Akun', headerClass: 'w-[10%] text-center', cellClass: 'text-center' },
  { key: 'kredit', label: 'Kredit', headerClass: 'w-[15%] text-center', cellClass: 'text-center whitespace-nowrap' },
]);

function updatePaginatedData() {
  isTableLoading.value = true;
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  paginatedLaporanData.value = allLaporanRows.value.slice(start, end);
  isTableLoading.value = false;
}

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(updatePaginatedData, { perPage: itemsPerPage.value });

import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

// Function: Fetch Tahun Options
async function fetchTahunOptions() {
  try {
    const response = await get_tahun();
    const years = response.data.data.map((year: string) => ({
      value: year,
      text: `Tahun ${year}`,
    }));
    tahunOptions.value = [{ value: '0', text: 'Pilih Semua Tahun' }, ...years];
  } catch (error) {
    displayNotification('Gagal mengambil data tahun', 'error');
  }
}

// Function: Fetch Data Laporan
async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_laporan_asnaf(selectedTahun.value, asnafId);
    const flattenedData = response.data.data.list.flatMap((group: any) => group.data);

    allLaporanRows.value = flattenedData;
    totalRow.value = flattenedData.length;
    updatePaginatedData();
  } catch (error) {
    allLaporanRows.value = [];
    totalRow.value = 0;
    paginatedLaporanData.value = [];

    console.error('Error fetching data:', error);

    if (error.response?.status !== 404) {
      if (error.request) {
        displayNotification('Tidak dapat terhubung ke server', 'error');
      } else {
        displayNotification('Terjadi kesalahan saat mengambil data', 'error');
      }
    }
  } finally {
    isTableLoading.value = false;
  }
}

// Function: Download Excel
// async function downloadExcel() {
//   try {
//     const response = await download_excel_asnaf(selectedTahun.value, 'Ibnu_Sabil');

//     const blob = new Blob([response.data]);
//     const url = window.URL.createObjectURL(blob);

//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `Laporan_Asnaf_Ibnu_Sabil_${selectedTahun.value}.xlsx`;

//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//     window.URL.revokeObjectURL(url);
//     displayNotification('Download berhasil', 'success');
//   } catch (error) {
//     console.error('Download error:', error);
//     displayNotification('Gagal mendownload file', 'error');
//   }
// }

const cetak_laporan = () => {
  const printUrl = `/cetak-laporan-asnaf-ibnu-sabil/${selectedTahun.value}`;
  window.open(printUrl, '_blank');
};

// Lifecycle Hooks
onMounted(async () => {
  isLoading.value = true;
  await fetchTahunOptions();
  await fetchData();
  isLoading.value = false;
});

// Watcher untuk memuat ulang data ketika tahun diganti
watch(selectedTahun, fetchData);
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Table -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
          empty-title="Laporan Penyaluran Asnaf Ibnu Sabil Tidak Ditemukan"
          empty-desc="Silakan pilih tahun yang lain atau data belum tersedia."
          empty-icon="fa-solid fa-database"
        :columns="tableColumns"
        :data="paginatedLaporanData"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="false"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #filters>
          <div class="flex items-center gap-2">
            <select
              v-model="selectedTahun"
              class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
            >
              <option v-for="option in tahunOptions" :key="option.value" :value="option.value">
                {{ option.text }}
              </option>
            </select>
          </div>
        </template>
        <template #custom-actions>
          <BaseButton @click="cetak_laporan" variant="primary" type="button">
            <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
            Cetak
          </BaseButton>
        </template>
        
        
        <template #cell-tanggal="{ row }">
          {{ row[1] }}
        </template>
        <template #cell-uraian="{ row }">
          {{ row[2] }}
        </template>
        <template #cell-nik="{ row }">
          {{ row[3] }}
        </template>
        <template #cell-alamat="{ row }">
          {{ row[4] }}
        </template>
        <template #cell-kecamatan="{ row }">
          {{ row[5] }}
        </template>
        <template #cell-kode_akun="{ row }">
          {{ row[6] }}
        </template>
        <template #cell-kredit="{ row }">
          {{ row[7] }}
        </template>
      </BaseTable>
      </div>
    </div>

    <!-- Notification -->
    <Notification
      :show-notification="showNotification"
      :notification-type="notificationType"
      :notification-message="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
