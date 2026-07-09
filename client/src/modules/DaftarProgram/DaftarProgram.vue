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
import FormAdd from '@/modules/DaftarProgram/widgets/FormAdd.vue';
import FormEdit from '@/modules/DaftarProgram/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API // edit_daftar_program,
import { get_daftar_program, delete_daftar_program } from '@/service/daftar_program';

// Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Pagination
const itemsPerPage = ref<number>(10);
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
interface DaftarProgram {
  id: number;
  name: string;
  desc: string;
  createdAt: string;
  updatedAt: string;
}

const DaftardataProgram = ref<DaftarProgram[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'name', label: 'Daftar Program', headerClass: 'w-[25%] text-center', cellClass: 'text-left font-medium text-gray-800' },
  { key: 'desc', label: 'Deskripsi', headerClass: 'w-[40%] text-center', cellClass: 'text-left font-medium text-gray-800 break-words' },
  { key: 'createdAt', label: 'Datetimes', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Modal state
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const DaftarselectedProgram = ref<any>(null);

function openAddModal() {
  isAddModalOpen.value = true;
}

function openEditModal(program: any) {
  DaftarselectedProgram.value = program;
  isEditModalOpen.value = true;
}

// Fetch data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_daftar_program({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    DaftardataProgram.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil program', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

// Delete
async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Daftar Program',
    'Apakah anda yakin ingin menghapus Program ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_daftar_program(id);
        displayNotification('Daftar Program Berhasil Dihapus.', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus Program', 'error');
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
          empty-desc="Belum ada Daftar Program."
          empty-icon="fa-solid fa-database"
        :columns="tableColumns"
        :data="DaftardataProgram"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari program..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Daftar Program"
        @add="openAddModal"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        
        <template #cell-name="{ value }">
          {{ value }}
        </template>
        <template #cell-desc="{ value }">
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
      @close="
        isAddModalOpen = false;
        fetchData();
      "
      @status="
        (payload) =>
          displayNotification(
            payload.error_msg || 'Program Berhasil Ditambahkan.',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Edit -->
    <FormEdit
      :is-modal-open="isEditModalOpen"
      :selected-program="DaftarselectedProgram"
      @close="
        isEditModalOpen = false;
        fetchData();
      "
      @status="
        (payload) =>
          displayNotification(
            payload.error_msg || 'Deskripsi Berhasil Diupdate!',
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
