<script setup lang="ts">
// Library
import { ref, onMounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logo from '@/components/Logo/Logo.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_laporan_tahunan } from '@/service/laporan_tahunan';
import BaseButton from '@/components/Button/BaseButton.vue';
import CetakIcon from '@/components/Icons/CetakIcon.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(3);
const tableColumns = ref<TableColumn[]>([]);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// State Data
interface Pengumpulan {
  zakat: string;
  infaq: string;
  donasi: string;
  total: string;
}

interface Distribusi {
  zakat: string;
  infaq: string;
  total: string;
}

interface Data {
  tahun: string;
  pengumpulan: Pengumpulan;
  distribusi: Distribusi;
}

const datas = ref<Data[]>([]);

// Ringkasan
const totalPengumpulan = ref(0);
const totalDistribusi = ref(0);
const persentase = ref(0);

// Chart State
const seriesPengumpulan = ref<any[]>([]);
const seriesDistribusi = ref<any[]>([]);
const chartOptionsPengumpulan = ref<any>({});
const chartOptionsDistribusi = ref<any>({});

// Helper format angka jadi Miliar (contoh: 120000000 → 120M)
const formatMiliar = (val: number) => {
  if (val >= 1000000000) {
    return (val / 1000000000).toFixed(2) + ' M';
  } else if (val >= 1000000) {
    return (val / 1000000).toFixed(0) + ' JT';
  }
  return val.toString();
};

// Helper format Rupiah detail
const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_laporan_tahunan({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    datas.value = response.data;
    totalRow.value = response.total;

    // Hitung total
    totalPengumpulan.value = datas.value.reduce((acc, d) => acc + Number(d.pengumpulan.total), 0);
    totalDistribusi.value = datas.value.reduce((acc, d) => acc + Number(d.distribusi.total), 0);
    persentase.value =
      totalPengumpulan.value > 0 ? (totalDistribusi.value / totalPengumpulan.value) * 100 : 0;

    // Chart Pengumpulan
    seriesPengumpulan.value = [
      { name: 'Zakat', data: datas.value.map((d) => Number(d.pengumpulan.zakat)) },
      { name: 'Infaq', data: datas.value.map((d) => Number(d.pengumpulan.infaq)) },
      { name: 'Donasi', data: datas.value.map((d) => Number(d.pengumpulan.donasi)) },
    ];

    // Chart Distribusi
    seriesDistribusi.value = [
      { name: 'Zakat', data: datas.value.map((d) => Number(d.distribusi.zakat)) },
      { name: 'Infaq', data: datas.value.map((d) => Number(d.distribusi.infaq)) },
    ];

    // Options Chart (biar sama style)
    const baseOptions = {
      chart: {
        type: 'bar',
        foreColor: '#000', // ini ngerubah default warna semua teks chart jadi hitam
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 6,
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: datas.value.map((d) => d.tahun),
        title: {
          text: 'Tahun',
          style: { color: '#000' },
        },
        labels: {
          style: {
            colors: Array(datas.value.length).fill('#000'), // semua label paksa hitam
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Nominal (Rp)',
          style: { color: '#000' },
        },
        labels: {
          formatter: (val: number) => formatMiliar(val),
          style: {
            colors: ['#000'],
            fontSize: '12px',
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        labels: {
          colors: ['#000'],
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => formatRupiah(val),
        },
      },
    };
    chartOptionsPengumpulan.value = {
      ...baseOptions,
      title: { text: 'Pengumpulan per Tahun' },
    };
    chartOptionsDistribusi.value = {
      ...baseOptions,
      title: { text: 'Distribusi per Tahun' },
    };
    chartOptionsPengumpulan.value = { ...baseOptions, title: { text: 'Pengumpulan per Tahun' } };
    chartOptionsDistribusi.value = { ...baseOptions, title: { text: 'Distribusi per Tahun' } };
  } catch (error) {
    console.error(error);
    displayNotification('Gagal mengambil data laporan tahunan', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

const tahun = ref<string>(new Date().getFullYear().toString());

const cetak_laporan = (tahun: string) => {
  const printUrl = `/laporan-tahunan/${tahun}`;
  window.open(printUrl, '_blank');
};

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <div class="mx-auto p-4">
    <div class="flex items-center justify-between">
      <BaseButton @click="cetak_laporan(tahun)" class="flex items-center justify-center">
        <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
        <span>Cetak</span>
      </BaseButton>

      <Logo />
    </div>

    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Ringkasan -->
      <div class="grid grid-cols-3 gap-4 my-6">
        <div class="p-4 rounded-xl bg-green-50 text-center shadow">
          <h3 class="font-semibold text-gray-700">Total Pengumpulan</h3>
          <p class="text-lg font-bold text-gray-900">{{ formatRupiah(totalPengumpulan) }}</p>
        </div>
        <div class="p-4 rounded-xl bg-blue-50 text-center shadow">
          <h3 class="font-semibold text-gray-700">Total Distribusi</h3>
          <p class="text-lg font-bold text-gray-900">{{ formatRupiah(totalDistribusi) }}</p>
        </div>
        <div class="p-4 rounded-xl bg-yellow-50 text-center shadow">
          <h3 class="font-semibold text-gray-700">Persentase</h3>
          <p class="text-lg font-bold text-gray-900">{{ persentase.toFixed(2) }} %</p>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <BaseTable
          v-else
          class="w-full border-collapse bg-white text-sm"
          :columns="tableColumns"
          :data="datas"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        @page-change="pageNow"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #thead>
            <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
              <tr>
                <th rowspan="2" class="w-[15%] px-6 py-3 font-medium align-middle">Tahun</th>
                <th colspan="4" class="w-[45%] px-6 py-3 font-medium">Pengumpulan</th>
                <th colspan="3" class="w-[40%] px-6 py-3 font-medium">Distribusi</th>
              </tr>
              <tr>
                <th class="px-4 py-2 font-medium">Zakat</th>
                <th class="px-4 py-2 font-medium">Infaq</th>
                <th class="px-4 py-2 font-medium">Donasi</th>
                <th class="px-4 py-2 font-medium">Total</th>
                <th class="px-4 py-2 font-medium">Zakat</th>
                <th class="px-4 py-2 font-medium">Infaq</th>
                <th class="px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(data, index) in datas"
                :key="index"
                class="hover:bg-gray-50 transition-colors text-center"
              >
                <td class="px-6 py-4 font-medium text-gray-800">{{ data.tahun }}</td>
                <td class="px-4 py-2 text-gray-700">
                  {{ formatRupiah(Number(data.pengumpulan.zakat)) }}
                </td>
                <td class="px-4 py-2 text-gray-700">
                  {{ formatRupiah(Number(data.pengumpulan.infaq)) }}
                </td>
                <td class="px-4 py-2 text-gray-700">
                  {{ formatRupiah(Number(data.pengumpulan.donasi)) }}
                </td>
                <td class="px-4 py-2 font-semibold text-gray-900">
                  {{ formatRupiah(Number(data.pengumpulan.total)) }}
                </td>
                <td class="px-4 py-2 text-gray-700">
                  {{ formatRupiah(Number(data.distribusi.zakat)) }}
                </td>
                <td class="px-4 py-2 text-gray-700">
                  {{ formatRupiah(Number(data.distribusi.infaq)) }}
                </td>
                <td class="px-4 py-2 font-semibold text-gray-900">
                  {{ formatRupiah(Number(data.distribusi.total)) }}
                </td>
              </tr>
            </tbody>
          </template>
          
        </BaseTable>
      </div>

      <!-- Chart -->
      <div class="grid grid-cols-2 gap-6 mt-8">
        <div class="p-4 rounded-xl border shadow bg-white">
          <h3 class="font-bold mb-2">Pengumpulan</h3>
          <VueApexCharts
            type="bar"
            height="300"
            :options="chartOptionsPengumpulan"
            :series="seriesPengumpulan"
          />
        </div>
        <div class="p-4 rounded-xl border shadow bg-white">
          <h3 class="font-bold mb-2">Distribusi</h3>
          <VueApexCharts
            type="bar"
            height="300"
            :options="chartOptionsDistribusi"
            :series="seriesDistribusi"
          />
        </div>
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

<style scoped>
:deep(.apexcharts-text),
:deep(.apexcharts-legend-text),
:deep(.apexcharts-xaxis-label),
:deep(.apexcharts-yaxis-label) {
  fill: #000 !important;
  color: #000 !important;
  font-size: 12px !important;
}
</style>
