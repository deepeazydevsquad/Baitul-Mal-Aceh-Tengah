<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import { list } from '@/service/system_log';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import { usePagination } from '@/composables/usePaginations';
import { useNotification } from '@/composables/useNotification';

interface Data {
  id: number;
  msg: string;
  ip: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

const isLoading = ref(false);
const isTableLoading = ref(false);
const search = ref('');
const data = ref<Data[]>([]);
const itemsPerPage = ref<number>(10);

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

const tableColumns: TableColumn[] = [
  { key: 'createdAt', label: 'Datetime' },
  { key: 'msg', label: 'Message' },
  { key: 'name', label: 'User' },
  { key: 'ip', label: 'IP' },
];

const showConfirmDialog = ref(false);
const confirmMessage = ref('');
const confirmTitle = ref('');
const confirmAction = ref<(() => void) | null>(null);

const showConfirmation = (title: string, message: string, action: () => void) => {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmAction.value = action;
  showConfirmDialog.value = true;
};

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list({
      search: search.value,
      perpage: itemsPerPage.value,
      pageNumber: currentPage.value,
    });
    data.value = response.data;
    totalRow.value = response.total || response.data.length || 0;
    totalPages.value = Math.ceil(totalRow.value / itemsPerPage.value);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
          empty-title="Data tidak ditemukan"
          empty-desc="Tidak ada data log sistem."
          empty-icon="fa-solid fa-list"
          :columns="tableColumns"
          :data="data"
          :loading="isTableLoading"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          :show-search="true"
          search-placeholder="Cari nama user..."
          @search="search = $event; fetchData()"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          @page-change="pageNow"
        >
          <template #cell-createdAt="{ value }">
            {{ new Date(value).toISOString().slice(0, 10).split('-').reverse().join('-') }}
          </template>
        </BaseTable>
      </div>
    </div>

    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <button
        @click="confirmAction && confirmAction()"
        class="inline-flex w-full justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
      >
        Ya
      </button>
      <button
        @click="showConfirmDialog = false"
        class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
      >
        Tidak
      </button>
    </Confirmation>

    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
