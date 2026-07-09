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
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from '@/modules/DaftarPengguna/widgets/FormAdd.vue';
import FormEdit from '@/modules/DaftarPengguna/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { list_daftar_pengguna, delete_daftar_pengguna } from '@/service/daftar_pengguna';

// Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Pagination
const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(5);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Interface
interface daftar_pengguna {
  id: number;
  kode: string;
  name: string;
  jabatan: string;
  username: string;
  grup: string;
  createdAt: string;
  updatedAt: string;
}

const dataDaftarPengguna = ref<daftar_pengguna[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'kode_username', label: 'Kode / Username', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'nama_jabatan', label: 'Nama / Jabatan', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800 break-words' },
  { key: 'grup', label: 'Grup', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800 break-words' },
  { key: 'createdAt', label: 'DateTimes', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Modal state
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const selectedDaftarPengguna = ref<any>(null);

function openAddModal() {
  isAddModalOpen.value = true;
}

function openEditModal(daftar_pengguna: any) {
  selectedDaftarPengguna.value = daftar_pengguna;
  isEditModalOpen.value = true;
}

// Fetch data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list_daftar_pengguna({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    dataDaftarPengguna.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil pengguna', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
  // totalColumns.value = document.querySelectorAll('thead th').length
});

// Delete
async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Pengguna',
    'Apakah Anda yakin ingin menghapus pengguna ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_daftar_pengguna(id);
        displayNotification('Pengguna berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus pengguna', 'error');
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
          empty-title="Data tidak ditemukan"
          empty-desc="Belum ada pengguna."
          empty-icon="fa-solid fa-database"
        :columns="tableColumns"
        :data="dataDaftarPengguna"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari pengguna..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Pengguna"
        @add="openAddModal"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        
        <template #cell-kode_username="{ row }">
          <b>#{{ row.kode }}</b>
          <br />
          ( {{ row.username }} )
        </template>
        <template #cell-nama_jabatan="{ row }">
          {{ row.name }}
          <br />
          ( Jabatan : {{ row.jabatan }} )
        </template>
        <template #cell-grup="{ value }">
          {{ value }}
        </template>
        <template #cell-createdAt="{ value }">
          {{ value }}
        </template>
        
        <template #row-actions="{ row }">
          <div class="flex justify-center gap-2">
            <LightButton @click="openEditModal(row)">
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

    <!-- Modal Tambah -->
    <FormAdd
      :is-modal-open="isAddModalOpen"
      @close="((isAddModalOpen = false), fetchData())"
      @status="
        (payload) =>
          displayNotification(
            payload.error_msg || 'Berhasil Menambah Pengguna',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Edit -->
    <FormEdit
      :is-modal-open="isEditModalOpen"
      :selected-pengguna="selectedDaftarPengguna"
      @close="((isEditModalOpen = false), fetchData())"
      @status="
        (payload) =>
          displayNotification(
            payload.error_msg || 'Berhasil Update Pengguna',
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
