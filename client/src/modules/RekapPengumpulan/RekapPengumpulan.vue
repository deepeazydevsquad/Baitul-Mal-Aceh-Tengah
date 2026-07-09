<script setup lang="ts">
import BaseButton from '@/components/Button/BaseButton.vue';
import Notification from '@/components/Modal/Notification.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import { useNotification } from '@/composables/useNotification';
import { computed, onMounted, ref, watch } from 'vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

import { list } from '@/service/rekap_pengumpulan';

const isLoading = ref(false);
const isDownloading = ref(false);
const selectedYear = ref('0'); // ubah ke string untuk konsistensi
const years = ref<string[]>([]);
const search = ref('');
const tableColumns = ref<TableColumn[]>([]);

const months = [
  { key: '01', label: 'JAN' },
  { key: '02', label: 'FEB' },
  { key: '03', label: 'MAR' },
  { key: '04', label: 'APR' },
  { key: '05', label: 'MEI' },
  { key: '06', label: 'JUN' },
  { key: '07', label: 'JUL' },
  { key: '08', label: 'AGS' },
  { key: '09', label: 'SEP' },
  { key: '10', label: 'OKT' },
  { key: '11', label: 'NOV' },
  { key: '12', label: 'DES' },
];

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

function generateYears() {
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const yearList = ['0']; // 0 untuk "Pilih Semua Tahun"

  for (let year = currentYear; year >= startYear; year--) {
    yearList.push(year.toString());
  }

  years.value = yearList;
  selectedYear.value = currentYear.toString(); // set default ke tahun sekarang
}

const rows = ref<any[]>([]);

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Computed untuk filter berdasarkan pencarian
const filteredRows = computed(() => {
  if (!search.value.trim()) {
    return rows.value;
  }

  const searchTerm = search.value.toLowerCase();
  return rows.value.filter((row) => row.label.toLowerCase().includes(searchTerm));
});

async function fetchData() {
  isLoading.value = true;
  try {
    const yearParam = selectedYear.value === '0' ? 0 : parseInt(selectedYear.value);
    const res = await list({ year: yearParam || new Date().getFullYear() });
    const data = res.data || [];

    const tipe = [
      { key: 'zakat_harta', label: 'Zakat Harta' },
      { key: 'zakat_simpanan', label: 'Zakat Simpanan' },
      { key: 'zakat_profesi', label: 'Zakat Profesi' },
      { key: 'zakat_perdagangan', label: 'Zakat Perdagangan' },
      { key: 'zakat_pertanian', label: 'Zakat Pertanian' },
      { key: 'infaq', label: 'Infaq' },
      { key: 'sum_riwayat_donasi', label: 'Donasi' },
      { key: 'total_nominal_realisasi', label: 'Total' },
    ];

    rows.value = tipe.map((t) => {
      const values: Record<string, number> = {};
      let total = 0;

      months.forEach((m) => {
        let val = 0;
        const bulan = data.find((d) => d.month === m.key);
        if (bulan) {
          if (t.key === 'total_realisasi') val = bulan.total_realisasi || 0;
          else if (t.key === 'total_nominal_realisasi') val = bulan.total_nominal_realisasi || 0;
          else if (t.key === 'sum_riwayat_donasi') val = bulan.sum_riwayat_donasi || 0;
          else val = bulan.sum_riwayat_pengumpulan?.[t.key] || 0;
        }
        values[m.key] = val;
        total += val;
      });
      return { label: t.label, values, total };
    });
  } catch (e: any) {
    displayNotification(e.response?.data?.message || 'Gagal memuat data', 'error');
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  generateYears();
  await fetchData();
});

watch(selectedYear, fetchData);

// Cetak Laporan
function cetak_laporan() {
  isDownloading.value = true;
  try {
    const printUrl = `/rekap-pengumpulan/${selectedYear.value}`;
    window.open(printUrl, '_blank');
  } catch (error) {
    console.error('Error saat mengunduh PDF:', error);
    displayNotification('Gagal mengunduh PDF: ' + error.message, 'error');
  } finally {
    isDownloading.value = false;
  }
}
</script>

<template>
  <div class="p-4">


    <!-- Table Container -->
    <div class="overflow-x-auto rounded-xl border border-gray-200 shadow">
      <SkeletonTable v-if="isLoading" :columns="months.length + 2" :rows="8" />

      <div v-else-if="filteredRows.length > 0" id="table-for-pdf">
        <BaseTable
          class="w-full border-collapse bg-white text-sm"
          :columns="tableColumns"
          :data="filteredRows"
          :with-pagination="false"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #filters>
            <div class="flex items-center gap-3">
              <div class="flex items-center">
                <label for="search" class="mr-2 text-sm font-medium text-gray-600 whitespace-nowrap">
                  Cari Jenis
                </label>
                <input
                  id="search"
                  type="text"
                  v-model="search"
                  placeholder="Zakat, Infaq, Donasi..."
                  class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
                />
              </div>
              <div class="flex items-center">
                <label for="year-filter" class="mr-2 text-sm font-medium text-gray-600 whitespace-nowrap">
                  Tahun
                </label>
                <select
                  id="year-filter"
                  v-model="selectedYear"
                  class="w-full sm:w-48 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
                >
                  <option value="0">Semua Tahun</option>
                  <option v-for="year in years.slice(1)" :key="year" :value="year">
                    {{ year }}
                  </option>
                </select>
              </div>
            </div>
          </template>
          <template #custom-actions>
            <BaseButton
              @click="cetak_laporan"
              variant="primary"
              type="button"
              :disabled="isDownloading || isLoading"
            >
              <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
              Cetak
            </BaseButton>
          </template>
          <template #thead>
            <thead class="text-gray-700 text-center border-b border-gray-300">
              <tr class="bg-gray-50">
                <th
                  rowspan="2"
                  class="w-[20%] px-4 py-3 font-medium border-r border-gray-300 sticky left-0 top-0 bg-gray-50 z-[50] min-w-[180px]"
                >
                  JENIS PENGUMPULAN
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

              <tr class="bg-gray-50 top-[40px] z-10">
                <th
                  v-for="bulan in bulanNames"
                  :key="bulan"
                  class="px-4 py-3 font-medium border-r border-gray-300 min-w-[100px]"
                >
                  {{ bulan }}
                </th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(r, i) in filteredRows"
                :key="r.label"
                :class="[
                  'transition-colors',
                  r.label === 'Total'
                    ? 'bg-gray-100 font-normal'
                    : 'even:bg-gray-50 hover:bg-indigo-50',
                ]"
              >
                <td
                  class="px-4 py-3 text-gray-700 border-r border-gray-100 sticky left-0 z-10"
                  :class="r.label === 'Total' ? ' bg-gray-100 font-normal' : 'bg-white font-normal'"
                >
                  {{ r.label }}
                </td>
                <td
                  v-for="m in months"
                  :key="m.key"
                  class="px-6 py-3 text-right tabular-nums whitespace-nowrap"
                >
                  {{ $formatToRupiah(r.values[m.key]) }}
                </td>
                <td
                  class="px-6 py-3 text-right whitespace-nowrap"
                  :class="r.label === 'Total' ? 'text-gray-700 bg-gray-100' : 'bg-gray-100'"
                >
                  {{ $formatToRupiah(r.total) }}
                </td>
              </tr>
            </tbody>
          </template>
        </BaseTable>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white shadow-md rounded-xl p-12 text-center">
        <p class="text-gray-500 text-lg">
          {{ search ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data tersedia' }}
        </p>
      </div>
    </div>

    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
