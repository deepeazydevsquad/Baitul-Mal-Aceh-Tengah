<script setup lang="ts">
// Library
import { onMounted, ref } from 'vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import Notification from '@/components/Modal/Notification.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useNotification } from '@/composables/useNotification';

// Service API
import { list } from '@/service/system_log_surveyor';

// State: Loading
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(4);
const tableColumns = ref<TableColumn[]>([]);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// State Data Surveyor
interface SurveyorLog {
  id: number;
  message: string;
  ip: string;
  nama_surveyor: string | null;
  createdAt: string;
  updatedAt: string;
}

// Function: fetch data
const search = ref('');
const dataSurveyorLog = ref<SurveyorLog[]>([]);

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    dataSurveyorLog.value = response.data;
    totalRow.value = response.total || response.data?.length || 0;
    console.log(dataSurveyorLog.value);
  } catch (error: any) {
    displayNotification(error.response?.data?.message || 'Gagal mengambil data surveyor', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <div class="space-y-4">
      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <BaseTable
          v-else
          class="w-full border-collapse bg-white text-sm"
          :columns="tableColumns"
          :data="dataSurveyorLog"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          @page-change="pageNow"
          :show-search="true"
          search-placeholder="Cari surveyor..."
          @search="search = $event; fetchData()"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #thead>
            <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
              <tr>
                <th class="w-[20%] px-6 py-3 font-medium">Datetimes</th>
                <th class="w-[40%] px-6 py-3 font-medium">Message</th>
                <th class="w-[20%] px-6 py-3 font-medium">Surveyor</th>
                <th class="w-[20%] px-6 py-3 font-medium">IP</th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100">
              <template v-if="dataSurveyorLog.length > 0">
                <tr
                  v-for="data in dataSurveyorLog"
                  :key="data.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.createdAt }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.message }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.nama_surveyor }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.ip }}
                  </td>
                </tr>
              </template>

              <!-- Empty State -->
              <tr v-else>
                <td :colspan="totalColumns" class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <p class="empty-state-title">Tidak ada data</p>
                    <p class="empty-state-desc">Belum ada data.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </template>

          <!-- Pagination -->
          
        </BaseTable>
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
