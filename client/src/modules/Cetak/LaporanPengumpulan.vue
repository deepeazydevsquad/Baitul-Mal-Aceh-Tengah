<script setup lang="ts">
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logos from '@/components/Logo/Logo.vue';
import FooterCetak from '@/modules/FooterCetak/FooterCetak.vue';
import { get_laporan_pengumpulan } from '@/service/laporan_pengumpulan';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import VueApexCharts from 'vue3-apexcharts';

const route = useRoute();
const tahun = parseInt(route.params.tahun as string);

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

const data = ref<Data | null>(null);



// Chart
const series = ref<any[]>([]);
const chartOptions = ref<any>({});
const zakatChart = ref<any>({});
const infakChart = ref<any>({});
const donasiChart = ref<any>({});

// Helper format
const formatMiliar = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'jt';
  return val.toLocaleString('id-ID');
};

const formatToRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);

const isLoading = ref(true);

async function fetchData() {
  isLoading.value = true;
  try {
    const response = await get_laporan_pengumpulan({ tahun });

    data.value = Array.isArray(response) ? response[0] : response;

    console.log('Data laporan pengumpulan:', data.value);

    if (data.value) {
      setupCharts();
    }
  } catch (error) {
    console.error('❌ Error fetching data:', error);
  } finally {
    isLoading.value = false;
  }
}

function setupCharts() {
  if (!data.value || !data.value.dataPerJenis) {
    return;
  }

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
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (data.value!.tahun === currentYear) {
      return Array.from({ length: 12 }, (_, i) =>
        i <= currentMonth ? totalRealisasi / (currentMonth + 1) : 0,
      );
    } else if (data.value!.tahun < currentYear) {
      return Array.from({ length: 12 }, () => totalRealisasi / 12);
    } else {
      return Array(12).fill(0);
    }
  };

  const zakatData = data.value.dataPerJenis.find((j) => j.jenis === 'Zakat');
  const infaqData = data.value.dataPerJenis.find((j) => j.jenis === 'Infaq');
  const donasiData = data.value.dataPerJenis.find((j) => j.jenis === 'Donasi');

  // Bar Chart (Stacked) - dengan data labels
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
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      foreColor: '#000',
      height: 320,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: '60%',
        dataLabels: { position: 'center' },
      },
    },
    xaxis: {
      categories: monthLabels,
      labels: { style: { colors: '#000', fontSize: '10px' } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + 'jt';
          return formatToRupiah(val);
        },
        style: { colors: '#000', fontSize: '10px' },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      labels: { colors: '#000' },
    },
    tooltip: { y: { formatter: (val: number) => formatToRupiah(val) } },
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        if (val === 0) return '';
        return formatMiliar(val);
      },
      style: {
        fontSize: '8px',
        colors: ['#fff'],
      },
      offsetY: 0,
    },
    grid: {
      borderColor: '#e5e7eb',
    },
    title: {
      text: 'Pengumpulan per Bulan',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#000',
      },
    },
  };

  // Line Charts - dengan data labels
  const makeLineChart = (title: string, jenisData: DataPerJenis | undefined) => {
    if (!jenisData) {
      return { series: [], options: {} };
    }

    const targetPerMonth = jenisData.target / 12;
    const realisasiPerMonth = jenisData.realisasi / 12;

    const targetData = Array.from({ length: 12 }, () => targetPerMonth);
    const targetSD = Array.from({ length: 12 }, (_, i) => targetPerMonth * (i + 1));
    const realisasiData = Array.from({ length: 12 }, () => realisasiPerMonth);
    const realisasiSD = Array.from({ length: 12 }, (_, i) => realisasiPerMonth * (i + 1));

    return {
      series: [
        { name: 'Target', data: targetData },
        { name: 'Target s.d', data: targetSD },
        { name: 'Realisasi', data: realisasiData },
        { name: 'Realisasi s.d', data: realisasiSD },
      ],
      options: {
        chart: {
          type: 'line',
          toolbar: { show: false },
          height: 320,
          foreColor: '#000',
        },
        stroke: { curve: 'smooth', width: [2, 2, 2, 2] },
        xaxis: {
          categories: monthLabels,
          labels: { style: { colors: '#000', fontSize: '10px' } },
        },
        yaxis: {
          labels: {
            formatter: (val: number) => {
              if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + 'jt';
              return formatToRupiah(val);
            },
            style: { colors: '#000', fontSize: '10px' },
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '11px',
          labels: { colors: '#000' },
        },
        title: {
          text: title,
          align: 'left',
          style: { color: '#000', fontSize: '13px', fontWeight: 600 },
        },
        colors: ['#94a3b8', '#cbd5e1', '#f87171', '#fb923c'],
        dataLabels: {
          enabled: true,
          formatter: (val: number) => {
            if (val === 0) return '';
            return formatMiliar(val);
          },
          style: {
            fontSize: '9px',
            colors: ['#fff'],
          },
          background: {
            enabled: true,
            foreColor: '#fff',
            padding: 3,
            borderRadius: 2,
            borderWidth: 0,
            opacity: 0.8,
          },
          offsetY: -8,
        },
        tooltip: { y: { formatter: (val: number) => formatToRupiah(val) } },
        markers: {
          size: 4,
        },
        grid: {
          borderColor: '#e5e7eb',
        },
      },
    };
  };

  zakatChart.value = makeLineChart('Pengumpulan Zakat: Target vs Realisasi', zakatData);
  infakChart.value = makeLineChart('Pengumpulan Infaq: Target vs Realisasi', infaqData);
  donasiChart.value = makeLineChart('Pengumpulan Donasi: Target vs Realisasi', donasiData);
}

const handlePrint = () => {
  const oldTitle = document.title;
  document.title = `Laporan Pengumpulan ${tahun === '0' ? 'Semua Tahun' : 'Per Tahun ' + tahun}`;

  const styleId = 'print-style';
  let styleElement: HTMLStyleElement | null = null;

  // Cek apakah style sudah ada
  if (!document.getElementById(styleId)) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      @page {
        size: A4 landscape;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Event listener untuk cleanup setelah print
  const afterPrint = () => {
    document.title = oldTitle;
    const printStyle = document.getElementById(styleId);
    if (printStyle) {
      printStyle.remove();
    }
    window.removeEventListener('afterprint', afterPrint);
    console.log('Print style cleaned up');
    setTimeout(() => {
      window.close();
    }, 400);
  };
  window.addEventListener('afterprint', afterPrint);
  setTimeout(() => {
    window.print();
  }, 1000);
};

onMounted(async () => {
  try {
    await fetchData();
    await nextTick();
    handlePrint();
  } catch (error) {
    console.error('❌ Error saat mounting:', error);
  }
});
</script>

<template>
  <div v-if="isLoading" class="bg-white min-h-screen flex items-center justify-center">
    <LoadingSpinner label="Memuat halaman..." />
  </div>
  <!-- HALAMAN 1 -->
  <div
    class="bg-white max-w-[297mm] mx-auto p-[5mm] font-sans print:p-0 print:m-0 print:shadow-none print-area page-break"
    style="color: black; font-size: 9pt; line-height: 1.3"
  >
    <!-- Header dengan Logo -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Laporan Pengumpulan</h1>
        <p class="text-sm text-gray-700">Tahun: {{ tahun }}</p>
      </div>
      <div class="flex-shrink-0">
        <Logos />
      </div>
    </div>

    <!-- Ringkasan Cards -->
    <div v-if="data" class="grid grid-cols-4 gap-3 mb-4">
      <div class="p-2 rounded-lg bg-blue-50 text-center border border-blue-200">
        <h3 class="text-xs font-semibold text-gray-700 mb-1">Total</h3>
        <p class="text-sm font-bold text-gray-900">{{ $formatToRupiah(data.totalRealisasi) }}</p>
      </div>
      <div class="p-2 rounded-lg bg-green-50 text-center border border-green-200">
        <h3 class="text-xs font-semibold text-gray-700 mb-1">Target</h3>
        <p class="text-sm font-bold text-gray-900">{{ $formatToRupiah(data.totalTarget) }}</p>
      </div>
      <div class="p-2 rounded-lg bg-yellow-50 text-center border border-yellow-200">
        <h3 class="text-xs font-semibold text-gray-700 mb-1">Realisasi</h3>
        <p class="text-sm font-bold text-gray-900">{{ $formatToRupiah(data.totalRealisasi) }}</p>
      </div>
      <div class="p-2 rounded-lg bg-purple-50 text-center border border-purple-200">
        <h3 class="text-xs font-semibold text-gray-700 mb-1">Persentase</h3>
        <p class="text-sm font-bold text-gray-900">{{ (data.persentaseTotal ?? 0).toFixed(2) }}%</p>
      </div>
    </div>

    <!-- Charts Grid - Halaman 1 -->
    <div v-if="data" class="grid grid-cols-2 gap-3 mb-4">
      <!-- Zakat Chart -->
      <div class="p-2 rounded-lg border border-gray-300 bg-white">
        <VueApexCharts
          v-if="zakatChart.series && zakatChart.series.length > 0"
          type="line"
          height="320"
          :options="zakatChart.options"
          :series="zakatChart.series"
        />
        <div v-else class="flex items-center justify-center h-[320px] text-gray-500">
          Tidak ada data
        </div>
      </div>

      <!-- Bar Chart Pengumpulan per Bulan -->
      <div class="p-2 rounded-lg border border-gray-300 bg-white">
        <VueApexCharts
          v-if="series.length > 0"
          type="bar"
          height="320"
          :options="chartOptions"
          :series="series"
        />
        <div v-else class="flex items-center justify-center h-[320px] text-gray-500">
          Tidak ada data
        </div>
      </div>
    </div>

    <!-- Tabel Target dan Capaian - Halaman 1 -->
    <div v-if="data" class="mb-4">
      <div class="p-2 rounded-lg border border-gray-300 bg-white">
        <h3 class="text-xs font-bold text-gray-900 mb-2">Target dan Capaian</h3>
        <table class="w-full text-[8pt] border-collapse border border-gray-300 print-table text-black">
          <thead class="bg-gray-100 border-b-2 border-gray-400">
            <tr>
              <th class="text-left py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Kategori</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Target</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Realisasi</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900">(%)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-if="data.dataPerJenis && data.dataPerJenis.length > 0">
              <tr v-for="(row, i) in data.dataPerJenis" :key="i">
                <td class="py-1 px-2 border-r border-gray-300">{{ row.jenis }}</td>
                <td class="py-1 px-2 text-right border-r border-gray-300">{{ $formatToRupiah(row.target) }}</td>
                <td class="py-1 px-2 text-right border-r border-gray-300">{{ $formatToRupiah(row.realisasi) }}</td>
                <td class="py-1 px-2 text-right">{{ (row.persentase ?? 0).toFixed(2) }}%</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="4" class="text-center py-2">Data tidak ditemukan</td>
            </tr>
            <tr class="bg-gray-100 font-bold border-t-2 border-gray-400">
              <td class="py-1 px-2 border-r border-gray-300">Total</td>
              <td class="py-1 px-2 text-right border-r border-gray-300">
                {{ $formatToRupiah(data.totalTarget) }}
              </td>
              <td class="py-1 px-2 text-right border-r border-gray-300">
                {{ $formatToRupiah(data.totalRealisasi) }}
              </td>
              <td class="py-1 px-2 text-right">{{ (data.persentaseTotal ?? 0).toFixed(2) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer Cetak Halaman 1 -->
    <div class="">
      <div>
        <FooterCetak />
      </div>
    </div>
  </div>

  <!-- HALAMAN 2 -->
  <div
    class="bg-white max-w-[297mm] mx-auto p-[10mm] font-sans print:p-[10mm] print:m-0 print:shadow-none print-area"
    style="color: black; font-size: 9pt; line-height: 1.3"
  >
    <!-- Header dengan Logo - Halaman 2 -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Laporan Pengumpulan</h1>
        <p class="text-sm text-gray-700">Tahun: {{ tahun }}</p>
      </div>
      <div class="flex-shrink-0">
        <Logos />
      </div>
    </div>

    <!-- Charts Grid - Halaman 2 -->
    <div v-if="data" class="grid grid-cols-2 gap-3 mb-4">
      <!-- Infaq Chart -->
      <div class="p-2 rounded-lg border border-gray-300 bg-white">
        <VueApexCharts
          v-if="infakChart.series && infakChart.series.length > 0"
          type="line"
          height="320"
          :options="infakChart.options"
          :series="infakChart.series"
        />
        <div v-else class="flex items-center justify-center h-[320px] text-gray-500">
          Tidak ada data
        </div>
      </div>

      <!-- Donasi Chart -->
      <div class="p-2 rounded-lg border border-gray-300 bg-white">
        <VueApexCharts
          v-if="donasiChart.series && donasiChart.series.length > 0"
          type="line"
          height="320"
          :options="donasiChart.options"
          :series="donasiChart.series"
        />
        <div v-else class="flex items-center justify-center h-[320px] text-gray-500">
          Tidak ada data
        </div>
      </div>
    </div>

    <!-- Tabel Komposisi Sumber Dana - Halaman 2 -->
    <div v-if="data" class="mb-4">
      <div class="p-2 rounded-lg border border-gray-300 bg-white">
        <h3 class="text-xs font-bold text-gray-900 mb-2">Komposisi Sumber Dana</h3>
        <table class="w-full text-[8pt] border-collapse border border-gray-300 print-table text-black">
          <thead class="bg-gray-100 border-b-2 border-gray-400">
            <tr>
              <th class="text-left py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Kategori</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Rek Penampung</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900">Rek Kasda</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-if="data.dataPerJenis && data.dataPerJenis.length > 0">
              <tr v-for="(row, i) in data.dataPerJenis" :key="i">
                <td class="py-1 px-2 border-r border-gray-300">{{ row.jenis }}</td>
                <td class="py-1 px-2 text-right border-r border-gray-300">{{ $formatToRupiah(row.realisasi * 0.6) }}</td>
                <td class="py-1 px-2 text-right">{{ $formatToRupiah(row.realisasi * 0.4) }}</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="3" class="text-center py-2">Data tidak ditemukan</td>
            </tr>
            <tr class="bg-gray-100 font-bold border-t-2 border-gray-400">
              <td class="py-1 px-2 border-r border-gray-300">Total keseluruhan</td>
              <td class="py-1 px-2 text-right border-r border-gray-300">
                {{ $formatToRupiah(data.totalRealisasi * 0.6) }}
              </td>
              <td class="py-1 px-2 text-right">
                {{ $formatToRupiah(data.totalRealisasi * 0.4) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer Cetak Halaman 2 -->
  </div>
  <div class="mt-auto">
    <FooterCetak />
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

  .page-break {
    margin-bottom: 20px;
  }
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0 !important;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white;
  }

  .page-break {
    page-break-after: always;
    margin-bottom: 0 !important;
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

:deep(.apexcharts-datalabel) {
  fill: #000 !important;
}

:deep(.apexcharts-datalabel-value) {
  fill: #fff !important;
  font-weight: 600;
}
</style>
