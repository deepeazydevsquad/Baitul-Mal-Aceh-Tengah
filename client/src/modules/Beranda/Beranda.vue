<script setup lang="ts">
// Library
import { ref, onMounted, computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import Notification from '@/components/Modal/Notification.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logo from '@/components/Logo/Logo.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_beranda } from '@/service/beranda';
import BaseButton from '@/components/Button/BaseButton.vue';

// State
const isLoading = ref(false);
const isTableLoading = ref(false);

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Data state
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

interface PengumpulanTahunan {
  tahun: number;
  total: number;
}

interface ApiData {
  infaq: Item;
  zakat: Item;
  donasi: Item;
  pengumpulan: {
    totalGabungan?: PengumpulanBulanan[];
    totalPerTahun?: PengumpulanTahunan[];
    dataKonversi?: PengumpulanBulanan[];
  };
}

const apiData = ref<ApiData | null>(null);

// Tahun filter - default tahun sekarang
const tahun = ref<string>(new Date().getFullYear().toString());

// bikin array 5 tahun terakhir termasuk tahun sekarang
const tahunOptions = ref<number[]>(
  Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
);

// Helper
const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

// Total ringkasan
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

// Chart
const seriesPengumpulan = ref<any[]>([]);
const seriesDistribusi = ref<any[]>([]);
const chartOptionsPengumpulan = ref<any>({});
const chartOptionsDistribusi = ref<any>({});

// Fetch API
async function fetchData() {
  console.log('Fetching data untuk tahun:', tahun.value);
  isTableLoading.value = true;
  try {
    const response = await get_beranda({ tahun: parseInt(tahun.value) });

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

    // Chart Pengumpulan Per Bulan dengan 2 garis (Realisasi & Target)
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

      // Buat array 12 bulan dengan nilai default 0
      const realisasiPerBulan = Array(12).fill(0);
      const targetPerBulan = Array(12).fill(0);

      // Isi data realisasi (totalGabungan)
      dataBulanan.forEach((item: PengumpulanBulanan) => {
        if (item.bulan >= 1 && item.bulan <= 12) {
          realisasiPerBulan[item.bulan - 1] = Number(item.total) || 0;
        }
      });

      // Isi data target (dataKonversi)
      dataTarget.forEach((item: PengumpulanBulanan) => {
        if (item.bulan >= 1 && item.bulan <= 12) {
          targetPerBulan[item.bulan - 1] = Number(item.total) || 0;
        }
      });

      console.log('Data Realisasi per bulan:', realisasiPerBulan);
      console.log('Data Target per bulan:', targetPerBulan);

      seriesPengumpulan.value = [
        {
          name: 'Realisasi',
          data: realisasiPerBulan,
        },
        {
          name: 'Target',
          data: targetPerBulan,
        },
      ];

      chartOptionsPengumpulan.value = {
        chart: {
          type: 'line',
          height: 300,
          foreColor: '#000',
          toolbar: { show: false },
        },
        colors: ['#10b981', '#f59e0b'],
        stroke: {
          curve: 'smooth',
          width: 3,
          dashArray: [0, 5], // realisasi solid, target dash
        },
        markers: {
          size: 5,
          hover: {
            size: 7,
          },
        },
        xaxis: {
          categories: namaBulan,
          labels: {
            style: {
              fontSize: '12px',
            },
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
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => formatRupiah(val),
          },
        },
        dataLabels: { enabled: false },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '13px',
          markers: {
            width: 12,
            height: 12,
          },
        },
        grid: {
          borderColor: '#f1f1f1',
        },
        title: {
          text: `Pengumpulan & Target Per Bulan - Tahun ${tahun.value}`,
          align: 'left',
          style: {
            fontSize: '16px',
            fontWeight: 600,
          },
        },
      };
    }

    // Chart Distribusi → bar
    seriesDistribusi.value = [
      { name: 'Zakat', data: [apiData.value.zakat.realisasi_distribusi] },
      { name: 'Infaq', data: [apiData.value.infaq.realisasi_distribusi] },
      { name: 'Donasi', data: [apiData.value.donasi.realisasi_distribusi] },
    ];

    chartOptionsDistribusi.value = {
      chart: {
        type: 'bar',
        height: 300,
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
          fontSize: '11px',
          colors: ['#000'],
        },
      },
      xaxis: {
        categories: ['Tahun ' + tahun.value],
        labels: {
          style: {
            fontSize: '12px',
          },
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
        fontSize: '13px',
      },
      grid: {
        borderColor: '#f1f1f1',
      },
      title: {
        text: 'Distribusi Per Kategori',
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 600,
        },
      },
    };
  } catch (err) {
    console.error(err);
    displayNotification('Gagal mengambil data laporan tahunan', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

const cetak_laporan = (tahun: string) => {
  const printUrl = `/beranda/${tahun}`;
  window.open(printUrl, '_blank');
};

onMounted(fetchData);
</script>

<template>
  <div class="mx-auto p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />

    <div v-else class="space-y-4">
      <!-- Tahun filter -->

      <div class="flex items-center justify-between mb-4">
        <!-- Kiri: Tombol & Select -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <BaseButton @click="cetak_laporan(tahun)" class="flex items-center justify-center">
              <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
              <span>Cetak</span>
            </BaseButton>
          </div>

          <div class="flex items-center gap-2">
            <label for="tahun" class="font-medium text-gray-700">Tahun:</label>
            <select
              id="tahun"
              v-model="tahun"
              @change="fetchData"
              class="border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-300"
            >
              <option v-for="t in tahunOptions" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <!-- Kanan: Logo -->
        <div class="flex-shrink-0">
          <Logo />
        </div>
      </div>

      <!-- Ringkasan total -->
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
          <h3 class="font-semibold text-gray-700">Persentase Distribusi</h3>
          <p class="text-lg font-bold text-gray-900">{{ persentase.toFixed(2) }}%</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="grid grid-cols-2 gap-4 mt-6">
        <div class="p-4 rounded-xl border shadow bg-white">
          <VueApexCharts
            v-if="seriesPengumpulan.length > 0"
            type="line"
            height="300"
            :options="chartOptionsPengumpulan"
            :series="seriesPengumpulan"
          />
          <div v-else class="flex items-center justify-center h-[300px] text-gray-500">
            Tidak ada data
          </div>
        </div>
        <div class="p-4 rounded-xl border shadow bg-white">
          <VueApexCharts
            v-if="seriesDistribusi.length > 0"
            type="bar"
            height="300"
            :options="chartOptionsDistribusi"
            :series="seriesDistribusi"
          />
          <div v-else class="flex items-center justify-center h-[300px] text-gray-500">
            Tidak ada data
          </div>
        </div>
      </div>

      <!-- Tabel -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow mt-6">
        <LoadingSpinner v-if="isTableLoading" label="Memuat data..." />

        <table
          v-else
          class="w-full border-collapse bg-white text-sm text-center shadow-md rounded-lg overflow-hidden"
        >
          <thead class="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th class="px-4 py-3">Kategori</th>
              <th class="px-4 py-3">Target Pengumpulan</th>
              <th class="px-4 py-3">Realisasi Pengumpulan</th>
              <th class="px-4 py-3">Capaian</th>
              <th class="px-4 py-3">Target Distribusi</th>
              <th class="px-4 py-3">Realisasi Distribusi</th>
              <th class="px-4 py-3">Capaian</th>
            </tr>
          </thead>
          <tbody v-if="apiData && apiData.length > 0" class="divide-y divide-gray-200">
            <tr class="hover:bg-gray-50 transition-colors duration-200">
              <td class="px-4 py-2 font-medium text-left">Infaq</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.infaq.target_pengumpulan) }}</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.infaq.realisasi_pengumpulan) }}</td>
              <td class="px-4 py-2">{{ apiData.infaq.persentase_pengumpulan.toFixed(2) }}%</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.infaq.target_distribusi) }}</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.infaq.realisasi_distribusi) }}</td>
              <td class="px-4 py-2">{{ apiData.infaq.persentase_distribusi.toFixed(2) }}%</td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors duration-200">
              <td class="px-4 py-2 font-medium text-left">Zakat</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.zakat.target_pengumpulan) }}</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.zakat.realisasi_pengumpulan) }}</td>
              <td class="px-4 py-2">{{ apiData.zakat.persentase_pengumpulan.toFixed(2) }}%</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.zakat.target_distribusi) }}</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.zakat.realisasi_distribusi) }}</td>
              <td class="px-4 py-2">{{ apiData.zakat.persentase_distribusi.toFixed(2) }}%</td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors duration-200">
              <td class="px-4 py-2 font-medium text-left">Donasi</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.donasi.target_pengumpulan) }}</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.donasi.realisasi_pengumpulan) }}</td>
              <td class="px-4 py-2">{{ apiData.donasi.persentase_pengumpulan.toFixed(2) }}%</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.donasi.target_distribusi) }}</td>
              <td class="px-4 py-2">{{ formatRupiah(apiData.donasi.realisasi_distribusi) }}</td>
              <td class="px-4 py-2">{{ apiData.donasi.persentase_distribusi.toFixed(2) }}%</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">Tidak ada data</td>
            </tr>
          </tbody>
          <tfoot v-if="apiData && apiData.length > 0" class="bg-gray-200 font-bold text-gray-800">
            <tr>
              <td class="px-4 py-3 text-left">TOTAL</td>
              <td class="px-4 py-3">
                {{ formatRupiah(totalTarget) }}
              </td>
              <td class="px-4 py-3">
                {{ formatRupiah(totalPengumpulan) }}
              </td>
              <td class="px-4 py-3">{{ persentaseCapaianPengumpulan.toFixed(2) }}%</td>
              <td class="px-4 py-3">
                {{ formatRupiah(totalTargetDistribusi) }}
              </td>
              <td class="px-4 py-3">
                {{ formatRupiah(totalDistribusi) }}
              </td>
              <td class="px-4 py-3">{{ persentaseCapaianDistribusi.toFixed(2) }}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Notification -->
      <Notification
        :showNotification="showNotification"
        :notificationType="notificationType"
        :notificationMessage="notificationMessage"
        @close="showNotification = false"
      />
    </div>
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
