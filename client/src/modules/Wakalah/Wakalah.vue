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
import { daftar_surveyor, delete_surveyor } from '@/service/surveyor';
// import FormAdd from './widget/FormAdd.vue';
// import FormEdit from './widget/FormEdit.vue';

import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface Data {
  id: number;
  nik: string;
  whatsapp_number: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

// Modal state
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const selectedSyarat = ref<any>(null);

function openAddModal() {
  isAddModalOpen.value = true;
}

const selectedSurveyor = ref<any>(null);

function openEditModal(id: any) {
  console.log(id);
  selectedSurveyor.value = id;
  isEditModalOpen.value = true;
}

const searchQuery = ref('');
const data = ref<Data[]>([]);
const totalItems = ref(0);
const itemsPerPage = 10;
const currentPage = ref(1);
const totalPages = ref(1);

const fetchData = async () => {
  try {
    const response = await daftar_surveyor({
      search: searchQuery.value,
      perpage: itemsPerPage,
      pageNumber: currentPage.value,
    });
    data.value = response.data;
    console.log(response);
    console.log('Data telah masuk: ', data.value);
    totalItems.value = response.total || response.data.length || 0;
    totalPages.value = Math.ceil(response.total / itemsPerPage);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

const pages = computed<number[]>(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1);
});
const totalColumns = 4; // karena table punya 5 kolom

const handlePrev = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const handleNext = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const handlePageNow = (page: number) => {
  currentPage.value = page;
};

onMounted(async () => {
  await fetchData();
});

const filterStatus = ref('');
const OptionFilter = [
  { id: 'verified', name: 'Approve' },
  { id: 'unverified', name: 'Reject' },
  { id: '', name: 'Semua' },
];

const isLoading = ref(false);

async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Surveyor',
    'Apakah Anda yakin ingin menghapus data surveyor ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_surveyor({ id: id });
        displayNotification('Data surveyor berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data surveyor', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}
</script>

<template>
  <div class="container mx-auto px-4 mt-10">
    <div class="flex justify-end items-center mb-6">
      <div class="flex items-center justify-between w-full mb-4">
        <!-- Button di kiri -->
        <BaseButton @click="openAddModal()" variant="primary" type="button">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Surveyor
        </BaseButton>

        <!-- Search di kanan -->
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
        <!-- Header dengan grouping -->
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">Nama</th>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">NIk</th>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">Nomor whatsapp</th>
            <th class="px-6 py-4 font-medium text-gray-900 text-center">Aksi</th>
          </tr>
        </thead>
        <!-- Isi Data -->
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

        <!-- Footer -->
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
  </div>

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
