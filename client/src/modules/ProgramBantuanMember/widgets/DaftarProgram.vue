<script setup lang="ts">
import BaseButton from '@/components/Button/BaseButton.vue';
import InputDateRange from '@/components/Form/InputDateRange.vue';
import PermohonanMember from '@/modules/PermohonanMember/PermohonanMember.vue';
import { list_program } from '@/service/program_bantuan_member';
import { defineEmits, defineProps, onMounted, ref } from 'vue';

const props = defineProps({
  programName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['back']);

interface Program {
  id_kegiatan: number;
  nama_kegiatan: string;
  banner: string;
  orang_terbantu: number;
  jumlah_realisasi: number;
}

import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

const data = ref<Program[]>([]);
const totalEntries = ref(0);
const currentPage = ref(1);
const perPage = ref(8);
const totalPages = ref(1);
const imageErrors = ref<Set<number>>(new Set());

// State untuk menampilkan PermohonanMember
const showPermohonan = ref(false);
const selectedIdKegiatan = ref<number | null>(null);

const normalizeResponseData = (respData: any): Program[] => {
  if (!respData) return [];
  if (Array.isArray(respData)) {
    return respData.filter((i) => i && Object.keys(i).length > 0);
  }
  if (typeof respData === 'object' && Object.keys(respData).length > 0) {
    return [respData];
  }
  return [];
};

// Function: Fetch data
const filter_date_range = ref({
  start: null,
  end: null,
});

const resetFilter = () => {
  filter_date_range.value = { start: null, end: null };
  fetchData();
};

const fetchData = async () => {
  try {
    const response = await list_program({
      name: props.programName,
      page: currentPage.value,
      perpage: perPage.value,
      type_date: filter_date_range.value,
    });

    const normalized = normalizeResponseData(response?.data);
    const totalFromApi = Number(response?.total?.jumlah_kegiatan ?? NaN);
    totalEntries.value = Number.isFinite(totalFromApi) ? totalFromApi : normalized.length;

    totalPages.value = totalEntries.value > 0 ? Math.ceil(totalEntries.value / perPage.value) : 1;

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
      if (totalEntries.value > 0) {
        return fetchData();
      }
    }

    data.value = normalized;
    console.log(data.value);
    imageErrors.value.clear();
  } catch (error) {
    console.error('Error fetching data:', error);
    data.value = [];
    totalEntries.value = 0;
    totalPages.value = 1;
  }
};

onMounted(fetchData);

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchData();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchData();
  }
};

const goToPage = (page: number) => {
  if (page !== currentPage.value) {
    currentPage.value = page;
    fetchData();
  }
};

const handleImageError = (index: number) => {
  imageErrors.value.add(index);
};

// Handler untuk tombol Detail Program
const openDetailProgram = (idKegiatan: number) => {
  selectedIdKegiatan.value = idKegiatan;
  showPermohonan.value = true;
};

// Handler untuk kembali dari PermohonanMember
const handleBackFromPermohonan = () => {
  showPermohonan.value = false;
  selectedIdKegiatan.value = null;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(value);
</script>

<template>
  <!-- Tampilkan PermohonanMember jika showPermohonan true -->
  <PermohonanMember
    v-if="showPermohonan"
    :id-kegiatan="selectedIdKegiatan!"
    @back="handleBackFromPermohonan"
  />

  <!-- Tampilkan list program jika showPermohonan false -->
  <div v-else class="p-6 bg-white rounded-lg shadow-lg">
    <div class="relative mb-12 flex flex-col md:flex-row items-center justify-center min-h-[60px] animate-fade-in-up">
      <button
        @click="emit('back')"
        class="md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 bg-white text-green-700 border border-green-600 px-5 py-2 rounded-xl hover:bg-green-50 transition-all flex items-center gap-2 shadow-sm font-semibold mb-6 md:mb-0"
      >
        <font-awesome-icon icon="fa-solid fa-arrow-left" />
        <span>Kembali</span>
      </button>

      <div class="text-center w-full md:w-auto px-4">
        <h2 class="text-2xl md:text-3xl font-extrabold text-gray-800 uppercase tracking-wider relative inline-block">
          {{ programName }}
          <span class="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-green-600 rounded-full"></span>
        </h2>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row items-center gap-4 max-w-4xl mx-auto mb-10 bg-white p-3 lg:p-4  animate-fade-in-up delay-100">
      <!-- Label Inline -->
      <div class="flex-shrink-0 font-semibold text-gray-700 pl-2 lg:pl-4 whitespace-nowrap">
        <font-awesome-icon icon="fa-regular fa-calendar-alt" class="mr-2 text-green-600" /> Periode:
      </div>
      
      <!-- Input Date Range -->
      <div class="flex-1 w-full">
        <InputDateRange
          id="date_range"
          v-model="filter_date_range"
          :label_status="false"
          :columns="2"
          :start-span="1"
          :end-span="1"
          class="w-full font-medium"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 w-full lg:w-auto pr-0 lg:pr-2">
        <button @click="fetchData" class="flex-1 lg:flex-none flex items-center justify-center px-6 py-2.5 bg-green-700 text-white font-semibold rounded-xl lg:rounded-full hover:bg-green-800 shadow-sm transition-all duration-300">
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" class="mr-2 lg:mr-0 xl:mr-2" /> <span class="inline lg:hidden xl:inline">Cari</span>
        </button>

        <button @click="resetFilter" class="flex-1 lg:flex-none flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl lg:rounded-full border border-gray-200 hover:bg-gray-200 hover:text-gray-800 shadow-sm transition-all duration-300">
          <font-awesome-icon icon="fa-solid fa-rotate-right" class="mr-2 lg:mr-0 xl:mr-2 text-gray-500" /> <span class="inline lg:hidden xl:inline">Reset</span>
        </button>
      </div>
    </div>

    <!-- Card List - Grid 4 kolom x 2 baris -->
    <div v-if="data.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="group bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col animate-fade-in-up"
        :style="{ animationDelay: `${200 + (index * 50)}ms` }"
      >
        <!-- Banner -->
        <div class="w-full h-48 bg-gray-50 flex items-center justify-center relative overflow-hidden">
          <img
            v-if="item.banner && !imageErrors.has(index)"
            :src="`${BASE_URL}/uploads/img/program_kegiatan_bantuan/${item.banner}`"
            alt="Banner Program"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            @error="handleImageError(index)"
          />
          <div
            v-else
            class="w-full h-full bg-gray-300 flex flex-col items-center justify-center text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-12 h-12 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
              />
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16l5-5 4 4 5-5 4 4" />
            </svg>
            <span class="text-sm font-medium">Gambar tidak ditemukan</span>
          </div>
        </div>

        <!-- Konten -->
        <div class="p-6 flex-1 flex flex-col justify-between relative bg-white">
          <div>
            <h3 class="font-bold text-lg text-gray-800 mb-4 leading-snug line-clamp-2 group-hover:text-green-700 transition-colors duration-200">
              {{ item.nama_kegiatan }}
            </h3>

            <div class="flex flex-col gap-3 mb-6">
              <!-- Orang Terbantu -->
              <div class="flex items-center text-sm text-gray-600 bg-blue-50/80 px-3.5 py-2.5 rounded-lg border border-blue-100">
                <font-awesome-icon icon="fa-solid fa-users" class="text-blue-500 mr-2.5 text-base" />
                <span class="font-medium mr-1.5 text-gray-600">Orang terbantu:</span>
                <span class="font-bold text-gray-800">{{ item.orang_terbantu }}</span>
              </div>

              <!-- Realisasi -->
              <div class="flex items-center text-sm text-gray-600 bg-green-50/80 px-3.5 py-2.5 rounded-lg border border-green-100">
                <font-awesome-icon icon="fa-solid fa-hand-holding-dollar" class="text-green-600 mr-2.5 text-base" />
                <span class="font-medium mr-1.5 text-gray-600">Realisasi:</span>
                <span class="font-bold text-green-700">{{ formatRupiah(item.jumlah_realisasi) }}</span>
              </div>
            </div>
          </div>

          <button
            @click="openDetailProgram(item.id_kegiatan)"
            class="mt-auto w-full bg-white border-2 border-green-600 text-green-700 font-bold text-sm py-2.5 rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300 shadow-sm focus:ring-4 focus:ring-green-100 focus:outline-none flex justify-center items-center gap-2"
          >
            <span>Detail Program</span>
            <font-awesome-icon icon="fa-solid fa-arrow-right" class="text-xs transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mt-8 animate-fade-in-up delay-200">
      <div class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <font-awesome-icon icon="fa-solid fa-folder-open" class="text-4xl text-green-500" />
      </div>
      <h3 class="text-xl font-bold text-gray-800 mb-2">Belum Ada Program</h3>
      <p class="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
        Saat ini belum ada program bantuan yang tersedia pada kategori ini. Silakan periksa kembali nanti.
      </p>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalEntries > 0"
      class="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4"
    >
      <!-- Pagination Buttons -->
      <div
        class="flex items-center justify-center gap-2 bg-gray-50 px-4 py-2 rounded-xl shadow-sm border border-gray-200"
      >
        <!-- Tombol Prev -->
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
          :class="
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-green-700 hover:bg-green-100'
          "
        >
          ← Prev
        </button>

        <!-- Nomor Halaman -->
        <div class="flex items-center gap-1">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            class="w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-all duration-200"
            :class="
              page === currentPage
                ? 'bg-green-700 text-white shadow-md'
                : 'text-gray-700 hover:bg-green-100'
            "
          >
            {{ page }}
          </button>
        </div>

        <!-- Tombol Next -->
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
          :class="
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-green-700 hover:bg-green-100'
          "
        >
          Next →
        </button>
      </div>

      <!-- Total Entries (kanan) -->
      <p class="text-gray-500 text-sm sm:text-right w-full sm:w-auto">
        Total Entries:
        <span class="font-semibold text-gray-800">{{ totalEntries }}</span>
      </p>
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
</style>
