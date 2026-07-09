<script setup lang="ts">
// Library
import { ref, onMounted, watch, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from '@/modules/TargetPengumpulan/widgets/FormAdd.vue';
import FormEdit from '@/modules/TargetPengumpulan/widgets/FormEdit.vue';
import InputText from '@/components/Form/InputText.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { list, delete_target } from '@/service/target_pengumpulan';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(6);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// State Data
interface Data {
  id: number;
  tahun: number;
  bulan: number;
  bulan_name: string;
  infaq: number;
  zakat: number;
  donasi: number;
}

const datas = ref<Data[]>([]);

// State: Filter
const filterTahun = ref<string>('');
const filterBulan = ref<string>('');

const bulanOptions = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const selectedTarget = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(tahun: any, bulan: any) {
  selectedTarget.value = { tahun, bulan };
  isModalEditOpen.value = true;
}

let debounceTimer: number;
watch([filterTahun, filterBulan], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchData();
  }, 500);
});

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list({
      tahun: filterTahun.value,
      bulan: filterBulan.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    datas.value = response.data;
    const uniqueKeys = new Set(datas.value.map((d) => `${d.tahun}-${d.bulan}`));
    totalRow.value = uniqueKeys.size;
  } catch (error) {
    displayNotification('Gagal mengambil data target pengumpulan', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

// Mengelompokkan data berdasarkan tahun
const groupedByYear = computed(() => {
  return datas.value.reduce((acc: Record<string, Data[]>, item) => {
    const year = item.tahun.toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(item);
    return acc;
  }, {});
});

async function deleteData(tahun: number, bulan: number) {
  const bulanName =
    datas.value.find((d) => d.tahun === tahun && d.bulan === bulan)?.bulan_name || bulan;
  displayConfirmation(
    'Hapus Data Target',
    `Apakah Anda yakin ingin menghapus data target ${bulanName} ${tahun}?`,
    async () => {
      try {
        isLoading.value = true;
        await delete_target({ tahun, bulan });
        displayNotification('Data target berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data target', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BaseButton
          @click="openModalAdd()"
          variant="primary"
          :loading="isModalAddOpen || isModalEditOpen"
          type="button"
        >
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Target
        </BaseButton>

        <!-- Filter Section -->
        <div class="flex items-center gap-2">
          <InputText
            v-model="filterTahun"
            type="text"
            placeholder="Cari Tahun..."
            class="w-36"
            :label_status="false"
          />
          <select
            id="filterBulan"
            v-model="filterBulan"
            class="w-40 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          >
            <option value="">Semua Bulan</option>
            <option v-for="b in bulanOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr>
              <th class="w-[10%] px-6 py-3 font-medium">Tahun</th>
              <th class="w-[15%] px-6 py-3 font-medium">Bulan</th>
              <th class="w-[21%] px-6 py-3 font-medium">Infaq</th>
              <th class="w-[21%] px-6 py-3 font-medium">Zakat</th>
              <th class="w-[21%] px-6 py-3 font-medium">Donasi</th>
              <th class="w-[12%] px-6 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-if="datas && datas.length > 0">
              <template v-for="(yearData, year, yearIndex) in groupedByYear" :key="year">
                <tr
                  v-for="(item, itemIndex) in yearData"
                  :key="item.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <!-- Kolom Tahun -->
                  <td
                    v-if="itemIndex === 0"
                    :rowspan="yearData.length"
                    class="px-6 py-4 text-center font-medium text-gray-800 align-top"
                    :class="{ 'border-t-2 border-gray-200': yearIndex !== 0 }"
                  >
                    {{ year }}
                  </td>

                  <!-- Kolom Data -->
                  <td
                    class="px-6 py-4 text-center font-medium text-gray-800"
                    :class="{ 'border-t-2 border-gray-200': itemIndex === 0 && yearIndex !== 0 }"
                  >
                    {{ item.bulan_name }}
                  </td>
                  <td
                    class="px-6 py-4 text-center font-medium text-gray-800"
                    :class="{ 'border-t-2 border-gray-200': itemIndex === 0 && yearIndex !== 0 }"
                  >
                    Rp {{ item.infaq.toLocaleString('id-ID') }}
                  </td>
                  <td
                    class="px-6 py-4 text-center font-medium text-gray-800"
                    :class="{ 'border-t-2 border-gray-200': itemIndex === 0 && yearIndex !== 0 }"
                  >
                    Rp {{ item.zakat.toLocaleString('id-ID') }}
                  </td>
                  <td
                    class="px-6 py-4 text-center font-medium text-gray-800"
                    :class="{ 'border-t-2 border-gray-200': itemIndex === 0 && yearIndex !== 0 }"
                  >
                    Rp {{ item.donasi.toLocaleString('id-ID') }}
                  </td>

                  <!-- Kolom Aksi -->
                  <td
                    class="px-6 py-4 align-middle"
                    :class="{ 'border-t-2 border-gray-200': itemIndex === 0 && yearIndex !== 0 }"
                  >
                    <div class="flex justify-center gap-2">
                      <LightButton @click="openModalEdit(item.tahun, item.bulan)">
                        <EditIcon />
                      </LightButton>
                      <DangerButton @click="deleteData(item.tahun, item.bulan)">
                        <DeleteIcon />
                      </DangerButton>
                    </div>
                  </td>
                </tr>
              </template>
            </template>

            <!-- Empty State -->
            <tr v-else>
              <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
                <font-awesome-icon
                  icon="fa-solid fa-database"
                  class="text-4xl mb-2 text-gray-400"
                />
                <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
                <p class="text-sm">
                  Silakan gunakan filter di atas untuk mencari data atau tambah data baru.
                </p>
              </td>
            </tr>
          </tbody>

          <!-- Pagination -->
          <tfoot class="bg-gray-100 font-bold">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              :pages="pages"
              :total-columns="totalColumns"
              :total-row="totalRow"
              @prev-page="prevPage"
              @next-page="nextPage"
              @page-now="pageNow"
            />
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Modal FormAdd -->
    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="((isModalAddOpen = false), fetchData())"
      @status="
        (payload: any) => {
          displayNotification(
            payload.error_msg || 'Tambah Target gagal',
            payload.error ? 'error' : 'success',
          );
        }
      "
    />

    <!-- Modal FormEdit -->
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :tahun="selectedTarget?.tahun"
      :bulan="selectedTarget?.bulan"
      @close="isModalEditOpen = false"
      @status="
        (payload) => {
          displayNotification(
            payload.error_msg || 'Update Target gagal',
            payload.error ? 'error' : 'success',
          );
          if (!payload.error) {
            isModalEditOpen = false;
            fetchData();
          }
        }
      "
    />

    <!-- Confirmation -->
    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <BaseButton variant="secondary" @click="cancel">Tidak</BaseButton>
      <BaseButton variant="warning" @click="confirm">Ya</BaseButton>
    </Confirmation>

    <!-- Notification -->
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
