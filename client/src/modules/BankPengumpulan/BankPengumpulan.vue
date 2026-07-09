<script setup lang="ts">
import { ref, onMounted } from 'vue';
// Import komponen UI
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import FormAdd from './Widgets/FormAdd.vue';
import FormEdit from './Widgets/FormEdit.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Import service API
import {
  getBankPengumpulan,
  addBankPengumpulan,
  updateBankPengumpulan,
  deleteBankPengumpulan,
} from '@/service/bank_pengumpulan';

// Import Composables
import { useNotification } from '@/composables/useNotification';
import { useConfirmation } from '@/composables/useConfirmation';
import { usePagination } from '@/composables/usePaginations';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composables
const {
  showNotification,
  notificationType,
  notificationMessage,
  displayNotification,
  hideNotification,
} = useNotification();

const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Composables: pagination
const totalColumns = ref<number>(6);
const itemsPerPage = ref<number>(100);

const { currentPage, totalPages, totalRow, perPage, pages, nextPage, prevPage, pageNow } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Function: fetch data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await getBankPengumpulan({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });
    totalRow.value = response.total;
    dataBankPengumpulan.value = response.data;
  } catch (error) {
    displayNotification('Gagal mengambil data.', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

// Interface definitions
interface Bank {
  id: number;
  name: string;
}

interface BankPengumpulan {
  id: number;
  bank_id: number;
  tipe: string;
  nomor_akun_bank: string;
  nama_akun_bank: string;
  createdAt: string | null;
  updatedAt: string | null;
  Bank?: Bank;
}

const dataBankPengumpulan = ref<BankPengumpulan[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'bank_name', label: 'Nama Bank', headerClass: 'w-[15%] text-center', cellClass: 'text-center' },
  { key: 'tipe', label: 'Jenis Pemasukan', headerClass: 'w-[10%] text-center', cellClass: 'text-center capitalize' },
  { key: 'nomor_akun_bank', label: 'Nomor Akun', headerClass: 'w-[20%] text-center', cellClass: 'text-center' },
  { key: 'nama_akun_bank', label: 'Atas Nama', headerClass: 'w-[20%] text-center', cellClass: 'text-center' },
  { key: 'tanggal', label: 'Tanggal', headerClass: 'w-[15%] text-center', cellClass: 'text-center' },
]);
const isModalAddOpen = ref(false);
const formAddRef = ref<any>(null);

// Fungsi untuk mengambil pesan error dari response API
const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors[0]?.msg || 'Terjadi kesalahan validasi';
  }
  return 'Terjadi kesalahan pada server';
};

// Handler untuk menyimpan data baru

const handleSaveNewData = async (formData: any) => {
  const payload = {
    bank_id: formData.bank_id,
    tipe: formData.jenisPemasukan,
    nama_akun_bank: formData.namaAkunBank,
    nomor_akun_bank: formData.nomorAkunBank,
  };
  try {
    await addBankPengumpulan(payload);
    isModalAddOpen.value = false;
    displayNotification('Data berhasil ditambahkan!', 'success');
    await fetchData();
  } catch (error: any) {
    if (error.response?.data?.errors && formAddRef.value?.parseServerErrors) {
      formAddRef.value.parseServerErrors(error);
      return;
    }
    const errorMessage = getErrorMessage(error);
    displayNotification(errorMessage, 'error');
  }
};

// Handler untuk menyimpan data yang diedit
const isEditLoading = ref(false);
const isModalEditOpen = ref(false);
const editData = ref<BankPengumpulan | null>(null);
const formEditRef = ref<any>(null);

const handleSaveEditData = async (formData: BankPengumpulan) => {
  isEditLoading.value = true;
  try {
    await updateBankPengumpulan(formData.id, formData);
    isModalEditOpen.value = false;
    displayNotification('Data berhasil diperbarui!', 'success');
    await fetchData();
  } catch (error: any) {
    if (error.response?.data?.errors && formEditRef.value?.parseServerErrors) {
      formEditRef.value.parseServerErrors(error);
      return;
    }
    const errorMessage = getErrorMessage(error);
    displayNotification(errorMessage, 'error');
  } finally {
    isEditLoading.value = false;
  }
};

// Handler untuk menghapus data
const handleDelete = (item: BankPengumpulan) => {
  const truncatedName =
    item.nama_akun_bank.length > 30
      ? `${item.nama_akun_bank.substring(0, 30)}...`
      : item.nama_akun_bank;

  displayConfirmation(
    'Konfirmasi Hapus',
    `Apakah Anda yakin ingin menghapus data atas nama "${truncatedName}"?`,
    async () => {
      isLoading.value = true;
      try {
        await deleteBankPengumpulan(item.id);
        displayNotification('Data berhasil dihapus.', 'success');
        await fetchData();
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Gagal menghapus data. Silakan coba lagi.';
        displayNotification(errorMessage, 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
};

// Handler untuk UI
const openModalAdd = () => {
  isModalAddOpen.value = true;
};
const handleEdit = (item: BankPengumpulan) => {
  editData.value = { ...item };
  isModalEditOpen.value = true;
};

// Lifecycle hook
onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
        :columns="tableColumns"
        :data="dataBankPengumpulan"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Nama / No. Akun..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Bank Pengumpulan"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-bank_name="{ row }">
          {{ row.Bank?.name || 'N/A' }}
        </template>

        <template #cell-tanggal="{ row }">
          {{ row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID') : '-' }}
        </template>

        <template #row-actions="{ row }">
          <div class="flex justify-center items-center gap-4">
            <LightButton @click="handleEdit(row)"><EditIcon /></LightButton>
            <DangerButton @click="handleDelete(row)"><DeleteIcon /></DangerButton>
          </div>
        </template>
      </BaseTable>
      </div>
    </div>

    <FormAdd
      ref="formAddRef"
      :showModal="isModalAddOpen"
      @close="isModalAddOpen = false"
      @save="handleSaveNewData"
    />
    <FormEdit
      ref="formEditRef"
      :showModal="isModalEditOpen"
      :editData="editData"
      :isLoading="isEditLoading"
      @close="isModalEditOpen = false"
      @save="handleSaveEditData"
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
      @close="hideNotification()"
    />
  </div>
</template>
