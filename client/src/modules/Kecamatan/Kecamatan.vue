<script setup lang="ts">
// Library
import { ref, onMounted, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import FormAdd from '@/modules/Kecamatan/widgets/FormAdd.vue';
import FormEdit from '@/modules/Kecamatan/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_kecamatan, delete_kecamatan } from '@/service/kecamatan';

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
  kode: string;
  updatedAt: string;
  name: string;
}

const dataKecamatan = ref<Data[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'kode', label: 'Kode', headerClass: 'w-[10%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'name', label: 'Nama Kecamatan', headerClass: 'w-[50%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'updatedAt', label: 'Datetime', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const selectedKecamatan = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(kecamatan: any) {
  selectedKecamatan.value = kecamatan;
  console.log('selectedKecamatan Parent', selectedKecamatan.value);
  isModalEditOpen.value = true;
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_kecamatan({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    dataKecamatan.value = response.data;
    totalRow.value = response.total;
    console.log(dataKecamatan.value);

    console.log('Total Row:', totalRow.value);
  } catch (error) {
    displayNotification('Gagal mengambil data kecamatan', 'error');
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
    'Hapus Data Kecamatan',
    'Apakah Anda yakin ingin menghapus data kecamatan ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_kecamatan(id);
        displayNotification('Data kecamatan berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data kecamatan', 'error');
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
        :data="dataKecamatan"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari kecamatan..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Kecamatan"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-kode="{ value }">
          {{ value }}
        </template>
        <template #cell-name="{ value }">
          {{ value }}
        </template>
        <template #cell-updatedAt="{ value }">
          {{ value }}
        </template>
        <template #row-actions="{ row }">
          <div class="flex justify-center gap-2">
            <LightButton @click="openModalEdit(row)">
              <EditIcon />
            </LightButton>
            <DangerButton @click="deleteData(row.id)">
              <DeleteIcon />
            </DangerButton>
          </div>
        </template>
      </BaseTable>
      </div>
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
            payload.error_msg || 'Tambah/Update Kecamatan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />
    <!-- Modal FormEdit -->
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :selected-kecamatan="selectedKecamatan"
      @close="
        isModalEditOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Kecamatan gagal',
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
