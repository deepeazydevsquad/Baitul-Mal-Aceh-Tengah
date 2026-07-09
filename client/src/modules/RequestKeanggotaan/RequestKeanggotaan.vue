<script setup lang="ts">
import Pagination from '@/components/Pagination/Pagination.vue';
import requestKeanggotaanService from '@/service/request_keanggotaan';
import DangerButton from '@/components/Button/DangerButton.vue';
import SuccessButton from '@/components/Button/SuccessButton.vue';
import { computed, onMounted, ref } from 'vue';
import ButtonReject from '@/components/Button/ButtonReject.vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useNotification } from '@/composables/useNotification';
import { useConfirmation } from '@/composables/useConfirmation';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(7);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

const tableColumns = ref<TableColumn[]>([
  { key: 'nama', label: 'Nama', headerClass: 'w-[20%] text-center', cellClass: 'text-center align-middle' },
  { key: 'tgl_lahir', label: 'Tgl Lahir', headerClass: 'w-[15%] text-center', cellClass: 'text-center align-middle' },
  { key: 'whatsapp', label: 'WhatsApp', headerClass: 'w-[15%] text-center', cellClass: 'text-center align-middle' },
  { key: 'username', label: 'Username', headerClass: 'w-[15%] text-center', cellClass: 'text-center align-middle' },
  { key: 'desa', label: 'Desa', headerClass: 'w-[15%] text-center', cellClass: 'text-center align-middle' },
  { key: 'status', label: 'Status', headerClass: 'w-[10%] text-center', cellClass: 'text-center align-middle' },
]);

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Interface
interface RequestKeanggotaan {
  id: number;
  status: 'verified' | 'unverified' | string;
  tipe: 'perorangan' | 'kelompok' | string;
  fullname: string;
  nomor_ktp: string;
  nomor_kk: string;
  whatsapp_number: string;
  birth_date: string;
  alamat: string;
  username: string;
  nama_desa: string;
  createdAt: string;
  updatedAt: string;
}

// Function: Fetch data
const search = ref('');
const data = ref<RequestKeanggotaan[]>([]);

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await requestKeanggotaanService.list({
      search: search.value,
      perpage: itemsPerPage.value,
      pageNumber: currentPage.value,
      status: filterStatus.value,
    });
    data.value = response.data;
    totalRow.value = response.total || response.data.length || 0;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

const filterStatus = ref('');
const OptionFilter = [
  { id: 'verified', name: 'Approve' },
  { id: 'unverified', name: 'Reject' },
  { id: '', name: 'Semua' },
];

const handleApprove = async (id: number) => {
  isLoading.value = true;
  try {
    await requestKeanggotaanService.verifikasi({ id, action: 'approve' });
    displayNotification('Berhasil approve data!', 'success');
    fetchData();
  } catch (e) {
    displayNotification('Gagal approve data!', 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleReject = async (id: number) => {
  isLoading.value = true;
  try {
    await requestKeanggotaanService.verifikasi({ id, action: 'reject' });
    displayNotification('Berhasil reject data!', 'success');
    fetchData();
  } catch (e) {
    displayNotification('Gagal reject data!', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto px-4 mt-10">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div class="flex justify-end items-center mb-6">
      <div class="inline-flex rounded-md shadow-xs" role="group">
        <label for="search" class="block text-sm font-medium text-gray-700 mr-2 mt-3">Filter</label>
        <input
          type="text"
          id="search"
          class="block w-64 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-s-lg shadow-sm focus:ring-2 focus:ring-green-900 focus:border-green-900 transition-all duration-200"
          v-model="search"
          @change="fetchData()"
          placeholder="Cari nama / nomor KTP..."
        />
        <select
          v-model="filterStatus"
          style="width: 200px"
          @change="fetchData()"
          class="border-t border-b border-e bg-gray-50 border-gray-300 text-gray-900 text-sm rounded-e-lg focus:ring-green-900 focus:border-green-900 block w-full p-2.5"
        >
          <option v-for="optionC in OptionFilter" :key="optionC.id" :value="optionC.id">
            {{ optionC.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-gray-200 shadow-md">
      <BaseTable
          empty-title="Tidak ada data"
          empty-desc="Belum ada data request keanggotaan."
          empty-icon="fa-solid fa-user-plus"
        :columns="tableColumns"
        :data="data"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="false"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        

        <template #cell-nama="{ row: item }">
          {{ item.fullname }}
        </template>

        <template #cell-tgl_lahir="{ row: item }">
          {{ item.birth_date }}
        </template>

        <template #cell-whatsapp="{ row: item }">
          {{ item.whatsapp_number }}
        </template>

        <template #cell-username="{ row: item }">
          {{ item.username }}
        </template>

        <template #cell-desa="{ row: item }">
          {{ item.nama_desa }}
        </template>

        <template #cell-status="{ row: item }">
          {{ item.status }}
        </template>

        <template #row-actions="{ row: item }">
          <div class="flex flex-col items-center gap-2 w-full max-w-xs">
            <div class="flex flex-col gap-2 items-stretch">
              <template v-if="item.status === 'verified'">
                <span
                  class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"
                >
                  ✔ Verified
                </span>
              </template>
              <template v-else-if="item.status === 'unverified'">
                <span
                  class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold"
                >
                  ✖ Unverified
                </span>
              </template>
              <template v-else>
                <span
                  class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold"
                >
                  ⚠ Unknown
                </span>
              </template>

              <!-- Approve -->
              <SuccessButton
                v-if="item.status == 'process'"
                class="w-full flex justify-center"
                @click="
                  displayConfirmation(
                    'Konfirmasi Approve',
                    `Yakin mau approve ${item.fullname}?`,
                    () => handleApprove(item.id),
                  )
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </SuccessButton>

              <!-- Reject -->
              <ButtonReject
                v-if="item.status == 'process'"
                class="w-full flex justify-center"
                @click="
                  displayConfirmation(
                    'Konfirmasi Reject',
                    `Yakin mau reject ${item.fullname}?`,
                    () => handleReject(item.id),
                  )
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </ButtonReject>
            </div>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>

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
</template>
