<script setup lang="ts">
const programs = [
  { name: 'Program Bantuan Sosial', icon: '/images/icon_program2.svg', link: '#' },
  { name: 'Program Pemberdayaan Ekonomi', icon: '/images/icon_program2.svg', link: '#' },
  { name: 'Program Bantuan Kesehatan', icon: '/images/icon_program2.svg', link: '#' },
  { name: 'Program Bantuan Pendidikan', icon: '/images/icon_program2.svg', link: '#' },
  { name: 'Program Bantuan Keagamaan', icon: '/images/icon_program2.svg', link: '#' },
  { name: 'Program Bantuan Infak', icon: '/images/icon_program2.svg', link: '#' },
];

// Library
import { ref, onMounted, onUnmounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import Notification from '@/components/Modal/Notification.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import DaftarProgram from './widgets/DaftarProgram.vue';
import RiwayatPermohonanMember from '@/modules/RiwayatPermohonanMember/RiwayatPermohonanMember.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_laporan } from '@/service/program_bantuan_member';

// === State ===
const isLoading = ref(false);
const tahun = ref<number>(new Date().getFullYear());
const selectedProgram = ref<string | null>(null);
const showRiwayat = ref(false);

const chartSeries = ref<any[]>([]);
const chartOptions = ref<any>({});
const orang_terbantu = ref(0);
const total_bantuan = ref(0);

const formatRupiah = (angka: number) => {
  if (!angka) return 'Rp 0';
  return angka
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    .replace(/^/, 'Rp ');
};

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

const fetchData = async () => {
  try {
    isLoading.value = true;
    const response = await get_laporan({ tahun: tahun.value });
    const data = response?.data || [];
    total_bantuan.value = response.total.sudah_direalisasi;
    orang_terbantu.value = response.total.total_penerima;

    const labels = data.map((d: any) => d.program);
    const realisasiSeries = data.map((d: any) => d.persentase_realisasi || 0);
    const belumSeries = data.map((d: any) => 100 - (d.persentase_realisasi || 0));

    chartSeries.value = [
      { name: 'Realisasi', data: realisasiSeries },
      { name: 'Belum Terealisasi', data: belumSeries },
    ];

    chartOptions.value = {
      chart: {
        type: 'bar',
        foreColor: '#000',
        toolbar: { show: true },
        stacked: true,
        animations: { enabled: true, easing: 'easeinout', speed: 800 },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const programName = labels[config.dataPointIndex];
            const realisasi = realisasiSeries[config.dataPointIndex];
            console.log('Program selected:', programName, realisasi);
          },
        },
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '45%', borderRadius: 6 },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
      xaxis: { categories: labels },
      yaxis: {
        labels: { formatter: (val: number) => `${val}%` },
        max: 100,
        title: { text: 'Persentase Realisasi' },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)}%`,
        },
      },
      title: { text: 'Persentase Realisasi Program', align: 'left' },
      colors: ['#16a34a', '#facc15'], // hijau & kuning
      legend: { position: 'bottom' },
    };
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const daftarTahun = ref<number[]>([]);

const initTahun = () => {
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= 2020; i--) {
    daftarTahun.value.push(i);
  }
};

// handle klik program
const handleProgramClick = (programName: string) => {
  selectedProgram.value = programName;
};

// handle klik riwayat
const handleRiwayatClick = () => {
  showRiwayat.value = true;
};

// handle back dari riwayat
const handleBackFromRiwayat = () => {
  showRiwayat.value = false;
};

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
  initTahun();
  fetchData();
});

onUnmounted(() => {
  isMounted.value = false;
});
</script>

<template>
  <div class="program-bantuan-wrapper">
    <!-- Tampilkan RiwayatPermohonanMember jika showRiwayat true -->
    <div v-if="showRiwayat">
      <RiwayatPermohonanMember @back="handleBackFromRiwayat" />
    </div>

    <!-- Tampilkan DaftarProgram jika selectedProgram ada -->
    <div v-else-if="selectedProgram">
      <DaftarProgram :program-name="selectedProgram" @back="selectedProgram = null" />
    </div>

    <!-- Tampilkan halaman utama jika tidak ada yang dipilih -->
    <div v-else class="pb-8">
      <div
        class="w-full bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-10 overflow-hidden"
      >
        <!-- === Kiri: List Program === -->
        <div
          class="w-full lg:w-[35%] flex flex-col gap-5 p-6 md:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100 bg-white animate-fade-in-up"
        >
          <div class="mb-4">
            <h2 class="text-3xl font-extrabold text-gray-800 uppercase tracking-wider relative inline-block mb-4">
              Program Bantuan
              <span class="absolute -bottom-2 left-0 w-12 h-1.5 bg-green-600 rounded-full"></span>
            </h2>
            <p class="text-gray-500 text-sm md:text-base leading-relaxed">
              Ayo, kita cari tahu bersama program-program bantuan apa saja yang sedang tersedia di
              Baitul Mal Kabupaten Bener Meriah!
            </p>
          </div>

          <div class="flex flex-col gap-3.5">
            <button
              v-for="(program, index) in programs"
              :key="index"
              @click="handleProgramClick(program.name)"
              class="w-full px-5 py-3.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl inline-flex justify-start items-center gap-3.5 font-bold text-gray-800 text-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-yellow-500/20 animate-fade-in-up"
              :style="{ animationDelay: `${100 + index * 50}ms` }"
            >
              <img :src="program.icon" class="w-6 h-6 object-contain" />
              <span>{{ program.name }}</span>
            </button>

            <button
              @click="handleRiwayatClick"
              class="w-full px-5 py-3.5 bg-green-800 hover:bg-green-700 rounded-xl inline-flex justify-start items-center gap-3.5 font-bold text-sm text-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 mt-2 border border-green-900/50 animate-fade-in-up"
              :style="{ animationDelay: `${100 + programs.length * 50}ms` }"
            >
              <font-awesome-icon icon="fa-solid fa-clock-rotate-left" class="text-green-300 text-lg ml-0.5" />
              <span>Riwayat Program Bantuan</span>
            </button>
          </div>
        </div>

        <!-- === Kanan: Chart & Stats === -->
        <div
          class="w-full lg:w-[65%] flex-1 p-6 md:p-8 lg:p-10 bg-gray-50/30 flex flex-col justify-start items-stretch overflow-hidden animate-fade-in-up delay-100"
        >
          <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center w-full gap-6 mb-8">
            <!-- Filter Tahun -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
              <div class="text-gray-700 text-sm font-semibold whitespace-nowrap">
                Pilih Tahun Anggaran:
              </div>
              <select
                v-model="tahun"
                @change="fetchData"
                class="block w-full sm:w-40 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all outline-none cursor-pointer"
              >
                <option v-for="(t, i) in daftarTahun" :key="i" :value="t">{{ t }}</option>
              </select>
            </div>
            
            <!-- Statistik Info -->
            <div class="w-full xl:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Orang Terbantu -->
              <div class="flex items-center gap-3 md:gap-4 bg-white p-4 sm:px-5 sm:py-3.5 rounded-xl border border-green-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] animate-fade-in-up delay-200 w-full overflow-hidden">
                <div class="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <img src="/images/icon_orang_terbantu.svg" class="w-5 h-5 md:w-6 md:h-6 object-contain" />
                </div>
                <div class="flex flex-col min-w-0 flex-1">
                  <div class="text-green-700 text-lg md:text-xl xl:text-2xl font-black leading-none mb-1 tracking-tight truncate" :title="'+' + orang_terbantu">
                    +{{ orang_terbantu }}
                  </div>
                  <div class="text-gray-500 text-xs font-semibold leading-tight uppercase tracking-wide">
                    Orang Terbantu
                  </div>
                </div>
              </div>

              <!-- Bantuan Disalurkan -->
              <div class="flex items-center gap-3 md:gap-4 bg-white p-4 sm:px-5 sm:py-3.5 rounded-xl border border-green-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] animate-fade-in-up delay-300 w-full overflow-hidden">
                <div class="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <img src="/images/icon_bantuan_tersalurkan.svg" class="w-5 h-5 md:w-6 md:h-6 object-contain" />
                </div>
                <div class="flex flex-col min-w-0 flex-1">
                  <div class="text-green-700 text-lg md:text-xl xl:text-2xl font-black leading-none mb-1 tracking-tight truncate" :title="'+' + formatRupiah(total_bantuan)">
                    +{{ formatRupiah(total_bantuan) }}
                  </div>
                  <div class="text-gray-500 text-xs font-semibold leading-tight uppercase tracking-wide">
                    Bantuan Disalurkan
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart -->
          <div v-if="isMounted && !isLoading" class="w-full mt-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up delay-400">
            <VueApexCharts type="bar" height="380" :options="chartOptions" :series="chartSeries" />
          </div>
          <div v-else class="flex flex-col justify-center items-center h-[380px] bg-white rounded-2xl border border-gray-100 shadow-sm w-full mt-4">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mb-4"></div>
            <span class="text-gray-500 font-medium">Memuat data grafik...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }

:deep(.apexcharts-text),
:deep(.apexcharts-legend-text),
:deep(.apexcharts-xaxis-label),
:deep(.apexcharts-yaxis-label) {
  fill: #000 !important;
  color: #000 !important;
  font-size: 12px !important;
}
</style>
