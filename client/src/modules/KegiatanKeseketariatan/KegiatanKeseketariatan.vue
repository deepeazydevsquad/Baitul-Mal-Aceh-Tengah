<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import FormAdd from '@/modules/KegiatanKeseketariatan/widgets/FormAdd.vue';
import { onMounted, ref } from 'vue';

// Composable
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

// Service API
import { list } from '@/service/kegiatan_keseketariatan';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(7);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface Data {
  id: number;
  kode: string;
  nama_kegiatan: string;
  sumber_dana: string;
  penerima: string;
  jenis_penerima: string;
  area_penyaluran: string;
  nama_desa: string;
  nominal_kegiatan: number;
  tanggal_penyaluran: string;
}

const datas = ref<Data[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);

function openModalAdd() {
  isModalAddOpen.value = true;
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    datas.value = response.data;
    totalRow.value = response.total;
    console.log(datas.value);
  } catch (error) {
    displayNotification('Gagal mengambil data kegiatan', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

const handleClose = () => {
  isModalAddOpen.value = false;
  fetchData();
};

const handleStatus = (payload: any) => {
  displayNotification(
    payload.error_msg || 'Tambah Program Berhasil',
    payload.error ? 'error' : 'success',
  );
};

// Helper function untuk format sumber dana
const formatSumberDana = (sumber: string) => {
  const mapping: Record<string, string> = {
    'zakat': 'Zakat',
    'infaq': 'Infaq',
    'operasional_apbk': 'Operasional APBK'
  };
  return mapping[sumber] || sumber;
};
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
          :loading="isModalAddOpen"
          type="button"
        >
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Program
        </BaseButton>

        <!-- Search -->
        <div class="flex items-center w-full sm:w-auto">
          <label for="search" class="mr-2 text-sm font-medium text-gray-600">Cari</label>
          <input
            id="search"
            type="text"
            v-model="search"
            @change="fetchData"
            placeholder="Cari Program . . . "
            class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr>
              <th class="w-[10%] px-6 py-3 font-medium">Kode</th>
              <th class="w-[18%] px-6 py-3 font-medium">Nama Kegiatan</th>
              <th class="w-[12%] px-6 py-3 font-medium">Sumber Dana</th>
              <th class="w-[18%] px-6 py-3 font-medium">Info Penerima</th>
              <th class="w-[15%] px-6 py-3 font-medium">Lokasi</th>
              <th class="w-[12%] px-6 py-3 font-medium">Nominal</th>
              <th class="w-[15%] px-6 py-3 font-medium">Tanggal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Data Rows -->
            <template v-if="datas && datas.length > 0">
              <tr v-for="data in datas" :key="data.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{ data.kode }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{ data.nama_kegiatan }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  <span 
                    class="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                    :class="{
                      'text-gray-800': data.sumber_dana === 'zakat',
                      'text-gray-800': data.sumber_dana === 'infaq',
                      'text-gray-800': data.sumber_dana === 'operasional_apbk'
                    }"
                  >
                    {{ formatSumberDana(data.sumber_dana) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-left font-medium text-gray-800">
                  <div class="grid grid-cols-2 gap-2">
                    <span class="text-gray-500">Nama Penerima</span>
                    <span>: {{ data.penerima }}</span>

                    <span class="text-gray-500">Jenis Penerima</span>
                    <span>: {{ data.jenis_penerima }}</span>
                  </div>
                </td>

                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{
                    data.area_penyaluran === 'kecamatan' ? 'Kec. ' + data.nama_desa : 'Kabupaten'
                  }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  Rp {{ data.nominal_kegiatan.toLocaleString('id-ID') }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{ new Date(data.tanggal_penyaluran).toLocaleDateString('id-ID') }}
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else>
              <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
                <p class="text-sm">Belum ada data.</p>
              </td>
            </tr>
          </tbody>

          <!-- Pagination -->
          <tfoot>
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
    <FormAdd :is-modal-open="isModalAddOpen" @close="handleClose" @status="handleStatus" />

    <!-- Notification -->
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>