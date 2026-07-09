<script setup lang="ts">
// Library
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service API
import {
  daftar_rekap_distribusi_kecamatan,
  download_rekap_perkecamatan,
} from '@/service/rekap_distribusi_kecamatan';

const router = useRouter();

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// State: Filter
const selectedYear = ref<string>('0');
const years = ref<string[]>([]);
const searchKecamatan = ref<string>('');

// State: Data Rekap
interface DetailBulan {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
  10: number;
  11: number;
}

interface KecamatanData {
  name: string;
  kode: string;
  detail_rupiah: DetailBulan;
  detail_pemohon: DetailBulan;
}

interface RekapData {
  [key: string]: KecamatanData;
}

const rekapData = ref<RekapData>({});
const kecamatanList = ref<Array<{ id: string; data: KecamatanData }>>([]);

// Computed: Filtered Kecamatan List
const filteredKecamatanList = computed(() => {
  if (!searchKecamatan.value.trim()) {
    return kecamatanList.value;
  }

  const searchLower = searchKecamatan.value.toLowerCase().trim();
  return kecamatanList.value.filter(
    (item) =>
      item.data.name.toLowerCase().includes(searchLower) ||
      item.data.kode.toLowerCase().includes(searchLower),
  );
});

// Nama bulan
const bulanNames = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGS',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

// Function: Generate Years
function generateYears() {
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const yearList = ['0']; // 0 untuk "Pilih Semua Tahun"

  for (let year = currentYear; year >= startYear; year--) {
    yearList.push(year.toString());
  }

  years.value = yearList;
}

// Function: Format Currency
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Function: Calculate Total per Kecamatan
function calculateTotal(detail: DetailBulan): number {
  return Object.values(detail).reduce((sum, val) => sum + val, 0);
}

// Function: Calculate Grand Total per Bulan
function calculateGrandTotalBulan(bulanIndex: number): number {
  let total = 0;
  filteredKecamatanList.value.forEach((item) => {
    total += item.data.detail_rupiah[bulanIndex as keyof DetailBulan] || 0;
  });
  return total;
}

// Function: Calculate Grand Total All
function calculateGrandTotal(): number {
  let total = 0;
  for (let i = 0; i < 12; i++) {
    total += calculateGrandTotalBulan(i);
  }
  return total;
}

// Function: Fetch Data
async function fetchData() {
  isTableLoading.value = true;
  try {
    const params =
      selectedYear.value !== '0' ? { tahun: parseInt(selectedYear.value) } : { tahun: '0' };

    const response = await daftar_rekap_distribusi_kecamatan(params);

    if (response.error) {
      displayNotification(response.error_msg || 'Gagal mengambil data rekap', 'error');
      rekapData.value = {};
      kecamatanList.value = [];
      return;
    }

    rekapData.value = response.data.feedBack || {};

    // Convert object to array untuk sorting
    kecamatanList.value = Object.entries(rekapData.value)
      .map(([id, data]) => ({ id, data }))
      .sort((a, b) => {
        if (a.data.kode === 'KAT') return -1;
        if (b.data.kode === 'KAT') return 1;
        if (a.data.kode === 'INS') return 1;
        if (b.data.kode === 'INS') return -1;
        // Sort kecamatan by name
        return a.data.name.localeCompare(b.data.name, 'id');
      });

    console.log('Rekap Data:', rekapData.value);
  } catch (error) {
    console.error('Error fetching data:', error);
    displayNotification('Gagal mengambil data rekap perkecamatan', 'error');
    rekapData.value = {};
    kecamatanList.value = [];
  } finally {
    isTableLoading.value = false;
  }
}

// Function: Open Print Page
const cetak_laporan = (tahun: string) => {
  const printUrl = `/rekap-distribusi-perkecamatan/${tahun}`;
  window.open(printUrl, '_blank');
};

// Function: Download Excel
async function downloadExcel() {
  try {
    isLoading.value = true;

    const params = selectedYear.value !== '0' ? { tahun: selectedYear.value } : { tahun: '0' };

    const response = await download_rekap_perkecamatan(params);

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const tahunText = selectedYear.value === '0' ? 'semua' : selectedYear.value;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `laporan_rekap_penyaluran_per_kecamatan_tahun_${tahunText}_${timestamp}.xlsx`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    displayNotification('File Excel berhasil didownload', 'success');
  } catch (error) {
    console.error('Error downloading:', error);
    displayNotification('Gagal mendownload laporan', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  generateYears();
  await fetchData();
});
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex gap-2">
          <BaseButton
            @click="cetak_laporan(selectedYear)"
            variant="primary"
            :loading="isLoading"
            type="button"
          >
            <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
            Cetak
          </BaseButton>
        </div>
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex items-center">
            <label
              for="search-kecamatan"
              class="mr-2 text-sm font-medium text-gray-600 whitespace-nowrap"
            >
              Cari Kecamatan
            </label>
            <input
              id="search-kecamatan"
              type="text"
              v-model="searchKecamatan"
              placeholder="Nama kecamatan..."
              class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
            />
          </div>

          <!-- Filter Tahun -->
          <div class="flex items-center">
            <label
              for="year-filter"
              class="mr-2 text-sm font-medium text-gray-600 whitespace-nowrap"
            >
              Tahun
            </label>
            <select
              id="year-filter"
              v-model="selectedYear"
              @change="fetchData"
              class="w-full sm:w-48 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
            >
              <option value="0">Semua Tahun</option>
              <option v-for="year in years.slice(1)" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="15" :rows="10" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <!-- Header -->
          <thead class="text-gray-700 text-center border-b border-gray-300">
            <!-- Baris 1 -->
            <tr class="bg-gray-50">
              <th
                rowspan="2"
                class="w-[20%] px-4 py-3 font-medium border-r border-gray-300 sticky left-0 top-0 bg-gray-50 z-[50] min-w-[180px]"
              >
                KECAMATAN
              </th>
              <th
                :colspan="bulanNames.length"
                class="px-4 py-3 font-medium border border-gray-300 top-0 bg-gray-50 z-[30]"
              >
                BULAN
              </th>
              <th
                rowspan="2"
                class="px-4 py-3 font-medium border border-gray-300 top-0 bg-gray-100 z-[30] min-w-[120px]"
              >
                JUMLAH
              </th>
            </tr>

            <!-- Baris 2 -->
            <tr class="bg-gray-50">
              <th
                v-for="bulan in bulanNames"
                :key="bulan"
                class="px-4 py-3 font-medium border-r border-gray-300 top-[44px] bg-gray-50 z-[30] min-w-[100px]"
              >
                {{ bulan }}
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody v-if="filteredKecamatanList && filteredKecamatanList.length > 0" class="divide-y divide-gray-100">
            <!-- Data per Kecamatan -->
            <tr
              v-for="item in filteredKecamatanList"
              :key="item.id"
              class="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td
                class="px-4 py-3 font-normal text-gray-800 border-r border-gray-300 sticky left-0 bg-white z-10"
              >
                {{ item.data.name }}
              </td>
              <td
                v-for="(bulan, index) in 12"
                :key="`rupiah-${index}`"
                class="px-4 py-3 text-right border-r border-gray-100"
              >
                {{ formatRupiah(item.data.detail_rupiah[index as keyof DetailBulan]) }}
              </td>
              <td class="px-4 py-3 text-right font-normal bg-gray-100">
                {{ formatRupiah(calculateTotal(item.data.detail_rupiah)) }}
              </td>
            </tr>

            <!-- Grand Total -->
            <tr class="border border-gray-200">
              <td
                class="px-4 py-3 font-normal text-gray-800 border-r border-gray-200 sticky left-0 bg-gray-100 z-10"
              >
                TOTAL KESELURUHAN
              </td>
              <td
                v-for="(bulan, index) in 12"
                :key="`total-${index}`"
                class="px-4 py-3 text-right font-normal border-r border-gray-200 bg-gray-100"
              >
                {{ formatRupiah(calculateGrandTotalBulan(index)) }}
              </td>
              <td class="px-4 py-3 text-right font-normal border-gray-200 bg-gray-100">
                {{ formatRupiah(calculateGrandTotal()) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Notification -->
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
