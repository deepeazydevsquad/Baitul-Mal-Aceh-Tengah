<script setup lang="ts">
// Library
import { ref, onMounted } from 'vue';
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
import FormAdd from '@/modules/Bank/widgets/FormAdd.vue';
import FormEdit from '@/modules/Bank/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_bank, delete_bank } from '@/service/bank';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(3);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// State Data Bank
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

interface Bank {
  id: number;
  img: string;
  name: string;
}

const dataBanks = ref<Bank[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'img', label: 'Logo Bank', headerClass: 'w-[10%] text-center', cellClass: 'text-center align-middle' },
  { key: 'name', label: 'Nama Bank', headerClass: 'w-[70%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const selectedBank = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(bank: any) {
  selectedBank.value = bank;
  console.log('selectedBank Parent', selectedBank.value);
  isModalEditOpen.value = true;
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_bank({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    dataBanks.value = response.data;
    totalRow.value = response.total;
    console.log(dataBanks.value);
  } catch (error) {
    displayNotification('Gagal mengambil data bank', 'error');
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
    'Hapus Data Bank',
    'Apakah Anda yakin ingin menghapus data bank ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_bank(id);
        displayNotification('Data bank berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data bank', 'error');
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
      <!-- Table with BaseTable -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
        :columns="tableColumns"
        :data="dataBanks"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari bank..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Bank"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-img="{ row }">
          <center>
            <div
              v-if="row.img && row.img !== '-'"
              class="relative rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
              style="width: 100px; height: 33px"
              :class="{ 'bg-gray-200': !row.img || row.img === '-' }"
            >
              <img
                :src="BASE_URL + '/uploads/img/bank/' + row.img"
                :alt="`Foto Bank ${row.name}`"
                class="object-contain max-w-full max-h-full mx-auto"
                @error="row.img = '-'"
              />
            </div>
            <div
              v-else
              class="bg-gray-200 text-gray-500 text-center px-4 relative aspect-video max-w-sm rounded-lg flex items-center justify-center overflow-hidden"
            >
              <p class="text-sm font-medium">Gambar tidak tersedia</p>
            </div>
          </center>
        </template>
        
        <template #cell-name="{ value }">
          {{ value }}
        </template>

        <template #row-actions="{ row }">
          <div class="flex justify-center gap-2">
            <LightButton @click="openModalEdit(row)"><EditIcon /></LightButton>
            <DangerButton @click="deleteData(row.id)"><DeleteIcon /></DangerButton>
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
            payload.error_msg || 'Tambah/Update Bank gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />
    <!-- Modal FormEdit -->
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :selected-bank="selectedBank"
      @close="
        isModalEditOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Bank gagal',
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
