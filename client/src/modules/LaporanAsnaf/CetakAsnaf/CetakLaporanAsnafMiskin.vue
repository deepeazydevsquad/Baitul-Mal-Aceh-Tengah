<script setup lang="ts">
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logos from '@/components/Logo/Logo.vue';
import FooterCetak from '@/modules/FooterCetak/FooterCetak.vue';
import { get_laporan_asnaf } from '@/service/laporan_asnaf';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';



const route = useRoute();
const tahun = route.params.tahun as string;
const asnafId = 2; // ID untuk Asnaf Gharim

// Fungsi untuk parse format rupiah string ke number
const parseRupiah = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/Rp\s?|\./g, '').trim();
  return parseFloat(cleaned) || 0;
};

const laporanData = ref<any[]>([]);
const isLoading = ref<boolean>(true);

const ttdData = ref<any>(null);
const grandTotal = ref<number>(0);

async function fetchData() {
  isLoading.value = true;
  try {
    const response = await get_laporan_asnaf(tahun, asnafId);

    // Flatten data dari response
    const flattenedData = response.data.data.list.flatMap((group: any) => group.data);
    laporanData.value = flattenedData;
    ttdData.value = response.data.data.tanda_tangan;

    // Hitung grand total
    grandTotal.value = flattenedData.reduce((sum: number, row: any) => {
      return sum + parseRupiah(row[7]);
    }, 0);
  } catch (error) {
    console.error('Error fetching data:', error);
    laporanData.value = [];
    grandTotal.value = 0;
  } finally {
    isLoading.value = false;
  }
}

const handlePrint = () => {
  const oldTitle = document.title;
  document.title = `Laporan Penyaluran Asnaf Miskin ${tahun === '0' ? 'Semua Tahun' : 'Per Tahun ' + tahun}`;

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
    console.error('Error saat mounting:', error);
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
      style="color: black; font-size: 8pt; line-height: 1.3; background: white"
    >
      <!-- Header -->
      <div class="flex justify-between items-start mb-3">
        <div>
          <h1 class="text-lg font-bold mb-1">Laporan Penyaluran Asnaf Miskin</h1>
          <p class="text-sm">Tahun: {{ tahun === '0' ? 'Semua Tahun' : tahun }}</p>
        </div>
        <div class="flex-shrink-0 scale-90 origin-top-right">
          <Logos />
        </div>
      </div>

      <!-- Tabel -->
            <!-- Tabel -->
      <table class="w-full text-[7pt] mt-5 border-collapse print-table" style="table-layout: fixed">
        <thead class="border border-black text-center">
            <tr>
              <th class="border border-black w-[10%] px-2 py-1">Tanggal</th>
              <th class="border border-black w-[25%] px-2 py-1">Uraian</th>
              <th class="border border-black w-[12%] px-2 py-1">NIK</th>
              <th class="border border-black w-[20%] px-2 py-1">Alamat</th>
              <th class="border border-black w-[8%] px-2 py-1">Kec</th>
              <th class="border border-black w-[10%] px-2 py-1">Kode Akun</th>
              <th class="border border-black w-[15%] px-2 py-1">Kredit</th>
            </tr>
          </thead>
        <tbody>
            <template v-if="laporanData.length > 0">
              <tr
                v-for="(row, index) in laporanData"
                :key="index"
                class="text-[6.5pt] text-black"
                style="page-break-inside: avoid"
              >
                <td class="border border-black px-2 py-1 text-center whitespace-nowrap">
                  {{ row[1] }}
                </td>
                <td class="border border-black px-2 py-1 text-left">{{ row[2] }}</td>
                <td class="border border-black px-2 py-1 text-center">{{ row[3] }}</td>
                <td class="border border-black px-2 py-1 text-left">{{ row[4] }}</td>
                <td class="border border-black px-2 py-1 text-center">{{ row[5] }}</td>
                <td class="border border-black px-2 py-1 text-center">{{ row[6] }}</td>
                <td class="border border-black px-2 py-1 text-right whitespace-nowrap">
                  {{ row[7] }}
                </td>
              </tr>

              <!-- Grand Total -->
              <tr class="font-bold text-black bg-gray-100">
                <td colspan="6" class="border border-black px-2 py-1 text-right">
                  Total
                </td>
                <td class="border border-black px-2 py-1 text-right">
                  {{ $formatToRupiah(grandTotal) }}
                </td>
              </tr>
            </template>

            <tr v-else>
              <td colspan="7" class="border border-black px-2 py-3 text-center text-gray-700">
                Laporan Penyaluran Asnaf Miskin Tidak Ditemukan
              </td>
            </tr>
          </tbody>
      </table>

      <!-- Tanda Tangan Section -->
      <div v-if="ttdData" class="mt-10 print:mt-8" style="page-break-inside: avoid">
        <div class="flex justify-between mb-5 print:mb-4">
          <div class="text-center min-w-[180px]">
            <p class="font-semibold text-[9pt] mb-2 print:mb-1">{{ ttdData.nama_jabatan1 }}</p>
            <div class="h-[60px] print:h-[50px]"></div>
            <p class="font-bold text-[9pt] underline">{{ ttdData.nama_pejabat1 }}</p>
          </div>

          <div class="text-center min-w-[180px]">
            <p class="font-semibold text-[9pt] mb-2 print:mb-1">{{ ttdData.nama_jabatan2 }}</p>
            <div class="h-[60px] print:h-[50px]"></div>
            <p class="font-bold text-[9pt] underline">{{ ttdData.nama_pejabat2 }}</p>
          </div>
        </div>

        <div class="flex justify-center">
          <div class="text-center min-w-[180px]">
            <p class="font-semibold text-[9pt] mb-2 print:mb-1">{{ ttdData.nama_jabatan3 }}</p>
            <div class="h-[60px] print:h-[50px]"></div>
            <p class="font-bold text-[9pt] underline">{{ ttdData.nama_pejabat3 }}</p>
          </div>
        </div>
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
    background: #f3f4f6;
  }
  .print-area {
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
    margin-top: 20px;
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

  .bg-gray-100 {
    background: #f3f4f6 !important;
  }
}
</style>
