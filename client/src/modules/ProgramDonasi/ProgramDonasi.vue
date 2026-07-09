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
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from '@/modules/ProgramDonasi/widgets/FormAdd.vue';
import FormEdit from '@/modules/ProgramDonasi/widgets/FormEdit.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import { useDynamicLabel } from '@/composables/useDynamicLabel';

// Service API
import { list, delete_program, tutup } from '@/service/program_donasi';
import IconMoney from '@/components/Icons/IconMoney.vue';
import FormDonasi from './widgets/FormDonasi.vue';
import LockIcon from '@/components/Icons/LockIcon.vue';
import { API_URL } from '@/config/config';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(5);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

const tableColumns = ref<TableColumn[]>([
  { key: 'banner', label: 'Banner', headerClass: 'w-[20%] text-center', cellClass: 'text-center align-middle' },
  { key: 'info_donasi', label: 'Informasi Donasi', headerClass: 'w-[40%] text-center', cellClass: 'text-center font-medium text-gray-800 align-top' },
  { key: 'status', label: 'Status', headerClass: 'w-[15%] text-center', cellClass: 'text-center font-medium text-gray-800 align-top' },
  { key: 'datetime', label: 'Datetime', headerClass: 'w-[20%] text-center', cellClass: 'text-center font-medium text-gray-800 align-top' },
]);

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Composable: dynamic label
const { dynamicLabel } = useDynamicLabel();
// State Data Bank
const BASE_URL = API_URL;

interface Data {
  id: number;
  banner: string;
  name: string;
  tahun: string;
  target_donasi_terkumpul: string;
  waktu_donasi: string;
  total_nominal: string;
  total_orang: string;
  status: string;
  createdAt: Date;
}

const datas = ref<Data[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const isModalDonasiOpen = ref(false);
const donasiSelected = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalDonasi(id: any) {
  donasiSelected.value = id;
  isModalDonasiOpen.value = true;
}

function openModalEdit(id: any) {
  donasiSelected.value = id;
  isModalEditOpen.value = true;
}

// Function: Fetch Data
const search = ref('');
const status = ref('');
async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
      status: status.value,
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

onMounted(async () => {
  await fetchData();
});

// Function: Delete Data
async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Program Donasi',
    'Apakah Anda yakin ingin menghapus data program donasi ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_program({ id: id });
        displayNotification('Data Program Donasi berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data bank', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}

async function tutup_program(id: number) {
  displayConfirmation(
    'Tutup Data Program Donasi',
    'Apakah Anda yakin ingin menutup Program Donasi ini?',
    async () => {
      try {
        isLoading.value = true;
        await tutup({ id: id });
        displayNotification(' Program Donasi berhasil diTutup', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal mengTutup data Program Donasi', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}

function formatToRupiah(angka: number | string) {
  let numberString = angka.toString().replace(/[^,\d]/g, '');
  let split = numberString.split(',');
  let sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    let separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
  return 'Rp ' + rupiah;
}
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow mt-4">
        <BaseTable
          empty-title="Tidak ada data"
          empty-desc="Belum ada data program donasi."
          empty-icon="fa-solid fa-money-bill-wave"
          :columns="tableColumns"
          :data="datas"
          :loading="isTableLoading"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          @page-change="pageNow"
        >
          <!-- Custom Filters -->
          <template #filters>
            <div class="flex items-center w-full sm:w-auto">
              <input
                id="search"
                type="text"
                v-model="search"
                @change="fetchData"
                placeholder="Cari Nama ..."
                class="w-full sm:w-96 rounded-s-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
              />
              <select
                id="status"
                v-model="status"
                @change="fetchData()"
                class="block w-full sm:w-64 rounded-e-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:ring-2 focus:ring-green-900 focus:border-green-900 transition"
              >
                <option value="sedang_berlangsung">Sedang Berlangsung</option>
                <option value="ditutup">Ditutup</option>
                <option value="">Semua</option>
              </select>
            </div>
          </template>

          <!-- Custom Actions (Add Button) -->
          <template #actions>
            <BaseButton
              @click="openModalAdd()"
              variant="primary"
              :loading="isModalAddOpen || isModalEditOpen"
              type="button"
            >
              <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
              {{ dynamicLabel('Tambah Program') }}
            </BaseButton>
          </template>

          

          <template #cell-banner="{ row: data }">
            <center>
              <div
                v-if="data.banner && data.banner !== '-'"
                class="relative rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
                style="width: 300px; height: 99px"
                :class="{ 'bg-gray-200': !data.banner || data.banner === '-' }"
              >
                <img
                  :src="BASE_URL + '/uploads/img/program_donasi/' + data.banner"
                  :alt="`Foto data ${data.banner}`"
                  class="object-contain max-w-full max-h-full mx-auto"
                  @error="data.banner = '-'"
                />
              </div>
              <div
                v-else
                class="bg-gray-200 text-gray-500 text-center px-4 relative aspect-video max-w-sm rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
              >
                <p class="text-sm font-medium">Gambar tidak tersedia</p>
              </div>
            </center>
          </template>

          <template #cell-info_donasi="{ row: data }">
            <table class="w-full border border-gray-300 rounded-lg">
              <tbody>
                <tr class="border-b border-gray-300">
                  <th class="w-[40%] px-4 py-2 text-left font-medium bg-gray-100">Name</th>
                  <td class="px-4 py-2 text-right">{{ data.name }}</td>
                </tr>
                <tr class="border-b border-gray-300">
                  <th class="px-4 py-2 text-left font-medium bg-gray-100">Tahun</th>
                  <td class="px-4 py-2 text-right">{{ data.tahun }}</td>
                </tr>
                <tr class="border-b border-gray-300">
                  <th class="px-4 py-2 text-left font-medium bg-gray-100">
                    Target Donasi Terkumpul
                  </th>
                  <td class="px-4 py-2 text-right">
                    {{ formatToRupiah(data.target_donasi_terkumpul) }}
                  </td>
                </tr>
                <tr class="border-b border-gray-300">
                  <th class="px-4 py-2 text-left font-medium bg-gray-100">Total Orang</th>
                  <td class="px-4 py-2 text-right">{{ data.total_orang }}</td>
                </tr>
                <tr>
                  <th class="px-4 py-2 text-left font-medium bg-gray-100">Total Nominal</th>
                  <td class="px-4 py-2 text-right">
                    {{ formatToRupiah(data.total_nominal) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <template #cell-status="{ row: data }">
            {{ data.status.replace(/_/g, ' ').toUpperCase() }}
          </template>

          <template #cell-datetime="{ row: data }">
            {{ new Date(data.createdAt).toLocaleString('id-ID') }}
          </template>

          <template #row-actions="{ row: data }">
            <div class="flex flex-col items-center gap-1 px-0 py-4">
              <!-- Kalau belum ditutup -->
              <template v-if="data.status !== 'ditutup'">
                <LightButton @click="openModalEdit(data.id)">
                  <EditIcon />
                </LightButton>
                <LightButton @click="openModalDonasi(data.id)">
                  <IconMoney />
                </LightButton>
                <DangerButton @click="tutup_program(data.id)">
                  <LockIcon />
                </DangerButton>
                <DangerButton @click="deleteData(data.id)">
                  <DeleteIcon />
                </DangerButton>
              </template>
              <!-- Kalau sudah ditutup -->
              <template v-else>
                <DangerButton @click="deleteData(data.id)">
                  <DeleteIcon />
                </DangerButton>
              </template>
            </div>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- Modal FormAdd -->
    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="((isModalAddOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Bank gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <FormDonasi
      :is-modal-open="isModalDonasiOpen"
      :id_donasi="donasiSelected"
      @close="((isModalDonasiOpen = false), fetchData())"
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
      :id_donasi="donasiSelected"
      @close="((isModalEditOpen = false), fetchData())"
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
