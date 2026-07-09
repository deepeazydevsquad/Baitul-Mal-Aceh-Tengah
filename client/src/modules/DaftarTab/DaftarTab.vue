<script setup lang="ts">
// Library
import { ref, onMounted } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormEdit from '@/modules/DaftarTab/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_tab } from '@/service/daftar_tab';

// Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Pagination
const itemsPerPage = ref<number>(20);
const totalColumns = ref<number>(4);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Interface
interface Tab {
  id: number;
  name: string;
  icon: string;
  path: string;
  desc: string;
}

const dataTab = ref<Tab[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'name', label: 'Nama Tab', headerClass: 'w-[20%] text-center', cellClass: 'text-left font-medium text-gray-800' },
  { key: 'icon', label: 'Icon', headerClass: 'w-[15%] text-center', cellClass: 'text-left font-medium text-gray-800' },
  { key: 'path', label: 'Path', headerClass: 'w-[25%] text-center', cellClass: 'text-left font-medium text-gray-800' },
  { key: 'desc', label: 'Deskripsi', headerClass: 'w-[40%] text-center', cellClass: 'text-left font-medium text-gray-800' },
]);

// Modal state
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const selectedTab = ref<any>(null);

function openAddModal() {
  isAddModalOpen.value = true;
}

function openEditModal(tab: any) {
  selectedTab.value = tab;
  isEditModalOpen.value = true;
}

// Fetch data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_tab({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    dataTab.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil tab', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
  totalColumns.value = document.querySelectorAll('thead th').length;
});
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <BaseTable
          empty-title="Data tidak ditemukan"
          empty-desc="Belum ada Tab."
          empty-icon="fa-solid fa-database"
        :columns="tableColumns"
        :data="dataTab"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Nama Tab..."
        @search="search = $event; fetchData()"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        
        <template #cell-name="{ value }">
          {{ value }}
        </template>
        <template #cell-icon="{ value }">
          {{ value }}
        </template>
        <template #cell-path="{ value }">
          {{ value }}
        </template>
        <template #cell-desc="{ value }">
          {{ value }}
        </template>
        
        <template #row-actions="{ row }">
          <div class="flex justify-center gap-2">
            <LightButton @click="openEditModal(row)">
              <EditIcon />
            </LightButton>
          </div>
        </template>
      </BaseTable>
    </div>
    <!-- Modal Edit -->
    <FormEdit
      :is-modal-open="isEditModalOpen"
      :selected-tab="selectedTab"
      @close="
        isEditModalOpen = false;
        fetchData();
      "
      @status="
        (payload) =>
          displayNotification(payload.error_msg || 'Berhasil', payload.error ? 'error' : 'success')
      "
    />

    <!-- Confirmation -->
    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <BaseButton variant="warning" @click="confirm">Ya</BaseButton>
      <BaseButton variant="secondary" @click="cancel">Tidak</BaseButton>
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
