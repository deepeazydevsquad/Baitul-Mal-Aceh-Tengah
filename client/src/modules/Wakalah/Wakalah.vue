<script setup lang="ts">
import Pagination from '@/components/Pagination/Pagination.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import LightButton from '@/components/Button/LightButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import { onMounted, ref } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import { daftar_wakalah, delete_wakalah } from '@/service/wakalah';
import FormAddUpdate from './widget/FormAddUpdate.vue';
// import FormEdit from './widget/FormEdit.vue';

import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(7);

const isTableLoading = ref(false);

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

interface Data {
  id: number;
  kode: string;
  fullname: string;
  jabatan: string;
  whatsapp_number: string;
  updatedAt: string;
  desa: string;
  kecamatan: string;
}

const searchQuery = ref('');
const data = ref<Data[]>([]);
const Id = ref(0);
const isModalOpen = ref(false);

async function fetchData() {
  try {
    const response = await daftar_wakalah({
      search: searchQuery.value,
      perpage: itemsPerPage,
      pageNumber: currentPage.value,
    });
    data.value = response.data;
    totalRow.value = response.total;
    // console.log(response);
    // console.log('Data telah masuk: ', data.value);
    // totalItems.value = response.total || response.data.length || 0;
    // totalPages.value = Math.ceil(response.total / itemsPerPage);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// const pages = computed<number[]>(() => {
//   return Array.from({ length: totalPages.value }, (_, i) => i + 1);
// });
// const totalColumns = 7; // karena table punya 5 kolom

// const handlePrev = () => {
//   if (currentPage.value > 1) currentPage.value--;
// };
// const handleNext = () => {
//   if (currentPage.value < totalPages.value) currentPage.value++;
// };
// const handlePageNow = (page: number) => {
//   currentPage.value = page;
// };

onMounted(async () => {
  await fetchData();
});

// const filterStatus = ref('');
// const OptionFilter = [
//   { id: 'verified', name: 'Approve' },
//   { id: 'unverified', name: 'Reject' },
//   { id: '', name: 'Semua' },
// ];

const isLoading = ref(false);

async function openModalAdd() {
  isModalOpen.value = true;
  console.log('----');
  console.log(isModalOpen.value);
  console.log('----');
}

async function openModalEdit(id: number) {
  isModalOpen.value = true;
  Id.value = id;
}

async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Wakalah',
    'Apakah Anda yakin ingin menghapus data wakalah ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_wakalah({ id: id });
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
  <div class="mx-auto p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BaseButton
          @click="openModalAdd()"
          variant="primary"
          :loading="isModalOpen && Id == 0"
          type="button"
        >
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Wakalah
        </BaseButton>

        <div class="flex items-center w-full sm:w-auto">
          <label for="search" class="mr-2 text-sm font-medium text-gray-600">Filter</label>
          <input
            id="search"
            type="text"
            v-model="searchQuery"
            @keyup="fetchData"
            placeholder="Cari Nama / Kode / Nomor Whatsapp . . ."
            class="w-full sm:w-96 rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          />
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr>
              <th class="w-[10%] px-6 py-3 font-medium">Kode</th>
              <th class="w-[20%] px-6 py-3 font-medium">Nama Lengkap</th>
              <th class="w-[10%] px-6 py-3 font-medium">Jabatan</th>
              <th class="w-[20%] px-6 py-3 font-medium">Nomor Whatsapp</th>
              <th class="w-[20%] px-6 py-3 font-medium">Alamat</th>
              <th class="w-[10%] px-6 py-3 font-medium">Datetimes</th>
              <th class="w-[10%] px-6 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-if="data.length > 0">
              <tr v-for="d in data" :key="d.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-center text-gray-800 font-bold">#{{ d.kode }}</td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">{{ d.fullname }}</td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">{{ d.jabatan }}</td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{ d.whatsapp_number }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  <b>Desa</b> : {{ d.desa }}, <br />
                  <b>Kecamatan</b> : {{ d.kecamatan }}
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">{{ d.updatedAt }}</td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  <div class="flex justify-center gap-2">
                    <LightButton @click="openModalEdit(d.id)">
                      <EditIcon />
                    </LightButton>
                    <DangerButton @click="deleteData(d.id)">
                      <DeleteIcon />
                    </DangerButton>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr>
                <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
                  <font-awesome-icon icon="fa-solid fa-users" class="text-4xl mb-2 text-gray-400" />
                  <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
                  <p class="text-sm">Belum ada data wakalah.</p>
                </td>
              </tr>
            </template>
          </tbody>

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
    <FormAddUpdate
      :isModalOpen="isModalOpen"
      :id="Id"
      @close="
        isModalOpen = false;
        fetchData();
        Id = 0;
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

  <!-- <Confirmation
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
  /> -->
</template>
