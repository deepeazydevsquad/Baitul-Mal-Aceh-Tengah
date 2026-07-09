<script setup lang="ts">
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logos from '@/components/Logo/Logo.vue';
import { get_beranda } from '@/service/beranda';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import VueApexCharts from 'vue3-apexcharts';
import FooterCetak from '../FooterCetak/FooterCetak.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

const route = useRoute();
const tahun = parseInt(route.params.tahun as string);

interface Item {
  target_pengumpulan: number;
  realisasi_pengumpulan: number;
  persentase_pengumpulan: number;
  target_distribusi: number;
  realisasi_distribusi: number;
  persentase_distribusi: number;
}

interface PengumpulanBulanan {
  bulan: number;
  total: number;
}

interface ApiData {
  infaq: Item;
  zakat: Item;
  donasi: Item;
  pengumpulan: {
    totalGabungan?: PengumpulanBulanan[];
    totalPerTahun?: any[];
    dataKonversi?: PengumpulanBulanan[];
  };
}

const apiData = ref<ApiData | null>(null);

// Chart
const seriesPengumpulan = ref<any[]>([]);
const seriesDistribusi = ref<any[]>([]);
const chartOptionsPengumpulan = ref<any>({});
const chartOptionsDistribusi = ref<any>({});

// Helper
const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);

// Computed
const totalPengumpulan = computed(() => {
  if (!apiData.value) return 0;
  return (
    (apiData.value.infaq?.realisasi_pengumpulan || 0) +
    (apiData.value.zakat?.realisasi_pengumpulan || 0) +
    (apiData.value.donasi?.realisasi_pengumpulan || 0)
  );
});

const totalDistribusi = computed(() => {
  if (!apiData.value) return 0;
  return (
    (apiData.value.infaq?.realisasi_distribusi || 0) +
    (apiData.value.zakat?.realisasi_distribusi || 0) +
    (apiData.value.donasi?.realisasi_distribusi || 0)
  );
});

const persentase = computed(() => {
  const pengumpulan = totalPengumpulan.value;
  const distribusi = totalDistribusi.value;
  if (!pengumpulan || pengumpulan === 0) return 0;
  return (distribusi / pengumpulan) * 100;
});

const totalTarget = computed(() => {
  if (!apiData.value) return 0;
  return (
    (apiData.value.infaq?.target_pengumpulan || 0) +
    (apiData.value.zakat?.target_pengumpulan || 0) +
    (apiData.value.donasi?.target_pengumpulan || 0)
  );
});

const totalTargetDistribusi = computed(() => {
  if (!apiData.value) return 0;
  return (
    (apiData.value.infaq?.target_distribusi || 0) +
    (apiData.value.zakat?.target_distribusi || 0) +
    (apiData.value.donasi?.target_distribusi || 0)
  );
});

const persentaseCapaianPengumpulan = computed(() => {
  const target = totalTarget.value;
  const realisasi = totalPengumpulan.value;
  if (!target || target === 0) return 0;
  return (realisasi / target) * 100;
});

const persentaseCapaianDistribusi = computed(() => {
  const target = totalTargetDistribusi.value;
  const realisasi = totalDistribusi.value;
  if (!target || target === 0) return 0;
  return (realisasi / target) * 100;
});

const dataTabel = computed(() => {
  if (!apiData.value) return [];
  return [
    { kategori: 'Infaq', data: apiData.value.infaq },
    { kategori: 'Zakat', data: apiData.value.zakat },
    { kategori: 'Donasi', data: apiData.value.donasi },
  ];
});

const tableColumns = ref<TableColumn[]>([
  { key: 'kategori', label: 'Kategori', headerClass: 'text-left border-r border-gray-300', cellClass: 'text-left font-medium border-r border-gray-300' },
  { key: 'target_pengumpulan', label: 'Target Pengumpulan', headerClass: 'border-r border-gray-300', cellClass: 'text-right border-r border-gray-300' },
  { key: 'realisasi_pengumpulan', label: 'Realisasi Pengumpulan', headerClass: 'border-r border-gray-300', cellClass: 'text-right border-r border-gray-300' },
  { key: 'capaian_pengumpulan', label: 'Capaian', headerClass: 'border-r border-gray-300', cellClass: 'text-right border-r border-gray-300' },
  { key: 'target_distribusi', label: 'Target Distribusi', headerClass: 'border-r border-gray-300', cellClass: 'text-right border-r border-gray-300' },
  { key: 'realisasi_distribusi', label: 'Realisasi Distribusi', headerClass: 'border-r border-gray-300', cellClass: 'text-right border-r border-gray-300' },
  { key: 'capaian_distribusi', label: 'Capaian', headerClass: '', cellClass: 'text-right' },
]);

// Fetch Data
async function fetchData() {
  try {
    const response = await get_beranda({ tahun });
    const resData = response;

    if (!resData) {
      apiData.value = null;
      return;
    }

    apiData.value = {
      infaq: resData.infaq,
      zakat: resData.zakat,
      donasi: resData.donasi,
      pengumpulan: resData.pengumpulan,
    };

    // Chart Pengumpulan Per Bulan
    if (resData.pengumpulan.totalGabungan) {
      const namaBulan = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agt',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];

      const dataBulanan = resData.pengumpulan.totalGabungan || [];
      const dataTarget = resData.pengumpulan.dataKonversi || [];

      const realisasiPerBulan = Array(12).fill(0);
      const targetPerBulan = Array(12).fill(0);

      dataBulanan.forEach((item: PengumpulanBulanan) => {
        if (item.bulan >= 1 && item.bulan <= 12) {
          realisasiPerBulan[item.bulan - 1] = Number(item.total) || 0;
        }
      });

      dataTarget.forEach((item: PengumpulanBulanan) => {
        if (item.bulan >= 1 && item.bulan <= 12) {
          targetPerBulan[item.bulan - 1] = Number(item.total) || 0;
        }
      });

      seriesPengumpulan.value = [
        { name: 'Realisasi', data: realisasiPerBulan },
        { name: 'Target', data: targetPerBulan },
      ];

      chartOptionsPengumpulan.value = {
        chart: {
          type: 'line',
          height: 280,
          foreColor: '#000',
          toolbar: { show: false },
        },
        colors: ['#10b981', '#f59e0b'],
        stroke: {
          curve: 'smooth',
          width: 3,
          dashArray: [0, 5],
        },
        markers: {
          size: 4,
        },
        xaxis: {
          categories: namaBulan,
          labels: {
            style: { fontSize: '10px', colors: '#000' },
          },
        },
        yaxis: {
          labels: {
            formatter: (val: number) => {
              if (val >= 1000000) {
                return 'Rp ' + (val / 1000000).toFixed(1) + 'jt';
              }
              return formatRupiah(val);
            },
            style: { colors: '#000', fontSize: '10px' },
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => formatRupiah(val),
          },
        },
        dataLabels: {
          enabled: true,
          formatter: (val: number) => {
            if (val >= 1000000) {
              return (val / 1000000).toFixed(1) + 'jt';
            }
            return val;
          },
          offsetY: -8,
          style: {
            fontSize: '9px',
            colors: ['#000'],
          },
          background: {
            enabled: true,
            foreColor: '#fff',
            padding: 3,
            borderRadius: 2,
            borderWidth: 0,
            opacity: 0.8,
          },
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '11px',
          labels: { colors: '#000' },
        },
        grid: {
          borderColor: '#e5e7eb',
        },
        title: {
          text: `Pengumpulan & Target Per Bulan - Tahun ${tahun}`,
          align: 'left',
          style: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#000',
          },
        },
      };
    }

    // Chart Distribusi
    seriesDistribusi.value = [
      { name: 'Zakat', data: [apiData.value.zakat.realisasi_distribusi] },
      { name: 'Infaq', data: [apiData.value.infaq.realisasi_distribusi] },
      { name: 'Donasi', data: [apiData.value.donasi.realisasi_distribusi] },
    ];

    chartOptionsDistribusi.value = {
      chart: {
        type: 'bar',
        height: 280,
        foreColor: '#000',
        toolbar: { show: false },
      },
      colors: ['#3b82f6', '#10b981', '#f59e0b'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%',
          borderRadius: 8,
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + 'jt';
          }
          return val;
        },
        offsetY: -20,
        style: {
          fontSize: '10px',
          colors: ['#000'],
        },
      },
      xaxis: {
        categories: ['Tahun ' + tahun],
        labels: {
          style: { fontSize: '10px', colors: '#000' },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => {
            if (val >= 1000000) {
              return 'Rp ' + (val / 1000000).toFixed(1) + 'jt';
            }
            return formatRupiah(val);
          },
          style: { colors: '#000', fontSize: '10px' },
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => formatRupiah(val),
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '11px',
        labels: { colors: '#000' },
      },
      grid: {
        borderColor: '#e5e7eb',
      },
      title: {
        text: 'Distribusi Per Kategori',
        align: 'left',
        style: {
          fontSize: '13px',
          fontWeight: 600,
          color: '#000',
        },
      },
    };
  } catch (err) {
    console.error('❌ Error fetching data:', err);
  }
}

onMounted(async () => {
  try {
    await fetchData();
    await nextTick();

    if (apiData.value) {
      setTimeout(() => {
        window.print();
      }, 800);
    } else {
      console.warn('❗ Data kosong atau tidak valid');
    }
  } catch (error) {
    console.error('❌ Error saat mounting:', error);
  }
});
</script>

<template>
  <div v-if="isLoading" class="bg-white min-h-screen flex items-center justify-center">
    <LoadingSpinner label="Memuat halaman..." />
  </div>
  <div v-else class="min-h-screen p-4 print:p-0 print:m-0">
    <div
      class="bg-white max-w-[297mm] mx-auto p-[5mm] font-sans print:p-[5mm] print:m-0 print:shadow-none print-area flex flex-col"
      style="color: black; font-size: 9pt; line-height: 1.3"
    >
      <!-- Header dengan Logo -->
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">Laporan Beranda</h1>
          <p class="text-sm text-gray-700">Tahun: {{ tahun }}</p>
        </div>
        <div class="flex-shrink-0">
          <Logos />
        </div>
      </div>

      <!-- Ringkasan Cards -->
      <div v-if="apiData && apiData.length > 0" class="grid grid-cols-3 gap-3 mb-4">
        <div class="p-2 rounded-lg bg-green-50 text-center border border-green-200">
          <h3 class="text-xs font-semibold text-gray-700 mb-1">Total Pengumpulan</h3>
          <p class="text-sm font-bold text-gray-900">{{ formatRupiah(totalPengumpulan) }}</p>
        </div>
        <div class="p-2 rounded-lg bg-blue-50 text-center border border-blue-200">
          <h3 class="text-xs font-semibold text-gray-700 mb-1">Total Distribusi</h3>
          <p class="text-sm font-bold text-gray-900">{{ formatRupiah(totalDistribusi) }}</p>
        </div>
        <div class="p-2 rounded-lg bg-yellow-50 text-center border border-yellow-200">
          <h3 class="text-xs font-semibold text-gray-700 mb-1">Persentase Distribusi</h3>
          <p class="text-sm font-bold text-gray-900">{{ persentase.toFixed(2) }}%</p>
        </div>
      </div>

      <!-- Charts -->
      <div v-if="apiData && apiData.length > 0" class="grid grid-cols-2 gap-3 mb-4">
        <!-- Chart Pengumpulan -->
        <div class="p-2 rounded-lg border border-gray-300 bg-white">
          <VueApexCharts
            v-if="seriesPengumpulan.length > 0"
            type="line"
            height="280"
            :options="chartOptionsPengumpulan"
            :series="seriesPengumpulan"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-gray-500">
            Tidak ada data
          </div>
        </div>

        <!-- Chart Distribusi -->
        <div class="p-2 rounded-lg border border-gray-300 bg-white">
          <VueApexCharts
            v-if="seriesDistribusi.length > 0"
            type="bar"
            height="280"
            :options="chartOptionsDistribusi"
            :series="seriesDistribusi"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-gray-500">
            Tidak ada data
          </div>
        </div>
      </div>

      <!-- Tabel Data -->
      <div v-if="apiData && dataTabel.length > 0" class="overflow-hidden border border-gray-300 rounded-lg">
        <BaseTable
          class="text-[8pt]"
          :columns="tableColumns"
          :data="dataTabel"
          :with-pagination="false"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #cell-kategori="{ row }">
            {{ row.kategori }}
          </template>
          <template #cell-target_pengumpulan="{ row }">
            {{ formatRupiah(row.data.target_pengumpulan) }}
          </template>
          <template #cell-realisasi_pengumpulan="{ row }">
            {{ formatRupiah(row.data.realisasi_pengumpulan) }}
          </template>
          <template #cell-capaian_pengumpulan="{ row }">
            {{ (row.data.persentase_pengumpulan ?? 0).toFixed(2) }}%
          </template>
          <template #cell-target_distribusi="{ row }">
            {{ formatRupiah(row.data.target_distribusi) }}
          </template>
          <template #cell-realisasi_distribusi="{ row }">
            {{ formatRupiah(row.data.realisasi_distribusi) }}
          </template>
          <template #cell-capaian_distribusi="{ row }">
            {{ (row.data.persentase_distribusi ?? 0).toFixed(2) }}%
          </template>

          <template #tfoot>
            <tr class="bg-gray-200 font-bold text-gray-900 border-t-2 border-gray-400">
              <td class="px-2 py-2 text-left border-r border-gray-300">TOTAL</td>
              <td class="px-2 py-2 text-right border-r border-gray-300">
                {{ formatRupiah(totalTarget) }}
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-300">
                {{ formatRupiah(totalPengumpulan) }}
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-300">
                {{ persentaseCapaianPengumpulan.toFixed(2) }}%
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-300">
                {{ formatRupiah(totalTargetDistribusi) }}
              </td>
              <td class="px-2 py-2 text-right border-r border-gray-300">
                {{ formatRupiah(totalDistribusi) }}
              </td>
              <td class="px-2 py-2 text-right">{{ persentaseCapaianDistribusi.toFixed(2) }}%</td>
            </tr>
          </template>
        </BaseTable>
      </div>

      <div class="mt-auto">
        <FooterCetak />
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-area {
  max-width: 297mm;
  min-height: 210mm;
  margin: 0 auto;
  padding: 5mm;
  background: white;
}

@media screen {
  body {
    background-color: #f3f4f6;
  }

  .print-area {
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
    margin-top: 20px;
  }
}

@media print {
  @page {
    size: A4 landscape;
    margin: 5mm;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
:deep(.apexcharts-text),
:deep(.apexcharts-legend-text),
:deep(.apexcharts-xaxis-label),
:deep(.apexcharts-yaxis-label),
:deep(.apexcharts-title-text) {
  fill: #000 !important;
  color: #000 !important;
}
</style>
