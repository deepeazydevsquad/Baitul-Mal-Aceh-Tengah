<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import { useNotification } from '@/composables/useNotification';
import { list_rekap_distribusi_per_asnaf } from '@/service/rekap_distribusi_per_asnaf';
import BaseButton from '@/components/Button/BaseButton.vue';
import { useRouter } from 'vue-router';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

const router = useRouter();
const isLoading = ref(false);
const selectedYear = ref('0');
const tableColumns = ref<TableColumn[]>([]);

const currentYear = new Date().getFullYear();
const years = ref<string[]>([]);

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

const bulanNames = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGS',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

function generateYears() {
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const yearList = ['0']; // 0 untuk "Pilih Semua Tahun"

  for (let year = currentYear; year >= startYear; year--) {
    yearList.push(year.toString());
  }

  years.value = yearList;
  selectedYear.value = currentYear.toString();
}

const rowsNominal = ref<any[]>([]);
const rowsPenerima = ref<any[]>([]);

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

async function fetchData() {
  isLoading.value = true;
  rowsNominal.value = [];
  rowsPenerima.value = [];

  try {
    const yearParam = selectedYear.value === '0' ? 0 : parseInt(selectedYear.value);
    const res = await list_rekap_distribusi_per_asnaf({ year: yearParam || currentYear });

    if (res.error) {
      displayNotification(res.error_msg || 'Data laporan tidak ditemukan', 'error');
      return;
    }

    const raw = res.data || [];
    if (!raw.length) {
      displayNotification('Data laporan penyaluran tidak ditemukan', 'error');
      return;
    }

    const asnafMap: Record<string, { asnaf: string; valuesNominal: any; valuesPenerima: any }> = {};

    if (raw[0]?.data) {
      raw.forEach((bulan: any) => {
        bulan.data.forEach((item: any) => {
          if (!asnafMap[item.asnaf_id]) {
            asnafMap[item.asnaf_id] = {
              asnaf: item.asnaf,
              valuesNominal: {},
              valuesPenerima: {},
            };
          }
          asnafMap[item.asnaf_id].valuesNominal[bulan.month] = item.total_nominal || 0;
          asnafMap[item.asnaf_id].valuesPenerima[bulan.month] = item.total_penerima || 0;
        });
      });
    } else {
      raw.forEach((item: any) => {
        if (!asnafMap[item.asnaf_id]) {
          asnafMap[item.asnaf_id] = {
            asnaf: item.asnaf,
            valuesNominal: {},
            valuesPenerima: {},
          };
        }
        asnafMap[item.asnaf_id].valuesNominal[item.month] = item.total_nominal || 0;
        asnafMap[item.asnaf_id].valuesPenerima[item.month] = item.total_penerima || 0;
      });
    }

    rowsNominal.value = Object.values(asnafMap).map((a: any) => {
      let total = 0;
      months.forEach((m) => {
        const val = a.valuesNominal[m.key] || 0;
        total += val;
        a.valuesNominal[m.key] = val;
      });
      return { label: a.asnaf, values: a.valuesNominal, total };
    });

    rowsPenerima.value = Object.values(asnafMap).map((a: any) => {
      let total = 0;
      months.forEach((m) => {
        const val = a.valuesPenerima[m.key] || 0;
        total += val;
        a.valuesPenerima[m.key] = val;
      });
      return { label: a.asnaf, values: a.valuesPenerima, total };
    });
  } catch (e: any) {
    console.error("DEBUG ERROR fetchData:", e);
    if (e.response) {
      console.error("DEBUG ERROR RESPONSE:", e.response.data);
    }
    displayNotification(e.response?.data?.message || e.message || 'Gagal memuat data', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Rupiah formatter
function formatRupiah(value: any) {
  const safeValue = Number(value) || 0;
  return 'Rp ' + safeValue.toLocaleString('id-ID');
}

// Fungsi untuk membuka halaman print
const cetak_laporan = (tahun: string) => {
  const printUrl = `/rekap-distribusi-per-asnaf/${tahun}`;
  window.open(printUrl, '_blank');
};

onMounted(async () => {
  generateYears();
  await fetchData();
});

watch(selectedYear, fetchData);
</script>

<template>
  <div class="p-4 space-y-8">
    <!-- Tabel Nominal Distribusi -->
    <div class="mt-0">
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isLoading" :columns="months.length + 2" :rows="5" />
        <BaseTable
          v-else-if="rowsNominal.length > 0"
          class="min-w-full table-auto border-collapse bg-white shadow-md rounded-xl overflow-hidden text-sm"
          :columns="tableColumns"
          :data="rowsNominal"
          :with-pagination="false"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #filters>
            <div class="flex items-center gap-3">
              <div class="flex items-center">
                <label for="year-filter" class="mr-2 text-sm font-medium text-gray-600 whitespace-nowrap">
                  Tahun
                </label>
                <select
                  id="year-filter"
                  v-model="selectedYear"
                  class="w-full sm:w-48 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
                >
                  <option value="0">Semua Tahun</option>
                  <option v-for="year in years.slice(1)" :key="year" :value="year">
                    {{ year }}
                  </option>
                </select>
              </div>
            </div>
          </template>
          <template #custom-actions>
            <BaseButton
              @click="cetak_laporan(selectedYear)"
              variant="primary"
              type="button"
              :disabled="isLoading"
            >
              <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
              Cetak
            </BaseButton>
          </template>
          <template #thead>
            <thead class="text-gray-700 text-center border-b border-gray-300">
              <tr>
                <th
                  colspan="14"
                  class="px-4 py-3 font-medium border border-gray-300 sticky left-0 bg-gray-200 z-30 text-left"
                >
                  <h2 class="text-lg font-bold">DISTRIBUSI (NOMINAL RUPIAH)</h2>
                </th>
              </tr>
              <tr class="bg-gray-50 sticky top-0 z-20">
                <th
                  rowspan="2"
                  class="px-4 py-3 font-medium border-r border-gray-300 sticky left-0 bg-gray-50 z-30 min-w-[180px]"
                >
                  ASNAF
                </th>
                <th :colspan="bulanNames.length" class="px-4 py-3 font-medium border border-gray-300">
                  BULAN
                </th>
                <th
                  rowspan="2"
                  class="px-4 py-3 font-medium bg-gray-100 min-w-[120px] border border-gray-300"
                >
                  JUMLAH
                </th>
              </tr>

              <tr class="bg-gray-50 sticky top-[40px] z-10">
                <th
                  v-for="bulan in bulanNames"
                  :key="bulan"
                  class="px-4 py-3 font-medium border-r border-gray-300 min-w-[120px]"
                >
                  {{ bulan }}
                </th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(r, i) in rowsNominal"
                :key="r.label"
                class="even:bg-gray-50 hover:bg-indigo-50 transition-colors"
              >
                <td class="px-6 py-4 text-left font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {{ r.label }}
                </td>
                <td
                  v-for="m in months"
                  :key="m.key"
                  class="px-4 py-3 text-right tabular-nums whitespace-nowrap"
                >
                  {{ formatRupiah(r.values[m.key]) }}
                </td>
                <td
                  class="px-4 py-3 text-right font-medium bg-gray-100 whitespace-nowrap italic text-gray-700"
                >
                  {{ formatRupiah(r.total) }}
                </td>
              </tr>
            </tbody>
          </template>
          <template #tfoot>
              <tr>
                <td class="px-6 py-4 text-left font-medium text-gray-700 sticky left-0 bg-gray-100 z-10">
                  Total
                </td>
                <td
                  v-for="m in months"
                  :key="m.key"
                  class="px-4 py-3 text-right font-medium bg-gray-100 whitespace-nowrap italic text-gray-700"
                >
                  {{
                    formatRupiah(
                      rowsNominal.reduce((acc, curr) => acc + (curr.values[m.key] || 0), 0),
                    )
                  }}
                </td>

                <td
                  class="px-4 py-3 text-right font-medium bg-gray-100 whitespace-nowrap italic text-gray-700"
                >
                  {{ formatRupiah(rowsNominal.reduce((acc, curr) => acc + (curr.total || 0), 0)) }}
                </td>
              </tr>
          </template>
        </BaseTable>
        <div v-else class="bg-white shadow-md rounded-xl p-12 text-center">
          <p class="text-gray-500 text-lg">Data laporan penyaluran tidak ditemukan</p>
        </div>
      </div>
    </div>

    <!-- Tabel Jumlah Penerima -->
    <div class="mt-10">
      <!-- <h2 class="text-lg font-medium mb-3">Distribusi (Jumlah Penerima)</h2> -->
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isLoading" :columns="months.length + 2" :rows="5" />
        <BaseTable
          v-else-if="rowsPenerima.length > 0"
          class="min-w-full table-auto border-collapse bg-white shadow-md rounded-xl overflow-hidden text-sm"
          :columns="tableColumns"
          :data="rowsPenerima"
          :with-pagination="false"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #thead>
            <thead class="text-gray-700 text-center border-b border-gray-300">
              <tr>
                <th
                  colspan="14"
                  class="px-4 py-3 font-medium border border-gray-300 sticky left-0 bg-gray-200 z-30 text-left"
                >
                  <h2 class="text-lg font-bold">DISTRIBUSI (JUMLAH PENERIMA)</h2>
                </th>
              </tr>
              <tr class="bg-gray-50 sticky top-0 z-20">
                <th
                  rowspan="2"
                  class="w-[20%] px-4 py-3 font-medium border-r border-gray-300 sticky left-0 bg-gray-50 z-30 min-w-[180px]"
                >
                  ASNAF
                </th>
                <th :colspan="bulanNames.length" class="px-4 py-3 font-medium border border-gray-300">
                  BULAN
                </th>
                <th rowspan="2" class="px-4 py-3 font-medium bg-gray-100 min-w-[120px]">JUMLAH</th>
              </tr>

              <tr class="bg-gray-50 sticky top-[40px] z-10">
                <th
                  v-for="bulan in bulanNames"
                  :key="bulan"
                  class="px-4 py-3 font-medium min-w-[100px]"
                >
                  {{ bulan }}
                </th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(r, i) in rowsPenerima"
                :key="r.label"
                class="even:bg-gray-50 hover:bg-indigo-50 transition-colors"
              >
                <td class="px-6 py-4 text-left font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {{ r.label }}
                </td>
                <td
                  v-for="m in months"
                  :key="m.key"
                  class="px-4 py-3 text-center tabular-nums min-w-[120px]"
                >
                  {{ r.values[m.key] || '-' }}
                </td>
                <td class="px-4 py-3 text-center font-medium bg-gray-100 min-w-[120px]">
                  {{ r.total }}
                </td>
              </tr>
            </tbody>
          </template>
          <template #tfoot>
              <tr>
                <td class="px-6 py-4 text-left font-medium text-gray-700 sticky left-0 bg-gray-100 z-10">
                  Total
                </td>
                <td
                  v-for="m in months"
                  :key="m.key"
                  class="px-4 py-3 text-center font-medium bg-gray-100 italic text-gray-700"
                >
                  {{ rowsPenerima.reduce((acc, curr) => acc + (curr.values[m.key] || 0), 0) }}
                </td>

                <td
                  class="px-4 py-3 text-center font-medium bg-gray-100 whitespace-nowrap italic text-gray-700"
                >
                  {{ rowsPenerima.reduce((acc, curr) => acc + (curr.total || 0), 0) }}
                </td>
              </tr>
          </template>
        </BaseTable>
        <div v-else class="bg-white shadow-md rounded-xl p-12 text-center">
          <p class="text-gray-500 text-lg">Data laporan penyaluran tidak ditemukan</p>
        </div>
      </div>
    </div>

    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
