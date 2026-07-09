<script setup lang="ts">
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logo from '@/components/Logo/Logo.vue';
import Notification from '@/components/Modal/Notification.vue';
import { useNotification } from '@/composables/useNotification';
import { get_laporan_pengumpulan } from '@/service/laporan_pengumpulan';
import { computed, onMounted, ref, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

const isLoading = ref(false);
const isTableLoading = ref(false);
const tableColumns = ref<TableColumn[]>([]);

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface DataPerJenis {
  jenis: string;
  target: number;
  realisasi: number;
  persentase: number;
}

interface Data {
  tahun: number;
  dataPerJenis: DataPerJenis[];
  totalTarget: number;
  totalRealisasi: number;
  persentaseTotal: number;
}
const datas = ref<Data[]>([]);
const selectedYear = ref<number>(new Date().getFullYear());

const totalTarget = ref(0);
const totalRealisasi = ref(0);
const rataPersentase = ref(0);

// Chart
const series = ref<any[]>([]);
const chartOptions = ref<any>({});
const zakatChart = ref<any>({});
const infakChart = ref<any>({});
const donasiChart = ref<any>({});

// Helper format
const formatMiliar = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(0) + ' jt';
  return val.toLocaleString('id-ID');
};

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);

const selectedYearData = computed(() => {
  return datas.value.find((d) => d.tahun === selectedYear.value) || null;
});

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_laporan_pengumpulan({
      tahun: selectedYear.value,
    });
    if (response.data && Array.isArray(response.data)) {
      datas.value = response.data;
    } else if (Array.isArray(response)) {
      datas.value = response;
    } else if (response.data) {
      datas.value = [response.data];
    } else {
      datas.value = [response];
    }

    if (datas.value.length > 0 && !selectedYear.value) {
      selectedYear.value = datas.value[0].tahun;
    }

    totalTarget.value = datas.value.reduce((acc, d) => acc + (d.totalTarget || 0), 0);
    totalRealisasi.value = datas.value.reduce((acc, d) => acc + (d.totalRealisasi || 0), 0);

    const validPercentages = datas.value.filter((d) => parseFloat(d.persentaseTotal || '0') > 0);
    rataPersentase.value =
      validPercentages.length > 0
        ? validPercentages.reduce((acc, d) => acc + parseFloat(d.persentaseTotal), 0) /
          validPercentages.length
        : datas.value.length > 0
          ? parseFloat(datas.value[0].persentaseTotal || '0')
          : 0;

    setupCharts();
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    displayNotification('Gagal mengambil data laporan pengumpulan', 'error');
    datas.value = [];
  } finally {
    isTableLoading.value = false;
  }
}

function setupCharts() {
  if (!selectedYearData.value || !selectedYearData.value.dataPerJenis) {
    console.warn('⚠️ No data available for charts');
    return;
  }

  const data = selectedYearData.value;
  const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  const getMonthlyDistribution = (totalRealisasi: number) => {
    const currentMonth = new Date().getMonth(); // 0-11
    const currentYear = new Date().getFullYear();

    if (data.tahun === currentYear) {
      // Untuk tahun berjalan, hanya sampai bulan ini
      return Array.from({ length: 12 }, (_, i) =>
        i <= currentMonth ? totalRealisasi / (currentMonth + 1) : 0,
      );
    } else if (data.tahun < currentYear) {
      // Untuk tahun lalu, distribusi rata
      return Array.from({ length: 12 }, () => totalRealisasi / 12);
    } else {
      // Untuk tahun depan, semua 0
      return Array(12).fill(0);
    }
  };

  const zakatData = data.dataPerJenis.find((j) => j.jenis === 'Zakat');
  const infaqData = data.dataPerJenis.find((j) => j.jenis === 'Infaq');
  const donasiData = data.dataPerJenis.find((j) => j.jenis === 'Donasi');

  series.value = [
    {
      name: 'Zakat',
      data: zakatData ? getMonthlyDistribution(zakatData.realisasi) : Array(12).fill(0),
    },
    {
      name: 'Infaq',
      data: infaqData ? getMonthlyDistribution(infaqData.realisasi) : Array(12).fill(0),
    },
    {
      name: 'Donasi',
      data: donasiData ? getMonthlyDistribution(donasiData.realisasi) : Array(12).fill(0),
    },
  ];

  chartOptions.value = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, foreColor: '#6b7280' },
    plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '60%' } },
    xaxis: {
      categories: monthLabels,
      labels: { style: { colors: '#6b7280', fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatMiliar(val),
        style: { colors: '#6b7280', fontSize: '11px' },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '12px',
      markers: { radius: 2 },
    },
    tooltip: { y: { formatter: (val: number) => formatRupiah(val) } },
    colors: ['#3b82f6', '#06b6d4', '#ef4444'],
    dataLabels: { enabled: false },
  };

  // =============== LINE CHARTS: Target vs Realisasi ===============
  const makeLineChart = (title: string, jenisData: DataPerJenis | undefined) => {
    if (!jenisData) {
      return {
        series: [],
        options: {
          chart: { type: 'line', toolbar: { show: false }, height: 280 },
          title: {
            text: title,
            align: 'left',
            style: { color: '#374151', fontSize: '13px', fontWeight: '600' },
          },
          noData: { text: 'Tidak ada data' },
        },
      };
    }

    const targetPerMonth = jenisData.target / 12;
    const realisasiPerMonth = jenisData.realisasi / 12;

    // Generate data kumulatif (s.d)
    const targetData = Array.from({ length: 12 }, (_, i) => targetPerMonth);
    const targetSD = Array.from({ length: 12 }, (_, i) => targetPerMonth * (i + 1));
    const realisasiData = Array.from({ length: 12 }, (_, i) => realisasiPerMonth);
    const realisasiSD = Array.from({ length: 12 }, (_, i) => realisasiPerMonth * (i + 1));

    return {
      series: [
        { name: 'Target', data: targetData },
        { name: 'Target s.d', data: targetSD },
        { name: 'Realisasi', data: realisasiData },
        { name: 'Realisasi s.d', data: realisasiSD },
      ],
      options: {
        chart: { type: 'line', toolbar: { show: false }, height: 280 },
        stroke: { curve: 'smooth', width: [2, 2, 2, 2] },
        xaxis: {
          categories: monthLabels,
          labels: { style: { colors: '#6b7280', fontSize: '10px' } },
        },
        yaxis: {
          labels: {
            formatter: (val: number) => formatMiliar(val),
            style: { colors: '#6b7280', fontSize: '10px' },
          },
        },
        legend: {
          position: 'top',
          fontSize: '11px',
          markers: { radius: 2 },
        },
        title: {
          text: title,
          align: 'left',
          style: { color: '#374151', fontSize: '13px', fontWeight: '600' },
        },
        colors: ['#94a3b8', '#cbd5e1', '#f87171', '#fb923c'],
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (val: number) => formatRupiah(val) } },
      },
    };
  };

  zakatChart.value = makeLineChart('Pengumpulan Zakat: Target vs Realisasi', zakatData);
  infakChart.value = makeLineChart('Pengumpulan Infaq: Target vs Realisasi', infaqData);
  donasiChart.value = makeLineChart('Pengumpulan Donasi: Target vs Realisasi', donasiData);
}

const cetak_laporan = (tahun: number) => {
  const printUrl = `/laporan-pengumpulan/${tahun}`;
  window.open(printUrl, '_blank');
};

// Watch untuk perubahan tahun
watch(selectedYear, () => {
  fetchData();
});

onMounted(fetchData);
</script>

<template>
  <div class="mx-auto p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />

    <div v-else class="space-y-4">
      <!-- Header dengan Dropdown Tahun -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2 mr-4">
          <BaseButton @click="cetak_laporan(selectedYear)" class="flex items-center justify-center">
            <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
            <span>Cetak</span>
          </BaseButton>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Tahun:</label>
          <select
            v-model="selectedYear"
            class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="year in [2023, 2024, 2025, 2026]" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
        <Logo />
      </div>

      <!-- Ringkasan Cards -->
      <div class="grid grid-cols-4 gap-4">
        <div class="p-4 rounded-lg bg-white text-center shadow-sm border border-gray-200">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Total</h3>
          <p class="text-2xl font-bold text-gray-900">
            {{ formatRupiah(selectedYearData?.totalRealisasi || 0) }}
          </p>
        </div>
        <div class="p-4 rounded-lg bg-white text-center shadow-sm border border-gray-200">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Target</h3>
          <p class="text-2xl font-bold text-gray-900">
            {{ formatRupiah(selectedYearData?.totalTarget || 0) }}
          </p>
        </div>
        <div class="p-4 rounded-lg bg-white text-center shadow-sm border border-gray-200">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Realisasi</h3>
          <p class="text-2xl font-bold text-gray-900">
            {{ formatRupiah(selectedYearData?.totalRealisasi || 0) }}
          </p>
        </div>
        <div class="p-4 rounded-lg bg-white text-center shadow-sm border border-gray-200">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Persentase</h3>
          <p class="text-2xl font-bold text-gray-900">
            {{ selectedYearData?.persentaseTotal || '0.00' }}%
          </p>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Line Charts -->
        <div class="p-4 rounded-lg border shadow-sm bg-white">
          <VueApexCharts
            v-if="zakatChart.series && zakatChart.series.length > 0"
            :options="zakatChart.options"
            :series="zakatChart.series"
            height="280"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-gray-400">
            Tidak ada data
          </div>
        </div>

        <div class="p-4 rounded-lg border shadow-sm bg-white">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Pengumpulan per Bulan</h3>
          <VueApexCharts
            v-if="series.length > 0"
            type="bar"
            height="280"
            :options="chartOptions"
            :series="series"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-gray-400">
            Tidak ada data
          </div>
        </div>

        <div class="p-4 rounded-lg border shadow-sm bg-white">
          <VueApexCharts
            v-if="infakChart.series && infakChart.series.length > 0"
            :options="infakChart.options"
            :series="infakChart.series"
            height="280"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-gray-400">
            Tidak ada data
          </div>
        </div>

        <!-- Tabel Target dan Capaian -->
        <div class="p-4 rounded-lg border shadow-sm bg-white">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Target dan Capaian</h3>
          <div
            v-if="
              selectedYearData &&
              selectedYearData.dataPerJenis &&
              selectedYearData.dataPerJenis.length > 0
            "
          >
            <BaseTable
              class="w-full text-xs mt-2"
              :columns="tableColumns"
              :data="selectedYearData.dataPerJenis"
              :with-pagination="false"
              :show-search="false"
              :show-add="false"
              :show-edit="false"
              :show-delete="false"
              :show-numbering="false"
              :show-actions="false"
            >
              <template #thead>
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-2 px-2 font-medium text-gray-600">Kategori</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600">Target</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600">Realisasi</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600">(%)</th>
                  </tr>
                </thead>
              </template>
              <template #tbody>
                <tbody class="divide-y">
                  <tr
                    v-for="jenis in selectedYearData.dataPerJenis"
                    :key="jenis.jenis"
                    class="hover:bg-gray-50"
                  >
                    <td class="py-2 px-2">{{ jenis.jenis }}</td>
                    <td class="py-2 px-2 text-right">{{ formatRupiah(jenis.target) }}</td>
                    <td class="py-2 px-2 text-right">{{ formatRupiah(jenis.realisasi) }}</td>
                    <td class="py-2 px-2 text-right">{{ (jenis.persentase ?? 0).toFixed(2) }}%</td>
                  </tr>
                  <tr class="bg-gray-50 font-semibold">
                    <td class="py-2 px-2">Total</td>
                    <td class="py-2 px-2 text-right">
                      {{ formatRupiah(selectedYearData.totalTarget) }}
                    </td>
                    <td class="py-2 px-2 text-right">
                      {{ formatRupiah(selectedYearData.totalRealisasi) }}
                    </td>
                    <td class="py-2 px-2 text-right">
                      {{ (selectedYearData.persentaseTotal ?? 0).toFixed(2) }}%
                    </td>
                  </tr>
                </tbody>
              </template>
            </BaseTable>
          </div>
          <div v-else class="flex items-center justify-center h-32 text-gray-400">
            Tidak ada data
          </div>
        </div>

        <div class="p-4 rounded-lg border shadow-sm bg-white">
          <VueApexCharts
            v-if="donasiChart.series && donasiChart.series.length > 0"
            :options="donasiChart.options"
            :series="donasiChart.series"
            height="280"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-gray-400">
            Tidak ada data
          </div>
        </div>

        <!-- Tabel Komposisi Sumber Dana -->
        <div class="p-4 rounded-lg border shadow-sm bg-white">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Komposisi Sumber Dana</h3>
          <div
            v-if="
              selectedYearData &&
              selectedYearData.dataPerJenis &&
              selectedYearData.dataPerJenis.length > 0
            "
          >
            <BaseTable
              class="w-full text-xs mt-2"
              :columns="tableColumns"
              :data="selectedYearData.dataPerJenis"
              :with-pagination="false"
              :show-search="false"
              :show-add="false"
              :show-edit="false"
              :show-delete="false"
              :show-numbering="false"
              :show-actions="false"
            >
              <template #thead>
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="text-left py-2 px-2 font-medium text-gray-600">Kategori</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600">Rek Penampung</th>
                    <th class="text-right py-2 px-2 font-medium text-gray-600">Rek Kasda</th>
                  </tr>
                </thead>
              </template>
              <template #tbody>
                <tbody class="divide-y">
                  <tr
                    v-for="jenis in selectedYearData.dataPerJenis"
                    :key="jenis.jenis"
                    class="hover:bg-gray-50"
                  >
                    <td class="py-2 px-2">{{ jenis.jenis }}</td>
                    <td class="py-2 px-2 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <div
                          class="h-4 bg-blue-400 rounded"
                          :style="{
                            width: `${Math.min(parseFloat(String(jenis.persentase)) * 0.6, 100)}%`,
                            maxWidth: '100px',
                          }"
                        ></div>
                        <span class="text-xs whitespace-nowrap">{{
                          formatRupiah(jenis.realisasi * 0.6)
                        }}</span>
                      </div>
                    </td>
                    <td class="py-2 px-2 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <div
                          class="h-4 bg-cyan-400 rounded"
                          :style="{
                            width: `${Math.min(parseFloat(String(jenis.persentase)) * 0.8, 100)}%`,
                            maxWidth: '100px',
                          }"
                        ></div>
                        <span class="text-xs whitespace-nowrap">{{
                          formatRupiah(jenis.realisasi * 0.4)
                        }}</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="bg-gray-50 font-semibold">
                    <td class="py-2 px-2">Total keseluruhan</td>
                    <td class="py-2 px-2 text-right">
                      {{ formatRupiah(selectedYearData.totalRealisasi * 0.6) }}
                    </td>
                    <td class="py-2 px-2 text-right">
                      {{ formatRupiah(selectedYearData.totalRealisasi * 0.4) }}
                    </td>
                  </tr>
                </tbody>
              </template>
            </BaseTable>
          </div>
          <div v-else class="flex items-center justify-center h-32 text-gray-400">
            Tidak ada data
          </div>
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
  fill: #6b7280 !important;
  color: #6b7280 !important;
  font-size: 11px !important;
}

:deep(.apexcharts-title-text) {
  fill: #374151 !important;
  color: #374151 !important;
  font-weight: 600 !important;
}
</style>
