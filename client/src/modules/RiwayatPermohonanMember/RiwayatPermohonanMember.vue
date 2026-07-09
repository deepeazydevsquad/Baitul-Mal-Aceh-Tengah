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
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { riwayat_permohonan, delete_riwayat_permohonan } from '@/service/riwayat_permohonan_member';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(4);

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

interface Data {
  id: number;
  tanggal: string;
  kegiatan: string;
  program: string;
  status_realisasi: string;
}

const datas = ref<Data[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'info_program', label: 'Info Program', headerClass: 'w-[50%] text-center', cellClass: 'px-6 py-4 text-left font-medium text-gray-800' },
  { key: 'status_realisasi', label: 'Status Permohonan', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'tanggal', label: 'Tanggal Permohonan', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
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
    const response = await riwayat_permohonan({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    datas.value = response.data;
    totalRow.value = response.total;
    console.log(datas.value);
  } catch (error) {
    displayNotification('Gagal mengambil data bank', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

const emit = defineEmits(['back']);

onMounted(async () => {
  await fetchData();
});

async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Permohonan',
    'Apakah Anda yakin ingin menghapus data permohonan ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_riwayat_permohonan({
          id: id,
        });
        displayNotification('Data Permohonan berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data permohohan', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Table with BaseTable -->
      <BaseTable
        :columns="tableColumns"
        :data="datas"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari permohonan..."
        @search="search = $event; fetchData()"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #filters>
          <BaseButton @click="emit('back')" variant="primary" type="button" class="mr-auto">
            <font-awesome-icon icon="fa-solid fa-arrow-left" class="mr-2" />
            Kembali
          </BaseButton>
        </template>

        <template #cell-info_program="{ row }">
          <table class="w-full mx-auto border border-gray-300 rounded-lg">
            <tbody>
              <tr>
                <td class="border w-[35%] border-gray-300 px-2 py-1 font-normal">
                  Nama Program
                </td>
                <td class="border border-gray-300 px-2 py-1 font-normal">
                  {{ row.program }}
                </td>
              </tr>
              <tr>
                <td class="border border-gray-300 px-2 py-1 font-normal">Nama Kegiatan</td>
                <td class="border border-gray-300 px-2 py-1 font-normal">
                  {{ row.kegiatan }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <template #cell-status_realisasi="{ row }">
          {{ row.status_realisasi?.replaceAll('_', ' ').toUpperCase() }}
        </template>
        
        <template #cell-tanggal="{ row }">
          {{ row.tanggal }}
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
