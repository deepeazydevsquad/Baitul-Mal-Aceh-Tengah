<script setup lang="ts">
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logos from '@/components/Logo/Logo.vue';
import FooterCetak from '@/modules/FooterCetak/FooterCetak.vue';
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;
// import { get_laporan_kesekretariatan } from '@/service/laporan_kesekretariatan';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const tahun = route.params.tahun as string;

// Fungsi untuk parse format rupiah string ke number
const parseRupiah = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/Rp\s?|\./g, '').trim();
  return parseFloat(cleaned) || 0;
};

const laporanData = ref<any[]>([]);
const isLoading = ref<boolean>(false);
const grandTotal = ref<number>(0);

async function fetchData() {
  // isLoading.value = true;
  // try {
  //   const response = await get_laporan_kesekretariatan(tahun);
  //   // Flatten data dari response
  //   const flattenedData = response.data.data.flatMap((group: any) => group.data);
  //   laporanData.value = flattenedData;
  //   // Hitung grand total
  //   grandTotal.value = flattenedData.reduce((sum: number, row: any) => {
  //     return sum + parseRupiah(row[7]);
  //   }, 0);
  // } catch (error) {
  //   console.error('Error fetching data:', error);
  //   laporanData.value = [];
  //   grandTotal.value = 0;
  // } finally {
  //   isLoading.value = false;
  // }
}

onMounted(async () => {
  try {
    //     await fetchData();
    await nextTick();
    const oldTitle = document.title;
    document.title = `Laporan Kesekretariatan ${tahun === '0' ? 'Semua Tahun' : 'Per Tahun ' + tahun}`;
    const styleId = 'print-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
            @page { size: A4 potrait; margin: 5mm
     12mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          `;
      document.head.appendChild(style);
    }
    setTimeout(() => {
      window.print();
      document.title = oldTitle;
      // setTimeout(() => {
      //   window.close();
      // }, 400);
    }, 1000);
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
    <div class="print-area font-sans" style="color: black; font-size: 9pt; line-height: 1.3">
      <!-- ===== BAGIAN ATAS ===== -->
      <div class="flex flex-col min-h-[130mm]">
        <!-- Header -->
        <div class="grid grid-cols-[90px_1fr_auto] items-start mb-3">
          <div>
            <img
              :src="`${BASE_URL}/uploads/img/logos/site_logo.png`"
              class="h-[15mm] max-w-[60mm] object-contain"
            />
          </div>
          <div></div>
          <div class="text-right leading-tight">
            <div class="font-bold text-[11pt] uppercase">SEKRETARIAT</div>
            <div class="font-bold text-[10pt] uppercase">BAITUL MAL KABUPATEN BENER MERIAH</div>
            <div class="text-[9pt]">
              Jl. Lebe Kader No.2, Asir Asir Asia, Kec. Lut Tawar,<br />
              Kabupaten Bener Meriah, Provinsi Aceh 24519
            </div>
          </div>
        </div>

        <!-- Isi / Tabel -->
        <div class="flex-1">
          <!-- isi laporan / tabel -->
        </div>

        <!-- Footer -->
        <div class="mt-auto pt-2 border-t border-gray-300">
          <div class="grid grid-cols-3 items-center text-[8pt] text-gray-600">
            <!-- Kiri -->
            <div class="flex items-center gap-2">
              <img src="/images/ziwah.png" alt="Logo ZIWAH" class="h-8 object-contain" />
            </div>

            <!-- Tengah -->
            <div class="text-center">Dicetak pada: 12 Januari 2026</div>

            <!-- Kanan -->
            <div class="text-right">
              <!-- Page number (optional) -->
              <!-- Halaman 1 -->
            </div>
          </div>
        </div>
      </div>

      <!-- ===== GARIS POTONG ===== -->
      <div class="relative my-4">
        <div class="border-t border-dashed border-black"></div>
        <div class="absolute left-1/2 -top-3 -translate-x-1/2 bg-white px-2 text-[10pt]">✂</div>
      </div>

      <!-- ===== BAGIAN BAWAH ===== -->
      <div class="flex flex-col min-h-[140mm]">
        <!-- Header -->
        <div class="grid grid-cols-[90px_1fr_auto] items-start mb-3">
          <div>
            <img
              :src="`${BASE_URL}/uploads/img/logos/site_logo.png`"
              class="h-[15mm] max-w-[60mm] object-contain"
            />
          </div>
          <div></div>
          <div class="text-right leading-tight">
            <div class="font-bold text-[11pt] uppercase">SEKRETARIAT</div>
            <div class="font-bold text-[10pt] uppercase">BAITUL MAL KABUPATEN BENER MERIAH</div>
            <div class="text-[9pt]">
              Jl. Lebe Kader No.2, Asir Asir Asia, Kec. Lut Tawar,<br />
              Kabupaten Bener Meriah, Provinsi Aceh 24519
            </div>
          </div>
        </div>

        <!-- Isi / Tabel -->
        <div class="flex-1">
          <!-- isi laporan / tabel (duplikat) -->
        </div>

        <!-- Footer -->
        <div class="mt-auto pt-2 border-t border-gray-300">
          <div class="grid grid-cols-3 items-center text-[8pt] text-gray-600">
            <!-- Kiri -->
            <div class="flex items-center gap-2">
              <img src="/images/ziwah.png" alt="Logo ZIWAH" class="h-8 object-contain" />
            </div>

            <!-- Tengah -->
            <div class="text-center">Dicetak pada: 12 Januari 2026</div>

            <!-- Kanan -->
            <div class="text-right">
              <!-- Page number (optional) -->
              <!-- Halaman 1 -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* .print-area {
  max-width: 297mm;
  min-height: 210mm;
  margin: 0 auto;
  padding: 5mm;
  background: white;
} */
.print-area {
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 10mm;
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
    size: A4 potrait;
    /* margin: 0 !important; */
    margin: 10mm;
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
