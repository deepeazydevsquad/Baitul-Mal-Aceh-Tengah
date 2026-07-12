<script setup lang="ts">
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logos from '@/components/Logo/Logo.vue';
import FooterCetak from '@/modules/FooterCetak/FooterCetak.vue';
import { list } from '@/service/rekap_pengumpulan';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const tahun = route.params.tahun as string;

const months = [
  { key: '01', label: 'JAN' },
  { key: '02', label: 'FEB' },
  { key: '03', label: 'MAR' },
  { key: '04', label: 'APR' },
  { key: '05', label: 'MEI' },
  { key: '06', label: 'JUN' },
  { key: '07', label: 'JUL' },
  { key: '08', label: 'AGS' },
  { key: '09', label: 'SEP' },
  { key: '10', label: 'OKT' },
  { key: '11', label: 'NOV' },
  { key: '12', label: 'DES' },
];

interface RowData {
  label: string;
  values: Record<string, number>;
  total: number;
}

const rows = ref<RowData[]>([]);
const isLoading = ref(true);

async function fetchData() {
  isLoading.value = true;
  try {
    const yearParam = tahun === '0' ? 0 : parseInt(tahun);
    const res = await list({ year: yearParam || new Date().getFullYear() });
    const data = res.data || [];

    const tipe = [
      { key: 'zakat_harta', label: 'Zakat Harta' },
      { key: 'zakat_simpanan', label: 'Zakat Simpanan' },
      { key: 'zakat_profesi', label: 'Zakat Profesi' },
      { key: 'zakat_perdagangan', label: 'Zakat Perdagangan' },
      { key: 'zakat_pertanian', label: 'Zakat Pertanian' },
      { key: 'infaq', label: 'Infaq' },
      { key: 'sum_riwayat_donasi', label: 'Donasi' },
      { key: 'total_nominal_realisasi', label: 'Total' },
    ];

    rows.value = tipe.map((t) => {
      const values: Record<string, number> = {};
      let total = 0;

      months.forEach((m) => {
        let val = 0;
        const bulan = data.find((d) => d.month === m.key);
        if (bulan) {
          if (t.key === 'total_realisasi') val = bulan.total_realisasi || 0;
          else if (t.key === 'total_nominal_realisasi') val = bulan.total_nominal_realisasi || 0;
          else if (t.key === 'sum_riwayat_donasi') val = bulan.sum_riwayat_donasi || 0;
          else val = bulan.sum_riwayat_pengumpulan?.[t.key] || 0;
        }
        values[m.key] = val;
        total += val;
      });
      return { label: t.label, values, total };
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    rows.value = [];
  } finally {
    isLoading.value = false;
  }
}

const handlePrint = () => {
  const oldTitle = document.title;
  document.title = `Rekap Pengumpulan ${tahun === '0' ? 'Semua Tahun' : 'Tahun ' + tahun}`;

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
          <h1 class="text-lg font-bold mb-1">Rekap Pengumpulan</h1>
          <p class="text-sm">Tahun: {{ tahun === '0' ? 'Semua Tahun' : tahun }}</p>
        </div>
        <div class="flex-shrink-0 scale-90 origin-top-right">
          <Logos />
        </div>
      </div>

      <!-- Tabel -->
      <table class="w-full border-collapse text-[6.5pt] mt-5 print-table" style="table-layout: auto">
          <thead class="border border-black text-center">
            <tr>
              <th rowspan="2" class="border border-black px-2 py-1 w-[15%]">JENIS PENGUMPULAN</th>
              <th colspan="12" class="border border-black px-2 py-1">BULAN</th>
              <th rowspan="2" class="border border-black px-2 py-1 w-[10%]">JUMLAH</th>
            </tr>
            <tr>
              <th v-for="m in months" :key="m.key" class="border border-black px-1 py-1">
                {{ m.label }}
              </th>
            </tr>
          </thead>
        
          <tbody>
            <template v-if="rows.length > 0">
              <tr
                v-for="(row, index) in rows"
                :key="index"
                class="text-[6pt] text-black"
                :class="row.label === 'Total' ? 'font-bold bg-gray-200' : ''"
                style="page-break-inside: avoid"
              >
                <td
                  class="border border-black px-2 py-1 text-left"
                  :class="row.label === 'Total' ? 'font-bold' : ''"
                >
                  {{ row.label }}
                </td>
                <td
                  v-for="m in months"
                  :key="`${index}_${m.key}`"
                  class="border border-black px-1 py-1 text-right"
                >
                  {{ $formatToRupiah(row.values[m.key] || 0) }}
                </td>
                <td
                  class="border border-black px-1 py-1 text-right bg-gray-100"
                  :class="row.label === 'Total' ? 'font-bold bg-gray-200' : ''"
                >
                  {{ $formatToRupiah(row.total) }}
                </td>
              </tr>
            </template>

            <tr v-else>
              <td colspan="14" class="border border-black px-2 py-3 text-center text-gray-700">
                Rekap Pengumpulan Tidak Ditemukan
              </td>
            </tr>
          </tbody>
        </table>
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
