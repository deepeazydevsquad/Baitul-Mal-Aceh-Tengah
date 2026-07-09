<script setup lang="ts">
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logos from '@/components/Logo/Logo.vue';
import FooterCetak from '@/modules/FooterCetak/FooterCetak.vue';
import { get_laporan_perencanaan } from '@/service/laporan_perencanaan';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

const route = useRoute();
const tahun = parseInt(route.params.tahun as string);
const program = route.params.program == 'semua' ? undefined : (route.params.program as string);
const perPage = (route.params.perpage as string) || undefined;
const currentPage = (route.params.currentpage as string) || undefined;
const grandTotal = ref<string>('');

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val);

interface LaporanPerencanaan {
  uraian: string;
  rencana: {
    jumlah: number;
    satuan: string;
  };
  rincian: {
    vol: number;
    satuan: string;
    jumlah_satuan: number;
  };
  persentase: string;
  ket: string;
}

interface Asnaf {
  nama: string;
  program: LaporanPerencanaan[];
  total: number;
}

const datas = ref<Asnaf[]>([]);
const isLoading = ref(true);
const tableColumns = ref<TableColumn[]>([]);

async function fetchData() {
  isLoading.value = true;
  try {
    const response = await get_laporan_perencanaan({
      perpage: perPage,
      pageNumber: currentPage,
      tahun: tahun || undefined,
      program: program || undefined,
    });
    datas.value = response.data;
    grandTotal.value = response.grand_total_format;
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

const handlePrint = () => {
  const oldTitle = document.title;
  document.title = `Laporan Perencanaan ${tahun === '0' ? 'Semua Tahun' : 'Per Tahun ' + tahun}`;

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
  <div v-else class="min-h-screen p-4 print:p-0 print:m-0">
    <div
      class="print-area font-sans flex flex-col"
      style="color: black; font-size: 9pt; line-height: 1.3; background: white"
    >
      <!-- Header -->
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">Laporan Perencanaan</h1>
          <p class="text-sm text-gray-700">Tahun: {{ tahun }}</p>
        </div>
        <div class="flex-shrink-0">
          <Logos />
        </div>
      </div>

      <!-- Tabel -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
        class="w-full text-[8pt] mb-4 print-table"
        style="table-layout: fixed"
        :columns="tableColumns"
        :data="[]"
        :with-pagination="false"
        :show-search="false"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        :show-numbering="false"
        :show-actions="false"
      >
        <template #thead>
          <thead class="border border-black text-center">
            <tr>
              <th rowspan="2" class="border border-black w-[14%] px-2 py-1">Asnaf</th>
              <th colspan="2" class="border border-black w-[12%] px-2 py-1">Rencana</th>
              <th colspan="4" class="border border-black w-[48%] px-2 py-1">
                Rincian Perhitungan (Murni)
              </th>
              <th rowspan="2" class="border border-black w-[8%] px-2 py-1">%</th>
              <th rowspan="2" class="border border-black w-[10%] px-2 py-1">Ket</th>
            </tr>
            <tr>
              <th class="border border-black px-2 py-1">Jml</th>
              <th class="border border-black px-2 py-1">Sat</th>
              <th class="border border-black px-2 py-1">Vol</th>
              <th class="border border-black px-2 py-1">Sat</th>
              <th class="border border-black px-2 py-1">Jml Sat</th>
              <th class="border border-black px-2 py-1">Jumlah</th>
            </tr>
          </thead>
        </template>

        <template #tbody>
          <tbody>
            <template v-if="datas && datas.length > 0">
              <template v-for="asnaf in datas" :key="asnaf.nama">
                <!-- Baris Asnaf -->
                <tr class="font-semibold text-black text-[8pt] bg-gray-50">
                  <td colspan="6" class="border border-black px-2 py-1 text-left">
                    {{ asnaf.nama }}
                  </td>
                  <td class="border border-black px-2 py-1 text-right">
                    {{ formatRupiah(asnaf.total) }}
                  </td>
                  <td class="border border-black px-2 py-1 text-center">100%</td>
                  <td class="border border-black px-2 py-1"></td>
                </tr>

                <!-- Baris Program -->
                <tr
                  v-for="(p, i) in asnaf.program"
                  :key="i"
                  class="text-[7pt] text-black"
                  style="page-break-inside: avoid"
                >
                  <td class="border border-black px-2 py-1 text-left">{{ p.uraian }}</td>
                  <td class="border border-black px-1 py-1 text-center">{{ p.rencana.jumlah }}</td>
                  <td class="border border-black px-1 py-1 text-center">{{ p.rencana.satuan }}</td>
                  <td class="border border-black px-1 py-1 text-center">{{ p.rincian.vol }}</td>
                  <td class="border border-black px-1 py-1 text-center">{{ p.rincian.satuan }}</td>
                  <td class="border border-black px-1 py-1 text-right">
                    {{ formatRupiah(p.rincian.jumlah_satuan) }}
                  </td>
                  <td class="border border-black px-1 py-1 text-right">
                    {{
                      formatRupiah(
                        p.rincian.satuan == 'tahun'
                          ? p.rincian.jumlah_satuan * p.rencana.jumlah
                          : p.rincian.jumlah_satuan * p.rincian.vol,
                      )
                    }}
                  </td>
                  <td class="border border-black px-1 py-1 text-center">{{ p.persentase }}</td>
                  <td class="border border-black px-1 py-1 text-left">{{ p.ket }}</td>
                </tr>
              </template>

              <!-- Grand Total -->
              <tr class="font-bold text-black bg-gray-100">
                <td colspan="6" class="border border-black px-2 py-1 text-left">Total</td>
                <td class="border border-black px-2 py-1 text-right">{{ grandTotal }}</td>
                <td colspan="2" class="border border-black px-2 py-1"></td>
              </tr>
            </template>

            <tr v-else>
              <td colspan="9" class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p class="empty-state-title">Data tidak ditemukan</p>
                    <p class="empty-state-desc">Belum ada data tersedia atau coba gunakan kata kunci lain.</p>
                  </div>
                </td>
            </tr>
          </tbody>
        </template>
      </BaseTable>
      </div>

      <!-- Footer -->
      <div class="mt-auto">
        <FooterCetak />
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-area {
  max-width: 297mm;
  margin: 0 auto;
  padding: 5mm;
  background: white;
}

@media screen {
  body {
    background: #f3f4f6;
  }
  .print-area {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
    margin: 20px auto;
    min-height: 210mm;
  }
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0 !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body,
  html {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid black !important;
    word-wrap: break-word;
  }

  thead th {
    background: #f3f4f6 !important;
    font-weight: 700 !important;
  }

  tbody tr {
    page-break-inside: avoid !important;
  }
}
</style>
