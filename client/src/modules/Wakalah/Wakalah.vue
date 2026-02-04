<script setup lang="ts">
import Pagination from '@/components/Pagination/Pagination.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import LightButton from '@/components/Button/LightButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import { computed, onMounted, ref } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import { daftar_wakalah } from '@/service/wakalah';
// import FormAdd from './widget/FormAdd.vue';
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

// interface Data {
//   id: number;
//   nik: string;
//   whatsapp_number: string;
//   name: string | null;
//   createdAt: string;
//   updatedAt: string;
// }

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

// Modal state
// const isAddModalOpen = ref(false);
// const isEditModalOpen = ref(false);
// const selectedSyarat = ref<any>(null);

// function openAddModal() {
//   isAddModalOpen.value = true;
// }

// const selectedSurveyor = ref<any>(null);

// function openEditModal(id: any) {
//   console.log(id);
//   selectedSurveyor.value = id;
//   isEditModalOpen.value = true;
// }

const searchQuery = ref('');
const data = ref<Data[]>([]);
// const totalItems = ref(0);
// const itemsPerPage = 10;
// const currentPage = ref(1);
// const totalPages = ref(1);

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

// async function deleteData(id: number) {
//   displayConfirmation(
//     'Hapus Data Surveyor',
//     'Apakah Anda yakin ingin menghapus data surveyor ini?',
//     async () => {
//       try {
//         isLoading.value = true;
//         await delete_surveyor({ id: id });
//         displayNotification('Data surveyor berhasil dihapus', 'success');
//         await fetchData();
//       } catch (error) {
//         displayNotification('Gagal menghapus data surveyor', 'error');
//       } finally {
//         isLoading.value = false;
//       }
//     },
//   );
// }
</script>

<template>
  <div class="mx-auto p-4">
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BaseButton
          @click="openModalAdd()"
          variant="primary"
          :loading="isModalAddOpen || isModalEditOpen"
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
            v-model="search"
            @change="fetchData"
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
                    <LightButton @click="openModalEdit(data)">
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
    <!-- <FormAdd
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
    /> -->

    <!-- Modal FormEdit -->
    <!-- <FormEdit
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
    /> -->

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
  <!-- <div class="container mx-auto px-4 mt-10">
    <div class="flex justify-end items-center mb-6">
      <div class="flex items-center justify-between w-full mb-4">
        <BaseButton @click="openAddModal()" variant="primary" type="button">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Wakalah
        </BaseButton>

        <div class="flex items-center">
          <label for="search" class="block text-sm font-medium text-gray-700 mr-2">Cari</label>
          <input
            type="text"
            id="search"
            class="block w-64 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            v-model="searchQuery"
            @change="fetchData()"
            placeholder="Nama Surveyor . . . ."
          />
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-gray-200 shadow-md">
      <table class="w-full border-collapse bg-white text-left text-sm text-gray-500">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">Nama</th>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">NIk</th>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">Nomor whatsapp</th>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100 border-t border-gray-100">
          <tr v-for="(item, idx) in data" :key="item.id">
            <td class="px-3 py-2 text-center">{{ item.name }}</td>
            <td class="px-3 py-2 text-center">{{ item.nik }}</td>
            <td class="px-3 py-2 text-center">{{ item.whatsapp_number }}</td>
            <td class="px-3 py-2 text-center">
              <div class="flex justify-center gap-2">
                <LightButton @click="openEditModal(item.id)">
                  <EditIcon />
                </LightButton>
                <DangerButton @click="deleteData(item.id)">
                  <DeleteIcon />
                </DangerButton>
              </div>
            </td>
          </tr>

          <tr v-if="data.length === 0">
            <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
              <font-awesome-icon icon="fa-solid fa-user-tie" class="text-4xl mb-2 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
              <p class="text-sm">Belum ada data surveyor.</p>
            </td>
          </tr>
        </tbody>

        <tfoot class="bg-gray-100 font-bold">
          <Pagination
            :total-row="totalItems"
            :currentPage="currentPage"
            :totalPages="totalPages"
            :pages="pages"
            :totalColumns="totalColumns"
            @prev-page="handlePrev"
            @next-page="handleNext"
            @page-now="handlePageNow"
          />
        </tfoot>
      </table>
    </div>
  </div> -->

  <!-- <FormAdd
    :is-modal-open="isAddModalOpen"
    @close="
      isAddModalOpen = false;
      fetchData();
    "
    @status="
      (payload) =>
        displayNotification(payload.error_msg || 'Berhasil', payload.error ? 'error' : 'success')
    "
  />

  <FormEdit
    :is-modal-open="isEditModalOpen"
    :id="selectedSurveyor"
    @close="
      isEditModalOpen = false;
      fetchData();
    "
    @status="
      (payload) =>
        displayNotification(payload.error_msg || 'Berhasil', payload.error ? 'error' : 'success')
    "
  /> -->

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
</template>
