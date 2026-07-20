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
import FormAdd from '@/modules/DaftarAsnaf/widgets/FormAdd.vue';
import FormEdit from '@/modules/DaftarAsnaf/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_daftar_asnaf, edit_daftar_asnaf, delete_daftar_asnaf } from '@/service/daftar_asnaf';

// Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Pagination
const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(3);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Interface
interface DaftarAsnaf {
  id: number;
  name: string;
  tipe: 'zakat' | 'infaq';
  createdAt: string;
  updatedAt: string;
}

const DaftardataAsnaf = ref<DaftarAsnaf[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'name', label: 'Daftar Asnaf', headerClass: 'w-[40%] text-center', cellClass: 'text-left font-medium text-gray-800' },
  { key: 'tipe', label: 'Tipe', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'updatedAt', label: 'Datetimes', headerClass: 'w-[30%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Modal state
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const DaftarselectedAsnaf = ref<any>(null);

function openAddModal() {
  isAddModalOpen.value = true;
}

function openEditModal(asnaf: any) {
  DaftarselectedAsnaf.value = asnaf;
  isEditModalOpen.value = true;
}

const handleCloseAdd = () => {
  isAddModalOpen.value = false;
  fetchData();
};

const handleCloseEdit = () => {
  isEditModalOpen.value = false;
  fetchData();
};

// Fetch data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_daftar_asnaf({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    DaftardataAsnaf.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil asnaf', 'error');
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
    'Hapus Daftar Asnaf',
    'Apakah anda yakin ingin menghapus Asnaf ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_daftar_asnaf(id);
        displayNotification('Daftar Asnaf Berhasil Dihapus.', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus Asnaf', 'error');
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
        :data="DaftardataAsnaf"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Asnaf..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Daftar Asnaf"
        @add="openAddModal"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-name="{ value }">
          {{ value }}
        </template>
        <template #cell-tipe="{ value }">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" :class="value === 'zakat' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'">
            {{ value || 'Zakat' }}
          </span>
        </template>
        <template #cell-updatedAt="{ value }">
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
            payload.error_msg || 'Asnaf Berhasil Ditambahkan.',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Edit -->
    <FormEdit
      :is-modal-open="isEditModalOpen"
      :selected-asnaf="DaftarselectedAsnaf"
      @close="((isEditModalOpen = false), fetchData())"
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
