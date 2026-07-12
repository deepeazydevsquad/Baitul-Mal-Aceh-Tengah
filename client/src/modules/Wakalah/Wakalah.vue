<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from '@/modules/Wakalah/widgets/FormAdd.vue';
import FormEdit from '@/modules/Wakalah/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

import { get_wakalah, delete_wakalah } from '@/service/wakalah';

const isLoading = ref(false);
const isTableLoading = ref(false);

const itemsPerPage = ref<number>(100);
const { currentPage, perPage, totalRow, totalPages, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface Wakalah {
  id: number;
  nama: string;
  nik: string;
  desa_name: string;
}

const dataWakalah = ref<Wakalah[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'nama', label: 'Nama', headerClass: 'w-[30%] text-left', cellClass: 'text-left font-medium text-gray-800' },
  { key: 'nik', label: 'NIK', headerClass: 'w-[30%] text-center', cellClass: 'text-center' },
  { key: 'desa_name', label: 'Desa', headerClass: 'w-[25%] text-center', cellClass: 'text-center' },
]);

const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const selectedWakalah = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(wakalah: any) {
  selectedWakalah.value = wakalah;
  isModalEditOpen.value = true;
}

const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_wakalah({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });
    dataWakalah.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil data wakalah', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Wakalah',
    'Apakah Anda yakin ingin menghapus data wakalah ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_wakalah(id);
        displayNotification('Data wakalah berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data wakalah', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}
</script>

<template>
  <div class="p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
        :columns="tableColumns"
        :data="dataWakalah"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari nama atau NIK..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Wakalah"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-nama="{ value }">
          {{ value }}
        </template>
        <template #cell-nik="{ value }">
          {{ value }}
        </template>
        <template #cell-desa_name="{ value }">
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

    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="isModalAddOpen = false; fetchData();"
      @status="(payload: any) => displayNotification(payload.error_msg || 'Gagal menyimpan data', payload.error ? 'error' : 'success')"
    />
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :selected-wakalah="selectedWakalah"
      @close="isModalEditOpen = false; fetchData();"
      @status="(payload: any) => displayNotification(payload.error_msg || 'Gagal menyimpan data', payload.error ? 'error' : 'success')"
    />
    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <BaseButton variant="secondary" @click="cancel">Tidak</BaseButton>
      <BaseButton variant="warning" @click="confirm">Ya</BaseButton>
    </Confirmation>
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
