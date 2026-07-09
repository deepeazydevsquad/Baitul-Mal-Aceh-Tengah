<script setup lang="ts">
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import { useNotification } from '@/composables/useNotification';
import { list_rekap_distribusi_per_kode_asnaf } from '@/service/rekap_distribusi_per_kode_asnaf';
import { computed, onMounted, ref, watch } from 'vue';

// ==================== STATE ====================
const isLoading = ref(false);
const isDownloading = ref(false);
const isTableLoading = ref(false);
const selectedYear = ref(new Date().getFullYear().toString());
const searchAsnaf = ref('');
const rowsNominal = ref<any[]>([]);

// ==================== CONSTANTS ====================
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 7 }, (_, i) => {
  const year = currentYear - 3 + i;
  return { id: year.toString(), name: year.toString() };
});

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

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// ==================== INTERFACES ====================
interface KegiatanData {
  kode: string;
  kegiatan_id: number | null;
  values: Record<string, number>;
  total: number;
}

interface RowData {
  asnaf: string;
  asnaf_id: number;
  kegiatan: KegiatanData[];
  values: Record<string, number>;
  total: number;
}

// ==================== COMPUTED ====================
const filteredRows = computed(() => {
  if (!searchAsnaf.value.trim()) {
    return rowsNominal.value;
  }

  const searchLower = searchAsnaf.value.toLowerCase().trim();
  return rowsNominal.value.filter((row) => row.asnaf.toLowerCase().includes(searchLower));
});

// ==================== HELPER FUNCTIONS ====================
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRupiahPlain(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateGrandTotalBulan(monthKey: string): number {
  return filteredRows.value.reduce((sum, row) => sum + (row.values[monthKey] || 0), 0);
}

function calculateGrandTotal(): number {
  return months.reduce((sum, m) => sum + calculateGrandTotalBulan(m.key), 0);
}

// ==================== FETCH DATA ====================
async function fetchData() {
  isTableLoading.value = true;
  rowsNominal.value = [];

  try {
    const res = await list_rekap_distribusi_per_kode_asnaf({ year: parseInt(selectedYear.value) });
    console.log('📊 Response backend:', res);

    if (!res.success) {
      displayNotification('Data laporan tidak ditemukan');
      return;
    }

    const raw = res.data || [];
    if (!raw.length) {
      displayNotification('Data laporan penyaluran tidak ditemukan');
      return;
    }

    const asnafMap: Record<number, any> = {};

    raw.forEach((monthData: any) => {
      const month = monthData.month;

      if (!monthData.data || !Array.isArray(monthData.data)) {
        return;
      }

      monthData.data.forEach((item: any) => {
        const asnafId = item.asnaf_id;

        if (!asnafMap[asnafId]) {
          asnafMap[asnafId] = {
            asnaf_id: asnafId,
            asnaf: item.asnaf || 'Tidak Diketahui',
            kegiatan: {},
            valuesNominal: {},
          };
        }

        const kegiatanId = item.kegiatan_id || 'null';
        if (!asnafMap[asnafId].kegiatan[kegiatanId]) {
          asnafMap[asnafId].kegiatan[kegiatanId] = {
            kegiatan_id: item.kegiatan_id,
            kode: item.kode || '-',
            valuesNominal: {},
          };
        }

        asnafMap[asnafId].kegiatan[kegiatanId].valuesNominal[month] = item.total_nominal || 0;

        if (!asnafMap[asnafId].valuesNominal[month]) {
          asnafMap[asnafId].valuesNominal[month] = 0;
        }
        asnafMap[asnafId].valuesNominal[month] += item.total_nominal || 0;
      });
    });

    rowsNominal.value = Object.values(asnafMap)
      .map((data: any) => {
        let totalAsnaf = 0;
        const valuesAsnaf: Record<string, number> = {};

        const kegiatanArray = Object.values(data.kegiatan).map((k: any) => {
          let totalKegiatan = 0;
          const valuesKegiatan: Record<string, number> = {};

          months.forEach((m) => {
            const val = k.valuesNominal[m.key] || 0;
            totalKegiatan += val;
            valuesKegiatan[m.key] = val;

            if (!valuesAsnaf[m.key]) {
              valuesAsnaf[m.key] = 0;
            }
            valuesAsnaf[m.key] += val;
          });

          totalAsnaf += totalKegiatan;

          return {
            kode: k.kode,
            kegiatan_id: k.kegiatan_id,
            values: valuesKegiatan,
            total: totalKegiatan,
          };
        });

        return {
          asnaf_id: data.asnaf_id,
          asnaf: data.asnaf,
          kegiatan: kegiatanArray,
          values: valuesAsnaf,
          total: totalAsnaf,
        };
      })
      .sort((a, b) => a.asnaf.localeCompare(b.asnaf, 'id'));

    console.log('✅ Data berhasil diproses. Total asnaf:', rowsNominal.value.length);
  } catch (e: any) {
    console.error('❌ Error fetching data:', e);
    displayNotification(e.response?.data?.message || 'Gagal memuat data', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

// ==================== LIFECYCLE ====================
onMounted(fetchData);
watch(selectedYear, fetchData);

// Ganti fungsi downloadPDF dengan ini
function cetak_laporan() {
  isDownloading.value = true;
  try {
    const printUrl = `/rekap-distribusi-per-kode-asnaf/${selectedYear.value}`;
    window.open(printUrl, '_blank');
  } catch (error) {
    console.error('Error saat mencetak laporan:', error);
    displayNotification('Gagal mencetak laporan: ' + error.message, 'error');
  } finally {
    isDownloading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Header Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BaseButton @click="cetak_laporan" variant="primary" :loading="isDownloading" type="button">
          <font-awesome-icon icon="fa-solid fa-print" class="mr-2"></font-awesome-icon>
          Cetak
        </BaseButton>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search -->
          <div class="flex items-center">
            <label
              for="search-asnaf"
              class="mr-2 text-sm font-medium text-gray-600 whitespace-nowrap"
            >
              Cari Asnaf
            </label>
            <input
              id="search-asnaf"
              type="text"
              v-model="searchAsnaf"
              placeholder="Nama asnaf..."
              class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
            />
          </div>

          <!-- Year Filter -->
          <div class="flex items-center">
            <label
              for="year-filter"
              class="mr-2 text-sm font-medium text-gray-600 whitespace-nowrap"
            >
              Tahun
            </label>
            <select
              id="year-filter"
              v-model="selectedYear"
              class="w-full sm:w-48 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
            >
              <option v-for="year in years" :key="year.id" :value="year.id">
                {{ year.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Info Message -->
      <div
        v-if="filteredRows.length === 0 && !isTableLoading"
        class="bg-yellow-50 border-l-4 border-yellow-400 p-4"
      >
        <p class="text-sm text-yellow-700">
          {{
            searchAsnaf
              ? `Asnaf "${searchAsnaf}" tidak ditemukan`
              : 'Rekap Penyaluran Per Kode Asnaf Tidak Ditemukan'
          }}
        </p>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="15" :rows="10" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <!-- Header -->
          <thead class="text-gray-700 text-center border-b border-gray-300">
            <tr class="bg-gray-50 top-0 z-20">
              <th
                rowspan="2"
                class="px-4 py-3 font-medium border border-gray-300 left-0 bg-gray-50 z-30 min-w-[180px]"
              >
                KODE / ASNAF
              </th>
              <th :colspan="months.length" class="px-4 py-3 font-medium border border-gray-300">
                BULAN
              </th>
              <th
                rowspan="2"
                class="px-4 py-3 font-medium bg-gray-100 min-w-[120px] border border-gray-300"
              >
                JUMLAH
              </th>
            </tr>
            <tr class="bg-gray-50 top-[48px] z-10">
              <th
                v-for="m in months"
                :key="m.key"
                class="px-4 py-3 font-medium border border-gray-300 min-w-[100px]"
              >
                {{ m.label }}
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody v-if="filteredRows && filteredRows.length > 0" class="divide-y divide-gray-100">
            <!-- Baris pertama untuk kegiatan pertama -->
            <tr
              class="even:bg-gray-50 hover:bg-indigo-50 transition-colors"
              v-for="(row, index) in filteredRows"
              :key="`asnaf_${row.asnaf_id}`"
            >
              <td class="px-6 py-4 text-left font-medium text-gray-700 left-0 bg-inherit">
                <b>#{{ row.kegiatan[0]?.kode || '-' }}</b>
                <br />
                {{ row.asnaf }}
              </td>
              <td
                v-for="m in months"
                :key="`${row.asnaf_id}_0_${m.key}`"
                class="px-4 py-3 text-right"
              >
                {{ formatRupiah(row.kegiatan[0]?.values[m.key] || 0) }}
              </td>
              <td
                :rowspan="row.kegiatan.length"
                class="px-4 py-3 text-right font-normal bg-gray-100"
              >
                {{ formatRupiah(row.total) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border border-gray-200 bg-gray-100">
              <td class="px-6 py-4 text-left font-bold text-gray-700 left-0 bg-gray-100">Total</td>
              <td
                v-for="m in months"
                :key="`total-${m.key}`"
                class="px-4 py-3 text-right font-medium"
              >
                {{ formatRupiah(calculateGrandTotalBulan(m.key)) }}
              </td>
              <td class="px-4 py-3 text-right font-medium">
                {{ formatRupiah(calculateGrandTotal()) }}
              </td>
            </tr>
          </tfoot>
        </table>
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
.sticky {
  position: sticky;
  z-index: 10;
}

table {
  border-spacing: 0;
}

.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
