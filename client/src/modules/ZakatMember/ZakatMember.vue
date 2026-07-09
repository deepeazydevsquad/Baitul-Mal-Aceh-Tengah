<script setup lang="ts">
// Library
import { ref, onMounted, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from '@/modules/ZakatMember/widgets/FormAdd.vue';
import FormConfirm from '@/modules/ZakatMember/widgets/FormConfirm.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service
import { getZakatList } from '@/service/zakat_member';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(10);
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
interface Zakat {
  id: number;
  invoice: string;
  nominal: number;
  tipe: string;
  status: string;
  konfirmasi_pembayaran: string;
  tanggal_pembayaran: string;
}

const zakat = ref<Zakat[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'invoice', label: 'Invoice', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'nominal', label: 'Nominal', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'tipe', label: 'Tipe Zakat', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'status', label: 'Status', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'tanggal_pembayaran', label: 'Tanggal Pembayaran Zakat', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalConfirmOpen = ref(false);
const selectedZakat = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalDetail(zakatData: any) {
  selectedZakat.value = zakatData;
  isModalConfirmOpen.value = true;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await getZakatList({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    zakat.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil data zakat', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

// Fungsi untuk menangani pencarian
const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

let debounceTimer: number;
watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    handleSearch();
  }, 500);
});

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Table with BaseTable -->
      <BaseTable
        :columns="tableColumns"
        :data="zakat"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari invoice..."
        @search="search = $event; handleSearch()"
        :show-add="true"
        add-label="Bayar Zakat"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-nominal="{ value }">
          {{ formatRupiah(value) }}
        </template>
        
        <template #cell-status="{ value }">
          <span
            :class="{
              'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs': value === 'process',
              'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs': value === 'success',
              'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs': value === 'failed',
            }"
          >
            {{ value }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <BaseButton @click="openModalDetail(row)" variant="warning" type="button">
            <font-awesome-icon icon="fa-solid fa-clipboard-check" />
          </BaseButton>
        </template>
      </BaseTable>
    </div>

    <!-- Modal FormAdd -->
    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="
        isModalAddOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah data zakat gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal FormConfirm -->
    <FormConfirm
      :is-modal-open="isModalConfirmOpen"
      :selected-zakat="selectedZakat"
      @close="
        isModalConfirmOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Konfirmasi pembayaran gagal',
            payload.error ? 'error' : 'success',
          )
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
