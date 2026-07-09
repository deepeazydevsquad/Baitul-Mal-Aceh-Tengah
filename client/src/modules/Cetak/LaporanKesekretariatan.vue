<script setup lang="ts">
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Logos from '@/components/Logo/Logo.vue';
import FooterCetak from '@/modules/FooterCetak/FooterCetak.vue';
import { get_laporan_kesekretariatan } from '@/service/laporan_kesekretariatan';
import { nextTick, onMounted, ref, computed } from 'vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
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
const isLoading = ref<boolean>(true);
const grandTotal = ref<number>(0);

async function fetchData() {
  isLoading.value = true;
  try {
    const response = await get_laporan_kesekretariatan(tahun);

    // Flatten data dari response
    const flattenedData = response.data.data.flatMap((group: any) => group.data);
    laporanData.value = flattenedData;

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

const tableColumns = ref<TableColumn[]>([
  { key: 'tanggal', label: 'Tanggal', headerClass: 'border border-black w-[10%] px-2 py-1 text-center', cellClass: 'border border-black px-2 py-1 text-center whitespace-nowrap' },
  { key: 'uraian', label: 'Uraian', headerClass: 'border border-black w-[25%] px-2 py-1 text-center', cellClass: 'border border-black px-2 py-1 text-left' },
  { key: 'nik', label: 'NIK', headerClass: 'border border-black w-[12%] px-2 py-1 text-center', cellClass: 'border border-black px-2 py-1 text-center' },
  { key: 'alamat', label: 'Alamat', headerClass: 'border border-black w-[20%] px-2 py-1 text-center', cellClass: 'border border-black px-2 py-1 text-left' },
  { key: 'kec', label: 'Kec', headerClass: 'border border-black w-[8%] px-2 py-1 text-center', cellClass: 'border border-black px-2 py-1 text-center' },
  { key: 'kode_akun', label: 'Kode Akun', headerClass: 'border border-black w-[10%] px-2 py-1 text-center', cellClass: 'border border-black px-2 py-1 text-center' },
  { key: 'kredit', label: 'Kredit', headerClass: 'border border-black w-[15%] px-2 py-1 text-center', cellClass: 'border border-black px-2 py-1 text-right whitespace-nowrap' },
]);

const formattedData = computed(() => {
  return laporanData.value.map(row => ({
    tanggal: row[1],
    uraian: row[2],
    nik: row[3],
    alamat: row[4],
    kec: row[5],
    kode_akun: row[6],
    kredit: row[7],
  }));
});

onMounted(async () => {
  try {
    await fetchData();
    await nextTick();

    const oldTitle = document.title;
    document.title = `Laporan Kesekretariatan ${tahun === '0' ? 'Semua Tahun' : 'Per Tahun ' + tahun}`;

    const styleId = 'print-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @page { size: A4 landscape; margin: 5mm
 12mm; }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      window.print();
      document.title = oldTitle;
      setTimeout(() => {
        window.close();
      }, 400);
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
    <div
      class="print-area font-sans flex flex-col"
      style="color: black; font-size: 9pt; line-height: 1.3; background: white"
    >
      <!-- Header -->
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">Laporan Kesekretariatan</h1>
          <p class="text-sm text-gray-700">Tahun: {{ tahun === '0' ? 'Semua Tahun' : tahun }}</p>
        </div>
        <div class="flex-shrink-0">
          <Logos />
        </div>
      </div>

      <!-- Tabel -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
          empty-title="Data tidak ditemukan"
          empty-desc="Belum ada data tersedia."
        class="w-full text-[8pt] mb-4 print-table"
        style="table-layout: fixed"
        :columns="tableColumns"
        :data="formattedData"
        :with-pagination="false"
        :show-search="false"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        :show-numbering="false"
        :show-actions="false"
      >
        <template #tfoot>
          <tr v-if="laporanData.length > 0" class="font-bold text-black bg-gray-100">
            <td colspan="6" class="border border-black px-2 py-1 text-right">Total</td>
            <td class="border border-black px-2 py-1 text-right">
              {{ $formatToRupiah(grandTotal) }}
            </td>
          </tr>
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
