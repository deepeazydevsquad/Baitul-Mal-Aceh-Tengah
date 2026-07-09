<script setup lang="ts">
// Library
import { ref, onMounted, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
// import LightButton from '@/components/Button/LightButton.vue';
// import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_kriteria, delete_kriteria } from '@/service/kriteria';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(4);

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
  name: string;
  kegiatan: string;
  updatedAt: string;
}

const dataKriteria = ref<Data[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'name', label: 'Kriteria', headerClass: 'w-[30%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'kegiatan', label: 'Nama Kegiatan', headerClass: 'w-[35%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'updatedAt', label: 'Datetime', headerClass: 'w-[25%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_kriteria({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    dataKriteria.value = response.data;
    totalRow.value = response.total;

    console.log('Total Row:', totalRow.value);
  } catch (error) {
    displayNotification('Gagal mengambil data kriteria', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

// Function: Delete Data
async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Kriteria',
    'Apakah Anda yakin ingin menghapus data kriteria ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_kriteria(id);
        displayNotification('Data kriteria berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data kriteria', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
        :columns="tableColumns"
        :data="dataKriteria"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari kriteria..."
        @search="search = $event; fetchData()"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-name="{ value }">
          {{ value }}
        </template>
        <template #cell-kegiatan="{ value }">
          {{ value }}
        </template>
        <template #cell-updatedAt="{ value }">
          {{ value }}
        </template>
        <template #row-actions="{ row }">
          <div class="flex justify-center gap-2">
            <DangerButton @click="deleteData(row.id)">
              <DeleteIcon />
            </DangerButton>
          </div>
        </template>
      </BaseTable>
      </div>
    </div>
    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <BaseButton variant="secondary" @click="cancel">Tidak</BaseButton>
      <BaseButton variant="warning" @click="confirm">Ya</BaseButton>
    </Confirmation>
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
