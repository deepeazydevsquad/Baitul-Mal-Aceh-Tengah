<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import FormAdd from '@/modules/KegiatanKeseketariatan/widgets/FormAdd.vue';
import { onMounted, ref } from 'vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

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

const tableColumns = ref<TableColumn[]>([
  { key: 'kode', label: 'Kode', headerClass: 'w-[10%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'nama_kegiatan', label: 'Nama Kegiatan', headerClass: 'w-[18%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'sumber_dana', label: 'Sumber Dana', headerClass: 'w-[12%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'penerima', label: 'Info Penerima', headerClass: 'w-[18%] text-center', cellClass: 'text-left font-medium text-gray-800' },
  { key: 'lokasi', label: 'Lokasi', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'nominal_kegiatan', label: 'Nominal', headerClass: 'w-[12%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'tanggal_penyaluran', label: 'Tanggal', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

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
      <BaseTable
        :columns="tableColumns"
        :data="datas"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Program . . . "
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Program"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-kode="{ value }">
          {{ value }}
        </template>
        
        <template #cell-nama_kegiatan="{ value }">
          {{ value }}
        </template>

        <template #cell-sumber_dana="{ value }">
          <span 
            class="inline-flex px-3 py-1 rounded-full text-xs font-semibold text-gray-800"
          >
            {{ formatSumberDana(value) }}
          </span>
        </template>
        
        <template #cell-penerima="{ row }">
          <div class="grid grid-cols-2 gap-2">
            <span class="text-gray-500">Nama Penerima</span>
            <span>: {{ row.penerima }}</span>

            <span class="text-gray-500">Jenis Penerima</span>
            <span>: {{ row.jenis_penerima }}</span>
          </div>
        </template>

        <template #cell-lokasi="{ row }">
          {{
            row.area_penyaluran === 'kecamatan' ? 'Kec. ' + row.nama_desa : 'Kabupaten'
          }}
        </template>

        <template #cell-nominal_kegiatan="{ value }">
          Rp {{ value.toLocaleString('id-ID') }}
        </template>

        <template #cell-tanggal_penyaluran="{ value }">
          {{ new Date(value).toLocaleDateString('id-ID') }}
        </template>
      </BaseTable>
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