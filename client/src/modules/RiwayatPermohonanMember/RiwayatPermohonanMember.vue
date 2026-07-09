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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Tombol Kembali -->
        <div>
          <BaseButton @click="emit('back')" variant="primary" type="button">
            <font-awesome-icon icon="fa-solid fa-arrow-left" class="mr-2" />
            Kembali
          </BaseButton>
        </div>

        <!-- Search -->
        <div class="flex items-center">
          <label for="search" class="mr-2 text-sm font-medium text-gray-600">Cari</label>
          <input
            id="search"
            type="text"
            v-model="search"
            @change="fetchData"
            placeholder="Cari permohonan..."
            class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr>
              <th class="w-[50%] px-6 py-3 font-medium">Info Program</th>
              <th class="w-[20%] px-6 py-3 font-medium">Status Permohonan</th>
              <th class="w-[20%] px-6 py-3 font-medium">Tanggal Permohonan</th>
              <th class="w-[10%] px-6 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-if="datas && datas.length > 0">
              <tr v-for="data in datas" :key="data.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-left font-medium text-gray-800">
                  <table class="w-full mx-auto border border-gray-300 rounded-lg">
                    <tbody>
                      <tr>
                        <td class="border w-[35%] border-gray-300 px-2 py-1 font-normal">
                          Nama Program
                        </td>
                        <td class="border border-gray-300 px-2 py-1 font-normal">
                          {{ data.program }}
                        </td>
                      </tr>
                      <tr>
                        <td class="border border-gray-300 px-2 py-1 font-normal">Nama Kegiatan</td>
                        <td class="border border-gray-300 px-2 py-1 font-normal">
                          {{ data.kegiatan }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{ data.status_realisasi?.replaceAll('_', ' ').toUpperCase() }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{ data.tanggal }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  <div class="flex justify-center gap-2">
                    <DangerButton @click="deleteData(data.id)">
                      <DeleteIcon />
                    </DangerButton>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr>
                <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
                  <font-awesome-icon
                    icon="fa-solid fa-database"
                    class="text-4xl mb-2 text-gray-400"
                  />
                  <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
                  <p class="text-sm">Belum ada data field.</p>
                </td>
              </tr>
            </template>
          </tbody>

          <!-- Pagination -->
          <tfoot class="bg-gray-100 font-bold">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              :pages="pages"
              :total-columns="totalColumns"
              :total-row="totalRow"
              @prev-page="prevPage"
              @next-page="nextPage"
              @page-now="pageNow"
            />
          </tfoot>
        </table>
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
