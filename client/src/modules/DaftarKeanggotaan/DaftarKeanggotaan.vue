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
import FormAdd from '@/modules/DaftarKeanggotaan/widgets/FormAdd.vue';
import FormEdit from '@/modules/DaftarKeanggotaan/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_daftar_keanggotaan, delete_keanggotaan } from '@/service/daftar_keanggotaan';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(6);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface Data {
  id: number;
  kode: string;
  fullname: string;
  tipe: string;
  nomor_ktp: string;
  nomor_kk: string;
  whatsapp_number: string;
  birth_date: string;
  alamat: string;
  datetime: string;
  desa_name: string;
  kecamatan_name: string;
}

const dataDaftarKeanggotaan = ref<Data[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'kode', label: 'Kode', headerClass: 'w-[10%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'tipe', label: 'Tipe Member', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'fullname', label: 'Nama Member', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'info_member', label: 'Info Member', headerClass: 'w-[35%] text-center', cellClass: 'text-center font-medium text-gray-800' },
  { key: 'datetime', label: 'Datetimes', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const selectedKeanggotaan = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(daftar_keanggotaan: any) {
  selectedKeanggotaan.value = daftar_keanggotaan;
  console.log('Keanggotaan Parent', selectedKeanggotaan.value);
  isModalEditOpen.value = true;
}

// Function: Fetch Data
const search = ref('');
const type = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_daftar_keanggotaan({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
      type: type.value,
    });

    dataDaftarKeanggotaan.value = response.data;
    totalRow.value = response.total;
    console.log(dataDaftarKeanggotaan.value);
  } catch (error) {
    displayNotification('Gagal mengambil data daftar keanggotaan', 'error');
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
    'Hapus Data Keanggotaan',
    'Apakah Anda yakin ingin menghapus data keanggotaan ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_keanggotaan(id);
        displayNotification('Data keanggotaan berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data keanggotaan', 'error');
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
          empty-title="Tidak ada data"
          empty-desc="Belum ada data keanggotaan."
          empty-icon="fa-solid fa-users"
        :columns="tableColumns"
        :data="dataDaftarKeanggotaan"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Nama / Kode / Nomor Whatsapp . . ."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Keanggotaan"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #filters>
          <select
            id="type"
            v-model="type"
            @change="fetchData()"
            class="block w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:ring-2 focus:ring-green-900 focus:border-green-900 transition"
          >
            <option value="perorangan">Perorangan</option>
            <option value="instansi">Instansi</option>
            <option value="">Semua</option>
          </select>
        </template>
        
        

        <template #cell-kode="{ value }">
          {{ value }}
        </template>
        <template #cell-tipe="{ value }">
          {{ value.toUpperCase() }}
        </template>
        <template #cell-fullname="{ value }">
          {{ value }}
        </template>
        <template #cell-info_member="{ row }">
          <table class="border border-gray-300 w-full text-sm text-left">
            <tbody>
              <tr class="border border-gray-300">
                <td class="w-[45%] bg-gray-100 px-4 py-2 font-medium">Desa</td>
                <td class="px-4 py-2">{{ row.desa_name || '-' }}</td>
              </tr>
              <tr class="border border-gray-300">
                <td class="w-[45%] bg-gray-100 px-4 py-2 font-medium">Kecamatan</td>
                <td class="px-4 py-2">{{ row.kecamatan_name || '-' }}</td>
              </tr>
              <tr class="border border-gray-300">
                <td class="w-[45%] bg-gray-100 px-4 py-2 font-medium">Nomor Whatsapp</td>
                <td class="px-4 py-2">{{ row.whatsapp_number || '-' }}</td>
              </tr>
              <tr class="border border-gray-300">
                <td class="w-[45%] bg-gray-100 px-4 py-2 font-medium">Nomor KTP</td>
                <td class="px-4 py-2">{{ row.nomor_ktp || '-' }}</td>
              </tr>
              <tr class="border border-gray-300">
                <td class="w-[45%] bg-gray-100 px-4 py-2 font-medium">Nomor KK</td>
                <td class="px-4 py-2">{{ row.nomor_kk || '-' }}</td>
              </tr>
              <tr class="border border-gray-300">
                <td class="w-[45%] bg-gray-100 px-4 py-2 font-medium">Tanggal Lahir</td>
                <td class="px-4 py-2">{{ row.birth_date || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <template #cell-datetime="{ value }">
          {{ value }}
        </template>
        
        <template #row-actions="{ row }">
          <div class="flex justify-center gap-2">
            <LightButton @click="openModalEdit(row)">
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
            payload.error_msg || 'Tambah/Update Keanggotaan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal FormEdit -->
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :selected-keanggotaan="selectedKeanggotaan"
      @close="
        isModalEditOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Keanggotaan gagal',
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
